import React, { useState, useEffect } from 'react';
import { UserPlus, Search, UserCheck, AlertCircle, HelpCircle, BarChart2 } from 'lucide-react';

const API_BASE = '/api';

export default function MemberSearch({ triggerRefresh, onActionCompleted }) {
  const [members, setMembers] = useState([]);
  const [newMemberName, setNewMemberName] = useState('');


  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [stepsTaken, setStepsTaken] = useState(null);
  const [totalRecords, setTotalRecords] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);

  const fetchMembers = async () => {
    try {
      const res = await fetch(`${API_BASE}/members`);
      const data = await res.json();
      setMembers(data);
    } catch (e) {
      console.error("Gagal memuat daftar anggota:", e);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [triggerRefresh]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newMemberName.trim() })
      });
      const data = await res.json();

      if (res.ok) {
        alert(`Anggota berhasil didaftarkan dengan ID: ${data.member_id}`);
        setNewMemberName('');
        fetchMembers();
        if (onActionCompleted) onActionCompleted();
      } else {
        alert(data.error || "Gagal menambah anggota");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchMember = async (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setLoadingSearch(true);
    setErrorMsg('');
    setSearchResult(null);
    setStepsTaken(null);
    setTotalRecords(null);

    try {
      const res = await fetch(`${API_BASE}/members/search?id=${searchId.trim()}`);
      const data = await res.json();

      if (res.ok) {
        setSearchResult(data.member);
        setStepsTaken(data.steps_taken);
        setTotalRecords(data.total_records);
      } else {
        setErrorMsg(data.error || "Anggota tidak ditemukan");
        if (data.steps_taken !== undefined) {
          setStepsTaken(data.steps_taken);
          setTotalRecords(data.total_records);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Koneksi gagal");
    } finally {
      setLoadingSearch(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="grid-2" style={{ gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>


        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>


          <div className="glass-card">
            <h3 className="card-title text-teal"><UserPlus size={18} /> Registrasi Anggota Baru</h3>
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label className="form-label">Nama Lengkap Mahasiswa:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Masukkan nama..."
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                Daftarkan Anggota
              </button>
            </form>
          </div>


          <div className="glass-card" style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Daftar Anggota Aktif ({members.length})</h3>
            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
              <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nama Anggota</th>
                    <th>Join Date</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>ID: {m.id}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{m.name}</td>
                      <td>{m.join_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>


        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 className="card-title text-teal"><Search size={20} /> Cari Anggota (Binary Search)</h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
            Pencarian biner (Binary Search) mengharuskan data untuk <strong>diurutkan terlebih dahulu</strong>.
            Backend akan mengurutkan anggota menggunakan <strong>Quick Sort</strong>, lalu menjalankan Binary Search untuk menemukan ID dengan kompleksitas <strong>O(log N)</strong>.
          </p>

          <form onSubmit={handleSearchMember} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Masukkan ID Anggota (Angka)..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }} disabled={loadingSearch}>
              <Search size={16} />
            </button>
          </form>


          <div style={{ flex: 1, background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

            {loadingSearch && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>Melakukan pencarian biner...</p>}

            {!loadingSearch && searchResult && (
              <div>
                <div className="flex-center text-emerald" style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                  <UserCheck size={18} /> Anggota Ditemukan!
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  <div style={{ color: 'var(--text-secondary)' }}>ID Anggota: <strong style={{ color: 'var(--text-primary)' }}>{searchResult.id}</strong></div>
                  <div style={{ color: 'var(--text-secondary)' }}>Nama Lengkap: <strong style={{ color: 'var(--text-primary)' }}>{searchResult.name}</strong></div>
                  <div style={{ color: 'var(--text-secondary)' }}>Tanggal Bergabung: <strong style={{ color: 'var(--text-primary)' }}>{searchResult.join_date}</strong></div>
                </div>


                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <h4 className="flex-center" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', marginBottom: '0.75rem' }}>
                    <BarChart2 size={14} /> Analisis Perbandingan Pencarian
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.5rem', borderRadius: '6px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.675rem', color: '#166534', fontWeight: '500' }}>Binary Search (O(log N))</span>
                      <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--accent-emerald)', marginTop: '0.25rem' }}>
                        {stepsTaken} <span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>langkah</span>
                      </div>
                    </div>

                    <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', padding: '0.5rem', borderRadius: '6px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.675rem', color: '#991b1b', fontWeight: '500' }}>Linear Search (O(N))</span>
                      <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#f87171', marginTop: '0.25rem' }}>
                        {totalRecords} <span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>langkah (worst)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!loadingSearch && errorMsg && (
              <div style={{ textAlign: 'center' }}>
                <div className="flex-center" style={{ color: 'var(--accent-red)', fontSize: '0.85rem', justifyContent: 'center', marginBottom: '1rem' }}>
                  <AlertCircle size={18} /> {errorMsg}
                </div>
                {stepsTaken !== null && (
                  <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                    Pencarian biner buntu setelah <strong>{stepsTaken} langkah</strong> dari total <strong>{totalRecords} records</strong>.
                  </p>
                )}
              </div>
            )}

            {!loadingSearch && !searchResult && !errorMsg && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                Hasil pencarian biner akan ditampilkan di sini beserta langkah komparasi Big-O.
              </p>
            )}
          </div>

        </div>
      </div>


      <div className="glass-card" style={{ background: '#f8fafc', borderColor: 'var(--border-color)' }}>
        <h4 className="flex-center text-teal" style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}><HelpCircle size={16} /> Mengapa Menggunakan Binary Search?</h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          Binary Search memotong ruang pencarian menjadi <strong>dua bagian</strong> pada setiap langkah.
          Ia membandingkan nilai target dengan nilai tengah elemen. Jika tidak sama, ia mempersempit pencarian ke setengah bagian yang tersisa.
          Oleh karena itu, untuk database berukuran N = 1.000 data, Linear Search membutuhkan hingga <strong>1.000 perbandingan</strong>,
          sedangkan Binary Search hanya membutuhkan maksimal <strong>10 perbandingan</strong> (log₂ 1000 ≈ 10).
        </p>
      </div>
    </div>
  );
}
