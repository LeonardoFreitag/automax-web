import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();

  const abrirChamado = () => {
    navigate('/novo');
  };

  const abrirTreinamentos = () => {
    navigate('/treinamentos');
  };

  const [novidades, setNovidades] = useState([]);

  useEffect(() => {
    const agora = new Date();
    getDocs(query(collection(db, 'novidades'), orderBy('dataCriacao', 'desc')))
      .then((snap) => {
        const ativas = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((n) => {
            const ini = n.dataInicio?.toDate?.() ?? new Date(n.dataInicio);
            const fim = n.dataFim?.toDate?.()   ?? new Date(n.dataFim);
            return agora >= ini && agora <= fim;
          })
          .slice(0, 6);
        setNovidades(ativas);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="home-container">
      {/* TOPBAR */}
      <div className="topbar">
        <div className="topbar-logo">
          <img src="assets/images/logo.png" alt="AutoMax" width="32" height="32" />
          <div>
            <div className="topbar-name">AutoMax</div>
            <div className="topbar-sub">Sistema de Gestão</div>
          </div>
        </div>
        <span className="topbar-version">v 23.2.6</span>
      </div>

      {/* HERO */}
      <div className="hero">
        <div className="hero-left">
          <h1>
            Gerenciamento<br />
            <span>Empresarial</span>
            <br />
            Integrado
          </h1>
          <div className="hero-divider"></div>
          <p className="hero-tagline">
            A solução completa para sua empresa.<br />
            Eficiência, controle e crescimento em um só lugar.
          </p>
          <div className="hero-badges">
            <span className="badge">NF-e</span>
            <span className="badge">NFC-e</span>
            <span className="badge">PDV</span>
            <span className="badge">TEF</span>
          </div>
        </div>

        <div className="hero-modules">
          {/* Financeiro */}
          <div className="module">
            <div className="mod-icon" style={{ background: 'rgba(24,95,165,0.18)' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="10" width="3" height="8" rx="1" fill="#185fa5" />
                <rect x="7" y="6" width="3" height="12" rx="1" fill="#185fa5" opacity="0.7" />
                <rect x="12" y="2" width="3" height="16" rx="1" fill="#185fa5" opacity="0.5" />
                <polyline points="2,9 7,5 12,1 17,3" stroke="#5ba3e0" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <div className="mod-line" style={{ background: '#185fa5' }}></div>
            <div className="mod-name">Financeiro</div>
            <div className="mod-desc">Contas, fluxo de caixa e conciliação</div>
          </div>

          {/* Vendas */}
          <div className="module">
            <div className="mod-icon" style={{ background: 'rgba(29,158,117,0.18)' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="8" cy="16" r="1.5" fill="#1d9e75" />
                <circle cx="15" cy="16" r="1.5" fill="#1d9e75" />
                <polyline points="1,2 4,2 6,12 16,12 18,5 5,5" stroke="#1d9e75" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="mod-line" style={{ background: '#1d9e75' }}></div>
            <div className="mod-name">Vendas</div>
            <div className="mod-desc">PDV, pedidos e frente de caixa</div>
          </div>

          {/* Estoque */}
          <div className="module">
            <div className="mod-icon" style={{ background: 'rgba(240,180,41,0.12)' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="8" width="16" height="10" rx="1.5" stroke="#f0b429" strokeWidth="1.5" fill="none" />
                <polyline points="5,8 5,5 10,2 15,5 15,8" stroke="#f0b429" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
                <line x1="10" y1="8" x2="10" y2="18" stroke="#f0b429" strokeWidth="1" opacity="0.4" />
              </svg>
            </div>
            <div className="mod-line" style={{ background: '#f0b429' }}></div>
            <div className="mod-name">Estoque</div>
            <div className="mod-desc">Produtos, lotes e movimentações</div>
          </div>

          {/* Relatórios */}
          <div className="module">
            <div className="mod-icon" style={{ background: 'rgba(163,45,45,0.18)' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="2" width="14" height="16" rx="2" stroke="#a32d2d" strokeWidth="1.5" fill="none" />
                <line x1="6" y1="7" x2="14" y2="7" stroke="#a32d2d" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="6" y1="10" x2="14" y2="10" stroke="#a32d2d" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
                <line x1="6" y1="13" x2="10" y2="13" stroke="#a32d2d" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
              </svg>
            </div>
            <div className="mod-line" style={{ background: '#a32d2d' }}></div>
            <div className="mod-name">Relatórios</div>
            <div className="mod-desc">Análises, DRE e exportações</div>
          </div>
        </div>
      </div>

      {/* NOVIDADES */}
      {novidades.length > 0 && (
        <div className="section">
          <div className="section-title">Novidades e atualizações</div>
          <div className="news-grid">
            {novidades.map((item) => {
              const classeTag = item.categoria === 'melhoria' ? 'fix' : item.categoria;
              const labelTag  = item.categoria === 'melhoria' ? 'Melhoria' :
                                item.categoria === 'aviso'    ? 'Aviso'    : 'Novo';
              const dataExib  = item.dataInicio?.toDate
                ? item.dataInicio.toDate().toLocaleDateString('pt-BR')
                : '';
              return (
                <div key={item.id} className="news-card">
                  {item.urlImagem && (
                    <img
                      src={item.urlImagem}
                      alt=""
                      className="news-img"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <div className="news-card-body">
                    <span className={`news-tag ${classeTag}`}>{labelTag}</span>
                    <div className="news-title">{item.texto}</div>
                    <div className="news-date">{dataExib}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUPORTE */}
      <div className="suporte-bar">
        <div className="suporte-text">
          <h3>Precisa de ajuda?</h3>
          <p>Nossa equipe está disponível de segunda a sexta, das 8h às 18h.</p>
        </div>
        <div className="suporte-btns">
          <button className="btn-suporte btn-treinamentos" onClick={abrirTreinamentos}>
            🎓 Treinamentos
          </button>
          <button className="btn-suporte btn-chamado" onClick={abrirChamado}>
            🎧 Abrir chamado
          </button>
        </div>
      </div>

      <footer>
        <span>© 2026 AutoMax Sistemas — Todos os direitos reservados</span>
        <span>v 23.2.6</span>
      </footer>
    </div>
  );
}
