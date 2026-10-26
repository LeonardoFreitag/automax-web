import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './SuporteNovoPage.css';

export default function SuporteNovoPage() {
  const navigate = useNavigate();
  const { registrar, registrarComGoogle } = useAuth();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    telefone: '',
    cpf: '',
    experiencia: 'iniciante',
  });
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
  const [googleSignUpMode, setGoogleSignUpMode] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      // Validar email
      if (!formData.email.includes('@')) {
        throw new Error('Email inválido');
      }

      // Validar senha
      if (formData.senha.length < 6) {
        throw new Error('Senha deve ter no mínimo 6 caracteres');
      }

      if (formData.senha !== formData.confirmarSenha) {
        throw new Error('As senhas não correspondem');
      }

      // Validar CPF básico (apenas números, 11 dígitos)
      const cpfLimpo = formData.cpf.replace(/\D/g, '');
      if (cpfLimpo.length !== 11) {
        throw new Error('CPF deve ter 11 dígitos');
      }

      // Registrar no Firebase Auth
      await registrar(formData.email, formData.senha);

      // Salvar no Firestore
      await addDoc(collection(db, 'suportes'), {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        cpf: cpfLimpo,
        experiencia: formData.experiencia,
        status: 'aguardando_aprovacao',
        dataCadastro: serverTimestamp(),
      });

      setMensagem({
        tipo: 'sucesso',
        texto: '✅ Cadastro enviado! Aguarde a aprovação do administrador.',
      });

      setTimeout(() => {
        navigate('/kanban');
      }, 2000);
    } catch (erro) {
      console.error('Erro ao cadastrar suporte:', erro);
      let mensagemErro = erro.message;
      
      // Traduzir erros do Firebase
      if (erro.code === 'auth/email-already-in-use') {
        mensagemErro = 'Este email já está registrado';
      } else if (erro.code === 'auth/invalid-email') {
        mensagemErro = 'Email inválido';
      } else if (erro.code === 'auth/weak-password') {
        mensagemErro = 'Senha fraca';
      }
      
      setMensagem({
        tipo: 'erro',
        texto: `❌ Erro: ${mensagemErro}`,
      });
    } finally {
      setCarregando(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setCarregando(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      const user = await registrarComGoogle();
      
      // Armazenar o usuário do Google e entrar no modo de completar cadastro
      setGoogleUser(user);
      setFormData(prev => ({
        ...prev,
        email: user.email,
        nome: user.displayName || '',
      }));
      setGoogleSignUpMode(true);
      setCarregando(false);
    } catch (erro) {
      console.error('Erro ao cadastrar com Google:', erro);
      let mensagemErro = 'Erro ao cadastrar com Google';

      if (erro.code === 'auth/popup-closed-by-user') {
        mensagemErro = 'Você fechou a janela de login';
      } else if (erro.code === 'auth/account-exists-with-different-credential') {
        mensagemErro = 'Este email já está registrado com outro método';
      }

      setMensagem({
        tipo: 'erro',
        texto: `❌ ${mensagemErro}`,
      });
      setCarregando(false);
    }
  };

  const handleCompleteGoogleSignUp = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      // Validar CPF
      const cpfLimpo = formData.cpf.replace(/\D/g, '');
      if (cpfLimpo.length !== 11) {
        throw new Error('CPF deve ter 11 dígitos');
      }

      // Validar nome
      if (!formData.nome.trim()) {
        throw new Error('Nome é obrigatório');
      }

      // Salvar no Firestore
      await addDoc(collection(db, 'suportes'), {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        cpf: cpfLimpo,
        experiencia: formData.experiencia,
        status: 'aguardando_aprovacao',
        dataCadastro: serverTimestamp(),
      });

      setMensagem({
        tipo: 'sucesso',
        texto: '✅ Cadastro enviado! Aguarde a aprovação do administrador.',
      });

      setTimeout(() => {
        navigate('/kanban');
      }, 2000);
    } catch (erro) {
      console.error('Erro ao completar cadastro Google:', erro);
      setMensagem({
        tipo: 'erro',
        texto: `❌ Erro: ${erro.message}`,
      });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="suporte-novo-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← Voltar
        </button>
        <h1>Cadastro de Novo Membro de Suporte</h1>
        <div></div>
      </div>

      <div className="formulario-container">
        <div className="formulario-info">
          <h2>{googleSignUpMode ? 'Complete seu Cadastro' : 'Junte-se ao Time de Suporte'}</h2>
          <p>{googleSignUpMode 
            ? 'Preencha os dados adicionais para completar o cadastro' 
            : 'Preencha o formulário abaixo para solicitar acesso como membro da equipe de suporte. Sua solicitação será analisada pelos administradores.'}</p>
        </div>

        <form onSubmit={googleSignUpMode ? handleCompleteGoogleSignUp : handleSubmit} className="formulario">
          {googleSignUpMode && (
            <div className="google-signup-info">
              <p>Email já preenchido: <strong>{formData.email}</strong></p>
            </div>
          )}

          <div className="form-group">
            <label>Nome Completo *</label>
            <input
              type="text"
              name="nome"
              placeholder="Seu nome completo"
              value={formData.nome}
              onChange={handleChange}
              required
              disabled={carregando}
            />
          </div>

          {!googleSignUpMode && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={carregando}
                  />
                </div>
                <div className="form-group">
                  <label>Telefone</label>
                  <input
                    type="tel"
                    name="telefone"
                    placeholder="(11) 99999-9999"
                    value={formData.telefone}
                    onChange={handleChange}
                    disabled={carregando}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Senha *</label>
                  <input
                    type="password"
                    name="senha"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.senha}
                    onChange={handleChange}
                    required
                    disabled={carregando}
                  />
                </div>
                <div className="form-group">
                  <label>Confirmar Senha *</label>
                  <input
                    type="password"
                    name="confirmarSenha"
                    placeholder="Confirme a senha"
                    value={formData.confirmarSenha}
                    onChange={handleChange}
                    required
                    disabled={carregando}
                  />
                </div>
              </div>
            </>
          )}

          {googleSignUpMode && (
            <div className="form-row">
              <div className="form-group">
                <label>Telefone</label>
                <input
                  type="tel"
                  name="telefone"
                  placeholder="(11) 99999-9999"
                  value={formData.telefone}
                  onChange={handleChange}
                  disabled={carregando}
                />
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>CPF *</label>
              <input
                type="text"
                name="cpf"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={handleChange}
                required
                disabled={carregando}
              />
            </div>
            <div className="form-group">
              <label>Nível de Experiência *</label>
              <select
                name="experiencia"
                value={formData.experiencia}
                onChange={handleChange}
                required
                disabled={carregando}
              >
                <option value="iniciante">Iniciante</option>
                <option value="intermediario">Intermediário</option>
                <option value="avancado">Avançado</option>
              </select>
            </div>
          </div>

          {mensagem.texto && (
            <div className={`mensagem mensagem-${mensagem.tipo}`}>
              {mensagem.texto}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="btn-submit"
          >
            {carregando ? 'Enviando...' : 'Enviar Solicitação'}
          </button>

          {!googleSignUpMode && (
            <>
              <div className="divider">
                <span>OU</span>
              </div>

              <button
                type="button"
                disabled={carregando}
                className="btn-google"
                onClick={handleGoogleSignUp}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Registrar com Google
              </button>
            </>
          )}

          {googleSignUpMode && (
            <button
              type="button"
              disabled={carregando}
              className="btn-back-to-form"
              onClick={() => setGoogleSignUpMode(false)}
            >
              ← Voltar ao formulário normal
            </button>
          )}
        </form>
      </div>

      <footer>
        <span>© 2026 AutoMax Sistemas — Todos os direitos reservados</span>
        <span>v 23.2.6</span>
      </footer>
    </div>
  );
}
