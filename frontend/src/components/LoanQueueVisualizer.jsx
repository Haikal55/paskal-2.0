import React, { useState, useEffect } from 'react';
import { Users, Trash2, ArrowLeftRight, HelpCircle } from 'lucide-react';

const API_BASE = '/api';

export default function LoanQueueVisualizer({ triggerRefresh, onActionCompleted }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/queue`);
      const data = await res.json();
      setQueue(data.queue || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [triggerRefresh]);

  const handleCancelQueue = async (memberId, bookId) => {
    try {
      const res = await fetch(`${API_BASE}/queue/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId, book_id: bookId })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Berhasil membatalkan antrean");
        fetchQueue();
        if (onActionCompleted) onActionCompleted();
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="glass-card fade-in">
      <h2 className="card-title text-teal" style={{ justifyContent: 'space-between', display: 'flex' }}>
        <span className="flex-center"><Users size={20} /> Visualisasi Antrean (Doubly Linked List)</span>
        <span className="badge badge-purple" style={{ textTransform: 'none', fontFamily: 'monospace' }}>
          Jumlah Node: {queue.length}
        </span>
      </h2>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem', lineHeight: '1.5' }}>
        Antrean di bawah dikelola menggunakan <strong>Doubly Linked List</strong> di backend Python.
        Setiap node memiliki pointer <strong>Next</strong> (ke anggota di belakangnya) dan <strong>Prev</strong> (ke anggota di depannya),
        sehingga operasi penambahan di akhir (<code>enqueue</code>) atau penghapusan di tengah (<code>remove</code>) berlangsung sangat efisien.
      </p>

      {queue.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '500' }}>Tidak ada mahasiswa dalam antrean peminjaman.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            Tip: Untuk mencoba antrean, lakukan peminjaman buku yang stoknya sedang 0 (misalnya buku <strong>"Pulang"</strong>).
          </p>
        </div>
      ) : (
        <div className="queue-container">
          {queue.map((item, index) => {
            const isHead = index === 0;
            const isTail = index === queue.length - 1;

            return (
              <React.Fragment key={`${item.member_id}-${item.book_id}`}>

                <div className={`queue-card ${isHead ? 'head-node' : ''} ${isTail ? 'tail-node' : ''}`}>
                  <span className="queue-badge">{index + 1}</span>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '0.25rem', fontWeight: '700' }}>
                    {item.member_name}
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                    ID MHS: {item.member_id}
                  </p>

                  <div style={{ background: '#f1f5f9', padding: '0.45rem', borderRadius: '6px', fontSize: '0.75rem', margin: '0.65rem 0', border: '1px solid #e2e8f0', color: 'var(--accent-primary)' }}>
                    Buku: <strong style={{ color: 'var(--text-primary)' }}>{item.book_title}</strong>
                  </div>

                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Antre sejak:<br/>{item.joined_at.split(' ')[1]}
                  </div>

                  <button
                    className="btn btn-danger btn-small"
                    style={{ width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                    onClick={() => handleCancelQueue(item.member_id, item.book_id)}
                  >
                    <Trash2 size={12} /> Batal Antre
                  </button>
                </div>


                {!isTail && (
                  <div className="queue-arrow">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.625rem', color: 'var(--accent-primary)', fontWeight: '600' }}>prev</span>
                      <ArrowLeftRight size={16} className="text-teal" />
                      <span style={{ fontSize: '0.625rem', color: 'var(--accent-pink)', fontWeight: '600' }}>next</span>
                    </div>
                    <span className="queue-arrow-text">next: pt</span>
                    <span className="queue-arrow-text" style={{ fontSize: '0.6rem', marginTop: '-2px' }}>prev: pt</span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}


      <div className="glass-card" style={{ marginTop: '2rem', background: '#f8fafc', borderColor: 'var(--border-color)' }}>
        <h4 className="flex-center text-pink" style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}><HelpCircle size={16} /> Bagaimana Doubly Linked List Bekerja di Sini?</h4>
        <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>
            <strong>Enqueue (Menambah Antrean):</strong> Mahasiswa baru ditambahkan ke ekor (<code>Tail</code>) antrean.
            Operasi ini dilakukan dengan mengarahkan pointer <code>tail.next = new_node</code> dan <code>new_node.prev = tail</code>.
          </li>
          <li>
            <strong>Dequeue (Memproses Antrean):</strong> Ketika buku dikembalikan, sistem mengambil mahasiswa dari kepala (<code>Head</code>) antrean secara FIFO (First In First Out), lalu memutus pointer head lama.
          </li>
          <li>
            <strong>Batalkan Antrean (Node Deletion):</strong> Jika mahasiswa membatalkan antrean di tengah-tengah list, sistem mencari node tersebut dan melakukan pemutusan pointer: <code>node.prev.next = node.next</code> dan <code>node.next.prev = node.prev</code>.
          </li>
        </ul>
      </div>
    </div>
  );
}
