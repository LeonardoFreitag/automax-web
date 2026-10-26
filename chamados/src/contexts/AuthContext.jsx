import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(false);
  const [usuarioEmail, setUsuarioEmail] = useState('');
  const [usuarioNome, setUsuarioNome] = useState('');
  const [usuarioTipo, setUsuarioTipo] = useState('cliente');
  const [carregando, setCarregando] = useState(true);
  const [usuarioAutorizado, setUsuarioAutorizado] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUsuarioEmail(firebaseUser.email);

        try {
          // Verificar no Firestore se é membro de suporte e qual o status
          const q = query(
            collection(db, 'suportes'),
            where('email', '==', firebaseUser.email)
          );
          const snap = await getDocs(q);

          if (!snap.empty) {
            const suporteData = snap.docs[0].data();
            const autorizado = suporteData.status === 'aprovado';
            setUsuarioTipo('suporte');
            setUsuarioAutorizado(autorizado);
            setUsuarioNome(suporteData.nome || '');
            localStorage.setItem('automax_usuario_tipo', 'suporte');
            localStorage.setItem('automax_usuario_autorizado', autorizado ? 'true' : 'false');
            localStorage.setItem('automax_usuario_nome', suporteData.nome || '');
          } else {
            setUsuarioTipo('cliente');
            setUsuarioAutorizado(false);
            setUsuarioNome('');
            localStorage.setItem('automax_usuario_tipo', 'cliente');
            localStorage.setItem('automax_usuario_autorizado', 'false');
          }
        } catch (err) {
          // Fallback para localStorage se Firestore falhar
          const tipoSalvo = localStorage.getItem('automax_usuario_tipo');
          const autorizadoSalvo = localStorage.getItem('automax_usuario_autorizado');
          setUsuarioTipo(tipoSalvo || 'cliente');
          setUsuarioAutorizado(autorizadoSalvo === 'true');
        }

        setUsuarioAutenticado(true);
      } else {
        setUsuarioEmail('');
        setUsuarioNome('');
        setUsuarioTipo('cliente');
        setUsuarioAutorizado(false);
        setUsuarioAutenticado(false);
        localStorage.removeItem('automax_usuario_email');
        localStorage.removeItem('automax_usuario_nome');
        localStorage.removeItem('automax_usuario_tipo');
        localStorage.removeItem('automax_usuario_autorizado');
        localStorage.removeItem('automax_admin_token');
      }
      setCarregando(false);
    });

    return () => unsubscribe();
  }, []);

  const registrar = async (email, senha) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };

  const login = async (email, senha) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  };

  const autenticar = (email, tipo = 'cliente', autorizado = false) => {
    setUsuarioEmail(email);
    setUsuarioTipo(tipo);
    setUsuarioAutenticado(true);
    setUsuarioAutorizado(autorizado);
    localStorage.setItem('automax_usuario_email', email);
    localStorage.setItem('automax_usuario_tipo', tipo);
    localStorage.setItem('automax_usuario_autorizado', autorizado ? 'true' : 'false');
  };

  const desautenticar = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao desautenticar:', error);
    }
  };

  const setarAutorizacao = (autorizado) => {
    setUsuarioAutorizado(autorizado);
    localStorage.setItem('automax_usuario_autorizado', autorizado ? 'true' : 'false');
  };

  const setarTokenAdmin = (token) => {
    localStorage.setItem('automax_admin_token', token);
  };

  const obterTokenAdmin = () => {
    return localStorage.getItem('automax_admin_token');
  };

  const sairAdmin = () => {
    localStorage.removeItem('automax_admin_token');
  };

  // Admin já autenticado no Painel Administrativo (token) não deve reautenticar como suporte
  const isAdminAutenticado = () => {
    const tokenCorreto = import.meta.env.VITE_ADMIN_TOKEN;
    const tokenSalvo = obterTokenAdmin();
    return Boolean(tokenCorreto) && tokenSalvo === tokenCorreto;
  };

  const registrarComGoogle = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };

  const loginComGoogle = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        usuarioAutenticado,
        usuarioEmail,
        usuarioNome,
        usuarioTipo,
        usuarioAutorizado,
        carregando,
        registrar,
        login,
        logout,
        registrarComGoogle,
        loginComGoogle,
        autenticar,
        desautenticar,
        setarAutorizacao,
        setarTokenAdmin,
        obterTokenAdmin,
        sairAdmin,
        isAdminAutenticado,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return contexto;
}
