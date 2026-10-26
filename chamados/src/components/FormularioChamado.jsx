import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import './FormularioChamado.css';

export default function FormularioChamado({ onChamadoCriado }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    email: '',
    telefone: '',
    categoria: 'geral',
    prioridade: 'normal'
  });

  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem('');

    try {
      const docRef = await addDoc(collection(db, 'chamados'), {
        ...formData,
        status: 'pendente',
        dataCriacao: serverTimestamp(),
        dataAtualizacao: serverTimestamp()
      });

      setMensagem('✓ Chamado criado com sucesso!');
      setFormData({
        titulo: '',
        descricao: '',
        email: '',
        telefone: '',
        categoria: 'geral',
        prioridade: 'normal'
      });

      if (onChamadoCriado) {
        onChamadoCriado(docRef.id);
      }

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Erro ao criar chamado:', error);
      setMensagem('❌ Erro ao criar chamado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="formulario-container">
      <div className="formulario-card">
        <h2>Abrir um Chamado de Suporte</h2>
        <p className="formulario-subtitle">Descreva seu problema para que nossa equipe possa ajudar</p>

        <form onSubmit={handleSubmit} className="formulario">
          <div className="form-group">
            <label htmlFor="titulo">Título do Chamado *</label>
            <input
              type="text"
              id="titulo"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              placeholder="Ex: Problema ao gerar NF-e"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="descricao">Descrição Detalhada *</label>
            <textarea
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              placeholder="Descreva em detalhes o problema que está enfrentando..."
              rows="5"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefone">Telefone</label>
              <input
                type="tel"
                id="telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="categoria">Categoria</label>
              <select
                id="categoria"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
              >
                <option value="geral">Geral</option>
                <option value="nfe">NF-e</option>
                <option value="pdv">PDV</option>
                <option value="financeiro">Financeiro</option>
                <option value="estoque">Estoque</option>
                <option value="relatorios">Relatórios</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="prioridade">Prioridade</label>
              <select
                id="prioridade"
                name="prioridade"
                value={formData.prioridade}
                onChange={handleChange}
              >
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
          </div>

          {mensagem && (
            <div className={`mensagem ${mensagem.includes('✓') ? 'sucesso' : 'erro'}`}>
              {mensagem}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-submit"
          >
            {loading ? 'Criando chamado...' : 'Criar Chamado'}
          </button>
        </form>
      </div>
    </div>
  );
}
