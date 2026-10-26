import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './SuporteAutorizaPage.css';

const STATUS_LABEL = {
  aprovado: 'Autorizado',
  pendente: 'Aguardando',
  suspenso: 'Suspenso',
};

const STATUS_CLASS = {
  aprovado: 'status-aprovado',
  pendente: 'status-pendente',
  suspenso: 'status-suspenso',
};

export default function SuporteAutorizaPage() {
  // Validar token apenas quando o componente é renderizado
  if (!import.meta.env.VITE_ADMIN_TOKEN) {
    throw new Error('❌ VITE_ADMIN_TOKEN não foi definido! Configure em .env.local');
  }

  const TOKEN_ADMIN_CORRETO = import.meta.env.VITE_ADMIN_TOKEN;
  const navigate = useNavigate();
  const { obterTokenAdmin, setarTokenAdmin } = useAuth();
  const [tokenIngresado, setTokenIngresado] = useState('');
  const [tokenAutenticado, setTokenAutenticado] = useState(false);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  // Painel de equipe
  const [painelAberto, setPainelAberto] = useState(false);
  const [suportes, setSuportes] = useState([]);
  const [loadingEquipe, setLoadingEquipe] = useState(false);
  const [atualizandoId, setAtualizandoId] = useState(null);

  useEffect(() => {
    // Verificar se já tem token válido
    if (obterTokenAdmin() === TOKEN_ADMIN_CORRETO) {
      setTokenAutenticado(true);
      carregarSolicitacoes();
    }
  }, []);

  // Escutar equipe em tempo real quando o painel estiver aberto
  useEffect(() => {
    if (!painelAberto) return;
    setLoadingEquipe(true);
    const q = query(collection(db, 'suportes'), orderBy('nome'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setSuportes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoadingEquipe(false);
    }, () => setLoadingEquipe(false));
    return () => unsubscribe();
  }, [painelAberto]);

  const alterarStatusEquipe = useCallback(async (id, novoStatus) => {
    setAtualizandoId(id);
    try {
      await updateDoc(doc(db, 'suportes', id), { status: novoStatus });
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    } finally {
      setAtualizandoId(null);
    }
  }, []);

  const carregarSolicitacoes = async () => {
    setCarregando(true);
    try {
      const q = query(
        collection(db, 'suportes'),
        where('status', '==', 'aguardando_aprovacao')
      );
      const snap = await getDocs(q);
      setSolicitacoes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (erro) {
      console.error('Erro ao carregar solicitacoes:', erro);
      setMensagem({
        tipo: 'erro',
        texto: '❌ Erro ao carregar solicitações',
      });
    } finally {
      setCarregando(false);
    }
  };

  const handleTokenSubmit = (e) => {
    e.preventDefault();
    
    if (tokenIngresado === TOKEN_ADMIN_CORRETO) {
      setTokenAutenticado(true);
      setarTokenAdmin(TOKEN_ADMIN_CORRETO);
      setMensagem({
        tipo: 'sucesso',
        texto: '✅ Autenticado com sucesso!',
      });
      carregarSolicitacoes();
    } else {
      setMensagem({
        tipo: 'erro',
        texto: '❌ Token inválido',
      });
    }
  };

  const aprovarSuporte = async (id, email) => {
    try {
      await updateDoc(doc(db, 'suportes', id), {
        status: 'aprovado',
      });
      setSolicitacoes(solicitacoes.filter(s => s.id !== id));
      setMensagem({
        tipo: 'sucesso',
        texto: `✅ Suporte ${email} aprovado!`,
      });
    } catch (erro) {
      console.error('Erro ao aprovar:', erro);
      setMensagem({
        tipo: 'erro',
        texto: '❌ Erro ao aprovar',
      });
    }
  };

  const rejeitarSuporte = async (id, email) => {
    try {
      await deleteDoc(doc(db, 'suportes', id));
      setSolicitacoes(solicitacoes.filter(s => s.id !== id));
      setMensagem({
        tipo: 'sucesso',
        texto: `✅ Solicitação de ${email} rejeitada`,
      });
    } catch (erro) {
      console.error('Erro ao rejeitar:', erro);
      setMensagem({
        tipo: 'erro',
        texto: '❌ Erro ao rejeitar',
      });
    }
  };

  if (!tokenAutenticado) {
    return (
      <div className="suporte-autoriza-page">
        <div className="page-header">
          <button className="btn-back" onClick={() => navigate('/')}>
            ← Voltar
          </button>
          <h1>Autenticação Administrativo</h1>
          <div></div>
        </div>

        <div className="auth-container">
          <div className="auth-form-wrapper">
            <h2>Acesso Restrito</h2>
            <p>Apenas administradores podem acessar esta página. Digite o token de administrador.</p>

            <form onSubmit={handleTokenSubmit} className="auth-form">
              <div className="form-group">
                <label>Token de Administrador</label>
                <input
                  type="password"
                  placeholder="Digite o token"
                  value={tokenIngresado}
                  onChange={(e) => setTokenIngresado(e.target.value)}
                  required
                />
              </div>

              {mensagem.texto && (
                <div className={`mensagem mensagem-${mensagem.tipo}`}>
                  {mensagem.texto}
                </div>
              )}

              <button type="submit" className="btn-submit">
                Autenticar
              </button>
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

  return (
    <div className="suporte-autoriza-page">
      <div className="page-header">
          <button className="btn-back" onClick={() => navigate('/suporte')}>
            ← Voltar
          </button>
          <h1>Autorização de Membros de Suporte</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn-novidades"
            onClick={() => navigate('/suporte/novidades')}
            title="Gerenciar novidades da home"
          >
            📢 Novidades
          </button>
          <button
            className="btn-treinamentos"
            onClick={() => navigate('/suporte/treinamentos')}
            title="Gerenciar biblioteca de treinamentos"
          >
            🎓 Treinamentos
          </button>
          <button
            className="btn-equipe"
            onClick={() => setPainelAberto(true)}
            title="Gerenciar equipe de suporte"
          >
            👥 Equipe
          </button>
          <button className="btn-logout" onClick={() => {
            setTokenAutenticado(false);
            setTokenIngresado('');
            setSolicitacoes([]);
          }}>
            Sair
          </button>
        </div>
      </div>

      <div className="admin-container">
        <div className="admin-header">
          <h2>Solicitações Pendentes</h2>
          <p className="count">{solicitacoes.length} solicitação{solicitacoes.length !== 1 ? 'ões' : ''}</p>
        </div>

        {mensagem.texto && (
          <div className={`mensagem mensagem-${mensagem.tipo}`}>
            {mensagem.texto}
          </div>
        )}

        {carregando ? (
          <div className="carregando">Carregando solicitações...</div>
        ) : solicitacoes.length === 0 ? (
          <div className="vazio">
            <p>✓ Nenhuma solicitação pendente no momento</p>
          </div>
        ) : (
          <div className="solicitacoes-lista">
            {solicitacoes.map((suporte) => (
              <div key={suporte.id} className="solicitacao-card">
                <div className="card-header">
                  <h3>{suporte.nome}</h3>
                  <span className={`experiencia exp-${suporte.experiencia}`}>
                    {suporte.experiencia}
                  </span>
                </div>

                <div className="card-info">
                  <p><strong>Email:</strong> {suporte.email}</p>
                  {suporte.telefone && <p><strong>Telefone:</strong> {suporte.telefone}</p>}
                  <p><strong>CPF:</strong> {suporte.cpf}</p>
                  <p><strong>Experiência:</strong> {suporte.experiencia}</p>
                </div>

                <div className="card-actions">
                  <button
                    className="btn-aprovar"
                    onClick={() => aprovarSuporte(suporte.id, suporte.email)}
                  >
                    ✓ Aprovar
                  </button>
                  <button
                    className="btn-rejeitar"
                    onClick={() => rejeitarSuporte(suporte.id, suporte.email)}
                  >
                    ✕ Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer>
        <span>© 2026 AutoMax Sistemas — Todos os direitos reservados</span>
        <span>v 23.2.6</span>
      </footer>

      {/* Overlay + Painel lateral de equipe */}
      {painelAberto && (
        <div className="equipe-overlay" onClick={() => setPainelAberto(false)}>
          <div className="equipe-panel" onClick={(e) => e.stopPropagation()}>
            <div className="equipe-panel-header">
              <h2>Equipe de Suporte</h2>
              <button className="btn-fechar-painel" onClick={() => setPainelAberto(false)}>✕</button>
            </div>

            {loadingEquipe ? (
              <div className="equipe-loading">Carregando...</div>
            ) : (
              <div className="equipe-scroll">
                <SuporteGrupo
                  titulo="Autorizados"
                  lista={suportes.filter((s) => s.status === 'aprovado')}
                  atualizandoId={atualizandoId}
                  onAlterar={alterarStatusEquipe}
                  acaoPrimaria={{ label: 'Suspender', status: 'suspenso', classe: 'btn-suspender' }}
                />
                <SuporteGrupo
                  titulo="Aguardando autorização"
                  lista={suportes.filter((s) => s.status === 'pendente')}
                  atualizandoId={atualizandoId}
                  onAlterar={alterarStatusEquipe}
                  acaoPrimaria={{ label: 'Autorizar', status: 'aprovado', classe: 'btn-autorizar' }}
                  acaoSecundaria={{ label: 'Recusar', status: 'suspenso', classe: 'btn-suspender' }}
                />
                <SuporteGrupo
                  titulo="Suspensos"
                  lista={suportes.filter((s) => s.status === 'suspenso')}
                  atualizandoId={atualizandoId}
                  onAlterar={alterarStatusEquipe}
                  acaoPrimaria={{ label: 'Reativar', status: 'aprovado', classe: 'btn-autorizar' }}
                />
                {suportes.length === 0 && (
                  <div className="equipe-vazia">Nenhum membro cadastrado ainda.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SuporteGrupo({ titulo, lista, atualizandoId, acaoPrimaria, acaoSecundaria, onAlterar }) {
  if (lista.length === 0) return null;
  return (
    <div className="equipe-grupo">
      <div className="equipe-grupo-titulo">
        {titulo}
        <span className="equipe-grupo-count">{lista.length}</span>
      </div>
      {lista.map((s) => (
        <div key={s.id} className="suporte-card">
          <div className="suporte-info">
            <span className="suporte-nome">{s.nome || s.email}</span>
            {s.nome && <span className="suporte-email">{s.email}</span>}
            <span className={`suporte-status ${STATUS_CLASS[s.status] || ''}`}>
              {STATUS_LABEL[s.status] || s.status}
            </span>
          </div>
          <div className="suporte-acoes">
            {acaoPrimaria && onAlterar && (
              <button
                className={`btn-acao-suporte ${acaoPrimaria.classe}`}
                disabled={atualizandoId === s.id}
                onClick={() => onAlterar(s.id, acaoPrimaria.status)}
              >
                {atualizandoId === s.id ? '...' : acaoPrimaria.label}
              </button>
            )}
            {acaoSecundaria && onAlterar && (
              <button
                className={`btn-acao-suporte ${acaoSecundaria.classe}`}
                disabled={atualizandoId === s.id}
                onClick={() => onAlterar(s.id, acaoSecundaria.status)}
              >
                {atualizandoId === s.id ? '...' : acaoSecundaria.label}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
