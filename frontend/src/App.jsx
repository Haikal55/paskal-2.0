import React, { useState } from 'react';
import { BookOpen, Users, GitBranch, Map, UserCheck, Library, Menu, X, ShieldAlert } from 'lucide-react';
import BookCatalog from './components/BookCatalog';
import LoanQueueVisualizer from './components/LoanQueueVisualizer';
import BstVisualizer from './components/BstVisualizer';
import MapVisualizer from './components/MapVisualizer';
import MemberSearch from './components/MemberSearch';

export default function App() {
  const [activeTab, setActiveTab] = useState('catalog');
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  const [isAdmin, setIsAdmin] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');


  const handleActionCompleted = () => {
    setRefreshCounter((prev) => prev + 1);
  };

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    setIsSidebarOpen(false);
  };

  const handleAdminLoginSubmit = (e) => {
    e.preventDefault();
    if (adminPassword === 'admin') {
      setIsAdmin(true);
      setLoginModalOpen(false);
      setLoginError('');
      alert("Login Admin Berhasil! Menu Tambah, Edit, dan Hapus Buku sekarang terbuka.");
    } else {
      setLoginError("Password salah! (Gunakan password: admin)");
    }
  };

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'catalog':
        return {
          title: 'Katalog Buku Perpustakaan',
          desc: 'Kelola sirkulasi buku, pencarian Linear, dan sorting Bubble, Merge, atau Quick Sort.'
        };
      case 'queue':
        return {
          title: 'Antrean Peminjaman Buku',
          desc: 'Visualisasi antrean peminjaman buku (FIFO) berbasis Doubly Linked List.'
        };
      case 'bst':
        return {
          title: 'Indeks ISBN (Binary Search Tree)',
          desc: 'Indeks pencarian cepat buku berdasarkan ISBN. Animasikan penelusuran O(log N) node secara interaktif.'
        };
      case 'map':
        return {
          title: 'Peta Navigasi Rak Buku (Graph)',
          desc: 'Denah visual lokasi rak buku. Menemukan rute jalan terpendek menggunakan Algoritma Dijkstra.'
        };
      case 'members':
        return {
          title: 'Manajemen Anggota & Binary Search',
          desc: 'Daftarkan anggota dan cari ID Anggota menggunakan Binary Search pada data terurut Quick Sort.'
        };
      default:
        return { title: 'Dashboard Perpustakaan', desc: 'PASKAL - Perpustakaan Digital Struktur Data & Algoritma' };
    }
  };

  const header = getHeaderInfo();

  return (
    <div className="app-container">

      <div className="mobile-header">
        <button
          className="btn btn-secondary mobile-menu-btn"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu size={20} />
        </button>
        <div className="mobile-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src="/logo.svg" alt="Logo" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
          <span>PASKAL</span>
        </div>
        <div style={{ width: '32px' }} />
      </div>


      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}


      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>

        <button
          className="mobile-close-btn"
          onClick={() => setIsSidebarOpen(false)}
        >
          <X size={20} />
        </button>

        <div className="brand-section" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/logo.svg" alt="Logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
          <div>
            <h2 className="brand-name">PASKAL</h2>
            <p className="brand-sub">Sistem Perpustakaan</p>
          </div>
        </div>

        <ul className="nav-links">
          <li
            className={`nav-item ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => handleTabClick('catalog')}
          >
            <BookOpen size={18} />
            <span>Katalog & Sirkulasi</span>
          </li>
          <li
            className={`nav-item ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => handleTabClick('queue')}
          >
            <Users size={18} />
            <span>Antrean DLL</span>
          </li>
          <li
            className={`nav-item ${activeTab === 'bst' ? 'active' : ''}`}
            onClick={() => handleTabClick('bst')}
          >
            <GitBranch size={18} />
            <span>Indeks ISBN (BST)</span>
          </li>
          <li
            className={`nav-item ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => handleTabClick('map')}
          >
            <Map size={18} />
            <span>Peta Rak (Graph)</span>
          </li>
          <li
            className={`nav-item ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => handleTabClick('members')}
          >
            <UserCheck size={18} />
            <span>Cari Anggota (Biner)</span>
          </li>
        </ul>

        <div className="sidebar-footer">
          {isAdmin ? (
            <div style={{ marginBottom: '0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.5rem', borderRadius: '6px', textAlign: 'center' }}>
              <span style={{ color: '#166534', fontSize: '0.725rem', fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>🔒 Mode Admin Aktif</span>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', padding: '0.25rem', fontSize: '0.7rem', height: 'auto', minWidth: 'unset' }}
                onClick={() => setIsAdmin(false)}
              >
                Keluar Admin
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', marginBottom: '0.75rem', padding: '0.35rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', height: 'auto', minWidth: 'unset' }}
              onClick={() => {
                setLoginModalOpen(true);
                setAdminPassword('');
                setLoginError('');
              }}
            >
              🔑 Login Admin
            </button>
          )}
          <p>Kelas 2A - Struktur Data</p>
          <p style={{ marginTop: '0.25rem', color: 'var(--text-muted)' }}>Haikal © 2026</p>
        </div>
      </aside>


      <main className="main-content">
        <header className="content-header">
          <div>
            <h1>{header.title}</h1>
            <p>{header.desc}</p>
          </div>
          <div className="header-status-container" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {isAdmin && <span className="badge badge-purple" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><ShieldAlert size={12} /> Admin Mode</span>}
            <span className="badge badge-emerald">SQLite Active</span>
            <span className="badge badge-teal">Flask Connected</span>
          </div>
        </header>


        <div style={{ position: 'relative' }}>
          {activeTab === 'catalog' && (
            <BookCatalog
              activeTab={activeTab}
              isAdmin={isAdmin}
              onActionCompleted={handleActionCompleted}
            />
          )}
          {activeTab === 'queue' && (
            <LoanQueueVisualizer
              triggerRefresh={refreshCounter}
              onActionCompleted={handleActionCompleted}
            />
          )}
          {activeTab === 'bst' && (
            <BstVisualizer
              triggerRefresh={refreshCounter}
            />
          )}
          {activeTab === 'map' && (
            <MapVisualizer />
          )}
          {activeTab === 'members' && (
            <MemberSearch
              triggerRefresh={refreshCounter}
              onActionCompleted={handleActionCompleted}
            />
          )}
        </div>
      </main>


      {loginModalOpen && (
        <div className="dialog-overlay" style={{ zIndex: 1000 }}>
          <div className="glass-card dialog-content" style={{ maxWidth: '360px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🔑 Login Admin PASKAL
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Masukkan password administrator untuk membuka fitur Tambah, Edit, dan Hapus Buku.
            </p>

            <form onSubmit={handleAdminLoginSubmit}>
              <div className="form-group">
                <label className="form-label">Password Admin:</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Masukkan password admin..."
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  autoFocus
                />
                {loginError && (
                  <p style={{ color: 'var(--accent-red)', fontSize: '0.75rem', marginTop: '0.35rem' }}>
                    {loginError}
                  </p>
                )}
              </div>

              <div className="flex-between" style={{ marginTop: '1.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setLoginModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Masuk</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
