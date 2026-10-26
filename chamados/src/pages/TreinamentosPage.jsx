import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import './TreinamentosPage.css';

function extrairIdYoutube(url) {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export default function TreinamentosPage() {
  const navigate = useNavigate();
  const [conteudos, setConteudos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [secaoAtiva, setSecaoAtiva] = useState(null);
  const [videoAberto, setVideoAberto] = useState(null);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'treinamentos'), orderBy('secao'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const dados = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      dados.sort((a, b) => a.titulo?.localeCompare(b.titulo ?? '') ?? 0);
      setConteudos(dados);
      setCarregando(false);
    }, (err) => {
      console.error('Erro ao carregar treinamentos:', err);
      setCarregando(false);
    });
    return () => unsubscribe();
  }, []);

  const secoes = [...new Set(conteudos.map((c) => c.secao))].sort((a, b) => a.localeCompare(b, 'pt-BR'));

  useEffect(() => {
    if (secoes.length > 0 && secaoAtiva === null) {
      setSecaoAtiva(secoes[0]);
    }
  }, [secoes.length]);

  const termoBusca = filtro.trim().toLowerCase();
  const conteudosDaSecao = conteudos.filter((c) => {
    if (c.secao !== secaoAtiva) return false;
    if (!termoBusca) return true;
    return (
      c.titulo?.toLowerCase().includes(termoBusca) ||
      c.descricao?.toLowerCase().includes(termoBusca)
    );
  });

  return (
    <div className="treinamentos-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← Voltar
        </button>
        <h1>Biblioteca de Treinamentos</h1>
        <div></div>
      </div>

      {carregando ? (
        <div className="carregando-central">Carregando conteúdos...</div>
      ) : conteudos.length === 0 ? (
        <div className="vazio-central">
          <p>Nenhum conteúdo disponível no momento.</p>
        </div>
      ) : (
        <div className="treinamentos-layout">
          <nav className="secoes-nav">
            <p className="secoes-label">Seções</p>
            {secoes.map((sec) => (
              <button
                key={sec}
                className={`secao-btn ${secaoAtiva === sec ? 'ativa' : ''}`}
                onClick={() => setSecaoAtiva(sec)}
              >
                {sec}
                <span className="secao-count">
                  {conteudos.filter((c) => c.secao === sec).length}
                </span>
              </button>
            ))}
          </nav>

          <main className="conteudos-area">
            <div className="conteudos-area-header">
              <h2 className="secao-titulo-ativa">{secaoAtiva}</h2>
              <input
                className="filtro-input"
                type="text"
                placeholder="Buscar por título ou descrição..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
            </div>
            {termoBusca && conteudosDaSecao.length === 0 && (
              <div className="filtro-vazio">Nenhum resultado para "{filtro}"</div>
            )}
            <div className="conteudos-grid">
              {conteudosDaSecao.map((item) => {
                const videoId = extrairIdYoutube(item.urlVideo);
                return (
                  <div key={item.id} className="conteudo-card">
                    {videoId ? (
                      <div
                        className="video-thumb"
                        onClick={() => setVideoAberto(item)}
                        title="Assistir vídeo"
                      >
                        <img
                          src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                          alt={item.titulo}
                        />
                        <div className="play-overlay">▶</div>
                      </div>
                    ) : item.urlVideo ? (
                      <div className="video-link-box">
                        <a href={item.urlVideo} target="_blank" rel="noopener noreferrer">
                          🔗 Acessar conteúdo
                        </a>
                      </div>
                    ) : null}

                    <div className="conteudo-body">
                      <h3>{item.titulo}</h3>
                      <p>{item.descricao}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        </div>
      )}

      <footer>
        <span>© 2026 AutoMax Sistemas — Todos os direitos reservados</span>
        <span>v 23.2.6</span>
      </footer>

      {videoAberto && (
        <div className="modal-overlay" onClick={() => setVideoAberto(null)}>
          <div className="modal-video" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{videoAberto.titulo}</h3>
              <button className="btn-fechar-modal" onClick={() => setVideoAberto(null)}>✕</button>
            </div>
            <div className="video-embed">
              <iframe
                src={`https://www.youtube.com/embed/${extrairIdYoutube(videoAberto.urlVideo)}?autoplay=1`}
                title={videoAberto.titulo}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {videoAberto.descricao && (
              <p className="modal-descricao">{videoAberto.descricao}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
