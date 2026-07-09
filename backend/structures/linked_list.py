class QueueNode:
    """Node untuk Doubly Linked List Antrean Peminjaman"""
    def __init__(self, member_id, member_name, book_id, book_title, joined_at):
        self.member_id = member_id
        self.member_name = member_name
        self.book_id = book_id
        self.book_title = book_title
        self.joined_at = joined_at
        self.next = None
        self.prev = None

    def to_dict(self):
        return {
            "member_id": self.member_id,
            "member_name": self.member_name,
            "book_id": self.book_id,
            "book_title": self.book_title,
            "joined_at": self.joined_at
        }


class LoanQueue:
    """Implementasi Doubly Linked List untuk Antrean Peminjaman"""
    def __init__(self):
        self.head = None
        self.tail = None
        self.size = 0

    def is_empty(self):
        return self.head is None

    def enqueue(self, member_id, member_name, book_id, book_title, joined_at):
        """Menambahkan anggota ke akhir antrean (Tail)"""
        new_node = QueueNode(member_id, member_name, book_id, book_title, joined_at)

        if self.is_empty():
            self.head = new_node
            self.tail = new_node
        else:
            new_node.prev = self.tail
            self.tail.next = new_node
            self.tail = new_node

        self.size += 1
        return new_node

    def dequeue(self):
        """Mengeluarkan anggota dari depan antrean (Head) - First In First Out"""
        if self.is_empty():
            return None

        removed_node = self.head

        if self.head == self.tail:

            self.head = None
            self.tail = None
        else:
            self.head = self.head.next
            self.head.prev = None

        self.size -= 1
        removed_node.next = None
        removed_node.prev = None
        return removed_node

    def remove_by_member_and_book(self, member_id, book_id):
        """Menghapus anggota tertentu dari antrean (bisa di tengah list) jika mereka membatalkan"""
        if self.is_empty():
            return False

        current = self.head
        while current:
            if current.member_id == member_id and current.book_id == book_id:

                if current == self.head and current == self.tail:
                    self.head = None
                    self.tail = None
                elif current == self.head:
                    self.head = current.next
                    self.head.prev = None
                elif current == self.tail:
                    self.tail = current.prev
                    self.tail.next = None
                else:
                    current.prev.next = current.next
                    current.next.prev = current.prev

                self.size -= 1
                current.next = None
                current.prev = None
                return True
            current = current.next

        return False

    def remove_by_book(self, book_id):
        """Menghapus semua antrean yang terkait dengan book_id tertentu"""
        if self.is_empty():
            return

        current = self.head
        while current:
            next_node = current.next
            if current.book_id == book_id:
                if current == self.head and current == self.tail:
                    self.head = None
                    self.tail = None
                elif current == self.head:
                    self.head = current.next
                    if self.head:
                        self.head.prev = None
                elif current == self.tail:
                    self.tail = current.prev
                    if self.tail:
                        self.tail.next = None
                else:
                    current.prev.next = current.next
                    current.next.prev = current.prev
                self.size -= 1
            current = next_node

    def to_list(self):
        """Mengonversi seluruh antrean menjadi Python list untuk API JSON"""
        result = []
        current = self.head
        while current:
            result.append(current.to_dict())
            current = current.next
        return result

    def get_position(self, member_id, book_id):
        """Mendapatkan posisi antrean (1-based index)"""
        current = self.head
        position = 1
        while current:
            if current.member_id == member_id and current.book_id == book_id:
                return position
            current = current.next
            position += 1
        return -1
