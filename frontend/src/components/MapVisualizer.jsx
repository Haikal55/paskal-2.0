import React, { useState, useEffect } from 'react';
import { Map, Navigation, Compass, Info, HelpCircle } from 'lucide-react';

const API_BASE = '/api';

export default function MapVisualizer() {
  const [mapNodes, setMapNodes] = useState({});
  const [startNode, setStartNode] = useState('entrance');
  const [endNode, setEndNode] = useState('shelf_fiction');


  const [routePath, setRoutePath] = useState([]);
  const [routeDetails, setRouteDetails] = useState([]);
  const [routeDistance, setRouteDistance] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchMap = async () => {
    try {
      const res = await fetch(`${API_BASE}/map`);
      const data = await res.json();
      setMapNodes(data);
    } catch (e) {
      console.error("Gagal memuat peta graph:", e);
    }
  };

  useEffect(() => {
    fetchMap();
  }, []);

  const handleFindRoute = async (e) => {
    if (e) e.preventDefault();
    if (!startNode || !endNode) return;

    setLoadingRoute(true);
    setErrorMsg('');
    setRoutePath([]);
    setRouteDetails([]);
    setRouteDistance(null);

    try {
      const res = await fetch(`${API_BASE}/route?start=${startNode}&end=${endNode}`);
      const data = await res.json();

      if (res.ok) {
        setRoutePath(data.path);
        setRouteDetails(data.path_details);
        setRouteDistance(data.distance);
      } else {
        setErrorMsg(data.error || "Rute tidak ditemukan");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Koneksi gagal");
    } finally {
      setLoadingRoute(false);
    }
  };

  useEffect(() => {
    if (Object.keys(mapNodes).length > 0) {
      handleFindRoute();
    }
  }, [mapNodes, endNode, startNode]);


  const nodesList = Object.values(mapNodes);
  const edgesList = [];
  const processedEdges = new Set();

  nodesList.forEach((node) => {
    Object.entries(node.neighbors).forEach(([neighborName, weight]) => {
      const edgeKey = [node.name, neighborName].sort().join('-');
      if (!processedEdges.has(edgeKey)) {
        processedEdges.add(edgeKey);
        const neighborNode = mapNodes[neighborName];
        if (neighborNode) {
          edgesList.push({
            id: edgeKey,
            x1: node.x,
            y1: node.y,
            x2: neighborNode.x,
            y2: neighborNode.y,
            source: node.name,
            target: neighborName,
            weight
          });
        }
      }
    });
  });

  const isEdgeInRoute = (nodeA, nodeB) => {
    if (routePath.length <= 1) return false;
    const idxA = routePath.indexOf(nodeA);
    const idxB = routePath.indexOf(nodeB);
    return idxA !== -1 && idxB !== -1 && Math.abs(idxA - idxB) === 1;
  };

  return (
    <div className="fade-in">
      <div className="grid-2" style={{ gridTemplateColumns: '2.5fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>


        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 className="card-title text-teal" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="flex-center"><Map size={20} /> Peta Denah & Rute Perpustakaan (Graph)</span>
            <span className="badge badge-emerald" style={{ fontFamily: 'monospace' }}>Dijkstra</span>
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.4' }}>
            Graf denah perpustakaan dengan rak buku, lobby, dan ruang baca. Jalur hijau menyala adalah rute terpendek yang dihitung dengan <strong>Algoritma Dijkstra</strong>.
          </p>

          <div style={{ flex: 1, position: 'relative' }}>
            {nodesList.length > 0 ? (
              <svg viewBox="0 0 950 550" className="map-svg">

                {edgesList.map((edge) => (
                  <line
                    key={edge.id}
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    className="map-edge"
                  />
                ))}


                {edgesList.map((edge) => {
                  const active = isEdgeInRoute(edge.source, edge.target);
                  return active ? (
                    <line
                      key={`active-${edge.id}`}
                      x1={edge.x1}
                      y1={edge.y1}
                      x2={edge.x2}
                      y2={edge.y2}
                      className="map-edge route-active"
                    />
                  ) : null;
                })}


                {edgesList.map((edge) => (
                  <g key={`weight-${edge.id}`}>
                    <rect
                      x={(edge.x1 + edge.x2) / 2 - 14}
                      y={(edge.y1 + edge.y2) / 2 - 9}
                      width={28}
                      height={18}
                      rx={3}
                      fill="#ffffff"
                      stroke="#cbd5e1"
                      strokeWidth={1}
                    />
                    <text
                      x={(edge.x1 + edge.x2) / 2}
                      y={(edge.y1 + edge.y2) / 2 + 3}
                      fill="var(--text-secondary)"
                      fontSize="9px"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {edge.weight}m
                    </text>
                  </g>
                ))}


                {nodesList.map((node) => {
                  const isStart = node.name === startNode;
                  const isEnd = node.name === endNode;
                  const onPath = routePath.includes(node.name);

                  return (
                    <g
                      key={node.name}
                      onClick={() => {
                        if (node.name.startsWith('shelf_')) {
                          setEndNode(node.name);
                        } else {
                          setStartNode(node.name);
                        }
                      }}
                    >
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={isStart || isEnd ? 16 : 12}
                        className={`map-node ${
                          isStart ? 'start-node' : isEnd ? 'target-node' : onPath ? 'on-path' : ''
                        }`}
                      />


                      <rect
                        x={node.x - 50}
                        y={node.y - 32}
                        width={100}
                        height={16}
                        className="map-node-label-bg"
                        style={{
                          fill: isStart ? '#eff6ff' : isEnd ? '#fff5f5' : onPath ? '#f0fdf4' : '#ffffff',
                          stroke: isStart ? '#bfdbfe' : isEnd ? '#fca5a5' : onPath ? '#bbf7d0' : '#cbd5e1',
                          strokeWidth: '1px'
                        }}
                      />

                      <text
                        x={node.x}
                        y={node.y - 21}
                        className="map-node-label"
                        textAnchor="middle"
                        style={{
                          fill: isStart ? 'var(--accent-primary)' : isEnd ? 'var(--accent-pink)' : onPath ? '#166534' : 'var(--text-primary)',
                          fontWeight: isStart || isEnd || onPath ? 'bold' : 'normal'
                        }}
                      >
                        {node.label.length > 15 ? node.label.slice(0, 15) + '..' : node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div style={{ display: 'flex', height: '350px', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Memuat peta graf...
              </div>
            )}
          </div>
        </div>


        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>


          <div className="glass-card">
            <h3 className="card-title text-teal" style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}><Navigation size={18} /> Rute Terpendek</h3>

            <form onSubmit={handleFindRoute} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Lokasi Awal (Mulai Walk):</label>
                <select className="form-input" value={startNode} onChange={(e) => setStartNode(e.target.value)}>
                  {nodesList.map(n => (
                    <option key={n.name} value={n.name}>{n.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Target Rak Buku (Tujuan):</label>
                <select className="form-input" value={endNode} onChange={(e) => setEndNode(e.target.value)}>
                  {nodesList.filter(n => n.name.startsWith('shelf_')).map(n => (
                    <option key={n.name} value={n.name}>{n.label}</option>
                  ))}
                </select>
              </div>
            </form>
          </div>


          <div className="glass-card" style={{ flex: 1 }}>
            <h3 className="card-title text-emerald" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}><Compass size={18} /> Panduan Navigasi</h3>

            {loadingRoute && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Mencari jalur terpendek...</p>}

            {!loadingRoute && routeDetails.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', color: '#166534' }}>
                  <span>Total Jarak:</span>
                  <strong className="text-emerald">{routeDistance} meter</strong>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative', paddingLeft: '1.25rem' }}>
                  <div style={{ position: 'absolute', left: '4px', top: '8px', bottom: '8px', width: '2px', background: '#cbd5e1' }}/>

                  {routeDetails.map((node, i) => {
                    const isStart = i === 0;
                    const isEnd = i === routeDetails.length - 1;
                    return (
                      <div key={node.name} style={{ position: 'relative', fontSize: '0.8rem', padding: '0.15rem 0' }}>
                        <div
                          style={{
                            position: 'absolute',
                            left: '-18px',
                            top: '4px',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: isStart ? 'var(--accent-primary)' : isEnd ? 'var(--accent-pink)' : 'var(--accent-emerald)',
                            border: '2px solid #ffffff'
                          }}
                        />
                        <span style={{ fontWeight: isStart || isEnd ? 'bold' : 'normal', color: 'var(--text-primary)' }}>
                          {node.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!loadingRoute && errorMsg && (
              <p style={{ color: 'var(--accent-red)', fontSize: '0.85rem' }}>{errorMsg}</p>
            )}

            <div style={{ marginTop: '1.5rem', background: '#f8fafc', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.725rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <Info size={16} className="text-teal" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Interaksi Peta:</strong><br/>
                - Klik area umum (seperti Lobby) untuk mengubah titik awal.<br/>
                - Klik area rak (seperti Rak Fiksi) untuk mengubah target tujuan.
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className="glass-card" style={{ background: '#f8fafc', borderColor: 'var(--border-color)' }}>
        <h4 className="flex-center text-emerald" style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}><HelpCircle size={16} /> Penjelasan Konsep Graph & Algoritma Dijkstra</h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          Denah perpustakaan direpresentasikan sebagai <strong>Graph Tak Berarah Berbobot (Weighted Undirected Graph)</strong>.
          Gedung/Rak adalah <strong>Node (Vertex)</strong>, dan jalur jalan kaki adalah <strong>Sisi (Edge)</strong> dengan bobot meter.
          <strong>Algoritma Dijkstra</strong> bekerja dengan mencari jalur terpendek satu-ke-semua (single-source shortest path)
          menggunakan strategi greedy, berturut-turut menjelajahi tetangga node terdekat yang belum dikunjungi
          sampai mencapai node tujuan dengan akumulasi bobot terkecil.
        </p>
      </div>
    </div>
  );
}
