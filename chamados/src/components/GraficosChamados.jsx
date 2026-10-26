import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import './GraficosChamados.css';

const CORES = [
  '#f0b429', '#5ba3e0', '#1d9e75', '#a855f7',
  '#ef5350', '#26c6da', '#ff7043', '#66bb6a',
];

const TooltipCustom = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="grafico-tooltip">
      <span className="tooltip-label">{payload[0].name || payload[0].payload?.name}</span>
      <span className="tooltip-valor">{payload[0].value} chamado{payload[0].value !== 1 ? 's' : ''}</span>
    </div>
  );
};

export default function GraficosChamados() {
  const [chamados, setChamados] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'chamados'), (snap) => {
      setChamados(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Agrupar por categoria
  const porCategoria = Object.entries(
    chamados.reduce((acc, c) => {
      const key = c.categoria || 'Sem categoria';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Agrupar por responsável
  const porResponsavel = Object.entries(
    chamados
      .filter((c) => c.responsavelNome)
      .reduce((acc, c) => {
        const key = c.responsavelNome;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (chamados.length === 0) return null;

  return (
    <div className="graficos-section">
      <h2 className="graficos-titulo">Visão Geral</h2>

      <div className="graficos-grid">
        {/* Gráfico de Pizza — por categoria */}
        <div className="grafico-card">
          <h3>Chamados por Categoria</h3>
          {porCategoria.length === 0 ? (
            <p className="grafico-vazio">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={porCategoria}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {porCategoria.map((_, i) => (
                    <Cell key={i} fill={CORES[i % CORES.length]} />
                  ))}
                </Pie>
                <Tooltip content={<TooltipCustom />} />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: '#a0afc4', fontSize: 12 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Gráfico de Barras — por responsável */}
        <div className="grafico-card">
          <h3>Chamados por Responsável</h3>
          {porResponsavel.length === 0 ? (
            <p className="grafico-vazio">Nenhum chamado atribuído ainda</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={porResponsavel}
                margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
              >
                <XAxis dataKey="name" hide />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#6b7a99', fontSize: 11 }}
                  width={28}
                />
                <Tooltip content={<TooltipCustom />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: '#a0afc4', fontSize: 12 }}>{value}</span>
                  )}
                />
                {porResponsavel.map((entry, i) => (
                  <Bar
                    key={entry.name}
                    dataKey="value"
                    name={entry.name}
                    data={[entry]}
                    fill={CORES[i % CORES.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
