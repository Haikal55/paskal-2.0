import datetime
import time
from flask import Flask, request, jsonify
from flask_cors import CORS

import db
from structures.bst import BinarySearchTree
from structures.linked_list import LoanQueue
from structures.graph import create_default_library_map
from structures.searching import linear_search_books, binary_search_members
from structures.sorting import bubble_sort, merge_sort, quick_sort

app = Flask(__name__)
CORS(app)


bst = BinarySearchTree()
loan_queue = LoanQueue()
library_map = create_default_library_map()

def reload_bst():
    """Mengisi ulang BST dari data SQLite terbaru"""
    global bst
    bst = BinarySearchTree()
    books = db.get_all_books()
    for book in books:
        bst.insert(book['isbn'], book)


reload_bst()


@app.route('/api/books', methods=['GET'])
def get_books():
    """Mengambil katalog buku dengan pencarian & pengurutan kustom"""
    search_query = request.args.get('search', '').strip()
    sort_by = request.args.get('sort_by', '').strip()
    sort_algo = request.args.get('sort_algo', 'quick').strip()
    reverse_param = request.args.get('reverse', 'false').lower() == 'true'


    books = db.get_all_books()


    search_steps = 0
    if search_query:
        books, search_steps = linear_search_books(books, search_query)


    sort_time_ms = 0.0
    if sort_by and len(books) > 1:
        start_time = time.perf_counter()

        if sort_algo == 'bubble':
            books = bubble_sort(books, sort_by, reverse=reverse_param)
        elif sort_algo == 'merge':
            books = merge_sort(books, sort_by, reverse=reverse_param)
        else:
            books = quick_sort(books, sort_by, reverse=reverse_param)

        end_time = time.perf_counter()
        sort_time_ms = (end_time - start_time) * 1000

    return jsonify({
        "books": books,
        "search_steps": search_steps if search_query else None,
        "sort_time_ms": sort_time_ms if sort_by else None,
        "sort_algo_used": sort_algo if sort_by else None
    })


@app.route('/api/books', methods=['POST'])
def create_book():
    """Menambahkan buku baru ke SQLite & menyisipkannya ke BST"""
    data = request.json
    if not data or not all(k in data for k in ('title', 'author', 'isbn', 'category', 'year', 'rating', 'shelf_node')):
        return jsonify({"error": "Data buku tidak lengkap"}), 400

    stock = int(data.get('stock', 1))


    book_id, err = db.add_book(
        data['title'], data['author'], data['isbn'], data['category'],
        int(data['year']), float(data['rating']), data['shelf_node'], stock
    )

    if err:
        return jsonify({"error": err}), 400


    reload_bst()

    return jsonify({
        "message": "Buku berhasil ditambahkan",
        "book_id": book_id
    }), 201


@app.route('/api/books/<int:book_id>', methods=['PUT'])
def update_book_api(book_id):
    """Mengupdate detail buku di SQLite & me-refresh BST"""
    data = request.json
    if not data or not all(k in data for k in ('title', 'author', 'isbn', 'category', 'year', 'rating', 'shelf_node')):
        return jsonify({"error": "Data buku tidak lengkap"}), 400

    stock = int(data.get('stock', 1))

    success, err = db.update_book(
        book_id, data['title'], data['author'], data['isbn'], data['category'],
        int(data['year']), float(data['rating']), data['shelf_node'], stock
    )

    if not success:
        return jsonify({"error": err}), 400


    reload_bst()

    return jsonify({"message": "Buku berhasil diperbarui"})


@app.route('/api/books/<int:book_id>', methods=['DELETE'])
def delete_book_api(book_id):
    """Menghapus buku dari SQLite & me-refresh BST"""
    success, err = db.delete_book(book_id)
    if not success:
        return jsonify({"error": err}), 400


    global loan_queue
    loan_queue.remove_by_book(book_id)


    reload_bst()

    return jsonify({"message": "Buku berhasil dihapus"})


@app.route('/api/books/isbn/<isbn>', methods=['GET'])
def get_book_by_isbn(isbn):
    """Mencari buku via custom BST dengan mengembalikan rute pencarian node"""
    book_data, search_path = bst.search(isbn)

    if not book_data:
        return jsonify({
            "error": "Buku tidak ditemukan di index BST",
            "search_path": search_path
        }), 404

    return jsonify({
        "book": book_data,
        "search_path": search_path
    })


@app.route('/api/bst', methods=['GET'])
def get_bst_structure():
    """Mengembalikan struktur pohon BST saat ini dalam bentuk JSON rekursif"""
    tree_dict = bst.to_dict()
    return jsonify({
        "root": tree_dict,
        "size": bst.size
    })




@app.route('/api/queue', methods=['GET'])
def get_queue():
    """Mengambil daftar antrean peminjaman saat ini"""
    return jsonify({
        "queue": loan_queue.to_list(),
        "size": loan_queue.size
    })


@app.route('/api/queue', methods=['POST'])
def join_queue():
    """Menambahkan mahasiswa ke akhir antrean (Doubly Linked List)"""
    data = request.json
    if not data or 'member_id' not in data or 'book_id' not in data:
        return jsonify({"error": "member_id dan book_id diperlukan"}), 400

    member_id = int(data['member_id'])
    book_id = int(data['book_id'])


    conn = db.get_db_connection()
    book = conn.execute("SELECT title, stock FROM books WHERE id = ?", (book_id,)).fetchone()
    member = conn.execute("SELECT name FROM members WHERE id = ?", (member_id,)).fetchone()
    conn.close()

    if not book or not member:
        return jsonify({"error": "Buku atau Anggota tidak ditemukan"}), 404


    if book['stock'] > 0:
        return jsonify({"error": "Stok buku masih ada, pinjam langsung saja!"}), 400


    existing_position = loan_queue.get_position(member_id, book_id)
    if existing_position != -1:
        return jsonify({"error": "Anggota ini sudah berada dalam antrean untuk buku ini"}), 400

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


    node = loan_queue.enqueue(member_id, member['name'], book_id, book['title'], timestamp)

    return jsonify({
        "message": f"{member['name']} berhasil masuk ke antrean '{book['title']}'",
        "queue": loan_queue.to_list()
    }), 201


@app.route('/api/queue/leave', methods=['POST'])
def leave_queue():
    """Menghapus anggota dari antrean (bisa di tengah antrean)"""
    data = request.json
    if not data or 'member_id' not in data or 'book_id' not in data:
        return jsonify({"error": "member_id dan book_id diperlukan"}), 400

    member_id = int(data['member_id'])
    book_id = int(data['book_id'])

    removed = loan_queue.remove_by_member_and_book(member_id, book_id)

    if not removed:
        return jsonify({"error": "Anggota tidak ditemukan di antrean buku ini"}), 404

    return jsonify({
        "message": "Berhasil membatalkan antrean",
        "queue": loan_queue.to_list()
    })


@app.route('/api/loans', methods=['POST'])
def borrow_book_api():
    """Meminjam buku. Jika stok habis, arahkan untuk antre."""
    data = request.json
    if not data or 'member_id' not in data or 'book_id' not in data:
        return jsonify({"error": "member_id dan book_id diperlukan"}), 400

    member_id = int(data['member_id'])
    book_id = int(data['book_id'])

    conn = db.get_db_connection()
    book = conn.execute("SELECT stock, title FROM books WHERE id = ?", (book_id,)).fetchone()
    conn.close()

    if not book:
        return jsonify({"error": "Buku tidak ditemukan"}), 404

    loan_date = datetime.datetime.now().strftime("%Y-%m-%d")

    if book['stock'] > 0:

        success, err = db.create_loan(book_id, member_id, loan_date)
        if success:
            reload_bst()
            return jsonify({
                "status": "borrowed",
                "message": f"Buku '{book['title']}' berhasil dipinjam langsung."
            })
        else:
            return jsonify({"error": err}), 400
    else:

        return jsonify({
            "status": "queued",
            "message": f"Stok buku '{book['title']}' habis. Apakah Anda ingin masuk ke antrean peminjaman?"
        })


@app.route('/api/loans/return', methods=['POST'])
def return_book_api():
    """Mengembalikan buku & otomatis memproses antrean terdepan untuk buku tersebut"""
    data = request.json
    if not data or 'member_id' not in data or 'book_id' not in data:
        return jsonify({"error": "member_id dan book_id diperlukan"}), 400

    member_id = int(data['member_id'])
    book_id = int(data['book_id'])


    success, err = db.return_loan(book_id, member_id)
    if not success:
        return jsonify({"error": err}), 400



    current = loan_queue.head
    queue_member_node = None

    while current:
        if current.book_id == book_id:
            queue_member_node = current
            break
        current = current.next

    queue_notified = None
    if queue_member_node:

        loan_queue.remove_by_member_and_book(queue_member_node.member_id, book_id)


        loan_date = datetime.datetime.now().strftime("%Y-%m-%d")
        db.create_loan(book_id, queue_member_node.member_id, loan_date)

        queue_notified = {
            "member_id": queue_member_node.member_id,
            "member_name": queue_member_node.member_name,
            "book_title": queue_member_node.book_title
        }


    reload_bst()

    message = "Buku berhasil dikembalikan."
    if queue_notified:
        message += f" Antrean terdepan ({queue_notified['member_name']}) otomatis meminjam buku ini."

    return jsonify({
        "message": message,
        "queue_processed": queue_notified,
        "queue": loan_queue.to_list()
    })


@app.route('/api/loans/active', methods=['GET'])
def get_active_loans_api():
    """Mengambil semua peminjaman aktif"""
    return jsonify(db.get_active_loans())




@app.route('/api/map', methods=['GET'])
def get_map_layout():
    """Mengambil data koordinat & jalur peta perpustakaan"""
    return jsonify(library_map.to_dict())


@app.route('/api/route', methods=['GET'])
def find_route():
    """Mendapatkan rute terpendek dari start ke end rak buku menggunakan Dijkstra"""
    start_node = request.args.get('start', 'entrance').strip()
    end_node = request.args.get('end', '').strip()

    if not end_node:
        return jsonify({"error": "Parameter 'end' (rak buku tujuan) diperlukan"}), 400

    path, distance = library_map.dijkstra(start_node, end_node)

    if not path:
        return jsonify({"error": f"Rute dari '{start_node}' ke '{end_node}' tidak ditemukan"}), 404


    path_details = []
    for node_name in path:
        node = library_map.nodes[node_name]
        path_details.append({
            "name": node.name,
            "label": node.label,
            "x": node.x,
            "y": node.y
        })

    return jsonify({
        "path": path,
        "path_details": path_details,
        "distance": distance
    })




@app.route('/api/members', methods=['GET'])
def get_members():
    """Mengambil semua daftar anggota"""
    return jsonify(db.get_all_members())


@app.route('/api/members', methods=['POST'])
def create_member():
    """Menambahkan anggota baru"""
    data = request.json
    if not data or 'name' not in data:
        return jsonify({"error": "Nama anggota diperlukan"}), 400

    join_date = datetime.datetime.now().strftime("%Y-%m-%d")
    member_id = db.add_member(data['name'], join_date)

    return jsonify({
        "message": "Anggota berhasil ditambahkan",
        "member_id": member_id
    }), 201


@app.route('/api/members/search', methods=['GET'])
def search_member_api():
    """Pencarian anggota menggunakan Binary Search (harus disorting dulu di backend)"""
    target_id_str = request.args.get('id', '').strip()
    if not target_id_str:
        return jsonify({"error": "Parameter ID anggota diperlukan"}), 400

    try:
        target_id = int(target_id_str)
    except ValueError:
        return jsonify({"error": "ID anggota harus berupa angka"}), 400


    members = db.get_all_members()


    members_sorted = quick_sort(members, 'id')


    member, steps = binary_search_members(members_sorted, target_id)

    if not member:
        return jsonify({
            "error": f"Anggota dengan ID {target_id} tidak ditemukan",
            "steps_taken": steps,
            "total_records": len(members)
        }), 404

    return jsonify({
        "member": member,
        "steps_taken": steps,
        "total_records": len(members)
    })


if __name__ == '__main__':

    app.run(host='127.0.0.1', port=5000, debug=True)
