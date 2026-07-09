import sqlite3
import os

DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'library.db')

def get_db_connection():
    """Membuka koneksi ke database SQLite dan mengembalikan dict-like rows"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Membuat tabel-tabel database jika belum ada"""
    conn = get_db_connection()
    cursor = conn.cursor()


    cursor.execute('''
    CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        isbn TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        year INTEGER NOT NULL,
        rating REAL NOT NULL,
        shelf_node TEXT NOT NULL,
        stock INTEGER NOT NULL DEFAULT 1
    )
    ''')


    cursor.execute('''
    CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        join_date TEXT NOT NULL
    )
    ''')


    cursor.execute('''
    CREATE TABLE IF NOT EXISTS loans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL,
        loan_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'borrowed',
        FOREIGN KEY (book_id) REFERENCES books (id),
        FOREIGN KEY (member_id) REFERENCES members (id)
    )
    ''')

    conn.commit()
    conn.close()

def get_all_books():
    """Mengambil semua buku dari database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM books")
    books = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return books

def get_all_members():
    """Mengambil semua anggota dari database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM members")
    members = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return members

def add_book(title, author, isbn, category, year, rating, shelf_node, stock=1):
    """Menambahkan buku baru"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO books (title, author, isbn, category, year, rating, shelf_node, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (title, author, isbn.replace("-", "").strip(), category, year, rating, shelf_node, stock)
        )
        conn.commit()
        book_id = cursor.lastrowid
        conn.close()
        return book_id, None
    except sqlite3.IntegrityError as e:
        conn.close()
        return None, "ISBN sudah terdaftar"

def add_member(name, join_date):
    """Menambahkan anggota baru"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO members (name, join_date) VALUES (?, ?)",
        (name, join_date)
    )
    conn.commit()
    member_id = cursor.lastrowid
    conn.close()
    return member_id

def create_loan(book_id, member_id, loan_date):
    """Mencatat transaksi peminjaman baru dan mengurangi stok buku"""
    conn = get_db_connection()
    cursor = conn.cursor()


    cursor.execute("SELECT stock FROM books WHERE id = ?", (book_id,))
    book = cursor.fetchone()
    if not book:
        conn.close()
        return False, "Buku tidak ditemukan"

    if book['stock'] <= 0:
        conn.close()
        return False, "Stok buku habis"


    cursor.execute("UPDATE books SET stock = stock - 1 WHERE id = ?", (book_id,))


    cursor.execute(
        "INSERT INTO loans (book_id, member_id, loan_date, status) VALUES (?, ?, ?, 'borrowed')",
        (book_id, member_id, loan_date)
    )

    conn.commit()
    conn.close()
    return True, None

def return_loan(book_id, member_id):
    """Mengembalikan buku (mengubah status peminjaman & menambah stok)"""
    conn = get_db_connection()
    cursor = conn.cursor()


    cursor.execute(
        "SELECT id FROM loans WHERE book_id = ? AND member_id = ? AND status = 'borrowed'",
        (book_id, member_id)
    )
    loan = cursor.fetchone()
    if not loan:
        conn.close()
        return False, "Transaksi peminjaman aktif tidak ditemukan"


    cursor.execute(
        "UPDATE loans SET status = 'returned' WHERE id = ?",
        (loan['id'],)
    )


    cursor.execute("UPDATE books SET stock = stock + 1 WHERE id = ?", (book_id,))

    conn.commit()
    conn.close()
    return True, None

def get_active_loans():
    """Mengambil semua transaksi peminjaman yang sedang aktif"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT l.id, l.book_id, l.member_id, l.loan_date, l.status,
               b.title as book_title, b.isbn as book_isbn, m.name as member_name
        FROM loans l
        JOIN books b ON l.book_id = b.id
        JOIN members m ON l.member_id = m.id
        WHERE l.status = 'borrowed'
    ''')
    loans = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return loans

def update_book(book_id, title, author, isbn, category, year, rating, shelf_node, stock):
    """Mengupdate detail buku berdasarkan ID"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            UPDATE books
            SET title = ?, author = ?, isbn = ?, category = ?, year = ?, rating = ?, shelf_node = ?, stock = ?
            WHERE id = ?
        ''', (title, author, isbn.replace("-", "").strip(), category, year, rating, shelf_node, stock, book_id))
        conn.commit()
        conn.close()
        return True, None
    except sqlite3.IntegrityError as e:
        conn.close()
        return False, "ISBN sudah terdaftar pada buku lain"
    except Exception as e:
        conn.close()
        return False, str(e)

def delete_book(book_id):
    """Menghapus buku berdasarkan ID dan menghapus peminjaman terkait"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:

        cursor.execute("DELETE FROM loans WHERE book_id = ?", (book_id,))

        cursor.execute("DELETE FROM books WHERE id = ?", (book_id,))
        conn.commit()
        conn.close()
        return True, None
    except Exception as e:
        conn.close()
        return False, str(e)
