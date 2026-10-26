import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import './NovidadesAdminPage.css';

const CATEGORIAS = [
  { value: 'novo',     label: 'Novo',     classe: 'tag-novo' },
  { value: 'melhoria', label: 'Melhoria', classe: 'tag-melhoria' },
  { value: 'aviso',    label: 'Aviso',    classe: 'tag-aviso' },
];

const FORM_INICIAL = { categoria: 'novo', texto: '', urlImagem: '', dataInicio: '', dataFim: '' };

function DropZoneImagem({ urlAtual, onUploadConcluido }) {
  const [arrastando, setArrastando] = useState(false);
  const [progresso, setProgresso]   = useState(null);
  const [erroUpload, setErroUpload] = useState('');
  const inputRef = useRef(null);

  const uploadArquivo = (arquivo) => {
    if (!arquivo) return;
    if (!arquivo.type.startsWith('image/')) {
      setErroUpload('Apenas imagens são aceitas (PNG, JPG, WEBP).');
      return;
    }
    if (arquivo.size > 5 * 1024 * 1024) {
      setErroUpload('A imagem deve ter menos de 5 MB.');
      return;
    }
    setErroUpload('');
    setProgresso(0);
    const storageRef = ref(storage, `novidades/${Date.now()}-${arquivo.name}`);
    const task = uploadBytesResumable(storageRef, arquivo);
    task.on(
      'state_changed',
      (snap) => setProgresso(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err)  => { setErroUpload('Erro ao enviar: ' + err.message); setProgresso(null); },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        onUploadConcluido(url);
        setProgresso(null);
      },
    );
  };

  return (
    <div
      className={`dropzone-imagem${arrastando ? ' drag-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
      onDragLeave={() => setArrastando(false)}
      onDrop={(e) => { e.preventDefault(); setArrastando(false); uploadArquivo(e.dataTransfer.files[0]); }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => uploadArquivo(e.target.files[0])}
      />

      {progresso !== null ? (
        <div className="dropzone-progress">
          <div className="progress-bar"><div style={{ width: `${progresso}%` }} /></div>
          <span>{progresso}% enviando...</span>
        </div>
      ) : urlAtual ? (
        <div className="dropzone-preview">
          <img src={urlAtual} alt="Imagem da novidade" />
          <span className="dropzone-hint">Clique ou arraste para substituir</span>
        </div>
      ) : (
        <div className="dropzone-placeholder">
          <span className="dropzone-icon">📷</span>
          <span>Arraste uma imagem ou <strong>clique para selecionar</strong></span>
          <span className="dropzone-sub">PNG, JPG, WEBP · máx. 5 MB</span>
        </div>
      )}

      {erroUpload && <span className="dropzone-erro" onClick={(e) => e.stopPropagation()}>{erroUpload}</span>}
    </div>
  );
}

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function formatarData(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('pt-BR');
}

function statusPublicacao(item) {
  if (!item.dataInicio || !item.dataFim) return 'indefinido';
  const now = new Date();
  const ini = item.dataInicio.toDate ? item.dataInicio.toDate() : new Date(item.dataInicio);
  const fim = item.dataFim.toDate   ? item.dataFim.toDate()   : new Date(item.dataFim);
  if (now < ini) return 'agendado';
  if (now > fim) return 'expirado';
  return 'ativo';
}

export default function NovidadesAdminPage() {
  if (!import.meta.env.VITE_ADMIN_TOKEN) {
    throw new Error('❌ VITE_ADMIN_TOKEN não foi definido! Configure em .env.local');
  }

  const TOKEN_ADMIN_CORRETO = import.meta.env.VITE_ADMIN_TOKEN;
  const navigate = useNavigate();
  const { obterTokenAdmin, setarTokenAdmin } = useAuth();

  const [tokenIngresado, setTokenIngresado] = useState('');
  const [tokenAutenticado, setTokenAutenticado] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  const [novidades, setNovidades] = useState([]);
  const [carregando, setCarregando] = useState(false);

  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (obterTokenAdmin() === TOKEN_ADMIN_CORRETO) setTokenAutenticado(true);
  }, []);

  useEffect(() => {
    if (!tokenAutenticado) return;
    setCarregando(true);
    const q = query(collection(db, 'novidades'), orderBy('dataCriacao', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setNovidades(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setCarregando(false);
    }, (err) => {
      console.error(err);
      setMensagem({ tipo: 'erro', texto: '❌ Erro ao carregar: ' + err.message });
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

  const abrirNovoForm = () => {
    setEditandoId(null);
    setForm({ ...FORM_INICIAL, dataInicio: hoje() });
    setFormAberto(true);
  };

  const abrirEdicao = (item) => {
    const toDateInput = (ts) => {
      if (!ts) return '';
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.toISOString().slice(0, 10);
    };
    setEditandoId(item.id);
    setForm({
      categoria:  item.categoria  || 'novo',
      texto:      item.texto      || '',
      urlImagem:  item.urlImagem  || '',
      dataInicio: toDateInput(item.dataInicio),
      dataFim:    toDateInput(item.dataFim),
    });
    setFormAberto(true);
  };

  const fecharForm = () => {
    setFormAberto(false);
    setEditandoId(null);
    setForm(FORM_INICIAL);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!form.texto.trim())      { setMensagem({ tipo: 'erro', texto: '❌ Texto é obrigatório' }); return; }
    if (!form.dataInicio)        { setMensagem({ tipo: 'erro', texto: '❌ Data inicial é obrigatória' }); return; }
    if (!form.dataFim)           { setMensagem({ tipo: 'erro', texto: '❌ Data final é obrigatória' }); return; }
    if (form.dataFim < form.dataInicio) { setMensagem({ tipo: 'erro', texto: '❌ Data final deve ser após a data inicial' }); return; }

    setSalvando(true);
    setMensagem({ tipo: '', texto: '' });
    try {
      const toTimestamp = (str) => Timestamp.fromDate(new Date(str + 'T00:00:00'));
      const dados = {
        categoria:  form.categoria,
        texto:      form.texto.trim(),
        urlImagem:  form.urlImagem.trim() || null,
        dataInicio: toTimestamp(form.dataInicio),
        dataFim:    toTimestamp(form.dataFim),
      };
      if (editandoId) {
        await updateDoc(doc(db, 'novidades', editandoId), dados);
        setMensagem({ tipo: 'sucesso', texto: '✅ Novidade atualizada!' });
      } else {
        await addDoc(collection(db, 'novidades'), { ...dados, dataCriacao: serverTimestamp() });
        setMensagem({ tipo: 'sucesso', texto: '✅ Novidade publicada!' });
      }
      fecharForm();
    } catch (err) {
      console.error(err);
      setMensagem({ tipo: 'erro', texto: '❌ Erro ao salvar: ' + err.message });
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id, texto) => {
    if (!window.confirm(`Excluir "${texto.slice(0, 60)}..."?`)) return;
    try {
      await deleteDoc(doc(db, 'novidades', id));
      setMensagem({ tipo: 'sucesso', texto: '✅ Novidade removida' });
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: '❌ Erro ao excluir' });
    }
  };

  // ── Tela de autenticação ──
  if (!tokenAutenticado) {
    return (
      <div className="novidades-admin-page">
        <div className="page-header">
          <button className="btn-back" onClick={() => navigate('/suporte')}>← Voltar</button>
          <h1>Gestão de Novidades</h1>
          <div></div>
        </div>
        <div className="auth-container">
          <div className="auth-form-wrapper">
            <h2>Acesso Restrito</h2>
            <p>Digite o token de administrador para gerenciar as novidades exibidas na home.</p>
            <form onSubmit={handleTokenSubmit} className="auth-form">
              <div className="form-group">
                <label>Token de Administrador</label>
                <input type="password" placeholder="Digite o token" value={tokenIngresado}
                  onChange={(e) => setTokenIngresado(e.target.value)} required />
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
    <div className="novidades-admin-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/suporte')}>← Voltar</button>
        <h1>Gestão de Novidades</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-logout" onClick={() => { setTokenAutenticado(false); setTokenIngresado(''); }}>
            Sair
          </button>
        </div>
      </div>

      <div className="admin-container">
        <div className="admin-toolbar">
          <div className="toolbar-left">
            <h2>Publicações</h2>
            <span className="count">{novidades.length} item{novidades.length !== 1 ? 'ns' : ''}</span>
          </div>
          <button className="btn-novo" onClick={abrirNovoForm}>+ Nova novidade</button>
        </div>

        {mensagem.texto && (
          <div className={`mensagem mensagem-${mensagem.tipo}`}>{mensagem.texto}</div>
        )}

        {carregando ? (
          <div className="carregando">Carregando...</div>
        ) : novidades.length === 0 ? (
          <div className="vazio"><p>Nenhuma novidade cadastrada ainda.</p></div>
        ) : (
          <div className="novidades-lista">
            {novidades.map((item) => {
              const cat = CATEGORIAS.find((c) => c.value === item.categoria) || CATEGORIAS[0];
              const status = statusPublicacao(item);
              return (
                <div key={item.id} className={`novidade-row status-${status}`}>
                  <div className="row-left">
                    <span className={`cat-tag ${cat.classe}`}>{cat.label}</span>
                    <span className={`status-badge st-${status}`}>
                      {status === 'ativo' ? '● Ativo' : status === 'agendado' ? '◷ Agendado' : '○ Expirado'}
                    </span>
                  </div>
                  <div className="row-texto">{item.texto}</div>
                  <div className="row-datas">
                    <span>{formatarData(item.dataInicio)}</span>
                    <span className="datas-sep">→</span>
                    <span>{formatarData(item.dataFim)}</span>
                  </div>
                  <div className="row-acoes">
                    <button className="btn-editar" onClick={() => abrirEdicao(item)}>Editar</button>
                    <button className="btn-excluir" onClick={() => handleExcluir(item.id, item.texto)}>Excluir</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer>
        <span>© 2026 AutoMax Sistemas — Todos os direitos reservados</span>
        <span>v 23.2.6</span>
      </footer>

      {/* Modal formulário */}
      {formAberto && (
        <div className="modal-overlay" onClick={fecharForm}>
          <div className="modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-form-header">
              <h3>{editandoId ? 'Editar novidade' : 'Nova novidade'}</h3>
              <button className="btn-fechar-modal" onClick={fecharForm}>✕</button>
            </div>
            <form onSubmit={handleSalvar} className="form-novidade">
              <div className="form-group">
                <label>Categoria *</label>
                <div className="categoria-opcoes">
                  {CATEGORIAS.map((c) => (
                    <label key={c.value} className={`cat-opcao ${form.categoria === c.value ? 'selecionada' : ''} ${c.classe}`}>
                      <input
                        type="radio"
                        name="categoria"
                        value={c.value}
                        checked={form.categoria === c.value}
                        onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))}
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Imagem (opcional)</label>
                <DropZoneImagem
                  urlAtual={form.urlImagem}
                  onUploadConcluido={(url) => setForm((p) => ({ ...p, urlImagem: url }))}
                />
                {form.urlImagem && (
                  <button
                    type="button"
                    className="btn-remover-imagem"
                    onClick={() => setForm((p) => ({ ...p, urlImagem: '' }))}
                  >
                    ✕ Remover imagem
                  </button>
                )}
              </div>

              <div className="form-group">
                <label>Texto *</label>
                <textarea
                  name="texto"
                  placeholder="Descreva a novidade, melhoria ou aviso..."
                  value={form.texto}
                  onChange={(e) => setForm((p) => ({ ...p, texto: e.target.value }))}
                  rows={3}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Data inicial *</label>
                  <input
                    type="date"
                    value={form.dataInicio}
                    onChange={(e) => setForm((p) => ({ ...p, dataInicio: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Data final *</label>
                  <input
                    type="date"
                    value={form.dataFim}
                    min={form.dataInicio}
                    onChange={(e) => setForm((p) => ({ ...p, dataFim: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {mensagem.texto && !salvando && (
                <div className={`mensagem mensagem-${mensagem.tipo}`}>{mensagem.texto}</div>
              )}

              <div className="form-acoes">
                <button type="button" className="btn-cancelar" onClick={fecharForm}>Cancelar</button>
                <button type="submit" className="btn-submit" disabled={salvando}>
                  {salvando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
