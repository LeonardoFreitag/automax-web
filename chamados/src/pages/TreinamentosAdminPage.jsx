import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './TreinamentosAdminPage.css';

const FORM_INICIAL = { secao: '', titulo: '', descricao: '', urlVideo: '' };

export default function TreinamentosAdminPage() {
  if (!import.meta.env.VITE_ADMIN_TOKEN) {
    throw new Error('❌ VITE_ADMIN_TOKEN não foi definido! Configure em .env.local');
  }

  const TOKEN_ADMIN_CORRETO = import.meta.env.VITE_ADMIN_TOKEN;
  const navigate = useNavigate();
  const { obterTokenAdmin, setarTokenAdmin } = useAuth();

  const [tokenIngresado, setTokenIngresado] = useState('');
  const [tokenAutenticado, setTokenAutenticado] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  const [conteudos, setConteudos] = useState([]);
  const [carregando, setCarregando] = useState(false);

  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);

  const [secaoFiltro, setSecaoFiltro] = useState('');

  // Verificar token salvo
  useEffect(() => {
    if (obterTokenAdmin() === TOKEN_ADMIN_CORRETO) {
      setTokenAutenticado(true);
    }
  }, []);

  // Escutar conteúdos em tempo real após autenticação
  useEffect(() => {
    if (!tokenAutenticado) return;
    setCarregando(true);
    const q = query(collection(db, 'treinamentos'), orderBy('secao'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const dados = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      dados.sort((a, b) => {
        const secaoComp = (a.secao ?? '').localeCompare(b.secao ?? '');
        if (secaoComp !== 0) return secaoComp;
        const aTime = a.dataCriacao?.toMillis?.() ?? 0;
        const bTime = b.dataCriacao?.toMillis?.() ?? 0;
        return bTime - aTime;
      });
      setConteudos(dados);
      setCarregando(false);
    }, (err) => {
      console.error('Erro ao carregar treinamentos:', err);
      setMensagem({ tipo: 'erro', texto: '❌ Erro ao carregar conteúdos: ' + err.message });
      setCarregando(false);
    });
    return () => unsubscribe();
  }, [tokenAutenticado]);

  const handleTokenSubmit = (e) => {
    e.preventDefault();
    if (tokenIngresado === TOKEN_ADMIN_CORRETO) {
      setTokenAutenticado(true);
      setarTokenAdmin(TOKEN_ADMIN_CORRETO);
      setMensagem({ tipo: 'sucesso', texto: '✅ Autenticado com sucesso!' });
    } else {
      setMensagem({ tipo: 'erro', texto: '❌ Token inválido' });
    }
  };

  const secoes = [...new Set(conteudos.map((c) => c.secao))].sort();
  const conteudosFiltrados = secaoFiltro
    ? conteudos.filter((c) => c.secao === secaoFiltro)
    : conteudos;

  const abrirNovoForm = () => {
    setEditandoId(null);
    setForm(FORM_INICIAL);
    setFormAberto(true);
  };

  const abrirEdicao = (item) => {
    setEditandoId(item.id);
    setForm({
      secao: item.secao || '',
      titulo: item.titulo || '',
      descricao: item.descricao || '',
      urlVideo: item.urlVideo || '',
    });
    setFormAberto(true);
  };

  const fecharForm = () => {
    setFormAberto(false);
    setEditandoId(null);
    setForm(FORM_INICIAL);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!form.secao.trim() || !form.titulo.trim()) {
      setMensagem({ tipo: 'erro', texto: '❌ Seção e título são obrigatórios' });
      return;
    }
    setSalvando(true);
    setMensagem({ tipo: '', texto: '' });
    try {
      const dados = {
        secao: form.secao.trim(),
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
        urlVideo: form.urlVideo.trim(),
      };
      if (editandoId) {
        await updateDoc(doc(db, 'treinamentos', editandoId), {
          ...dados,
          dataAtualizacao: serverTimestamp(),
        });
        setMensagem({ tipo: 'sucesso', texto: '✅ Conteúdo atualizado!' });
      } else {
        await addDoc(collection(db, 'treinamentos'), {
          ...dados,
          dataCriacao: serverTimestamp(),
          dataAtualizacao: serverTimestamp(),
        });
        setMensagem({ tipo: 'sucesso', texto: '✅ Conteúdo adicionado!' });
      }
      fecharForm();
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setMensagem({ tipo: 'erro', texto: '❌ Erro ao salvar conteúdo' });
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id, titulo) => {
    if (!window.confirm(`Excluir "${titulo}"?`)) return;
    try {
      await deleteDoc(doc(db, 'treinamentos', id));
      setMensagem({ tipo: 'sucesso', texto: '✅ Conteúdo removido' });
    } catch (err) {
      console.error('Erro ao excluir:', err);
      setMensagem({ tipo: 'erro', texto: '❌ Erro ao excluir' });
    }
  };

  // ── Tela de autenticação ──
  if (!tokenAutenticado) {
    return (
      <div className="treinamentos-admin-page">
        <div className="page-header">
          <button className="btn-back" onClick={() => navigate('/suporte')}>
            ← Voltar
          </button>
          <h1>Gestão de Treinamentos</h1>
          <div></div>
        </div>

        <div className="auth-container">
          <div className="auth-form-wrapper">
            <h2>Acesso Restrito</h2>
            <p>Digite o token de administrador para gerenciar os conteúdos de treinamento.</p>
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
                <div className={`mensagem mensagem-${mensagem.tipo}`}>{mensagem.texto}</div>
              )}
              <button type="submit" className="btn-submit">Autenticar</button>
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

  // ── Painel admin ──
  return (
    <div className="treinamentos-admin-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/suporte')}>
          ← Voltar
        </button>
        <h1>Gestão de Treinamentos</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-visualizar" onClick={() => navigate('/treinamentos')}>
            👁 Visualizar
          </button>
          <button className="btn-logout" onClick={() => {
            setTokenAutenticado(false);
            setTokenIngresado('');
          }}>
            Sair
          </button>
        </div>
      </div>

      <div className="admin-container">
        <div className="admin-toolbar">
          <div className="toolbar-left">
            <h2>Conteúdos</h2>
            <span className="count">{conteudos.length} item{conteudos.length !== 1 ? 'ns' : ''}</span>
          </div>
          <div className="toolbar-right">
            {secoes.length > 0 && (
              <select
                className="filtro-secao"
                value={secaoFiltro}
                onChange={(e) => setSecaoFiltro(e.target.value)}
              >
                <option value="">Todas as seções</option>
                {secoes.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
            <button className="btn-novo" onClick={abrirNovoForm}>
              + Novo conteúdo
            </button>
          </div>
        </div>

        {mensagem.texto && (
          <div className={`mensagem mensagem-${mensagem.tipo}`}>{mensagem.texto}</div>
        )}

        {carregando ? (
          <div className="carregando">Carregando conteúdos...</div>
        ) : conteudosFiltrados.length === 0 ? (
          <div className="vazio">
            <p>Nenhum conteúdo cadastrado. Clique em "+ Novo conteúdo" para começar.</p>
          </div>
        ) : (
          <div className="conteudos-lista">
            {[...new Set(conteudosFiltrados.map((c) => c.secao))].map((secao) => (
              <div key={secao} className="secao-grupo">
                <div className="secao-grupo-header">
                  <span>{secao}</span>
                  <span className="secao-grupo-count">
                    {conteudosFiltrados.filter((c) => c.secao === secao).length} item(s)
                  </span>
                </div>
                {conteudosFiltrados
                  .filter((c) => c.secao === secao)
                  .map((item) => (
                    <div key={item.id} className="conteudo-row">
                      <div className="row-info">
                        <span className="row-titulo">{item.titulo}</span>
                        {item.descricao && (
                          <span className="row-descricao">{item.descricao}</span>
                        )}
                      </div>
                      {item.urlVideo && (
                        <a
                          href={item.urlVideo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="row-link"
                          title="Abrir vídeo"
                        >
                          ▶
                        </a>
                      )}
                      <div className="row-acoes">
                        <button className="btn-editar" onClick={() => abrirEdicao(item)}>
                          Editar
                        </button>
                        <button
                          className="btn-excluir"
                          onClick={() => handleExcluir(item.id, item.titulo)}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <footer>
        <span>© 2026 AutoMax Sistemas — Todos os direitos reservados</span>
        <span>v 23.2.6</span>
      </footer>

      {/* Modal de formulário */}
      {formAberto && (
        <div className="modal-overlay" onClick={fecharForm}>
          <div className="modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-form-header">
              <h3>{editandoId ? 'Editar conteúdo' : 'Novo conteúdo'}</h3>
              <button className="btn-fechar-modal" onClick={fecharForm}>✕</button>
            </div>

            <form onSubmit={handleSalvar} className="form-conteudo">
              <div className="form-group">
                <label>Seção *</label>
                <input
                  type="text"
                  name="secao"
                  placeholder="ex.: Módulo 1 — Introdução"
                  value={form.secao}
                  onChange={handleFormChange}
                  list="secoes-existentes"
                  required
                />
                <datalist id="secoes-existentes">
                  {secoes.map((s) => <option key={s} value={s} />)}
                </datalist>
              </div>

              <div className="form-group">
                <label>Título *</label>
                <input
                  type="text"
                  name="titulo"
                  placeholder="Título do conteúdo"
                  value={form.titulo}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Descrição</label>
                <textarea
                  name="descricao"
                  placeholder="Descreva brevemente o conteúdo..."
                  value={form.descricao}
                  onChange={handleFormChange}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>URL do vídeo</label>
                <input
                  type="url"
                  name="urlVideo"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={form.urlVideo}
                  onChange={handleFormChange}
                />
              </div>

              {mensagem.texto && !salvando && (
                <div className={`mensagem mensagem-${mensagem.tipo}`}>{mensagem.texto}</div>
              )}

              <div className="form-acoes">
                <button type="button" className="btn-cancelar" onClick={fecharForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn-submit" disabled={salvando}>
                  {salvando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
