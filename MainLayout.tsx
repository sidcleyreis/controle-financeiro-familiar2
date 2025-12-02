

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';
import DashboardView from './DashboardView';
import TransacoesView from './TransacoesView';
import AddTransactionModal from './AddTransactionModal';
import ConfirmationModal from './ConfirmationModal';
import ConfiguracoesModal from './ConfiguracoesModal'; 
import type { Transacao, Membro, Grupo, Conta, Categoria, PeriodoFinanceiro } from './types';

// --- DADOS DE DEMONSTRAÇÃO (CONSTANTES GLOBAIS) ---

const MEMBROS_DEMO: Membro[] = [
    {id: 1, nome: 'Você', usuario_id: 'demo', ativo: true, criado_em: new Date().toISOString()}
];

const GRUPOS_DEMO: Grupo[] = [
    {id: 1, nome: 'Família', usuario_id: 'demo', tipo_rateio: 'proporcional_receita', ativo: true, criado_em: new Date().toISOString()}
];

const CONTAS_DEMO: Conta[] = [
    {id: 1, nome: 'Conta Principal', usuario_id: 'demo', tipo: 'conta_corrente', saldo_inicial: 1000, membro_id: 1, grupo_id: null, ativo: true, criado_em: new Date().toISOString()},
    {id: 2, nome: 'Cartão Família', usuario_id: 'demo', tipo: 'cartao_credito', saldo_inicial: 0, membro_id: null, grupo_id: 1, ativo: true, criado_em: new Date().toISOString()},
];

const CATEGORIAS_DEMO: Categoria[] = [
    {id: 1, nome: 'Moradia', usuario_id: 'demo', categoria_pai_id: null, criado_em: new Date().toISOString()},
    {id: 2, nome: 'Alimentação', usuario_id: 'demo', categoria_pai_id: null, criado_em: new Date().toISOString()},
    {id: 3, nome: 'Transporte', usuario_id: 'demo', categoria_pai_id: null, criado_em: new Date().toISOString()},
    {id: 4, nome: 'Lazer', usuario_id: 'demo', categoria_pai_id: null, criado_em: new Date().toISOString()},
];

const PERIODOS_DEMO: PeriodoFinanceiro[] = [
  {id: 1, nome: 'Período Atual', usuario_id: 'demo', data_inicio: new Date().toISOString(), data_fim: new Date().toISOString(), ativo: true, criado_em: new Date().toISOString()}
];

const TRANSACOES_EXEMPLO: Transacao[] = [
    { id: 1, usuario_id: 'demo', descricao: 'Salário Mensal', valor: 5000, data_transacao: new Date(new Date().setDate(1)).toISOString(), tipo: 'receita', status: 'realizada', periodicidade: 'mensal', categoria_id: null, conta_id: 1, periodo_financeiro_id: 1, responsavel_membro_id: 1, responsavel_grupo_id: null, conta_destino_id: null, transferencia_vinculada_id: null, criado_em: new Date().toISOString(), categorias: undefined, contas: { nome: 'Conta Principal' } },
    { id: 2, usuario_id: 'demo', descricao: 'Aluguel', valor: 1500, data_transacao: new Date(new Date().setDate(2)).toISOString(), tipo: 'despesa', status: 'realizada', periodicidade: 'mensal', categoria_id: 1, conta_id: 1, periodo_financeiro_id: 1, responsavel_membro_id: 1, responsavel_grupo_id: null, conta_destino_id: null, transferencia_vinculada_id: null, criado_em: new Date().toISOString(), categorias: { nome: 'Moradia' }, contas: { nome: 'Conta Principal' } },
    { id: 3, usuario_id: 'demo', descricao: 'Compras Supermercado', valor: 450.75, data_transacao: new Date(new Date().setDate(3)).toISOString(), tipo: 'despesa', status: 'realizada', periodicidade: 'unica', categoria_id: 2, conta_id: 2, periodo_financeiro_id: 1, responsavel_grupo_id: 1, responsavel_membro_id: null, conta_destino_id: null, transferencia_vinculada_id: null, criado_em: new Date().toISOString(), categorias: { nome: 'Alimentação' }, contas: { nome: 'Cartão Família' } },
    { id: 4, usuario_id: 'demo', descricao: 'Venda de Item Usado', valor: 200, data_transacao: new Date(new Date().setDate(4)).toISOString(), tipo: 'receita', status: 'realizada', periodicidade: 'unica', categoria_id: null, conta_id: 1, periodo_financeiro_id: 1, responsavel_membro_id: 1, responsavel_grupo_id: null, conta_destino_id: null, transferencia_vinculada_id: null, criado_em: new Date().toISOString(), categorias: undefined, contas: { nome: 'Conta Principal' } },
];


export default function MainLayout({ session }: { session?: Session }) {
  
  // --- INICIALIZAÇÃO DE ESTADO (SÍNCRONA / LAZY INITIALIZATION) ---
  
  const [transacoes, setTransacoes] = useState<Transacao[]>(() => {
    if (!session?.user?.id) {
        return TRANSACOES_EXEMPLO.sort((a,b) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime());
    }
    return [];
  });

  const [membros, setMembros] = useState<Membro[]>(() => {
    if (!session?.user?.id) return MEMBROS_DEMO;
    return [];
  });

  const [grupos, setGrupos] = useState<Grupo[]>(() => {
    if (!session?.user?.id) return GRUPOS_DEMO;
    return [];
  });

  const [contas, setContas] = useState<Conta[]>(() => {
    if (!session?.user?.id) return CONTAS_DEMO;
    return [];
  });

  const [categorias, setCategorias] = useState<Categoria[]>(() => {
    if (!session?.user?.id) return CATEGORIAS_DEMO;
    return [];
  });

  const [periodos, setPeriodos] = useState<PeriodoFinanceiro[]>(() => {
    if (!session?.user?.id) return PERIODOS_DEMO;
    return [];
  });

  const [activePeriodo, setActivePeriodo] = useState<PeriodoFinanceiro | null>(() => {
    if (!session?.user?.id) return PERIODOS_DEMO[0];
    return null;
  });

  // Log de depuração
  console.log('MainLayout activePeriodo (após useState):', activePeriodo);

  // Estados de UI
  // Se não tem sessão, loading começa falso pois os dados demo já estão carregados
  const [loading, setLoading] = useState(() => !!session?.user?.id); 
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transacoes'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transacao | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); 

  useEffect(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('pt-BR', options);
    setCurrentDate(formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1));
  }, []);

  // Efeito para buscar dados do Supabase (Apenas se logado)
  useEffect(() => {
    if (!session?.user?.id) {
        // Modo demo já inicializado no useState, não faz nada aqui
        return;
    }

    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          transacoesRes,
          membrosRes,
          gruposRes,
          contasRes,
          categoriasRes,
          periodosRes,
        ] = await Promise.all([
          supabase.from('transacoes').select('*, categorias(nome), contas:conta_id(nome)').eq('usuario_id', session.user.id).order('data_transacao', { ascending: false }),
          supabase.from('membros').select('*').eq('usuario_id', session.user.id).order('nome'),
          supabase.from('grupos').select('*').eq('usuario_id', session.user.id).eq('ativo', true),
          supabase.from('contas').select('*').eq('usuario_id', session.user.id).eq('ativo', true),
          supabase.from('categorias').select('*').eq('usuario_id', session.user.id),
          supabase.from('periodos_financeiros').select('*').eq('usuario_id', session.user.id),
        ]);

        if (transacoesRes.error) throw new Error(`Transações: ${transacoesRes.error.message}`);
        if (membrosRes.error) throw new Error(`Membros: ${membrosRes.error.message}`);
        if (gruposRes.error) throw new Error(`Grupos: ${gruposRes.error.message}`);
        if (contasRes.error) throw new Error(`Contas: ${contasRes.error.message}`);
        if (categoriasRes.error) throw new Error(`Categorias: ${categoriasRes.error.message}`);
        if (periodosRes.error) throw new Error(`Períodos: ${periodosRes.error.message}`);

        setTransacoes(transacoesRes.data || []);
        setMembros(membrosRes.data || []);
        setGrupos(gruposRes.data || []);
        setContas(contasRes.data || []);
        setCategorias(categoriasRes.data || []);
        setPeriodos(periodosRes.data || []);

        const active = periodosRes.data?.find(p => p.ativo) || null;
        setActivePeriodo(active);

      } catch (err: any) {
        console.error("Erro ao carregar dados:", err);
        const msg = err instanceof Error 
            ? err.message 
            : (typeof err === 'string' 
                ? err 
                : (err?.message || err?.error_description || JSON.stringify(err)));
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [session?.user?.id]);

  // Transações filtradas pelo período ativo
  const transacoesFiltradas = useMemo(() => {
    if (!activePeriodo) return transacoes;
    return transacoes.filter(t => t.periodo_financeiro_id === activePeriodo.id);
  }, [transacoes, activePeriodo]);

  const { totalReceitas, totalDespesas, saldo } = useMemo(() => {
    const totalReceitas = transacoesFiltradas
      .filter(t => t.tipo === 'receita')
      .reduce((sum, t) => sum + t.valor, 0);
    const totalDespesas = transacoesFiltradas
      .filter(t => t.tipo === 'despesa')
      .reduce((sum, t) => sum + t.valor, 0);
    const saldo = totalReceitas - totalDespesas;
    return { totalReceitas, totalDespesas, saldo };
  }, [transacoesFiltradas]);

  const refreshTransactionWithDetails = async (id: number): Promise<Transacao | null> => {
    if (!session) return null;
    const { data, error } = await supabase
        .from('transacoes')
        .select('*, categorias(nome), contas:conta_id(nome)')
        .eq('id', id)
        .single();
    if (error) {
        console.error("Error refreshing transaction:", error);
        return null;
    }
    return data;
  }

  const handleTransacaoAdicionada = async (novaTransacaoStub: Transacao) => {
    if (!session) {
      setTransacoes(currentTransacoes => [novaTransacaoStub, ...currentTransacoes].sort((a, b) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime()));
      return;
    }
    const newTransaction = await refreshTransactionWithDetails(novaTransacaoStub.id);
    if(newTransaction) {
      setTransacoes(currentTransacoes => [newTransaction, ...currentTransacoes].sort((a, b) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime()));
    }
  };
  
  const handleTransacaoAtualizada = async (transacaoAtualizadaStub: Transacao) => {
    if (!session) {
      setTransacoes(currentTransacoes => currentTransacoes.map(t => t.id === transacaoAtualizadaStub.id ? transacaoAtualizadaStub : t));
      return;
    }
    const updatedTransaction = await refreshTransactionWithDetails(transacaoAtualizadaStub.id);
    if(updatedTransaction){
        setTransacoes(currentTransacoes => currentTransacoes.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
    }
  };
  
  const handleRequestDelete = (id: number) => {
    setTransactionToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (transactionToDelete === null) return;
    setIsDeleting(true);

    if (!session) {
      setTransacoes(current => current.filter(t => t.id !== transactionToDelete));
    } else {
        try {
          const { error } = await supabase!
            .from('transacoes')
            .delete()
            .eq('id', transactionToDelete);

          if (error) throw error;
          setTransacoes(current => current.filter(t => t.id !== transactionToDelete));
        } catch (err: any) {
          const msg = err instanceof Error 
            ? err.message 
            : (typeof err === 'string' 
                ? err 
                : (err?.message || err?.error_description || JSON.stringify(err)));
          alert("Erro ao excluir a transação: " + msg);
        }
    }
    
    setIsDeleting(false);
    setIsConfirmModalOpen(false);
    setTransactionToDelete(null);
  };

  const handleCancelDelete = () => {
    setIsConfirmModalOpen(false);
    setTransactionToDelete(null);
  }

  const handleStartEdit = (transacao: Transacao) => {
      setEditingTransaction(transacao);
      setIsModalOpen(true);
  };
  
  const closeModal = () => {
      setIsModalOpen(false);
      setEditingTransaction(null);
  }

  // Handlers for CRUDs
  const handleMembroAdicionado = (novoMembro: Membro) => {
    setMembros(current => [...current, novoMembro].sort((a,b) => a.nome.localeCompare(b.nome)));
  };
  const handleMembroAtualizado = (membroAtualizado: Membro) => {
    setMembros(current => current.map(m => m.id === membroAtualizado.id ? membroAtualizado : m));
  };
  const handleMembroExcluido = (id: number) => {
    setMembros(current => current.filter(m => m.id !== id));
  };

  const handleCategoriaAdicionada = (novaCategoria: Categoria) => {
    setCategorias(current => [...current, novaCategoria].sort((a,b) => a.nome.localeCompare(b.nome)));
  };
  const handleCategoriaAtualizada = (categoriaAtualizada: Categoria) => {
    setCategorias(current => current.map(c => c.id === categoriaAtualizada.id ? categoriaAtualizada : c));
  };
  const handleCategoriaExcluida = (id: number) => {
    setCategorias(current => current.filter(c => c.id !== id));
  };

  const handleContaAdicionada = (novaConta: Conta) => {
    setContas(current => [...current, novaConta].sort((a,b) => a.nome.localeCompare(b.nome)));
  };
  const handleContaAtualizada = (contaAtualizada: Conta) => {
    setContas(current => current.map(c => c.id === contaAtualizada.id ? contaAtualizada : c));
  };
  const handleContaExcluida = (id: number) => {
    setContas(current => current.filter(c => c.id !== id));
  };

  const handleGrupoAdicionado = (novoGrupo: Grupo) => {
    setGrupos(current => [...current, novoGrupo].sort((a,b) => a.nome.localeCompare(b.nome)));
  };
  const handleGrupoAtualizado = (grupoAtualizado: Grupo) => {
    setGrupos(current => current.map(g => g.id === grupoAtualizado.id ? grupoAtualizado : g));
  };
  const handleGrupoExcluido = (id: number) => {
    setGrupos(current => current.filter(g => g.id !== id));
  };


  const formatarMoeda = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
  
  const SettingsIconSmall = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const LogoutIcon = () => (
    <svg className="h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-800 font-sans text-gray-100">
      {/* Header */}
      <header className="bg-gray-900 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-brand-primary to-emerald-400 text-transparent bg-clip-text">
                Finanças
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400 hidden sm:block">{currentDate}</span>
               {/* User Dropdown */}
               <div className="relative ml-3">
                  <div>
                    <button 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center max-w-xs bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white" 
                      id="user-menu" 
                      aria-haspopup="true"
                    >
                      <span className="sr-only">Abrir menu do usuário</span>
                      <div className="h-8 w-8 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold">
                        {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </button>
                  </div>
                  
                  {isDropdownOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-32 bg-gray-600 rounded-md shadow-lg py-1 z-20 ring-1 ring-black ring-opacity-5"
                      onMouseLeave={() => setIsDropdownOpen(false)}
                    >
                        <div className="px-4 py-2 text-xs text-gray-300 border-b border-gray-500 truncate">
                            {session?.user?.email || 'Convidado'}
                        </div>
                      <button
                        onClick={() => {
                          setIsSettingsModalOpen(true);
                          setIsDropdownOpen(false);
                        }}
                        className="block w-full text-left px-2 py-2 text-xs text-gray-200 hover:bg-gray-500 transition-colors flex items-center"
                      >
                        <SettingsIconSmall /> Config.
                      </button>
                      <div className="border-t border-gray-500 my-1"></div>
                      <button
                        onClick={() => {
                          supabase?.auth.signOut();
                          setIsDropdownOpen(false);
                        }}
                        className="block w-full text-left px-2 py-2 text-xs text-gray-200 hover:bg-brand-secondary hover:text-white transition-colors flex items-center"
                      >
                        <LogoutIcon /> Sair
                      </button>
                    </div>
                  )}
                </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex space-x-4 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-4 font-medium text-sm transition-colors focus:outline-none border-b-2 ${
              activeTab === 'dashboard'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('transacoes')}
            className={`py-2 px-4 font-medium text-sm transition-colors focus:outline-none border-b-2 ${
              activeTab === 'transacoes'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Transações
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        {loading ? (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            </div>
        ) : error ? (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Erro!</strong>
                <span className="block sm:inline"> {error}</span>
            </div>
        ) : (
            <>
                {activeTab === 'dashboard' && (
                  <>
                    <DashboardView
                        totalReceitas={totalReceitas}
                        totalDespesas={totalDespesas}
                        saldo={saldo}
                        formatarMoeda={formatarMoeda}
                        transacoes={transacoesFiltradas} // Passando as transações já filtradas
                        onEdit={handleStartEdit}
                        onDelete={handleRequestDelete}
                        session={session}
                        categorias={categorias}
                        activePeriodo={activePeriodo}
                    />
                  </>
                )}

                {activeTab === 'transacoes' && (
                <TransacoesView
                    transacoes={transacoes} // TransacoesView continua vendo tudo (histórico)
                    loading={loading}
                    error={error}
                    formatarMoeda={formatarMoeda}
                    onEdit={handleStartEdit}
                    onDelete={handleRequestDelete}
                />
                )}
            </>
        )}
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => {
            setEditingTransaction(null);
            setIsModalOpen(true);
        }}
        className="fixed bottom-6 right-6 bg-brand-primary hover:bg-emerald-600 text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary z-40"
        aria-label="Adicionar Transação"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={closeModal}
        session={session}
        onTransacaoAdicionada={handleTransacaoAdicionada}
        onTransacaoAtualizada={handleTransacaoAtualizada}
        transactionToEdit={editingTransaction}
        membros={membros}
        grupos={grupos}
        contas={contas}
        categorias={categorias}
        activePeriodoId={activePeriodo?.id}
      />
      
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Excluir Transação"
        message="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."
        loading={isDeleting}
      />

      <ConfiguracoesModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        session={session}
        
        membros={membros}
        onMembroAdicionado={handleMembroAdicionado}
        onMembroAtualizado={handleMembroAtualizado}
        onMembroExcluido={handleMembroExcluido}
        
        categorias={categorias}
        onCategoriaAdicionada={handleCategoriaAdicionada}
        onCategoriaAtualizada={handleCategoriaAtualizada}
        onCategoriaExcluida={handleCategoriaExcluida}
        
        contas={contas}
        onContaAdicionada={handleContaAdicionada}
        onContaAtualizada={handleContaAtualizada}
        onContaExcluida={handleContaExcluida}
        
        grupos={grupos}
        onGrupoAdicionado={handleGrupoAdicionado}
        onGrupoAtualizado={handleGrupoAtualizado}
        onGrupoExcluido={handleGrupoExcluido}
      />
    </div>
  );
}