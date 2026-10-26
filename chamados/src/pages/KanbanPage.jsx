import React from 'react';
import Kanban from '../components/Kanban';
import GraficosChamados from '../components/GraficosChamados';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './KanbanPage.css';

export default function KanbanPage() {
  const navigate = useNavigate();
  const { logout, usuarioEmail, isAdminAutenticado, sairAdmin } = useAuth();
  const viaAdmin = isAdminAutenticado();

  const handleLogout = async () => {
    if (viaAdmin) {
      sairAdmin();
      navigate('/suporte');
      return;
    }
    try {
      await logout();
      navigate('/kanban');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="kanban-page">
      {/* Header */}
      <div className="page-header">
        {viaAdmin && (
          <button className="btn-back" onClick={() => navigate('/suporte')}>
            ← Voltar
          </button>
        )}
        <div className="header-title">
          <h1>Quadro de Chamados</h1>
          <span className="user-info">{usuarioEmail}</span>
        </div>
        <div className="header-buttons">
          <button
            className="btn-novo-chamado"
            onClick={() => navigate('/novo')}
          >
            + Novo Chamado
          </button>
          <button
            className="btn-logout"
            onClick={handleLogout}
            title="Sair da conta"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="page-content">
        <Kanban />
        <GraficosChamados />
      </div>
    </div>
  );
}
