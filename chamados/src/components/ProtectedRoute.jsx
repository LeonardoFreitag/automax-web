import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SuporteLoginForm from './SuporteLoginForm';

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { usuarioAutenticado, usuarioTipo, usuarioAutorizado, carregando, isAdminAutenticado } = useAuth();

  if (carregando) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0d1225',
        color: '#e0eaf5',
        fontFamily: 'Segoe UI, sans-serif',
      }}>
        <p>Carregando...</p>
      </div>
    );
  }

  // Se precisa de role específico (suporte)
  if (requiredRole === 'suporte') {
    // Admin já autenticado no Painel Administrativo não precisa logar de novo como suporte
    const adminOk = isAdminAutenticado();

    // Não autenticado ou autenticado mas não é suporte aprovado → mostra formulário
    if (!adminOk && (!usuarioAutenticado || usuarioTipo !== 'suporte' || !usuarioAutorizado)) {
      return <SuporteLoginForm />;
    }
  } else {
    // Para outras roles, apenas verifica autenticação
    if (!usuarioAutenticado) {
      return <Navigate to="/" replace />;
    }

    if (requiredRole && usuarioTipo !== requiredRole) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
