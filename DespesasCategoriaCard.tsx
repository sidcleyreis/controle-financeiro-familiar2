
import React, { useMemo } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Categoria, PeriodoFinanceiro, Transacao } from './types';
import PieChart from './PieChart';

interface DespesasCategoriaCardProps {
  session?: Session;
  activePeriodo: PeriodoFinanceiro | null;
  categorias: Categoria[];
  transacoes: Transacao[]; // Já filtradas pelo MainLayout
  formatarMoeda: (value: number) => string;
}

const COLORS = [
  '#10b981', // emerald-500
  '#3b82f6', // blue-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
];

export default function DespesasCategoriaCard({ 
  activePeriodo, 
  categorias, 
  transacoes,
  formatarMoeda
}: DespesasCategoriaCardProps) {
  
  // DEBUG: Verificar dados de entrada
  console.log('DespesasCategoriaCard INPUT:', { 
    transacoesCount: transacoes.length, 
    categoriasCount: categorias.length, 
    activePeriodo 
  });

  const { dadosGrafico, total } = useMemo(() => {
    if (!activePeriodo) return { dadosGrafico: [], total: 0 };

    // 1. Filtrar apenas despesas efetivadas/realizadas
    const despesas = transacoes.filter(t => 
      t.tipo === 'despesa' && 
      (t.status === 'realizada' || t.status === 'prevista') // Considerando prevista para visualização
    );

    // 2. Agrupar valores
    const agrupado: Record<string, number> = {};
    let totalGeral = 0;

    despesas.forEach(t => {
      const valor = Number(t.valor);
      totalGeral += valor;
      
      let nomeCategoria = 'Outros / Sem Categoria';
      let catId = t.categoria_id;

      if (catId) {
        const cat = categorias.find(c => c.id === catId);
        if (cat) {
          // Se tiver pai, usa o nome do pai
          if (cat.categoria_pai_id) {
            const pai = categorias.find(p => p.id === cat.categoria_pai_id);
            if (pai) nomeCategoria = pai.nome;
            else nomeCategoria = cat.nome;
          } else {
            nomeCategoria = cat.nome;
          }
        }
      }

      agrupado[nomeCategoria] = (agrupado[nomeCategoria] || 0) + valor;
    });

    // 3. Converter para array e ordenar
    const arrayDados = Object.entries(agrupado).map(([label, value], index) => ({
      label,
      value,
      color: '' // Será preenchido depois
    })).sort((a, b) => b.value - a.value);

    // 4. Top 5 e Outros
    let finalDados = arrayDados;
    if (arrayDados.length > 5) {
      const top5 = arrayDados.slice(0, 5);
      const outros = arrayDados.slice(5).reduce((sum, item) => sum + item.value, 0);
      finalDados = [...top5, { label: 'Outros', value: outros, color: '#9ca3af' }];
    }

    // 5. Atribuir cores
    finalDados = finalDados.map((item, index) => ({
      ...item,
      color: item.label === 'Outros' ? '#9ca3af' : COLORS[index % COLORS.length]
    }));

    const result = { dadosGrafico: finalDados, total: totalGeral };
    
    // DEBUG: Verificar dados processados
    console.log('DespesasCategoriaCard OUTPUT:', result);
    
    return result;
  }, [activePeriodo, transacoes, categorias]);

  if (!activePeriodo) return null;

  return (
    <div className="bg-gray-700 p-6 rounded-lg shadow-md border border-gray-600">
      <div className="flex justify-between items-center mb-4 border-b border-gray-600 pb-2">
        <h3 className="text-lg font-bold text-white">Despesas por Categoria</h3>
        <span className="text-xs text-gray-400">{activePeriodo.nome}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Gráfico Donut */}
        <div className="flex flex-col items-center justify-center relative">
          <PieChart data={dadosGrafico} size={180} innerRadius={0.6} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
             <span className="text-xs text-gray-400">Total</span>
             <span className="text-sm font-bold text-white">{formatarMoeda(total)}</span>
          </div>
        </div>

        {/* Legenda / Tabela */}
        <div className="space-y-2">
           {dadosGrafico.length === 0 ? (
               <p className="text-gray-400 text-center text-sm">Nenhuma despesa registrada.</p>
           ) : (
               dadosGrafico.map((item, idx) => (
                 <div key={idx} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span className="text-gray-200 truncate max-w-[120px]" title={item.label}>{item.label}</span>
                    </div>
                    <div className="text-right">
                        <span className="block text-white font-medium">{formatarMoeda(item.value)}</span>
                        <span className="block text-xs text-gray-500">
                            {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%
                        </span>
                    </div>
                 </div>
               ))
           )}
        </div>
      </div>
    </div>
  );
}
