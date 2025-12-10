
import React from 'react';
import { PeriodoFinanceiro } from './types';

interface PeriodoSelectorProps {
  periodos: PeriodoFinanceiro[];
  periodoSelecionado: PeriodoFinanceiro | null;
  onPeriodoChange: (periodo: PeriodoFinanceiro) => void;
  loading?: boolean;
}

// Ícone de calendário inline
const CalendarIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

// Helper para formatar data DD/MM/YYYY
const formatarData = (data: string): string => {
  if (!data) return '';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
};

export default function PeriodoSelector({
  periodos,
  periodoSelecionado,
  onPeriodoChange,
  loading = false
}: PeriodoSelectorProps) {

  // Ordenar períodos por data_inicio DESC
  const periodosOrdenados = [...periodos].sort((a, b) => 
    new Date(b.data_inicio).getTime() - new Date(a.data_inicio).getTime()
  );

  if (periodos.length === 0) {
    return null; // Não exibe se não houver períodos
  }

  return (
    <div className="relative flex items-center gap-2">
      {/* Label com ícone */}
      <div className="text-gray-400 flex items-center gap-1">
        <CalendarIcon />
      </div>

      {/* Dropdown */}
      <select
        value={periodoSelecionado?.id || ''}
        onChange={(e) => {
          const periodo = periodos.find(p => p.id === Number(e.target.value));
          if (periodo) onPeriodoChange(periodo);
        }}
        disabled={loading}
        className="bg-gray-700 border border-gray-600 rounded px-3 py-2 pr-10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] max-w-[300px]"
      >
        {periodosOrdenados.map(periodo => (
          <option key={periodo.id} value={periodo.id}>
            {periodo.nome} ({formatarData(periodo.data_inicio)} - {formatarData(periodo.data_fim)})
            {periodo.ativo ? ' ★' : ''}
          </option>
        ))}
      </select>

      {/* Ícone dropdown customizado */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </div>
    </div>
  );
}
