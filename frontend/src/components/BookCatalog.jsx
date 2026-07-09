import React, { useState, useEffect } from 'react';
import { Search, Star, Clock, AlertTriangle, ArrowUpDown, Bookmark, RefreshCw, BarChart2, Plus, Edit2, Trash } from 'lucide-react';

const API_BASE = '/api';

export default function BookCatalog({ activeTab, isAdmin, onActionCompleted }) {
  const [books, setBooks] = useState([]);
  const [activeLoans, setActiveLoans] = useState([]);
  const [members, setMembers] = useState([]);
  const [queueSize, setQueueSize] = useState(0);


  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('year');
  const [sortAlgo, setSortAlgo] = useState('quick');
  const [sortOrder, setSortOrder] = useState('desc');


  const [searchSteps, setSearchSteps] = useState(null);
  const [sortTime, setSortTime] = useState(null);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [benchmarking, setBenchmarking] = useState(false);


  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [queueModalOpen, setQueueModalOpen] = useState(false);


  const [addBookModalOpen, setAddBookModalOpen] = useState(false);
  const [editBookModalOpen, setEditBookModalOpen] = useState(false);
  const [editingBookId, setEditingBookId] = useState(null);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Fiksi',
    year: new Date().getFullYear(),
    rating: 4.5,
    stock: 3
  });

  const categoryToShelfMap = {
    "Fiksi": "shelf_fiction",
    "Sains & Teknologi": "shelf_science",
    "Sejarah": "shelf_history",
    "Seni & Sastra": "shelf_arts",
    "Komputer & Elektro": "shelf_computer",
    "Umum & Kamus": "shelf_general"
  };

  const handleOpenAddModal = () => {
    setBookForm({
      title: '',
      author: '',
      isbn: '',
      category: 'Fiksi',
      year: new Date().getFullYear(),
      rating: 4.5,
      stock: 3
    });
    setAddBookModalOpen(true);
  };

  const handleOpenEditModal = (book) => {
    setEditingBookId(book.id);
    setBookForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      year: book.year,
      rating: book.rating,
      stock: book.stock
    });
    setEditBookModalOpen(true);
  };

  const handleAddBookSubmit = async (e) => {
    e.preventDefault();
    const shelfNode = categoryToShelfMap[bookForm.category] || "shelf_general";

    try {
      const response = await fetch(`${API_BASE}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookForm,
          shelf_node: shelfNode
        })
      });
      const data = await response.json();
      if (response.ok) {
        alert("Buku berhasil ditambahkan!");
        setAddBookModalOpen(false);
        fetchBooks();
        fetchQueueSize();
        if (onActionCompleted) onActionCompleted();
      } else {
        alert(data.error || "Gagal menambahkan buku");
      }
    } catch (err) {
      console.error(err);
      alert("Error koneksi server");
    }
  };

  const handleEditBookSubmit = async (e) => {
    e.preventDefault();
    const shelfNode = categoryToShelfMap[bookForm.category] || "shelf_general";

    try {
      const response = await fetch(`${API_BASE}/books/${editingBookId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookForm,
          shelf_node: shelfNode
        })
      });
      const data = await response.json();
      if (response.ok) {
        alert("Detail buku berhasil diperbarui!");
        setEditBookModalOpen(false);
        fetchBooks();
        if (onActionCompleted) onActionCompleted();
      } else {
        alert(data.error || "Gagal memperbarui detail buku");
      }
    } catch (err) {
      console.error(err);
      alert("Error koneksi server");
    }
  };

  const handleDeleteBook = async (bookId, title) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus buku "${title}"? Transaksi peminjaman & antrean terkait buku ini juga akan dihapus secara otomatis dari database.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/books/${bookId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (response.ok) {
        alert("Buku berhasil dihapus!");
        fetchBooks();
        fetchActiveLoans();
        fetchQueueSize();
        if (onActionCompleted) onActionCompleted();
      } else {
        alert(data.error || "Gagal menghapus buku");
      }
    } catch (err) {
      console.error(err);
      alert("Error koneksi server");
    }
  };


  const fetchBooks = async () => {
    try {
      const sortParam = sortBy ? `&sort_by=${sortBy}&sort_algo=${sortAlgo}&reverse=${sortOrder === 'desc'}` : '';
      const response = await fetch(`${API_BASE}/books?search=${searchQuery}${sortParam}`);
      const data = await response.json();
      setBooks(data.books || []);
      setSearchSteps(data.search_steps);
      setSortTime(data.sort_time_ms);
    } catch (error) {
      console.error("Gagal mengambil data buku:", error);
    }
  };


  const fetchActiveLoans = async () => {
    try {
      const res = await fetch(`${API_BASE}/loans/active`);
      const data = await res.json();
      setActiveLoans(data);
    } catch (e) {
      console.error(e);
    }
  };


  const fetchMembers = async () => {
    try {
      const res = await fetch(`${API_BASE}/members`);
      const data = await res.json();
      setMembers(data);
      if (data.length > 0) setSelectedMemberId(data[0].id.toString());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchQueueSize = async () => {
    try {
      const res = await fetch(`${API_BASE}/queue`);
      const data = await res.json();
      setQueueSize(data.size || 0);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchActiveLoans();
    fetchMembers();
    fetchQueueSize();
  }, [searchQuery, sortBy, sortAlgo, sortOrder, activeTab]);


  const runBenchmark = async () => {
    if (books.length <= 1) return;
    setBenchmarking(true);
    try {
      const algos = ['bubble', 'merge', 'quick'];
      const results = {};

      for (const algo of algos) {

        const start = performance.now();
        const res = await fetch(`${API_BASE}/books?sort_by=title&sort_algo=${algo}&reverse=false`);
        const data = await res.json();
        const end = performance.now();
        results[algo] = data.sort_time_ms || (end - start);
      }
      setBenchmarkData(results);
    } catch (e) {
      console.error("Gagal melakukan benchmark:", e);
    } finally {
      setBenchmarking(false);
    }
  };


  const handleBorrowSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBook || !selectedMemberId) return;

    try {
      const response = await fetch(`${API_BASE}/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: parseInt(selectedMemberId),
          book_id: selectedBook.id
        })
      });
      const data = await response.json();

      if (response.ok) {
        if (data.status === 'queued') {

          setBorrowModalOpen(false);
          setQueueModalOpen(true);
        } else {

          setBorrowModalOpen(false);
          alert(data.message);
          fetchBooks();
          fetchActiveLoans();
          if (onActionCompleted) onActionCompleted();
        }
      } else {
        alert(data.error || "Gagal memproses peminjaman");
      }
    } catch (err) {
      console.error(err);
      alert("Error koneksi server");
    }
  };


  const handleJoinQueue = async () => {
    try {
      const response = await fetch(`${API_BASE}/queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: parseInt(selectedMemberId),
          book_id: selectedBook.id
        })
      });
      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        setQueueModalOpen(false);
        fetchBooks();
        if (onActionCompleted) onActionCompleted();
      } else {
        alert(data.error || "Gagal masuk antrean");
      }
    } catch (err) {
      console.error(err);
      alert("Error koneksi server");
    }
  };


  const handleReturn = async (loan) => {
    try {
      const response = await fetch(`${API_BASE}/loans/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: loan.member_id,
          book_id: loan.book_id
        })
      });
      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchBooks();
        fetchActiveLoans();
        if (onActionCompleted) onActionCompleted();
      } else {
        alert(data.error || "Gagal mengembalikan buku");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fade-in">

      <div className="algo-stat-banner" style={{ marginBottom: '1.25rem' }}>
        <div className="flex-center">
          <Clock size={16} />
          <span>
            Pencarian & Pengurutan Aktif:{' '}
            {searchQuery && (
              <span>
                Linear Search (<span className="algo-stat-value">{searchSteps} perbandingan</span>)
              </span>
            )}
            {searchQuery && sortBy && ' | '}
            {sortBy && (
              <span>
                Sort <span className="algo-stat-value">{sortBy}</span> via{' '}
                <span className="algo-stat-value">{sortAlgo.toUpperCase()}</span> (
                <span className="algo-stat-value">{(sortTime || 0).toFixed(4)} ms</span>)
              </span>
            )}
            {!searchQuery && !sortBy && 'Katalog dimuat dari SQLite'}
          </span>
        </div>
        <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={runBenchmark} disabled={benchmarking}>
          <BarChart2 size={12} /> {benchmarking ? 'Menguji...' : 'Bandingkan Algoritma Sort'}
        </button>
      </div>


      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', borderLeft: '4px solid var(--accent-primary)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Buku (Judul)</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{books.length}</span>
        </div>
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', borderLeft: '4px solid var(--accent-emerald)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Stok Buku Tersedia</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{books.reduce((sum, b) => sum + b.stock, 0)}</span>
        </div>
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', borderLeft: '4px solid var(--accent-pink)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Peminjaman Aktif</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{activeLoans.length}</span>
        </div>
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', borderLeft: '4px solid var(--accent-purple)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Antrean DLL</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{queueSize}</span>
        </div>
      </div>


      {benchmarkData && (
        <div className="glass-card" style={{ marginBottom: '1.5rem', background: '#f8fafc' }}>
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <h4 className="flex-center text-teal" style={{ margin: 0 }}><BarChart2 size={18} /> Hasil Perbandingan Kecepatan Sorting (Big-O)</h4>
            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setBenchmarkData(null)}>Tutup</button>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Mengurutkan {books.length} buku. Bubble Sort memiliki kompleksitas rata-rata O(N²), sedangkan Merge dan Quick Sort memiliki O(N log N).
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.entries(benchmarkData).map(([algo, time]) => (
              <div key={algo} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 80px', alignItems: 'center', gap: '1rem' }}>
                <span style={{ textTransform: 'capitalize', fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  {algo === 'quick' ? 'Quick Sort' : algo === 'merge' ? 'Merge Sort' : 'Bubble Sort'}
                </span>
                <div style={{ background: '#e2e8f0', borderRadius: '4px', height: '12px', overflow: 'hidden' }}>
                  <div
                    style={{
                      background: algo === 'bubble' ? 'var(--accent-pink)' : algo === 'merge' ? 'var(--accent-primary)' : 'var(--accent-emerald)',
                      width: `${Math.min(100, Math.max(5, (time / Math.max(...Object.values(benchmarkData))) * 100))}%`,
                      height: '100%',
                      transition: 'width 0.5s ease'
                    }}
                  />
                </div>
                <span className="algo-stat-value" style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  {time.toFixed(4)} ms
                </span>
              </div>
            ))}
          </div>
        </div>
      )}


      <div className="catalog-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '300px' }}>
          <div className="search-wrapper" style={{ flex: 1 }}>
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="form-input search-input-padding"
              placeholder="Cari judul buku atau penulis (Linear Search)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {isAdmin && (
            <button
              type="button"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap', padding: '0 1rem', height: 'auto' }}
              onClick={handleOpenAddModal}
            >
              <Plus size={16} /> Tambah Buku
            </button>
          )}
        </div>

        <div className="flex-center" style={{ gap: '0.5rem' }}>
          <div className="flex-center" style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.15rem 0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '0 0.5rem' }}>Urut:</span>
            <select className="form-input" style={{ border: 'none', background: 'transparent', width: 'auto', padding: '0.25rem 1.5rem 0.25rem 0.25rem' }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="year">Tahun Terbit</option>
              <option value="rating">Rating Buku</option>
              <option value="title">Judul Buku</option>
            </select>
          </div>

          <div className="flex-center" style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.15rem 0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '0 0.5rem' }}>Algoritma:</span>
            <select className="form-input" style={{ border: 'none', background: 'transparent', width: 'auto', padding: '0.25rem 1.5rem 0.25rem 0.25rem' }} value={sortAlgo} onChange={(e) => setSortAlgo(e.target.value)}>
              <option value="quick">Quick Sort (O(N log N))</option>
              <option value="merge">Merge Sort (O(N log N))</option>
              <option value="bubble">Bubble Sort (O(N²))</option>
            </select>
          </div>

          <button className="btn btn-secondary" style={{ padding: '0.55rem 0.75rem' }} onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
            <ArrowUpDown size={16} />
          </button>
        </div>
      </div>


      <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
        {books.map((book) => (
          <div key={book.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            <div>
              <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  <span className="badge badge-teal">{book.category}</span>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(book)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                        title="Edit Buku"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBook(book.id, book.title)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-pink)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                        title="Hapus Buku"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  )}
                </div>
                <span className="badge badge-purple" style={{ fontFamily: 'monospace' }}>{book.isbn}</span>
              </div>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>{book.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>Oleh: {book.author}</p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span className="flex-center" style={{ color: '#d97706', fontWeight: '600' }}><Star size={14} fill="#d97706" /> {book.rating.toFixed(1)}</span>
                <span>Thn: {book.year}</span>
                <span>Stok: <strong style={{ color: book.stock > 0 ? 'var(--accent-emerald)' : 'var(--accent-red)' }}>{book.stock}</strong></span>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }} className="tooltip">
                Lokasi: <span style={{ textDecoration: 'underline' }}>{book.shelf_node === 'shelf_fiction' ? 'Rak A1' : book.shelf_node === 'shelf_science' ? 'Rak B1' : book.shelf_node === 'shelf_history' ? 'Rak C1' : book.shelf_node === 'shelf_arts' ? 'Rak D1' : book.shelf_node === 'shelf_computer' ? 'Rak E1' : 'Rak F1'}</span>
                <span className="tooltip-text">Node Graph: {book.shelf_node}</span>
              </span>

              <button
                className={`btn btn-small ${book.stock > 0 ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem' }}
                onClick={() => {
                  setSelectedBook(book);
                  setBorrowModalOpen(true);
                }}
              >
                {book.stock > 0 ? 'Pinjam' : 'Antre'}
              </button>
            </div>
          </div>
        ))}
      </div>


      <div className="glass-card">
        <h2 className="card-title text-teal"><Bookmark size={20} /> Transaksi Peminjaman Aktif (SQLite)</h2>
        {activeLoans.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0' }}>Tidak ada peminjaman buku yang aktif saat ini.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Buku</th>
                  <th>ISBN</th>
                  <th>Peminjam</th>
                  <th>Tanggal Pinjam</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {activeLoans.map((loan) => (
                  <tr key={loan.id}>
                    <td><strong style={{ color: 'var(--text-primary)' }}>{loan.book_title}</strong></td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{loan.book_isbn}</td>
                    <td>{loan.member_name}</td>
                    <td>{loan.loan_date}</td>
                    <td><span className="badge badge-rose">{loan.status === 'borrowed' ? 'DIPINJAM' : 'KEMBALI'}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-danger" style={{ padding: '0.3rem 0.65rem', fontSize: '0.775rem' }} onClick={() => handleReturn(loan)}>
                        Kembalikan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {borrowModalOpen && selectedBook && (
        <div className="dialog-overlay">
          <div className="glass-card dialog-content">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Form Transaksi Peminjaman</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Anda akan meminjam buku: <strong style={{ color: 'var(--text-primary)' }}>{selectedBook.title}</strong> oleh {selectedBook.author}.
            </p>

            <form onSubmit={handleBorrowSubmit}>
              <div className="form-group">
                <label className="form-label">Pilih Anggota Perpustakaan:</label>
                {members.length === 0 ? (
                  <p style={{ color: 'var(--accent-red)', fontSize: '0.8rem' }}>Daftar anggota kosong! Silakan daftarkan anggota baru terlebih dahulu di tab Cari Anggota.</p>
                ) : (
                  <select
                    className="form-input"
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>ID: {m.id} - {m.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex-between" style={{ marginTop: '1.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setBorrowModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={members.length === 0}>Konfirmasi Pinjam</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {queueModalOpen && selectedBook && (
        <div className="dialog-overlay">
          <div className="glass-card dialog-content" style={{ borderColor: 'var(--accent-primary)' }}>
            <h3 className="flex-center text-pink" style={{ fontSize: '1.15rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              <AlertTriangle size={18} /> Stok Habis! Bergabung ke Antrean?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              Stok buku <strong style={{ color: 'var(--text-primary)' }}>{selectedBook.title}</strong> sedang kosong karena dipinjam.
              Apakah Anda ingin memasukkan anggota ini ke dalam <strong>Antrean Peminjaman (Doubly Linked List)</strong>?
              <br/><br/>
              Ketika buku dikembalikan oleh peminjam sebelumnya, antrean pertama akan <strong>otomatis</strong> meminjam buku ini.
            </p>

            <div className="flex-between" style={{ marginTop: '1.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setQueueModalOpen(false)}>Batal</button>
              <button className="btn btn-accent" onClick={handleJoinQueue}>Bergabung ke Antrean</button>
            </div>
          </div>
        </div>
      )}


      {addBookModalOpen && (
        <div className="dialog-overlay" style={{ zIndex: 1000 }}>
          <div className="glass-card dialog-content" style={{ maxWidth: '450px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📚 Tambah Buku Baru
            </h3>

            <form onSubmit={handleAddBookSubmit}>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label">Judul Buku:</label>
                <input
                  type="text"
                  className="form-input"
                  value={bookForm.title}
                  onChange={(e) => setBookForm({...bookForm, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label">Penulis:</label>
                <input
                  type="text"
                  className="form-input"
                  value={bookForm.author}
                  onChange={(e) => setBookForm({...bookForm, author: e.target.value})}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label">ISBN:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: 1234 (4 digit terakhir)"
                  value={bookForm.isbn}
                  onChange={(e) => setBookForm({...bookForm, isbn: e.target.value})}
                  required
                />
              </div>
              <div className="grid-2" style={{ gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Kategori:</label>
                  <select
                    className="form-input"
                    value={bookForm.category}
                    onChange={(e) => setBookForm({...bookForm, category: e.target.value})}
                  >
                    <option value="Fiksi">Fiksi</option>
                    <option value="Sains & Teknologi">Sains & Teknologi</option>
                    <option value="Sejarah">Sejarah</option>
                    <option value="Seni & Sastra">Seni & Sastra</option>
                    <option value="Komputer & Elektro">Komputer & Elektro</option>
                    <option value="Umum & Kamus">Umum & Kamus</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tahun Terbit:</label>
                  <input
                    type="number"
                    className="form-input"
                    value={bookForm.year}
                    onChange={(e) => setBookForm({...bookForm, year: parseInt(e.target.value) || 2026})}
                    required
                  />
                </div>
              </div>
              <div className="grid-2" style={{ gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Rating (0 - 5.0):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    className="form-input"
                    value={bookForm.rating}
                    onChange={(e) => setBookForm({...bookForm, rating: parseFloat(e.target.value) || 0.0})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stok Buku:</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={bookForm.stock}
                    onChange={(e) => setBookForm({...bookForm, stock: parseInt(e.target.value) || 0})}
                    required
                  />
                </div>
              </div>

              <div className="flex-between" style={{ marginTop: '1.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAddBookModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Tambah</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {editBookModalOpen && (
        <div className="dialog-overlay" style={{ zIndex: 1000 }}>
          <div className="glass-card dialog-content" style={{ maxWidth: '450px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📝 Edit Detail Buku
            </h3>

            <form onSubmit={handleEditBookSubmit}>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label">Judul Buku:</label>
                <input
                  type="text"
                  className="form-input"
                  value={bookForm.title}
                  onChange={(e) => setBookForm({...bookForm, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label">Penulis:</label>
                <input
                  type="text"
                  className="form-input"
                  value={bookForm.author}
                  onChange={(e) => setBookForm({...bookForm, author: e.target.value})}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label">ISBN:</label>
                <input
                  type="text"
                  className="form-input"
                  value={bookForm.isbn}
                  onChange={(e) => setBookForm({...bookForm, isbn: e.target.value})}
                  required
                  disabled
                />
              </div>
              <div className="grid-2" style={{ gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Kategori:</label>
                  <select
                    className="form-input"
                    value={bookForm.category}
                    onChange={(e) => setBookForm({...bookForm, category: e.target.value})}
                  >
                    <option value="Fiksi">Fiksi</option>
                    <option value="Sains & Teknologi">Sains & Teknologi</option>
                    <option value="Sejarah">Sejarah</option>
                    <option value="Seni & Sastra">Seni & Sastra</option>
                    <option value="Komputer & Elektro">Komputer & Elektro</option>
                    <option value="Umum & Kamus">Umum & Kamus</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tahun Terbit:</label>
                  <input
                    type="number"
                    className="form-input"
                    value={bookForm.year}
                    onChange={(e) => setBookForm({...bookForm, year: parseInt(e.target.value) || 2026})}
                    required
                  />
                </div>
              </div>
              <div className="grid-2" style={{ gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Rating (0 - 5.0):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    className="form-input"
                    value={bookForm.rating}
                    onChange={(e) => setBookForm({...bookForm, rating: parseFloat(e.target.value) || 0.0})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stok Buku:</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={bookForm.stock}
                    onChange={(e) => setBookForm({...bookForm, stock: parseInt(e.target.value) || 0})}
                    required
                  />
                </div>
              </div>

              <div className="flex-between" style={{ marginTop: '1.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditBookModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
