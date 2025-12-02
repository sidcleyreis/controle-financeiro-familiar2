
import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import type { Conta, Membro, Grupo } from './types';
import ConfirmationModal from './ConfirmationModal';

// Ícones inline
const Edit2Icon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>;
const Trash2Icon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;

const TIPOS_CONTA = [
  'Conta Corrente',
  'Poupança',
  'Cartão de Crédito',
  'Carteira',
  'Investimento',
  'Outros'
];

function formatTipoConta(tipoBanco: string): string {
  const mapa: Record<string, string> = {
    'dinheiro': 'Carteira',
    'conta_corrente': 'Conta Corrente',
    'poupanca': 'Poupança',
    'cartao_credito': 'Cartão de Crédito',
    'investimento': 'Investimento',
    'outros': 'Outros'
  };
  return mapa[tipoBanco] || tipoBanco;
}

interface ContasTabProps {
  contas: Conta[];
  membros: Membro[];
  grupos: Grupo[];
  onContaAdicionada: (novaConta: Conta) => void;
  onContaAtualizada: (contaAtualizada: Conta) => void;
  onContaExcluida: (id: number) => void;
}

export default function ContasTab({
  contas,
  membros,
  grupos,
  onContaAdicionada,
  onContaAtualizada,
  onContaExcluida
}: ContasTabProps) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [contaEditando, setContaEditando] = useState<Conta | null>(null);
  
  // Form States
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('');
  const [saldoInicial, setSaldoInicial] = useState('0,00'); // Armazena string formatada
  const [proprietario, setProprietario] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  // Delete Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contaToDelete, setContaToDelete] = useState<Conta | null>(null);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [isSoftDelete, setIsSoftDelete] = useState(false);

  // Helpers
  const contasAtivas = contas.filter(c => c.ativo !== false);
  const membrosAtivos = membros.filter(m => m.ativo !== false);
  const gruposAtivos = grupos.filter(g => g.ativo !== false);

  const getNomeProprietario = (conta: Conta): string => {
    if (conta.membro_id) {
        const membro = membros.find(m => m.id === conta.membro_id);
        return membro ? `${membro.nome} [Membro]` : '-';
    }
    if (conta.grupo_id) {
        const grupo = grupos.find(g => g.id === conta.grupo_id);
        return grupo ? `${grupo.nome} [Grupo]` : '-';
    }
    return '-';
  };

  const formatarValorTabela = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  // Funções de manipulação de moeda no input
  const formatarMoedaInput = (valor: string) => {
    // Remove tudo que não é dígito
    let valorLimpo = valor.replace(/\D/g, '');
    
    // Se estiver vazio, retorna 0,00
    if (!valorLimpo) return '0,00';
    
    // Converte para número e divide por 100 para ter os centavos
    const numero = parseInt(valorLimpo) / 100;
    
    // Formata para string pt-BR
    return numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleSaldoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSaldoInicial(formatarMoedaInput(e.target.value));
  };

  const parseMoeda = (valorFormatado: string): number => {
    // Remove pontos de milhar e troca vírgula por ponto
    const valorLimpo = valorFormatado.replace(/\./g, '').replace(',', '.');
    return parseFloat(valorLimpo);
  };

  // Actions
  const abrirFormularioNovo = () => {
    setContaEditando(null);
    setNome('');
    setTipo('Conta Corrente');
    setSaldoInicial('0,00');
    setProprietario('');
    setErro('');
    setMostrarFormulario(true);
  };

  const abrirFormularioEditar = (conta: Conta) => {
    setContaEditando(conta);
    setNome(conta.nome);
    
    const displayType = TIPOS_CONTA.find(t => {
        let tipoBanco = '';
        switch(t) {
            case 'Conta Corrente': tipoBanco = 'conta_corrente'; break;
            case 'Poupança': tipoBanco = 'poupanca'; break;
            case 'Cartão de Crédito': tipoBanco = 'cartao_credito'; break;
            case 'Carteira': tipoBanco = 'dinheiro'; break;
            case 'Investimento': tipoBanco = 'investimento'; break;
            case 'Outros': tipoBanco = 'outros'; break;
        }
        return tipoBanco === conta.tipo;
    }) || conta.tipo;

    setTipo(displayType); 
    
    // Formata o valor numérico do banco para a string do input
    setSaldoInicial(conta.saldo_inicial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    
    if (conta.membro_id) {
        setProprietario(`membro-${conta.membro_id}`);
    } else if (conta.grupo_id) {
        setProprietario(`grupo-${conta.grupo_id}`);
    } else {
        setProprietario('');
    }

    setErro('');
    setMostrarFormulario(true);
  };

  const fecharFormulario = () => {
    setMostrarFormulario(false);
    setContaEditando(null);
    setNome('');
    setTipo('');
    setSaldoInicial('0,00');
    setProprietario('');
    setErro('');
  };

  const validarFormulario = (): boolean => {
    if (!nome.trim()) {
      setErro('Nome é obrigatório');
      return false;
    }
    if (!tipo) {
      setErro('Tipo é obrigatório');
      return false;
    }
    const valorFloat = parseMoeda(saldoInicial);
    if (isNaN(valorFloat)) {
      setErro('Saldo inicial deve ser um número válido');
      return false;
    }
    if (!proprietario) {
      setErro('Proprietário (Membro ou Grupo) é obrigatório');
      return false;
    }
    return true;
  };

  const handleSalvar = async () => {
    if (!validarFormulario()) return;

    setLoading(true);
    setErro('');

    try {
      const sessionRes = await supabase?.auth.getSession();
      const session = sessionRes?.data.session;

      // Normalizar tipo
      let tipoBanco = tipo;
      switch(tipo) {
          case 'Conta Corrente': tipoBanco = 'conta_corrente'; break;
          case 'Poupança': tipoBanco = 'poupanca'; break;
          case 'Cartão de Crédito': tipoBanco = 'cartao_credito'; break;
          case 'Carteira': tipoBanco = 'dinheiro'; break;
          case 'Investimento': tipoBanco = 'investimento'; break;
          case 'Outros': tipoBanco = 'outros'; break;
          default: tipoBanco = tipo.toLowerCase().replace(/ /g, '_');
      }

      const [ownerType, ownerIdStr] = proprietario.split('-');
      const ownerId = parseInt(ownerIdStr);
      
      const membro_id = ownerType === 'membro' ? ownerId : null;
      const grupo_id = ownerType === 'grupo' ? ownerId : null;

      const payload = {
        nome,
        tipo: tipoBanco,
        saldo_inicial: parseMoeda(saldoInicial), // Converte string formatada para float
        membro_id,
        grupo_id
      };

      // MODO DEMO
      if (!session) {
        const contaSimulada: Conta = {
          id: contaEditando?.id || Math.floor(Math.random() * 10000),
          usuario_id: 'demo',
          ...payload,
          ativo: true,
          criado_em: new Date().toISOString()
        } as Conta;

        if (contaEditando) {
          onContaAtualizada(contaSimulada);
        } else {
          onContaAdicionada(contaSimulada);
        }
        fecharFormulario();
        setLoading(false);
        return;
      }

      // MODO PRODUÇÃO
      if (contaEditando) {
        const { data, error } = await supabase!
          .from('contas')
          .update(payload)
          .eq('id', contaEditando.id)
          .eq('usuario_id', session.user.id)
          .select()
          .single();

        if (error) throw error;
        onContaAtualizada(data);

      } else {
        const { data, error } = await supabase!
          .from('contas')
          .insert({
            ...payload,
            usuario_id: session.user.id,
            ativo: true
          })
          .select()
          .single();

        if (error) throw error;
        onContaAdicionada(data);
      }

      fecharFormulario();

    } catch (error: any) {
      console.error(error);
      const msg = error instanceof Error 
        ? error.message 
        : (typeof error === 'string' 
            ? error 
            : (error?.message || error?.error_description || JSON.stringify(error)));
      setErro(msg || 'Erro ao salvar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDelete = async (conta: Conta) => {
    setLoading(true); 
    setErro('');

    try {
        const sessionRes = await supabase?.auth.getSession();
        const session = sessionRes?.data.session;

        // MODO DEMO
        if (!session) {
            setDeleteMessage(`Modo Demo: Deseja excluir a conta "${conta.nome}"?`);
            setIsSoftDelete(false);
            setContaToDelete(conta);
            setIsDeleteModalOpen(true);
            setLoading(false);
            return;
        }

        // MODO PRODUÇÃO: Verificar vínculos
        const { count, error } = await supabase!
            .from('transacoes')
            .select('*', { count: 'exact', head: true })
            .eq('conta_id', conta.id)
            .eq('usuario_id', session.user.id);

        if (error) throw error;

        if (count && count > 0) {
            setDeleteMessage(`A conta "${conta.nome}" possui ${count} transação(ões) vinculada(s). Deseja desativá-la? Ela não aparecerá mais para novas transações.`);
            setIsSoftDelete(true);
        } else {
            setDeleteMessage(`Deseja excluir permanentemente a conta "${conta.nome}"? Esta ação não pode ser desfeita.`);
            setIsSoftDelete(false);
        }

        setContaToDelete(conta);
        setIsDeleteModalOpen(true);

    } catch (error: any) {
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        setErro("Erro ao verificar conta: " + msg);
    } finally {
        setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!contaToDelete) return;

    setLoading(true); 
    
    try {
        const sessionRes = await supabase?.auth.getSession();
        const session = sessionRes?.data.session;

        // MODO DEMO
        if (!session) {
            onContaExcluida(contaToDelete.id);
            setIsDeleteModalOpen(false);
            setContaToDelete(null);
            return;
        }

        if (isSoftDelete) {
            // SOFT DELETE
            const { error } = await supabase!
                .from('contas')
                .update({ ativo: false })
                .eq('id', contaToDelete.id)
                .eq('usuario_id', session.user.id);

            if (error) throw error;
        } else {
            // HARD DELETE
            const { error } = await supabase!
                .from('contas')
                .delete()
                .eq('id', contaToDelete.id)
                .eq('usuario_id', session.user.id);

            if (error) throw error;
        }

        onContaExcluida(contaToDelete.id);
        setIsDeleteModalOpen(false);
        setContaToDelete(null);

    } catch (error: any) {
        console.error("Erro ao excluir conta:", error);
        alert("Erro ao excluir conta: " + (error.message || error));
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* CABEÇALHO */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Minhas Contas</h3>
        <button
          onClick={abrirFormularioNovo}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 disabled:opacity-50 transition-colors"
        >
          <PlusIcon />
          <span className="text-sm font-medium">Nova Conta</span>
        </button>
      </div>

      {/* ERRO GLOBAL */}
      {erro && !mostrarFormulario && (
        <div className="p-3 bg-red-500/20 border border-red-500 rounded text-red-200 mb-4 text-sm">
          {erro}
        </div>
      )}

      {/* TABELA COM SCROLL HORIZONTAL */}
      <div className="bg-gray-900/30 rounded-lg border border-gray-600 overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[600px]">
            <thead className="bg-gray-700 text-gray-300 uppercase text-xs">
                <tr>
                <th className="px-3 py-3 text-left min-w-[130px]">Nome</th>
                <th className="px-3 py-3 text-left whitespace-nowrap w-32">Tipo</th>
                <th className="px-3 py-3 text-right whitespace-nowrap w-32">Saldo</th>
                <th className="px-3 py-3 text-left min-w-[120px]">Proprietário</th>
                <th className="px-3 py-3 text-center w-20">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
                {contasAtivas.length === 0 ? (
                <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                    Nenhuma conta cadastrada.
                    </td>
                </tr>
                ) : (
                contasAtivas.map(conta => (
                    <tr key={conta.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-3 py-3 font-medium text-white truncate max-w-[200px]" title={conta.nome}>
                        {conta.nome}
                    </td>
                    <td className="px-3 py-3 text-gray-400 whitespace-nowrap text-xs">
                        {formatTipoConta(conta.tipo)}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-400 font-mono whitespace-nowrap text-sm">
                        {formatarValorTabela(conta.saldo_inicial)}
                    </td>
                    <td className="px-3 py-3 text-gray-400 text-xs truncate max-w-[150px]" title={getNomeProprietario(conta)}>
                        {getNomeProprietario(conta)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                        <div className="flex justify-center items-center gap-2">
                        <button
                            onClick={() => abrirFormularioEditar(conta)}
                            disabled={loading}
                            className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                            title="Editar"
                        >
                            <Edit2Icon />
                        </button>
                        <button
                            onClick={() => handleRequestDelete(conta)}
                            disabled={loading}
                            className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                            title="Excluir"
                        >
                            <Trash2Icon />
                        </button>
                        </div>
                    </td>
                    </tr>
                ))
                )}
            </tbody>
            </table>
      </div>

      {/* FORMULÁRIO MODAL */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md border border-gray-600 flex flex-col max-h-[90vh]">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h4 className="text-lg font-bold text-white">
                {contaEditando ? 'Editar Conta' : 'Nova Conta'}
              </h4>
              <button
                onClick={fecharFormulario}
                disabled={loading}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XIcon />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nome *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={loading}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: Nubank, Carteira..."
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tipo *</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  disabled={loading}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Selecione...</option>
                  {TIPOS_CONTA.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Saldo Inicial (R$) *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={saldoInicial}
                  onChange={handleSaldoChange}
                  disabled={loading}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right font-mono"
                  placeholder="0,00"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">Digite apenas os números</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Proprietário *</label>
                <select
                  value={proprietario}
                  onChange={(e) => setProprietario(e.target.value)}
                  disabled={loading}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Selecione o dono da conta...</option>
                  
                  <optgroup label="Membros Individuais">
                    {membrosAtivos.map(m => (
                        <option key={`membro-${m.id}`} value={`membro-${m.id}`}>{m.nome}</option>
                    ))}
                  </optgroup>

                  {gruposAtivos.length > 0 && (
                      <optgroup label="Grupos Compartilhados">
                          {gruposAtivos.map(g => (
                              <option key={`grupo-${g.id}`} value={`grupo-${g.id}`}>{g.nome}</option>
                          ))}
                      </optgroup>
                  )}
                </select>
                <p className="text-xs text-gray-500 mt-1">Quem é o responsável por esta conta/cartão.</p>
              </div>

              {erro && (
                <div className="p-3 bg-red-500/20 border border-red-500 rounded text-red-200 text-sm">
                  {erro}
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-gray-700 flex gap-3 bg-gray-800/50">
              <button
                onClick={fecharFormulario}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 disabled:opacity-50 transition-colors font-medium"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
            setIsDeleteModalOpen(false);
            setContaToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title={isSoftDelete ? "Desativar Conta" : "Excluir Conta"}
        message={deleteMessage}
        confirmText={isSoftDelete ? "Desativar" : "Excluir"}
        loading={loading}
      />
    </div>
  );
}
