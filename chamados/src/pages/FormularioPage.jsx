import React from 'react';
import FormularioChamado from '../components/FormularioChamado';
import { useNavigate } from 'react-router-dom';
import './FormularioPage.css';

export default function FormularioPage() {
  const navigate = useNavigate();

  return (
    <div className="formulario-page">
      {/* Header */}
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          ← Voltar
        </button>
        <h1>Novo Chamado</h1>
        <div style={{ width: '50px' }}></div>
      </div>

      {/* Conteúdo */}
      <div className="page-content">
        <FormularioChamado onChamadoCriado={() => navigate('/kanban')} />
      </div>
    </div>
  );
}
