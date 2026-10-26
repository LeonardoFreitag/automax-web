import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './SuporteDashboardPage.css';

export default function SuporteDashboardPage() {
  if (!import.meta.env.VITE_ADMIN_TOKEN) {
    throw new Error('❌ VITE_ADMIN_TOKEN não foi definido! Configure em .env.local');
  }

  const TOKEN_ADMIN_CORRETO = import.meta.env.VITE_ADMIN_TOKEN;
  const navigate = useNavigate();
  const { obterTokenAdmin, setarTokenAdmin } = useAuth();

  const [tokenIngresado, setTokenIngresado] = useState('');
  const [tokenAutenticado, setTokenAutenticado] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  const [stats, setStats] = useState({
    pendentes: null,
    novidades: null,
    treinamentos: null,
    chamados: null,
  });

  useEffect(() => {
    if (obterTokenAdmin() === TOKEN_ADMIN_CORRETO) setTokenAutenticado(true);
  }, []);

  useEffect(() => {
    if (!tokenAutenticado) return;
    const agora = new Date();

    Promise.all([
      getCountFromServer(query(collection(db, 'suportes'), where('status', '==', 'aguardando_aprovacao'))),
      getCountFromServer(collection(db, 'novidades')),
      getCountFromServer(collection(db, 'treinamentos')),
      getCountFromServer(query(collection(db, 'chamados'), where('status', '==', 'pendente'))),
    ])
      .then(([pendentes, novidades, treinamentos, chamados]) => {
        setStats({
          pendentes:    pendentes.data().count,
          novidades:    novidades.data().count,
          treinamentos: treinamentos.data().count,
          chamados:     chamados.data().count,
        });
      })
      .catch(() => {});
  }, [tokenAutenticado]);

  const handleTokenSubmit = (e) => {
    e.preventDefault();
    if (tokenIngresado === TOKEN_ADMIN_CORRETO) {
      setTokenAutenticado(true);
      setarTokenAdmin(TOKEN_ADMIN_CORRETO);
    } else {
      setMensagem({ tipo: 'erro', texto: '❌ Token inválido' });
    }
  };

  const handleSair = () => {
    setTokenAutenticado(false);
    setTokenIngresado('');
    setMensagem({ tipo: '', texto: '' });
  };

  const modulos = [
    {
      label: 'Autorização',
      descricao: 'Aprovar e gerenciar membros da equipe de suporte',
      icone: '👥',
      cor: '#5ba3e0',
      corBg: 'rgba(91, 163, 224, 0.08)',
      corBorda: 'rgba(91, 163, 224, 0.2)',
      rota: '/suporte/autoriza',
      stat: stats.pendentes !== null ? `${stats.pendentes} aguardando aprovação` : null,
      statAlerta: stats.pendentes > 0,
    },
    {
      label: 'Novidades',
      descricao: 'Publicar e gerenciar novidades exibidas na home',
      icone: '📢',
      cor: '#1d9e75',
      corBg: 'rgba(29, 158, 117, 0.08)',
      corBorda: 'rgba(29, 158, 117, 0.2)',
      rota: '/suporte/novidades',
      stat: stats.novidades !== null ? `${stats.novidades} publicação(ões) cadastrada(s)` : null,
    },
    {
      label: 'Treinamentos',
      descricao: 'Gerenciar a biblioteca de conteúdo de treinamento',
      icone: '🎓',
      cor: '#f0b429',
      corBg: 'rgba(240, 180, 41, 0.08)',
      corBorda: 'rgba(240, 180, 41, 0.2)',
      rota: '/suporte/treinamentos',
      stat: stats.treinamentos !== null ? `${stats.treinamentos} conteúdo(s) cadastrado(s)` : null,
    },
    {
      label: 'Chamados',
      descricao: 'Visualizar e gerenciar tickets de suporte no Kanban',
      icone: '🎧',
      cor: '#a07ef0',
      corBg: 'rgba(160, 126, 240, 0.08)',
      corBorda: 'rgba(160, 126, 240, 0.2)',
      rota: '/kanban',
      stat: stats.chamados !== null ? `${stats.chamados} chamado(s) pendente(s)` : null,
      statAlerta: stats.chamados > 0,
    },
  ];

  // ── Tela de autenticação ──
  if (!tokenAutenticado) {
    return (
      <div className="suporte-dashboard-page">
        <div className="page-header">
          <div></div>
          <h1>Painel Administrativo</h1>
          <div></div>
        </div>

        <div className="auth-container">
          <div className="auth-form-wrapper">
            <div className="auth-icon">🔐</div>
            <h2>Acesso Restrito</h2>
            <p>Digite o token de administrador para acessar o painel.</p>
            <form onSubmit={handleTokenSubmit} className="auth-form">
              <div className="form-group">
                <label>Token de Administrador</label>
                <input
                  type="password"
                  placeholder="Digite o token"
                  value={tokenIngresado}
                  onChange={(e) => setTokenIngresado(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              {mensagem.texto && (
                <div className={`mensagem mensagem-${mensagem.tipo}`}>{mensagem.texto}</div>
              )}
              <button type="submit" className="btn-submit">Entrar</button>
            </form>
          </div>
        </div>

        <footer>
          <span>© 2026 AutoMax Sistemas — Todos os direitos reservados</span>
          <span>v 23.2.6</span>
        </footer>
      </div>
    );
  }

  // ── Dashboard ──
  return (
    <div className="suporte-dashboard-page">
      <div className="page-header">
        <div></div>
        <h1>Painel Administrativo</h1>
        <button className="btn-sair" onClick={handleSair}>Sair</button>
      </div>

      <div className="dashboard-container">
        <p className="dashboard-subtitulo">Selecione um módulo para gerenciar</p>

        <div className="modulos-grid">
          {modulos.map((m) => (
            <button
              key={m.rota}
              className="modulo-card"
              style={{ '--cor': m.cor, '--cor-bg': m.corBg, '--cor-borda': m.corBorda }}
              onClick={() => navigate(m.rota)}
            >
              <div className="modulo-icone">{m.icone}</div>
              <div className="modulo-body">
                <span className="modulo-label">{m.label}</span>
                <span className="modulo-descricao">{m.descricao}</span>
                {m.stat && (
                  <span className={`modulo-stat ${m.statAlerta ? 'stat-alerta' : ''}`}>
                    {m.stat}
                  </span>
                )}
              </div>
              <span className="modulo-arrow">→</span>
            </button>
          ))}
        </div>
      </div>

      <footer>
        <span>© 2026 AutoMax Sistemas — Todos os direitos reservados</span>
        <span>v 23.2.6</span>
      </footer>
    </div>
  );
}
