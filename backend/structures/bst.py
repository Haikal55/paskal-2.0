class BSTNode:
    """Node untuk Binary Search Tree (BST)"""
    def __init__(self, isbn, book_data):
        self.isbn = isbn
        self.book_data = book_data
        self.left = None
        self.right = None

    def to_dict(self):
        """Mengonversi sub-pohon menjadi struktur dictionary untuk dirender di frontend"""
        return {
            "isbn": self.isbn,
            "title": self.book_data.get("title", ""),
            "left": self.left.to_dict() if self.left else None,
            "right": self.right.to_dict() if self.right else None
        }


class BinarySearchTree:
    """Implementasi Binary Search Tree untuk pencarian berbasis ISBN"""
    def __init__(self):
        self.root = None
        self.size = 0

    def insert(self, isbn, book_data):
        """Menyisipkan buku baru berdasarkan ISBN ke dalam BST"""

        clean_isbn = isbn.replace("-", "").strip()
        new_node = BSTNode(clean_isbn, book_data)

        if self.root is None:
            self.root = new_node
            self.size += 1
        else:
            self._insert_recursive(self.root, new_node)

    def _insert_recursive(self, current_node, new_node):
        if new_node.isbn < current_node.isbn:
            if current_node.left is None:
                current_node.left = new_node
                self.size += 1
            else:
                self._insert_recursive(current_node.left, new_node)
        elif new_node.isbn > current_node.isbn:
            if current_node.right is None:
                current_node.right = new_node
                self.size += 1
            else:
                self._insert_recursive(current_node.right, new_node)
        else:

            current_node.book_data = new_node.book_data

    def search(self, isbn):
        """Mencari buku berdasarkan ISBN dan mengembalikan (book_data, search_path)"""
        clean_isbn = isbn.replace("-", "").strip()
        path = []
        result = self._search_recursive(self.root, clean_isbn, path)
        return result, path

    def _search_recursive(self, current_node, isbn, path):
        if current_node is None:
            return None

        path.append(current_node.isbn)

        if isbn == current_node.isbn:
            return current_node.book_data
        elif isbn < current_node.isbn:
            return self._search_recursive(current_node.left, isbn, path)
        else:
            return self._search_recursive(current_node.right, isbn, path)

    def to_dict(self):
        """Mengonversi seluruh tree menjadi dictionary untuk dirender di frontend"""
        if self.root is None:
            return None
        return self.root.to_dict()

    def get_inorder(self):
        """Dapatkan data terurut secara inorder (untuk verifikasi)"""
        result = []
        self._inorder_recursive(self.root, result)
        return result

    def _inorder_recursive(self, node, result):
        if node:
            self._inorder_recursive(node.left, result)
            result.append(node.book_data)
            self._inorder_recursive(node.right, result)
