
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { PeriodoFinanceiro } from './types';
import ConfirmationModal from './ConfirmationModal';

// Ícones Inline
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const CircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>;
const Edit2Icon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;
const Trash2Icon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

export default function PeriodosTab() {
  const [periodos, setPeriodos] = useState<PeriodoFinanceiro[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  
  // Form State
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nome, setNome] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [ativo, setAtivo] = useState(false);
  const [confirmarAviso, setConfirmarAviso] = useState(false); // Novo estado para controle de warnings

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [periodoToDelete, setPeriodoToDelete] = useState<PeriodoFinanceiro | null>(null);

  useEffect(() => {
    fetchPeriodos();
  }, []);

  const fetchPeriodos = async () => {
    const sessionRes = await supabase?.auth.getSession();
    const session = sessionRes?.data.session;

    if (!session) {
      // Modo Demo (mock inicial)
      if (periodos.length === 0) {
        setPeriodos([{
            id: 1, usuario_id: 'demo', nome: 'Período Atual', 
            data_inicio: new Date().toISOString().split('T')[0], 
            data_fim: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0], 
            ativo: true, criado_em: new Date().toISOString()
        }]);
      }
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase!
        .from('periodos_financeiros')
        .select('*')
        .eq('usuario_id', session.user.id)
        .order('data_inicio', { ascending: false });

      if (error) throw error;
      setPeriodos(data || []);
    } catch (err: any) {
      console.error(err);
      setErro('❌ Erro ao carregar períodos.');
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data: string) => {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  // Helper para somar dias a uma data string YYYY-MM-DD mantendo fuso local
  const somarDias = (dataStr: string, dias: number): string => {
    if (!dataStr) return '';
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    // Cria data local (mes começa em 0 no JS)
    const data = new Date(ano, mes - 1, dia);
    data.setDate(data.getDate() + dias);
    
    const y = data.getFullYear();
    const m = String(data.getMonth() + 1).padStart(2, '0');
    const d = String(data.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const limparFormulario = () => {
    setEditingId(null);
    setNome('');
    setDataInicio('');
    setDataFim('');
    setAtivo(false);
    setErro('');
    setConfirmarAviso(false);
    setMostrarFormulario(false);
  };

  const abrirFormulario = (periodo?: PeriodoFinanceiro) => {
    setErro('');
    setConfirmarAviso(false);
    
    if (periodo) {
      // Edição: Carrega dados existentes
      setEditingId(periodo.id);
      setNome(periodo.nome);
      setDataInicio(periodo.data_inicio);
      setDataFim(periodo.data_fim);
      setAtivo(periodo.ativo);
    } else {
      // Novo: Lógica de Sugestão Inteligente
      let sugestaoInicio = '';
      
      if (periodos.length > 0) {
        // Pega a maior data_fim dentre os períodos existentes
        const ordenadosPorFim = [...periodos].sort((a, b) => 
            new Date(b.data_fim).getTime() - new Date(a.data_fim).getTime()
        );
        const ultimoPeriodo = ordenadosPorFim[0];
        sugestaoInicio = somarDias(ultimoPeriodo.data_fim, 1);
      } else {
        // Primeiro dia do mês atual
        const hoje = new Date();
        const y = hoje.getFullYear();
        const m = String(hoje.getMonth() + 1).padStart(2, '0');
        sugestaoInicio = `${y}-${m}-01`;
      }

      // Sugere fim = inicio + 30 dias
      const sugestaoFim = somarDias(sugestaoInicio, 30);
      
      setEditingId(null);
      setNome('');
      setDataInicio(sugestaoInicio);
      setDataFim(sugestaoFim);
      setAtivo(false);
    }
    setMostrarFormulario(true);
  };

  // Handler inteligente para mudança de Data Início
  const handleDataInicioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novaDataInicio = e.target.value;
    setDataInicio(novaDataInicio);
    
    // Recalcula automaticamente a data fim (+30 dias) ao mudar o inicio
    if (novaDataInicio) {
        setDataFim(somarDias(novaDataInicio, 30));
    }
  };

  const validarSobreposicao = async (start: string, end: string, ignoreId?: number | null) => {
    const sessionRes = await supabase?.auth.getSession();
    if (!sessionRes?.data.session) return false;

    // Lógica de sobreposição: (StartA <= EndB) e (EndA >= StartB)
    let query = supabase!
      .from('periodos_financeiros')
      .select('id, nome')
      .eq('usuario_id', sessionRes.data.session.user.id)
      .or(`and(data_inicio.lte.${end},data_fim.gte.${start})`);

    if (ignoreId) {
      query = query.neq('id', ignoreId);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    if (data && data.length > 0) {
      throw new Error(`As datas conflitam com o período: ${data[0].nome}`);
    }
  };

  // Nova função de validação de lacunas
  const validarLacunas = (inicio: string, fim: string, ignoreId?: number | null): string => {
    // Filtra períodos (exceto o atual)
    const periodosParaValidar = periodos.filter(p => p.id !== ignoreId);

    // Adiciona o novo período temporariamente para validação
    const novoPeriodoMock = {
      id: -1, // ID temporário
      usuario_id: '',
      nome: 'TEMP',
      ativo: false,
      criado_em: '',
      data_inicio: inicio,
      data_fim: fim
    };

    const todosOsPeriodos = [...periodosParaValidar, novoPeriodoMock].sort((a, b) => 
      new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime()
    );

    // Verifica lacunas
    const lacunas: string[] = [];
    for (let i = 0; i < todosOsPeriodos.length - 1; i++) {
      const fimAtual = new Date(todosOsPeriodos[i].data_fim);
      const inicioProximo = new Date(todosOsPeriodos[i + 1].data_inicio);

      // Calcula diferença em dias
      const diffTime = Math.abs(inicioProximo.getTime() - fimAtual.getTime());
      const diferencaDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1; // -1 porque se termina dia 1 e começa dia 2, diff é 0

      // Ajuste simplificado para garantir precisão com datas YYYY-MM-DD
      const [fAno, fMes, fDia] = todosOsPeriodos[i].data_fim.split('-').map(Number);
      const dataFimAtualObj = new Date(fAno, fMes - 1, fDia);
      
      const [iAno, iMes, iDia] = todosOsPeriodos[i + 1].data_inicio.split('-').map(Number);
      const dataInicioProximoObj = new Date(iAno, iMes - 1, iDia);

      // Diferença em ms
      const diffMs = dataInicioProximoObj.getTime() - dataFimAtualObj.getTime();
      const diffDiasReais = Math.round(diffMs / (1000 * 60 * 60 * 24));

      // Se a diferença for maior que 1 dia (ex: termina dia 1, começa dia 3 -> gap dia 2)
      if (diffDiasReais > 1) {
        const dataLacunaInicio = somarDias(todosOsPeriodos[i].data_fim, 1);
        const dataLacunaFim = somarDias(todosOsPeriodos[i + 1].data_inicio, -1);
        lacunas.push(`${formatarData(dataLacunaInicio)} até ${formatarData(dataLacunaFim)}`);
      }
    }

    if (lacunas.length > 0) {
      return `⚠️ Atenção: Este período deixará lacuna(s) entre: ${lacunas.join(', ')}`;
    }

    return '';
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    // Validações locais
    if (!nome.trim() || !dataInicio || !dataFim) {
      setErro('❌ Preencha todos os campos obrigatórios.');
      return;
    }
    if (dataFim <= dataInicio) {
      setErro('❌ A data final deve ser posterior à data inicial.');
      return;
    }

    // Validação de Lacunas (Warning)
    // Se não confirmou ainda, roda validação.
    if (!confirmarAviso) {
        const warning = validarLacunas(dataInicio, dataFim, editingId);
        if (warning) {
            setErro(warning);
            setConfirmarAviso(true); // Próximo clique vai salvar
            return; // Interrompe para mostrar o aviso
        }
    }

    setLoading(true);

    try {
      const sessionRes = await supabase?.auth.getSession();
      const session = sessionRes?.data.session;

      // --- MODO DEMO ---
      if (!session) {
        if (ativo) {
            // Desativar outros no modo demo
            setPeriodos(prev => prev.map(p => ({ ...p, ativo: false })));
        }
        
        const payload = { 
            nome, 
            data_inicio: dataInicio, 
            data_fim: dataFim, 
            ativo 
        };

        if (editingId) {
            setPeriodos(prev => prev.map(p => p.id === editingId ? { ...p, ...payload } : p));
        } else {
            setPeriodos(prev => [{ ...payload, id: Math.random(), usuario_id: 'demo', criado_em: new Date().toISOString() } as PeriodoFinanceiro, ...prev]);
        }
        
        limparFormulario();
        setLoading(false);
        return;
      }

      // --- MODO PRODUÇÃO ---
      
      // 1. Validar Sobreposição no Banco (Erro bloqueante)
      await validarSobreposicao(dataInicio, dataFim, editingId);

      // 2. Se for ativar este período, desativar todos os outros antes
      if (ativo) {
        await supabase!
          .from('periodos_financeiros')
          .update({ ativo: false })
          .eq('usuario_id', session.user.id);
      }

      const payload = {
        usuario_id: session.user.id,
        nome,
        data_inicio: dataInicio,
        data_fim: dataFim,
        ativo
      };

      if (editingId) {
        const { error } = await supabase!
          .from('periodos_financeiros')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase!
          .from('periodos_financeiros')
          .insert(payload);
        if (error) throw error;
      }

      await fetchPeriodos();
      limparFormulario();

    } catch (err: any) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      setErro(`❌ ${msg}`);
      setConfirmarAviso(false); // Reset se der erro real
    } finally {
      setLoading(false);
    }
  };

  const handleTornarAtivo = async (periodo: PeriodoFinanceiro) => {
    if (periodo.ativo) return; // Já está ativo
    setLoading(true);

    try {
      const sessionRes = await supabase?.auth.getSession();
      if (!sessionRes?.data.session) {
        // Demo
        setPeriodos(prev => prev.map(p => ({ ...p, ativo: p.id === periodo.id })));
        return;
      }

      // Desativar todos
      await supabase!
        .from('periodos_financeiros')
        .update({ ativo: false })
        .eq('usuario_id', sessionRes.data.session.user.id);

      // Ativar o selecionado
      await supabase!
        .from('periodos_financeiros')
        .update({ ativo: true })
        .eq('id', periodo.id);

      await fetchPeriodos();

    } catch (err) {
      console.error(err);
      setErro('❌ Erro ao ativar período.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDelete = async (periodo: PeriodoFinanceiro) => {
    setLoading(true);
    setErro('');

    try {
      const sessionRes = await supabase?.auth.getSession();
      if (!sessionRes?.data.session) {
        // Demo
        setPeriodoToDelete(periodo);
        setIsDeleteModalOpen(true);
        setLoading(false);
        return;
      }

      // Verificar Vínculos (Transações)
      const { count: transacoesCount, error: tError } = await supabase!
        .from('transacoes')
        .select('*', { count: 'exact', head: true })
        .eq('periodo_financeiro_id', periodo.id);
      
      if (tError) throw tError;

      // Verificar Vínculos (Metas)
      const { count: metasCount, error: mError } = await supabase!
        .from('metas')
        .select('*', { count: 'exact', head: true })
        .eq('periodo_id', periodo.id);

      if (mError) throw mError;

      const totalLinks = (transacoesCount || 0) + (metasCount || 0);

      if (totalLinks > 0) {
        // SUBSTITUIÇÃO DO ALERT POR MENSAGEM VISUAL
        const msgs = [];
        if (transacoesCount) msgs.push(`${transacoesCount} transação(ões)`);
        if (metasCount) msgs.push(`${metasCount} meta(s)`);
        
        setErro(`❌ Não é possível excluir: existem ${msgs.join(' e ')} vinculadas a este período.`);
        
        // Scroll para o topo para ver o erro caso esteja numa lista longa
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        setLoading(false);
        return;
      }

      setPeriodoToDelete(periodo);
      setIsDeleteModalOpen(true);

    } catch (err: any) {
      setErro('❌ Erro ao verificar vínculos do período.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!periodoToDelete) return;
    setLoading(true);

    try {
      const sessionRes = await supabase?.auth.getSession();
      if (!sessionRes?.data.session) {
        setPeriodos(prev => prev.filter(p => p.id !== periodoToDelete.id));
      } else {
        const { error } = await supabase!
          .from('periodos_financeiros')
          .delete()
          .eq('id', periodoToDelete.id);
        
        if (error) throw error;
        await fetchPeriodos();
      }
      setIsDeleteModalOpen(false);
      setPeriodoToDelete(null);
    } catch (err) {
      setErro('❌ Erro ao excluir período.');
    } finally {
      setLoading(false);
    }
  };

  // Helper para estilização da mensagem de erro/aviso
  const getMessageClass = (msg: string) => {
    if (msg.startsWith('⚠️')) {
      return 'bg-yellow-500/20 border-yellow-500 text-yellow-200';
    }
    return 'bg-red-500/20 border-red-500 text-red-200';
  };

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Períodos Financeiros</h3>
        <button
          onClick={() => abrirFormulario()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 disabled:opacity-50 transition-colors"
        >
          <PlusIcon />
          <span className="text-sm font-medium">Novo Período</span>
        </button>
      </div>

      {/* ERROR DISPLAY (LIST VIEW) */}
      {erro && !mostrarFormulario && (
        <div className={`p-3 border rounded mb-4 text-sm ${getMessageClass(erro)}`}>
          {erro}
        </div>
      )}

      {/* LISTA */}
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
        {periodos.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-900/30 rounded-lg border border-gray-700">
             <p>Nenhum período cadastrado.</p>
             <p className="text-sm mt-1">Crie períodos para organizar suas finanças (ex: "Janeiro 2025", "Férias").</p>
           </div>
        ) : (
          periodos.map(periodo => (
            <div 
              key={periodo.id} 
              className={`p-4 rounded-lg border flex justify-between items-center transition-all ${
                periodo.ativo 
                  ? 'bg-emerald-900/20 border-emerald-500/50 shadow-lg shadow-emerald-900/20' 
                  : 'bg-gray-700 border-gray-600 hover:bg-gray-700/80'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`font-bold text-lg ${periodo.ativo ? 'text-emerald-400' : 'text-white'}`}>
                    {periodo.nome}
                  </h4>
                  {periodo.ativo && (
                    <span className="flex items-center gap-1 text-xs font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <CheckCircleIcon /> Ativo
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <CalendarIcon />
                  <span>{formatarData(periodo.data_inicio)} até {formatarData(periodo.data_fim)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!periodo.ativo && (
                  <button
                    onClick={() => handleTornarAtivo(periodo)}
                    className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded transition-colors"
                    title="Tornar Ativo"
                    disabled={loading}
                  >
                    <CircleIcon />
                  </button>
                )}
                <button
                  onClick={() => abrirFormulario(periodo)}
                  className="p-2 text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                  title="Editar"
                  disabled={loading}
                >
                  <Edit2Icon />
                </button>
                <button
                  onClick={() => handleRequestDelete(periodo)}
                  className="p-2 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                  title="Excluir"
                  disabled={loading}
                >
                  <Trash2Icon />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL FORM */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-sm border border-gray-600 relative flex flex-col">
            <button 
              onClick={limparFormulario} 
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
              disabled={loading}
            >
              <XIcon />
            </button>
            
            <div className="p-6">
              <h4 className="text-lg font-bold text-white mb-6">
                {editingId ? 'Editar Período' : 'Novo Período'}
              </h4>
              
              <form onSubmit={handleSalvar} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Nome</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ex: Janeiro 2025"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Início</label>
                    <input
                      type="date"
                      value={dataInicio}
                      onChange={handleDataInicioChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Fim (+30 dias)</label>
                    <input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-gray-900/50 p-3 rounded border border-gray-700">
                  <input
                    type="checkbox"
                    id="periodo-ativo"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <label htmlFor="periodo-ativo" className="text-sm text-gray-300 cursor-pointer select-none">
                    Definir como Período Ativo Atual
                  </label>
                </div>

                {/* ERROR DISPLAY (MODAL FORM VIEW) */}
                {erro && (
                  <div className={`p-3 border rounded text-sm ${getMessageClass(erro)}`}>
                    {erro}
                    {confirmarAviso && (
                        <p className="mt-1 font-bold text-xs uppercase opacity-80">Clique em Salvar novamente para confirmar.</p>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={limparFormulario}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 disabled:opacity-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 px-4 py-2 text-white rounded disabled:opacity-50 transition-colors font-medium ${
                        confirmarAviso ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-emerald-500 hover:bg-emerald-600'
                    }`}
                  >
                    {loading ? 'Salvando...' : (confirmarAviso ? 'Confirmar' : 'Salvar')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Período"
        message={`Deseja excluir o período "${periodoToDelete?.nome}"?`}
        loading={loading}
      />
    </div>
  );
}
