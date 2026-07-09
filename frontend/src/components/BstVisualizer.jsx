import React, { useState, useEffect } from 'react';
import { GitBranch, Search, AlertCircle, HelpCircle, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const API_BASE = '/api';

export default function BstVisualizer({ triggerRefresh }) {
  const [treeData, setTreeData] = useState(null);
  const [searchIsbn, setSearchIsbn] = useState('');
  const [searchPath, setSearchPath] = useState([]);
  const [currentPathIndex, setCurrentPathIndex] = useState(-1);
  const [searchResult, setSearchResult] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');


  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setHasDragged(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      setHasDragged(true);
    }
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {

    e.preventDefault();
    const zoomFactor = 1.05;
    let newScale = scale;
    if (e.deltaY < 0) {
      newScale = Math.min(scale * zoomFactor, 3);
    } else {
      newScale = Math.max(scale / zoomFactor, 0.5);
    }
    setScale(newScale);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setHasDragged(false);
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStart.x;
    const dy = e.touches[0].clientY - dragStart.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      setHasDragged(true);
    }
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.15, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.15, 0.5));
  };

  const handleReset = () => {
    setPan({ x: 0, y: 0 });
    setScale(1);
  };

  const fetchBst = async () => {
    try {
      const res = await fetch(`${API_BASE}/bst`);
      const data = await res.json();
      setTreeData(data.root);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBst();
  }, [triggerRefresh]);


  const layoutTree = (node, x, y, dx, dy, depth = 0) => {
    if (!node) return null;

    return {
      isbn: node.isbn,
      title: node.title,
      x,
      y,
      left: layoutTree(node.left, x - dx, y + dy, dx * 0.52, dy, depth + 1),
      right: layoutTree(node.right, x + dx, y + dy, dx * 0.52, dy, depth + 1)
    };
  };

  const svgWidth = 800;
  const svgHeight = 450;
  const renderedTree = layoutTree(treeData, svgWidth / 2, 40, 190, 80);


  const nodesList = [];
  const linksList = [];

  const traverse = (node) => {
    if (!node) return;

    nodesList.push({
      isbn: node.isbn,
      title: node.title,
      x: node.x,
      y: node.y
    });

    if (node.left) {
      linksList.push({
        id: `${node.isbn}-${node.left.isbn}`,
        x1: node.x,
        y1: node.y,
        x2: node.left.x,
        y2: node.left.y,
        source: node.isbn,
        target: node.left.isbn
      });
      traverse(node.left);
    }

    if (node.right) {
      linksList.push({
        id: `${node.isbn}-${node.right.isbn}`,
        x1: node.x,
        y1: node.y,
        x2: node.right.x,
        y2: node.right.y,
        source: node.isbn,
        target: node.right.isbn
      });
      traverse(node.right);
    }
  };

  traverse(renderedTree);


  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchIsbn.trim()) return;

    setErrorMsg('');
    setSearchResult(null);
    setSearchPath([]);
    setCurrentPathIndex(-1);

    try {
      const res = await fetch(`${API_BASE}/books/isbn/${searchIsbn.trim()}`);
      const data = await res.json();

      if (res.ok) {
        setSearchResult(data.book);
        animatePath(data.search_path);
      } else {
        setErrorMsg(data.error || "Buku tidak ditemukan");
        if (data.search_path && data.search_path.length > 0) {
          animatePath(data.search_path);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Koneksi gagal");
    }
  };

  const animatePath = (path) => {
    setAnimating(true);
    setSearchPath(path);
    setCurrentPathIndex(0);

    let index = 0;
    const interval = setInterval(() => {
      index++;
      if (index < path.length) {
        setCurrentPathIndex(index);
      } else {
        clearInterval(interval);
        setAnimating(false);
      }
    }, 600);
  };


  const getNodeStatus = (isbn) => {
    if (searchPath.length === 0) return 'normal';

    const pathIdx = searchPath.indexOf(isbn);
    if (pathIdx === -1 || pathIdx > currentPathIndex) return 'normal';

    if (pathIdx === searchPath.length - 1 && searchResult && searchResult.isbn.replace("-","") === isbn && !animating) {
      return 'match';
    }

    return 'searched';
  };


  const isLinkActive = (sourceIsbn, targetIsbn) => {
    if (searchPath.length <= 1) return false;

    const sourceIdx = searchPath.indexOf(sourceIsbn);
    const targetIdx = searchPath.indexOf(targetIsbn);

    if (sourceIdx !== -1 && targetIdx !== -1 && Math.abs(sourceIdx - targetIdx) === 1) {
      return sourceIdx <= currentPathIndex && targetIdx <= currentPathIndex;
    }

    return false;
  };

  return (
    <div className="fade-in">
      <div className="grid-2" style={{ gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>


        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 className="card-title text-teal" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="flex-center"><GitBranch size={20} /> Indeks Buku (Binary Search Tree)</span>
            <span className="badge badge-purple" style={{ fontFamily: 'monospace' }}>ISBN BST</span>
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.4' }}>
            Pohon di bawah dibuat otomatis berdasarkan nomor ISBN buku. Masukkan ISBN untuk melihat traversal pohon <strong>O(log N)</strong>. Anda dapat <strong>menggeser (drag)</strong> atau <strong>memperbesar/memperkecil (scroll)</strong> tampilan pohon.
          </p>

          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {renderedTree ? (
              <>
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="bst-svg"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                  onWheel={handleWheel}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
                >
                  <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>

                    {linksList.map((link) => {
                      const active = isLinkActive(link.source, link.target);
                      return (
                        <line
                          key={link.id}
                          x1={link.x1}
                          y1={link.y1}
                          x2={link.x2}
                          y2={link.y2}
                          className={`bst-link ${active ? 'active-path' : ''}`}
                        />
                      );
                    })}


                    {nodesList.map((node) => {
                      const status = getNodeStatus(node.isbn);
                      return (
                        <g
                          key={node.isbn}
                          onClick={(e) => {
                            if (hasDragged) {
                              e.preventDefault();
                              return;
                            }
                            setSearchIsbn(node.isbn);
                            setTimeout(() => {
                              const submitBtn = document.getElementById('search-bst-btn');
                              if (submitBtn) submitBtn.click();
                            }, 50);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={20}
                            className={`bst-node-circle ${
                              status === 'searched' ? 'searched' : status === 'match' ? 'current-match' : ''
                            }`}
                          />
                          <text x={node.x} y={node.y} className="bst-node-text">
                            {node.isbn.slice(-4)}
                          </text>
                          <title>{node.title} ({node.isbn})</title>
                        </g>
                      );
                    })}
                  </g>
                </svg>


                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  background: 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(4px)',
                  padding: '6px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  zIndex: 10
                }}>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    className="btn-zoom-control"
                    style={{
                      padding: '4px',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'white',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    title="Perbesar"
                  >
                    <ZoomIn size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    className="btn-zoom-control"
                    style={{
                      padding: '4px',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'white',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    title="Perkecil"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="btn-zoom-control"
                    style={{
                      padding: '4px',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'white',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    title="Atur Ulang Tampilan"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', height: '350px', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Memuat pohon BST...
              </div>
            )}
          </div>
        </div>


        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>


          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Cari Buku via BST</h3>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Masukkan ISBN..."
                value={searchIsbn}
                onChange={(e) => setSearchIsbn(e.target.value)}
              />
              <button id="search-bst-btn" type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }} disabled={animating}>
                <Search size={16} />
              </button>
            </form>

            <div style={{ marginTop: '0.75rem', fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
              Tip: Klik salah satu node lingkaran di peta pohon untuk menyalin ISBN-nya ke kotak cari!
            </div>
          </div>


          <div className="glass-card" style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Detail Hasil Pencarian</h3>

            {animating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontSize: '0.85rem', padding: '1rem 0' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-primary)', animation: 'bst-node-glow 0.6s infinite alternate' }}/>
                <span>Sedang menelusuri pohon BST...</span>
              </div>
            )}

            {!animating && searchPath.length > 0 && (
              <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.8rem' }}>
                <strong style={{ color: 'var(--accent-primary)' }}>Rute Traversal BST: </strong>
                <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                  {searchPath.map((node, i) => (
                    <span key={node}>
                      {node.slice(-4)}
                      {i < searchPath.length - 1 ? ' → ' : ''}
                    </span>
                  ))}
                </span>
                <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                  Pencarian selesai dalam <strong>{searchPath.length} perbandingan</strong> node.
                </div>
              </div>
            )}

            {!animating && searchResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span className="badge badge-teal" style={{ alignSelf: 'flex-start' }}>{searchResult.category}</span>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '700' }}>{searchResult.title}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Oleh: {searchResult.author}</p>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  <span>Tahun: {searchResult.year}</span>
                  <span>Rating: ⭐ {searchResult.rating}</span>
                </div>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.75rem', borderRadius: '8px', fontSize: '0.75rem', marginTop: '1rem', color: '#166534' }}>
                  Buku ditemukan di <strong>{searchResult.shelf_node === 'shelf_fiction' ? 'Rak Fiksi (A1)' : searchResult.shelf_node === 'shelf_science' ? 'Rak Sains (B1)' : searchResult.shelf_node === 'shelf_history' ? 'Rak Sejarah (C1)' : searchResult.shelf_node === 'shelf_arts' ? 'Rak Seni (D1)' : searchResult.shelf_node === 'shelf_computer' ? 'Rak Komputer (E1)' : 'Rak Umum (F1)'}</strong>.
                </div>
              </div>
            )}

            {!animating && errorMsg && (
              <div className="flex-center" style={{ color: 'var(--accent-red)', fontSize: '0.85rem', background: '#fff5f5', border: '1px solid #fed7d7', padding: '0.75rem', borderRadius: '8px' }}>
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            {!animating && !searchResult && !errorMsg && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', paddingTop: '2rem' }}>
                Masukkan nomor ISBN dan jalankan pencarian untuk melihat hasilnya.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ background: '#f8fafc', borderColor: 'var(--border-color)' }}>
        <h4 className="flex-center text-teal" style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}><HelpCircle size={16} /> Penjelasan Konsep Binary Search Tree (BST)</h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          Binary Search Tree adalah struktur data pohon biner di mana setiap node memenuhi properti berikut:
          Semua node di <strong>sub-pohon kiri</strong> memiliki nilai kunci (ISBN) yang <strong>lebih kecil</strong> daripada kunci node tersebut, dan
          semua node di <strong>sub-pohon kanan</strong> memiliki nilai kunci yang <strong>lebih besar</strong>.
          Hal ini memungkinkan pencarian dengan kompleksitas waktu rata-rata <strong>O(log N)</strong> karena setiap percabangan
          memangkas separuh sisa ruang pencarian.
        </p>
      </div>
    </div>
  );
}
