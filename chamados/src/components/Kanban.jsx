import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
  Timestamp,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './Kanban.css';

const statusConfig = {
  pendente:   { label: 'Pendente',  color: '#f0b429', bgColor: 'rgba(240, 180, 41, 0.1)' },
  resolvendo: { label: 'Resolvendo', color: '#185fa5', bgColor: 'rgba(24, 95, 165, 0.1)' },
  concluido:  { label: 'Concluído', color: '#1d9e75', bgColor: 'rgba(29, 158, 117, 0.1)' },
  arquivado:  { label: 'Arquivado', color: '#3a5a7a', bgColor: 'rgba(58, 90, 122, 0.1)' },
};

export default function Kanban() {
  const { usuarioEmail, usuarioNome } = useAuth();
  const [chamados, setChamados]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [draggedCard, setDraggedCard]   = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

  // Modal de solução (obrigatório ao mover para "concluido")
  const [modalSolucao, setModalSolucao]   = useState(null); // { chamado, novoStatus }
  const [textSolucao, setTextSolucao]     = useState('');
  const [errSolucao, setErrSolucao]       = useState('');
  const [salvando, setSalvando]           = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'chamados'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setChamados(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Constrói o objeto de movimento e grava no Firestore
  const moverCard = async (chamado, novoStatus, solucao = null) => {
    const movimento = {
      de:               chamado.status,
      para:             novoStatus,
      responsavelEmail: usuarioEmail,
      responsavelNome:  usuarioNome || usuarioEmail,
      data:             Timestamp.now(),
    };

    const update = {
      status:            novoStatus,
      dataAtualizacao:   Timestamp.now(),
      responsavelEmail:  usuarioEmail,
      responsavelNome:   usuarioNome || usuarioEmail,
      historico:         arrayUnion(movimento),
    };

    if (solucao) update.solucao = solucao;

    await updateDoc(doc(db, 'chamados', chamado.id), update);
  };

  const handleDragStart = (e, chamado) => {
    setDraggedCard(chamado);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, novoStatus) => {
    e.preventDefault();
    if (!draggedCard || draggedCard.status === novoStatus) return;

    if (novoStatus === 'concluido') {
      // Abre modal exigindo descrição da solução
      setTextSolucao('');
      setErrSolucao('');
      setModalSolucao({ chamado: draggedCard, novoStatus });
      setDraggedCard(null);
      return;
    }

    try {
      await moverCard(draggedCard, novoStatus);
    } catch (err) {
      console.error('Erro ao mover chamado:', err);
    }
    setDraggedCard(null);
  };

  const confirmarSolucao = async () => {
    if (!textSolucao.trim()) {
      setErrSolucao('Descreva a solução antes de concluir.');
      return;
    }
    setSalvando(true);
    try {
      await moverCard(modalSolucao.chamado, modalSolucao.novoStatus, textSolucao.trim());
      setModalSolucao(null);
    } catch (err) {
      console.error('Erro ao concluir chamado:', err);
    }
    setSalvando(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar este chamado?')) {
      try {
        await deleteDoc(doc(db, 'chamados', id));
        if (selectedCard?.id === id) setSelectedCard(null);
      } catch (err) {
        console.error('Erro ao deletar chamado:', err);
      }
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getPriorityColor = (prioridade) => ({
    baixa: '#3a5a7a', normal: '#5ba3e0', alta: '#f0b429', critica: '#a32d2d',
  }[prioridade] || '#5ba3e0');

  if (loading) return <div className="kanban-loading">Carregando chamados...</div>;

  const colunas = [
    { status: 'pendente',   titulo: 'Pendente' },
    { status: 'resolvendo', titulo: 'Resolvendo' },
    { status: 'concluido',  titulo: 'Concluído' },
    { status: 'arquivado',  titulo: 'Arquivado' },
  ];

  return (
    <div className="kanban-container">
      <div className="kanban-header">
        <h2>Quadro de Chamados</h2>
        <p>Gerencia seus tickets de suporte</p>
      </div>

      <div className="kanban-board">
        {colunas.map((coluna) => {
          const cards = chamados
            .filter((c) => c.status === coluna.status)
            .sort((a, b) => (b.dataAtualizacao?.seconds ?? 0) - (a.dataAtualizacao?.seconds ?? 0));
          return (
            <div
              key={coluna.status}
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, coluna.status)}
            >
              <div className="column-header">
                <h3>{coluna.titulo}</h3>
                <span className="card-count">{cards.length}</span>
              </div>

              <div className="column-content">
                {cards.length === 0 ? (
                  <div className="empty-state">Nenhum chamado</div>
                ) : (
                  cards.map((chamado) => (
                    <div
                      key={chamado.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, chamado)}
                      className="kanban-card"
                      onClick={() => setSelectedCard(chamado)}
                    >
                      <div className="card-header">
                        <h4>{chamado.titulo}</h4>
                        <button
                          className="btn-close"
                          onClick={(e) => { e.stopPropagation(); handleDelete(chamado.id); }}
                        >✕</button>
                      </div>

                      <p className="card-desc">
                        {chamado.descricao?.substring(0, 80)}{chamado.descricao?.length > 80 ? '…' : ''}
                      </p>

                      <div className="card-footer">
                        <span
                          className="priority-badge"
                          style={{ borderLeftColor: getPriorityColor(chamado.prioridade) }}
                        >
                          {chamado.prioridade}
                        </span>
                        <span className="card-date">{formatDate(chamado.dataCriacao)}</span>
                      </div>

                      <div className="card-contact">
                        <small>{chamado.email}</small>
                      </div>

                      {chamado.responsavelNome && (
                        <div className="card-responsavel">
                          <small>👤 {chamado.responsavelNome}</small>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal de Solução (concluído) ── */}
      {modalSolucao && (
        <div className="modal-overlay" onClick={() => setModalSolucao(null)}>
          <div className="modal-content modal-solucao" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Descreva a Solução</h3>
              <button className="btn-close-modal" onClick={() => setModalSolucao(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="solucao-subtitulo">
                Antes de concluir <strong>"{modalSolucao.chamado.titulo}"</strong>, descreva o que foi feito:
              </p>
              <textarea
                className="solucao-textarea"
                placeholder="Descreva detalhadamente a solução aplicada..."
                value={textSolucao}
                onChange={(e) => { setTextSolucao(e.target.value); setErrSolucao(''); }}
                rows={5}
                autoFocus
              />
              {errSolucao && <span className="solucao-erro">{errSolucao}</span>}
            </div>
            <div className="modal-actions">
              <button className="btn-close-modal-btn" onClick={() => setModalSolucao(null)}>
                Cancelar
              </button>
              <button
                className="btn-concluir-modal"
                onClick={confirmarSolucao}
                disabled={salvando}
              >
                {salvando ? 'Salvando…' : 'Confirmar Conclusão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Detalhes ── */}
      {selectedCard && (
        <div className="modal-overlay" onClick={() => setSelectedCard(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedCard.titulo}</h3>
              <button className="btn-close-modal" onClick={() => setSelectedCard(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="modal-section">
                <label>Descrição</label>
                <p>{selectedCard.descricao}</p>
              </div>

              <div className="modal-grid">
                <div className="modal-section">
                  <label>Email</label>
                  <p>{selectedCard.email}</p>
                </div>
                <div className="modal-section">
                  <label>Telefone</label>
                  <p>{selectedCard.telefone || '-'}</p>
                </div>
              </div>

              <div className="modal-grid">
                <div className="modal-section">
                  <label>Categoria</label>
                  <p>{selectedCard.categoria}</p>
                </div>
                <div className="modal-section">
                  <label>Prioridade</label>
                  <p>{selectedCard.prioridade}</p>
                </div>
              </div>

              <div className="modal-grid">
                <div className="modal-section">
                  <label>Status</label>
                  <p style={{ color: statusConfig[selectedCard.status]?.color }}>
                    {statusConfig[selectedCard.status]?.label}
                  </p>
                </div>
                <div className="modal-section">
                  <label>Data de Criação</label>
                  <p>{formatDate(selectedCard.dataCriacao)}</p>
                </div>
              </div>

              {selectedCard.responsavelNome && (
                <div className="modal-section">
                  <label>Responsável Atual</label>
                  <p>
                    {selectedCard.responsavelNome}
                    <span className="responsavel-email"> — {selectedCard.responsavelEmail}</span>
                  </p>
                </div>
              )}

              {selectedCard.solucao && (
                <div className="modal-section modal-solucao-box">
                  <label>✅ Solução Aplicada</label>
                  <p>{selectedCard.solucao}</p>
                </div>
              )}

              {selectedCard.historico?.length > 0 && (
                <div className="modal-section">
                  <label>Histórico de Movimentações</label>
                  <div className="historico-lista">
                    {[...selectedCard.historico]
                      .sort((a, b) => {
                        const ta = a.data?.seconds ?? 0;
                        const tb = b.data?.seconds ?? 0;
                        return tb - ta;
                      })
                      .map((mov, i) => (
                        <div key={i} className="historico-item">
                          <span className="hist-status hist-de">{statusConfig[mov.de]?.label ?? mov.de}</span>
                          <span className="hist-arrow">→</span>
                          <span className="hist-status hist-para">{statusConfig[mov.para]?.label ?? mov.para}</span>
                          <span className="hist-resp">por {mov.responsavelNome || mov.responsavelEmail}</span>
                          <span className="hist-data">{formatDateTime(mov.data)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                className="btn-delete-modal"
                onClick={() => { handleDelete(selectedCard.id); setSelectedCard(null); }}
              >
                Deletar Chamado
              </button>
              <button className="btn-close-modal-btn" onClick={() => setSelectedCard(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
