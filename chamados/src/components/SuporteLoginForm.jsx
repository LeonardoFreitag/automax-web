import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './SuporteLoginForm.css';

export default function SuporteLoginForm({ onLoginSuccess }) {
  const { login, loginComGoogle, autenticar } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      // Fazer login no Firebase Auth
      await login(email, senha);

      // Verificar se está autorizado no Firestore
      const q = query(
        collection(db, 'suportes'),
        where('email', '==', email),
        where('status', '==', 'aprovado')
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setMensagem({
          tipo: 'erro',
          texto: '❌ Sua solicitação ainda não foi aprovada pelos administradores',
        });
        return;
      }

      // Usuário encontrado e autorizado
      const suporteData = snap.docs[0].data();
      autenticar(email, 'suporte', true);

      setMensagem({
        tipo: 'sucesso',
        texto: '✅ Autenticado com sucesso!',
      });

      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }, 500);
    } catch (erro) {
      console.error('Erro ao fazer login:', erro);
      let mensagemErro = 'Erro ao fazer login';

      if (erro.code === 'auth/user-not-found') {
        mensagemErro = 'Email não encontrado';
      } else if (erro.code === 'auth/wrong-password') {
        mensagemErro = 'Senha incorreta';
      } else if (erro.code === 'auth/invalid-email') {
        mensagemErro = 'Email inválido';
      }

      setMensagem({
        tipo: 'erro',
        texto: `❌ ${mensagemErro}`,
      });
    } finally {
      setCarregando(false);
    }
  };

  const handleGoogleLogin = async () => {
    setCarregando(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      const user = await loginComGoogle();

      // Verificar se está autorizado no Firestore
      const q = query(
        collection(db, 'suportes'),
        where('email', '==', user.email),
        where('status', '==', 'aprovado')
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setMensagem({
          tipo: 'erro',
          texto: '❌ Sua solicitação ainda não foi aprovada pelos administradores',
        });
        setCarregando(false);
        return;
      }

      autenticar(user.email, 'suporte', true);

      setMensagem({
        tipo: 'sucesso',
        texto: '✅ Autenticado com sucesso!',
      });

      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }, 500);
    } catch (erro) {
      console.error('Erro ao fazer login com Google:', erro);
      let mensagemErro = 'Erro ao fazer login com Google';

      if (erro.code === 'auth/popup-closed-by-user') {
        mensagemErro = 'Você fechou a janela de login';
      }

      setMensagem({
        tipo: 'erro',
        texto: `❌ ${mensagemErro}`,
      });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="suporte-login-form">
      <div className="login-card">
        <h2>Acesso de Suporte</h2>
        <p>Faça login com suas credenciais para acessar o Kanban</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={carregando}
            />
          </div>

          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              placeholder="Sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              disabled={carregando}
            />
          </div>

          {mensagem.texto && (
            <div className={`mensagem mensagem-${mensagem.tipo}`}>
              {mensagem.texto}
            </div>
          )}

          <button type="submit" disabled={carregando} className="btn-login">
            {carregando ? 'Autenticando...' : 'Entrar'}
          </button>
        </form>

        <div className="divider">
          <span>OU</span>
        </div>

        <button 
          type="button"
          disabled={carregando} 
          className="btn-google"
          onClick={handleGoogleLogin}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Entrar com Google
        </button>

        <div className="login-footer">
          <p>Não possui conta?</p>
          <a href="/suporte/novo">Cadastre-se aqui</a>
        </div>
      </div>
    </div>
  );
}
