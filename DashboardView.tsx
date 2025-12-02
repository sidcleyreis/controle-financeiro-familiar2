import React from 'react';
import type { Transacao, Categoria, PeriodoFinanceiro } from './types';
import type { Session as SupabaseSession } from '@supabase/supabase-js';
import PieChart from './PieChart';
import DespesasCategoriaCard from './DespesasCategoriaCard';

interface DashboardViewProps {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  formatarMoeda: (value: number) => string;
  transacoes: Transacao[]; // Transações JÁ FILTRADAS pelo período ativo
  onEdit: (transacao: Transacao) => void;
  onDelete: (id: number) => void;
  session?: SupabaseSession;
  categorias: Categoria[];
  activePeriodo: PeriodoFinanceiro | null;
}

const PencilIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L15.232 5.232z" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const ExchangeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
);

const ArrowUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
  </svg>
);

const ArrowDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
  </svg>
);

// Função auxiliar para determinar cor e sinal (Replicada de TransacoesView para consistência)
const getTransacaoStyle = (t: Transacao) => {
    if (t.tipo === 'receita') return { color: 'text-brand-primary', sinal: '+ ', iconColor: 'text-brand-primary', Icon: ArrowUpIcon };
    if (t.tipo === 'despesa') return { color: 'text-brand-secondary', sinal: '- ', iconColor: 'text-brand-secondary', Icon: ArrowDownIcon };
    
    // Lógica para Transferência
    if (t.tipo === 'transferencia') {
        const isSaida = t.descricao?.startsWith('Envio');
        return { 
            color: isSaida ? 'text-brand-secondary' : 'text-brand-primary', 
            sinal: isSaida ? '- ' : '+ ',
            iconColor: 'text-blue-400',
            Icon: ExchangeIcon
        }; 
    }
    
    return { color: 'text-gray-100', sinal: '', iconColor: 'text-gray-400', Icon: ExchangeIcon };
};

export default function DashboardView({ 
  totalReceitas, 
  totalDespesas, 
  saldo, 
  formatarMoeda, 
  transacoes, 
  onEdit, 
  onDelete,
  session,
  categorias,
  activePeriodo
}: DashboardViewProps) {
  
  // Dados para o gráfico de Receitas x Despesas
  const fluxoData = [
    { label: 'Receitas', value: totalReceitas, color: '#10b981' },
    { label: 'Despesas', value: totalDespesas, color: '#f43f5e' }
  ].filter(d => d.value > 0);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-in-out' }} className="space-y-6">
       <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-700 p-4 rounded-lg shadow-md text-center border border-gray-600">
          <h3 className="text-lg font-semibold text-gray-300">Receitas</h3>
          <p className="text-2xl font-bold text-brand-primary">{formatarMoeda(totalReceitas)}</p>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg shadow-md text-center border border-gray-600">
          <h3 className="text-lg font-semibold text-gray-300">Despesas</h3>
          <p className="text-2xl font-bold text-brand-secondary">{formatarMoeda(totalDespesas)}</p>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg shadow-md text-center border border-gray-600">
          <h3 className="text-lg font-semibold text-gray-300">Saldo Atual</h3>
          <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-white' : 'text-brand-secondary'}`}>{formatarMoeda(saldo)}</p>
        </div>
      </div>
      
      {/* Área de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Fluxo de Caixa */}
          <div className="bg-gray-700 p-6 rounded-lg shadow-md border border-gray-600">
              <div className="flex justify-between items-center mb-4 border-b border-gray-600 pb-2">
                 <h3 className="text-lg font-bold text-white">Fluxo do Mês</h3>
                 <span className="text-xs text-gray-400">{activePeriodo?.nome}</span>
              </div>
              <div className="flex justify-center py-4">
                  <PieChart data={fluxoData} size={180} />
              </div>
          </div>

          {/* Card 2: Despesas por Categoria */}
          <DespesasCategoriaCard 
            session={session}
            activePeriodo={activePeriodo}
            categorias={categorias}
            transacoes={transacoes}
            formatarMoeda={formatarMoeda}
          />
      </div>
      
      {/* Últimas Transações */}
      <div className="bg-gray-700 p-6 rounded-lg shadow-md border border-gray-600">
         <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-600 pb-2">Últimas Transações</h3>
          {transacoes.length > 0 ? (
               <ul className="divide-y divide-gray-600">
                  {transacoes.slice(0, 5).map((t) => {
                      const style = getTransacaoStyle(t);
                      const IconComponent = style.Icon;
                      return (
                          <li key={t.id} className="py-3 flex justify-between items-center hover:bg-gray-600/30 px-2 rounded transition-colors">
                              <div>
                                  <div className="flex items-center gap-2">
                                    <span className={style.iconColor} title={t.tipo}>
                                        <IconComponent />
                                    </span>
                                    <p className="font-semibold text-white">{t.descricao}</p>
                                  </div>
                                  <p className="text-sm text-gray-400">
                                    {t.contas?.nome} {t.categorias?.nome ? `> ${t.categorias.nome}` : ''}
                                  </p>
                              </div>
                              <div className="flex items-center space-x-4">
                                <p className={`font-bold text-base text-right ${style.color}`}>
                                    {style.sinal}{formatarMoeda(t.valor)}
                                </p>
                                 <div className="flex space-x-2">
                                    <button onClick={() => onEdit(t)} className="text-gray-400 hover:text-white transition-colors" aria-label="Editar"><PencilIcon/></button>
                                    <button onClick={() => onDelete(t.id)} className="text-gray-400 hover:text-brand-secondary transition-colors" aria-label="Excluir"><TrashIcon/></button>
                                 </div>
                              </div>
                          </li>
                      );
                  })}
              </ul>
          ) : (
               <div className="text-center text-gray-400 py-10 flex flex-col justify-center items-center h-full">
                  <p>Suas últimas transações aparecerão aqui.</p>
              </div>
          )}
      </div>
    </div>
  );
}