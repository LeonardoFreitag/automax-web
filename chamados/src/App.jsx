import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import FormularioPage from './pages/FormularioPage';
import KanbanPage from './pages/KanbanPage';
import SuporteNovoPage from './pages/SuporteNovoPage';
import SuporteAutorizaPage from './pages/SuporteAutorizaPage';
import TreinamentosPage from './pages/TreinamentosPage';
import TreinamentosAdminPage from './pages/TreinamentosAdminPage';
import NovidadesAdminPage from './pages/NovidadesAdminPage';
import SuporteDashboardPage from './pages/SuporteDashboardPage';
import './App.css';

function App() {
  const basename = '/';

  return (
    <AuthProvider>
      <Router basename={basename}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/novo" element={<FormularioPage />} />
          <Route
            path="/kanban"
            element={
              <ProtectedRoute requiredRole="suporte">
                <KanbanPage />
              </ProtectedRoute>
            }
          />
          <Route path="/suporte" element={<SuporteDashboardPage />} />
          <Route path="/suporte/novo" element={<SuporteNovoPage />} />
          <Route path="/suporte/autoriza" element={<SuporteAutorizaPage />} />
          <Route path="/suporte/treinamentos" element={<TreinamentosAdminPage />} />
          <Route path="/suporte/novidades" element={<NovidadesAdminPage />} />
          <Route path="/treinamentos" element={<TreinamentosPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
