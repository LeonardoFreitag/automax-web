import React from 'react';
import { useNavigate } from 'react-router-dom';
import FormularioChamado from '../components/FormularioChamado';
import Kanban from '../components/Kanban';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [tabAtiva, setTabAtiva] = React.useState('formulario');

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>AutoMax - Sistema de Chamados</h1>
          <p>Gerencie seus tickets de suporte</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab-button ${tabAtiva === 'formulario' ? 'ativa' : ''}`}
          onClick={() => setTabAtiva('formulario')}
        >
          📝 Novo Chamado
        </button>
        <button
          className={`tab-button ${tabAtiva === 'kanban' ? 'ativa' : ''}`}
          onClick={() => setTabAtiva('kanban')}
        >
          📊 Quadro de Chamados
        </button>

        {/* Links diretos para rotas */}
        <div className="tab-links">
          <small>Ou acesse as rotas:</small>
          <a href="/chamados/novo" className="link-rota">/novo</a>
          <a href="/chamados/kanban" className="link-rota">/kanban</a>
        </div>
      </div>

      {/* Content */}
      <div className="dashboard-content">
        {tabAtiva === 'formulario' && <FormularioChamado />}
        {tabAtiva === 'kanban' && <Kanban />}
      </div>

      {/* Footer */}
      <div className="dashboard-footer">
        <p>© 2026 AutoMax Sistemas — Todos os direitos reservados</p>
        <p>v 23.2.6</p>
      </div>
    </div>
  );
}
