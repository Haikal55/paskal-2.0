def linear_search_books(books_list, query):
    """
    Pencarian linear untuk mencocokkan judul atau penulis buku secara parsial.
    Mengembalikan: (daftar_hasil, jumlah_langkah/perbandingan)
    """
    results = []
    steps = 0
    query = query.lower().strip()

    if not query:
        return books_list, 0

    for book in books_list:
        steps += 1

        if query in book['title'].lower() or query in book['author'].lower():
            results.append(book)

    return results, steps


def binary_search_members(sorted_members_list, target_id):
    """
    Pencarian biner untuk mencari anggota berdasarkan ID (harus terurut).
    Mengembalikan: (anggota_ditemukan atau None, jumlah_langkah/perbandingan)
    """
    steps = 0
    low = 0
    high = len(sorted_members_list) - 1

    while low <= high:
        steps += 1
        mid = (low + high) // 2
        mid_id = sorted_members_list[mid]['id']

        if mid_id == target_id:
            return sorted_members_list[mid], steps
        elif mid_id < target_id:
            low = mid + 1
        else:
            high = mid - 1

    return None, steps
