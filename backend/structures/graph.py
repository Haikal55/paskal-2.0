class GraphNode:
    """Node untuk representasi lokasi dalam Graph Peta Perpustakaan"""
    def __init__(self, name, label, x, y):
        self.name = name
        self.label = label
        self.x = x
        self.y = y
        self.neighbors = {}

    def to_dict(self):
        return {
            "name": self.name,
            "label": self.label,
            "x": self.x,
            "y": self.y,
            "neighbors": self.neighbors
        }


class LibraryGraph:
    """Implementasi Graph untuk Peta Navigasi Perpustakaan & Shortest Path (Dijkstra)"""
    def __init__(self):
        self.nodes = {}

    def add_node(self, name, label, x, y):
        """Menambahkan lokasi baru ke dalam graph"""
        if name not in self.nodes:
            self.nodes[name] = GraphNode(name, label, x, y)

    def add_edge(self, node1, node2, weight):
        """Menghubungkan dua lokasi dengan jalan berbobot (jarak langkah kaki)"""
        if node1 in self.nodes and node2 in self.nodes:
            self.nodes[node1].neighbors[node2] = weight
            self.nodes[node2].neighbors[node1] = weight

    def dijkstra(self, start, end):
        """Algoritma Dijkstra untuk mencari rute terpendek dari start ke end"""
        if start not in self.nodes or end not in self.nodes:
            return [], float('inf')


        distances = {node: float('inf') for node in self.nodes}
        previous = {node: None for node in self.nodes}
        distances[start] = 0


        unvisited = list(self.nodes.keys())

        while unvisited:

            current = min(unvisited, key=lambda node: distances[node])

            if distances[current] == float('inf'):
                break

            if current == end:
                break

            unvisited.remove(current)

            for neighbor, weight in self.nodes[current].neighbors.items():
                if neighbor in unvisited:
                    new_route = distances[current] + weight
                    if new_route < distances[neighbor]:
                        distances[neighbor] = new_route
                        previous[neighbor] = current


        path = []
        current = end
        while current is not None:
            path.insert(0, current)
            current = previous[current]


        if distances[end] == float('inf'):
            return [], float('inf')

        return path, distances[end]

    def to_dict(self):
        """Mengonversi graph menjadi dict untuk dikirim ke frontend"""
        return {name: node.to_dict() for name, node in self.nodes.items()}


def create_default_library_map():
    """Membuat peta layout default perpustakaan"""
    g = LibraryGraph()


    g.add_node("entrance", "Pintu Masuk", 100, 400)
    g.add_node("lobby", "Lobby Utama", 250, 400)
    g.add_node("counter", "Meja Layanan/Petugas", 250, 250)
    g.add_node("reading_area", "Area Baca Mandiri", 450, 400)
    g.add_node("discussion_room", "Ruang Diskusi Kelompok", 450, 250)


    g.add_node("shelf_fiction", "Rak Fiksi (A1)", 650, 150)
    g.add_node("shelf_science", "Rak Sains & Teknologi (B1)", 800, 150)
    g.add_node("shelf_history", "Rak Sejarah (C1)", 650, 300)
    g.add_node("shelf_arts", "Rak Seni & Sastra (D1)", 800, 300)
    g.add_node("shelf_computer", "Rak Komputer & Elektro (E1)", 650, 450)
    g.add_node("shelf_general", "Rak Umum & Kamus (F1)", 800, 450)


    g.add_edge("entrance", "lobby", 3)
    g.add_edge("lobby", "counter", 4)
    g.add_edge("lobby", "reading_area", 5)
    g.add_edge("counter", "discussion_room", 4)
    g.add_edge("reading_area", "discussion_room", 3)
    g.add_edge("reading_area", "shelf_computer", 5)


    g.add_edge("discussion_room", "shelf_fiction", 5)
    g.add_edge("shelf_fiction", "shelf_science", 2)
    g.add_edge("shelf_fiction", "shelf_history", 3)
    g.add_edge("shelf_science", "shelf_arts", 3)
    g.add_edge("shelf_history", "shelf_arts", 2)
    g.add_edge("shelf_history", "shelf_computer", 3)
    g.add_edge("shelf_computer", "shelf_general", 2)
    g.add_edge("shelf_arts", "shelf_general", 3)

    return g
