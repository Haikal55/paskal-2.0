import datetime
from db import init_db, get_db_connection, add_book, add_member

def seed_data():
    print("Memulai seeding database...")


    init_db()

    conn = get_db_connection()
    cursor = conn.cursor()


    cursor.execute("DELETE FROM loans")
    cursor.execute("DELETE FROM books")
    cursor.execute("DELETE FROM members")
    conn.commit()
    conn.close()


    members_data = [
        ("Muhammad Haikal", "2026-01-10"),
        ("Aulia Rahma", "2026-02-15"),
        ("Budi Santoso", "2026-03-01"),
        ("Siti Aminah", "2026-04-12"),
        ("Rian Hidayat", "2026-05-20")
    ]

    for name, join_date in members_data:
        member_id = add_member(name, join_date)
        print(f"Anggota berhasil ditambahkan: {name} (ID: {member_id})")


    books_data = [

        ("Bumi", "Tere Liye", "9786020331607", "Fiksi", 2014, 4.8, "shelf_fiction", 2),
        ("Laskar Pelangi", "Andrea Hirata", "9793062797", "Fiksi", 2005, 4.7, "shelf_fiction", 1),
        ("Pulang", "Leila S. Chudori", "9789799105127", "Fiksi", 2012, 4.6, "shelf_fiction", 0),


        ("Kosmos", "Carl Sagan", "9786020638539", "Sains", 1980, 4.9, "shelf_science", 3),
        ("A Brief History of Time", "Stephen Hawking", "9780553380163", "Sains", 1988, 4.8, "shelf_science", 2),


        ("Sapiens", "Yuval Noah Harari", "9786024410209", "Sejarah", 2011, 4.9, "shelf_history", 2),
        ("Guns, Germs, and Steel", "Jared Diamond", "9780393317558", "Sejarah", 1997, 4.7, "shelf_history", 1),


        ("Seni Rupa Modern", "Dwi Marianto", "9789798448836", "Seni", 2002, 4.2, "shelf_arts", 1),
        ("Teori Seni", "Jakob Sumardjo", "9789799456205", "Seni", 2000, 4.3, "shelf_arts", 2),


        ("Clean Code", "Robert C. Martin", "9780132350884", "Komputer", 2008, 4.9, "shelf_computer", 2),
        ("Introduction to Algorithms", "Thomas H. Cormen", "9780262033848", "Komputer", 2009, 4.8, "shelf_computer", 1),
        ("Struktur Data & Algoritma", "Rinaldi Munir", "9786021514917", "Komputer", 2015, 4.5, "shelf_computer", 2),


        ("Kamus Besar Bahasa Indonesia", "Tim Balai Pustaka", "9789794071823", "Umum", 2008, 4.4, "shelf_general", 2),
        ("Ensiklopedi Dunia", "Tim Ensiklopedia", "9789799298324", "Umum", 2010, 4.3, "shelf_general", 1),
    ]

    for title, author, isbn, category, year, rating, shelf_node, stock in books_data:
        book_id, err = add_book(title, author, isbn, category, year, rating, shelf_node, stock)
        if err:
            print(f"Gagal menambahkan buku {title}: {err}")
        else:
            print(f"Buku berhasil ditambahkan: {title} (ID: {book_id})")

    print("Seeding database selesai dengan sukses!")

if __name__ == "__main__":
    seed_data()
