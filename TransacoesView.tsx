import React from 'react';
import type { Transacao } from './types';

interface TransacoesViewProps {
  transacoes: Transacao[];
  loading: boolean;
  error: string | null;
  formatarMoeda: (value: number) => string;
  onEdit: (transacao: Transacao) => void;
  onDelete: (id: number) => void;
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

// Função auxiliar para determinar cor e sinal
const getTransacaoStyle = (t: Transacao) => {
    if (t.tipo === 'receita') return { color: 'text-brand-primary', sinal: '+ ', iconColor: 'text-brand-primary', Icon: ArrowUpIcon };
    if (t.tipo === 'despesa') return { color: 'text-brand-secondary', sinal: '- ', iconColor: 'text-brand-secondary', Icon: ArrowDownIcon };
    
    // Lógica para Transferência
    if (t.tipo === 'transferencia') {
        // Identifica se é saída (Envio) ou entrada (Recebido) baseado na descrição gerada
        // "Envio p/..." -> Saída (Vermelho)
        // "Recebido de..." -> Entrada (Verde)
        const isSaida = t.descricao?.startsWith('Envio');
        
        return { 
            color: isSaida ? 'text-brand-secondary' : 'text-brand-primary', 
            sinal: isSaida ? '- ' : '+ ',
            iconColor: 'text-blue-400', // Ícone sempre azul para diferenciar o TIPO
            Icon: ExchangeIcon
        }; 
    }
    
    return { color: 'text-gray-100', sinal: '', iconColor: 'text-gray-400', Icon: ExchangeIcon };
};

export default function TransacoesView({ transacoes, loading, error, formatarMoeda, onEdit, onDelete }: TransacoesViewProps) {
  return (
    <div style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
      {/* Histórico de Transações */}
      <div className="bg-gray-700 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Histórico de Transações</h2>
        {error && <p className="mb-4 text-center text-sm text-brand-secondary">{error}</p>}
        {loading ? (
          <p className="text-center text-gray-400 py-8">Carregando transações...</p>
        ) : transacoes.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Nenhuma transação registrada ainda. Clique no botão '+' no canto superior direito para adicionar uma.</p>
        ) : (
          <ul className="divide-y divide-gray-600">
            {transacoes.map((t) => {
                const style = getTransacaoStyle(t);
                const IconComponent = style.Icon;
                
                return (
                  <li key={t.id} className="py-3 flex justify-between items-center hover:bg-gray-600/30 px-2 rounded transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                          <span className={style.iconColor} title={t.tipo}>
                              <IconComponent />
                          </span>
                          <p className="font-semibold text-white truncate">{t.descricao}</p>
                      </div>
                      <p className="text-sm text-gray-400">
                        {new Date(t.data_transacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                         {' • '} {t.contas?.nome} {t.categorias?.nome ? `> ${t.categorias.nome}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center ml-4">
                        <p className={`font-bold text-lg w-32 text-right ${style.color}`}>
                            {style.sinal}{formatarMoeda(t.valor)}
                        </p>
                        <div className="flex items-center space-x-2 ml-4">
                            <button onClick={() => onEdit(t)} className="text-gray-400 hover:text-white transition-colors" aria-label="Editar"><PencilIcon/></button>
                            <button onClick={() => onDelete(t.id)} className="text-gray-400 hover:text-brand-secondary transition-colors" aria-label="Excluir"><TrashIcon/></button>
                        </div>
                    </div>
                  </li>
                );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}