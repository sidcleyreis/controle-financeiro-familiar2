
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import type { Grupo, Membro } from './types';

// Ícones inline
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const Edit2Icon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>;
const Trash2Icon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;

interface GruposTabProps {
  grupos: Grupo[];
  membros: Membro[];
  onGrupoAdicionado: (novoGrupo: Grupo) => void;
  onGrupoAtualizado: (grupoAtualizado: Grupo) => void;
  onGrupoExcluido: (id: number) => void;
  // Callback para solicitar exclusão ao pai (que abre o modal)
  onRequestDelete: (grupo: Grupo, message: string, onConfirm: () => Promise<void>) => void;
}

export default function GruposTab({
  grupos,
  membros,
  onGrupoAdicionado,
  onGrupoAtualizado,
  onGrupoExcluido,
  onRequestDelete
}: GruposTabProps) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [grupoEditando, setGrupoEditando] = useState<Grupo | null>(null);
  
  // Estado para armazenar visualmente quem está em qual grupo na listagem
  const [associacoes, setAssociacoes] = useState<Record<number, number[]>>({});
  
  // Form States
  const [nome, setNome] = useState('');
  const [tipoRateio, setTipoRateio] = useState<'proporcional_receita' | 'fixo'>('proporcional_receita');
  const [membrosVinculados, setMembrosVinculados] = useState<number[]>([]); 
  
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  // Filtros
  const gruposAtivos = grupos.filter(g => g.ativo !== false);
  const membrosAtivos = membros.filter(m => m.ativo !== false);

  // --- EFEITO: Carregar associações para exibição na lista ---
  useEffect(() => {
    const carregarAssociacoes = async () => {
        const idsGrupos = gruposAtivos.map(g => g.id);
        if (idsGrupos.length === 0) return;

        const sessionRes = await supabase?.auth.getSession();
        if (!sessionRes?.data.session) return;

        try {
            const { data, error } = await supabase!
                .from('grupos_membros')
                .select('grupo_id, membro_id')
                .in('grupo_id', idsGrupos);

            if (error) throw error;

            if (data) {
                const novoMapa: Record<number, number[]> = {};
                data.forEach(row => {
                    if (!novoMapa[row.grupo_id]) {
                        novoMapa[row.grupo_id] = [];
                    }
                    novoMapa[row.grupo_id].push(row.membro_id);
                });
                setAssociacoes(novoMapa);
            }
        } catch (err) {
            console.error("Erro ao carregar membros dos grupos:", err);
        }
    };

    carregarAssociacoes();
  }, [grupos]);

  // --- ACTIONS ---

  const abrirFormularioNovo = () => {
    setGrupoEditando(null);
    setNome('');
    setTipoRateio('proporcional_receita');
    setMembrosVinculados([]);
    setErro('');
    setMostrarFormulario(true);
  };

  const abrirFormularioEditar = async (grupo: Grupo) => {
    setGrupoEditando(grupo);
    setNome(grupo.nome);
    setTipoRateio(grupo.tipo_rateio);
    setErro('');
    setLoading(true);
    setMostrarFormulario(true);

    try {
      const sessionRes = await supabase?.auth.getSession();
      const session = sessionRes?.data.session;

      if (session) {
        const { data, error } = await supabase!
          .from('grupos_membros')
          .select('membro_id')
          .eq('grupo_id', grupo.id);
        
        if (error) throw error;
        
        if (data) {
          setMembrosVinculados(data.map(d => d.membro_id));
        }
      } else {
        setMembrosVinculados(associacoes[grupo.id] || []);
      }
    } catch (err: any) {
      console.error("Erro ao carregar membros do grupo para edição:", err);
      setErro("Erro ao carregar membros vinculados.");
    } finally {
      setLoading(false);
    }
  };

  const fecharFormulario = () => {
    setMostrarFormulario(false);
    setGrupoEditando(null);
    setNome('');
    setTipoRateio('proporcional_receita');
    setMembrosVinculados([]);
    setErro('');
  };

  const toggleMembro = (id: number) => {
    setMembrosVinculados(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErro('Nome é obrigatório');
      return;
    }
    if (membrosVinculados.length === 0) {
      setErro('Selecione pelo menos um membro para o grupo.');
      return;
    }

    setLoading(true);
    setErro('');

    try {
      const sessionRes = await supabase?.auth.getSession();
      const session = sessionRes?.data.session;

      const payload = {
        nome,
        tipo_rateio: tipoRateio
      };

      // --- MODO DEMO ---
      if (!session) {
        const grupoSimulado: Grupo = {
          id: grupoEditando?.id || Math.floor(Math.random() * 10000),
          usuario_id: 'demo',
          ...payload,
          ativo: true,
          criado_em: new Date().toISOString()
        };

        if (grupoEditando) {
          onGrupoAtualizado(grupoSimulado);
        } else {
          onGrupoAdicionado(grupoSimulado);
        }
        
        setAssociacoes(prev => ({
            ...prev,
            [grupoSimulado.id]: membrosVinculados
        }));

        fecharFormulario();
        setLoading(false);
        return;
      }

      // --- MODO PRODUÇÃO ---
      let grupoId: number;

      if (grupoEditando) {
        const { data, error } = await supabase!
          .from('grupos')
          .update(payload)
          .eq('id', grupoEditando.id)
          .eq('usuario_id', session.user.id)
          .select()
          .single();

        if (error) throw error;
        onGrupoAtualizado(data);
        grupoId = data.id;

      } else {
        const { data, error } = await supabase!
          .from('grupos')
          .insert({
            ...payload,
            usuario_id: session.user.id,
            ativo: true
          })
          .select()
          .single();

        if (error) throw error;
        onGrupoAdicionado(data);
        grupoId = data.id;
      }

      // Atualizar Vínculos (Diff)
      const { data: currentLinks, error: fetchError } = await supabase!
          .from('grupos_membros')
          .select('membro_id')
          .eq('grupo_id', grupoId);
      
      if (fetchError) throw fetchError;
      
      const currentIds = currentLinks ? currentLinks.map(r => r.membro_id) : [];

      const toInsert = membrosVinculados.filter(id => !currentIds.includes(id));
      const toDelete = currentIds.filter(id => !membrosVinculados.includes(id));

      if (toDelete.length > 0) {
        const { error: deleteError } = await supabase!
          .from('grupos_membros')
          .delete()
          .eq('grupo_id', grupoId)
          .in('membro_id', toDelete);
        
        if (deleteError) {
             console.error('Erro ao remover membros do grupo:', deleteError);
             throw deleteError;
        }
      }

      if (toInsert.length > 0) {
        const inserts = toInsert.map(mId => ({
          grupo_id: grupoId,
          membro_id: mId
        }));
        
        const { error: insertError } = await supabase!
          .from('grupos_membros')
          .insert(inserts);
          
        if (insertError) throw insertError;
      }

      setAssociacoes(prev => ({
        ...prev,
        [grupoId]: membrosVinculados
      }));

      fecharFormulario();

    } catch (error: any) {
      console.error(error);
      const msg = error instanceof Error 
        ? error.message 
        : (typeof error === 'string' 
            ? error 
            : (error?.message || error?.error_description || JSON.stringify(error)));
      setErro(msg || 'Erro ao salvar grupo');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestExclusao = async (id: number) => {
    const grupo = grupos.find(g => g.id === id);
    if (!grupo) return;

    setLoading(true);

    try {
        const sessionRes = await supabase?.auth.getSession();
        const session = sessionRes?.data.session;

        let message = '';
        let isSoftDelete = false;

        // VERIFICAÇÃO DE VÍNCULOS E CONSTRUÇÃO DA MENSAGEM
        if (!session) {
            // MODO DEMO: Simula sem vínculos ou assume hard delete
            message = `Deseja realmente excluir o grupo "${grupo.nome}" permanentemente?`;
            isSoftDelete = false;
        } else {
            // MODO PRODUÇÃO
            
            // 1. Verificar contas
            const { count: contasCount, error: contasError } = await supabase!
                .from('contas')
                .select('*', { count: 'exact', head: true })
                .eq('grupo_id', id)
                .eq('usuario_id', session.user.id);

            if (contasError) throw contasError;

            // 2. Verificar transações
            const { count: transacoesCount, error: transacoesError } = await supabase!
                .from('transacoes')
                .select('*', { count: 'exact', head: true })
                .eq('responsavel_grupo_id', id)
                .eq('usuario_id', session.user.id);

            if (transacoesError) throw transacoesError;

            const totalVinculos = (contasCount || 0) + (transacoesCount || 0);

            if (totalVinculos > 0) {
                isSoftDelete = true;
                message = `Deseja realmente desativar o grupo "${grupo.nome}"? Ele possui ${contasCount} conta(s) e ${transacoesCount} transação(ões) vinculada(s) e será apenas ocultado das novas seleções.`;
            } else {
                isSoftDelete = false;
                message = `Deseja realmente excluir o grupo "${grupo.nome}" permanentemente? Ele não possui vínculos e será removido do sistema.`;
            }
        }

        // DEFINIÇÃO DA CALLBACK DE EXECUÇÃO
        const executarExclusao = async () => {
            // O loading será controlado pelo modal (ou pai) enquanto esta Promise roda
            if (!session) {
                onGrupoExcluido(id);
                return;
            }

            if (isSoftDelete) {
                // SOFT DELETE
                const { error } = await supabase!
                    .from('grupos')
                    .update({ ativo: false })
                    .eq('id', id)
                    .eq('usuario_id', session.user.id);

                if (error) throw error;
                
                // Atualizar localmente
                const grupoAtual = grupos.find(g => g.id === id);
                if (grupoAtual) {
                    onGrupoAtualizado({ ...grupoAtual, ativo: false });
                }
            } else {
                // HARD DELETE
                const { error } = await supabase!
                    .from('grupos')
                    .delete()
                    .eq('id', id)
                    .eq('usuario_id', session.user.id);

                if (error) throw error;
                
                onGrupoExcluido(id);
            }
        };

        // Solicita ao pai que abra o modal de confirmação com a mensagem correta
        onRequestDelete(grupo, message, executarExclusao);

    } catch (error: any) {
         const msg = error instanceof Error 
            ? error.message 
            : (typeof error === 'string' 
                ? error 
                : (error?.message || error?.error_description || JSON.stringify(error)));
        alert('Erro ao verificar grupo: ' + msg);
    } finally {
        setLoading(false);
    }
  };

  const renderNomesMembros = (grupoId: number) => {
      const idsVinculados = associacoes[grupoId] || [];
      if (idsVinculados.length === 0) return <span className="text-gray-500 italic">Sem membros</span>;

      const nomes = idsVinculados
        .map(id => membrosAtivos.find(m => m.id === id)?.nome)
        .filter(Boolean) as string[];

      if (nomes.length === 0) return <span className="text-gray-500 italic">Membros inativos</span>;

      const textoCompleto = nomes.join(', ');
      
      if (nomes.length > 3) {
          return (
            <span title={textoCompleto} className="cursor-help border-b border-dotted border-gray-500">
                {nomes.slice(0, 3).join(', ')} e mais {nomes.length - 3}...
            </span>
          );
      }
      return <span>{textoCompleto}</span>;
  };

  return (
    <div className="space-y-4">
      {/* CABEÇALHO */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Grupos Familiares</h3>
        <button
          onClick={abrirFormularioNovo}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 disabled:opacity-50 transition-colors"
        >
          <PlusIcon />
          <span className="text-sm font-medium">Novo Grupo</span>
        </button>
      </div>

      {/* LISTAGEM */}
      <div className="grid grid-cols-1 gap-4">
        {gruposAtivos.length === 0 ? (
           <div className="text-center py-8 text-gray-500 bg-gray-900/30 rounded-lg border border-gray-700">
             <p>Nenhum grupo cadastrado.</p>
             <p className="text-sm mt-1">Crie grupos para dividir despesas (ex: "Casa", "Viagem").</p>
           </div>
        ) : (
          gruposAtivos.map(grupo => (
            <div key={grupo.id} className="bg-gray-700 p-4 rounded-lg border border-gray-600 flex justify-between items-start shadow-sm hover:bg-gray-700/80 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-emerald-400 bg-emerald-400/10 p-1.5 rounded-full"><UsersIcon /></span>
                  <h4 className="font-bold text-white text-lg">{grupo.nome}</h4>
                </div>
                
                <div className="text-sm text-gray-300 ml-9 space-y-1">
                    <p>
                        <span className="text-gray-500 mr-1">Rateio:</span> 
                        {grupo.tipo_rateio === 'proporcional_receita' ? 'Proporcional à Receita' : 'Fixo (Manual)'}
                    </p>
                    <p>
                        <span className="text-gray-500 mr-1">Membros:</span>
                        <span className="text-gray-200">{renderNomesMembros(grupo.id)}</span>
                    </p>
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => abrirFormularioEditar(grupo)}
                  disabled={loading}
                  className="p-2 text-blue-400 hover:bg-gray-600 rounded transition-colors"
                  title="Editar"
                >
                  <Edit2Icon />
                </button>
                <button
                  onClick={() => handleRequestExclusao(grupo.id)}
                  disabled={loading}
                  className="p-2 text-red-400 hover:bg-gray-600 rounded transition-colors"
                  title="Excluir"
                >
                  <Trash2Icon />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FORMULÁRIO MODAL */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-sm border border-gray-600 relative max-h-[90vh] flex flex-col">
            <button 
              onClick={fecharFormulario} 
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
              disabled={loading}
            >
              <XIcon />
            </button>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <h4 className="text-lg font-bold text-white mb-6">
                {grupoEditando ? 'Editar Grupo' : 'Novo Grupo'}
              </h4>
              
              <form onSubmit={handleSalvar} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Nome do Grupo</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    disabled={loading}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ex: Família, Viagem..."
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de Rateio</label>
                  <select
                    value={tipoRateio}
                    onChange={(e) => setTipoRateio(e.target.value as any)}
                    disabled={loading}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="proporcional_receita">Proporcional à Receita</option>
                    <option value="fixo">Fixo (Definido Manualmente)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {tipoRateio === 'proporcional_receita' 
                      ? 'O sistema calcula a divisão baseada no que cada membro ganha.' 
                      : 'Você define a porcentagem de cada membro manualmente.'}
                  </p>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-300 mb-2">Membros do Grupo</label>
                   <div className="bg-gray-900/50 p-3 rounded border border-gray-600 max-h-40 overflow-y-auto space-y-2">
                      {membrosAtivos.length === 0 ? (
                        <p className="text-xs text-gray-500 italic">Nenhum membro ativo disponível.</p>
                      ) : (
                        membrosAtivos.map(membro => (
                          <label key={membro.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-700/50 p-1 rounded">
                            <input 
                              type="checkbox"
                              checked={membrosVinculados.includes(membro.id)}
                              onChange={() => toggleMembro(membro.id)}
                              className="rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-gray-800"
                              disabled={loading}
                            />
                            <span className="text-sm text-gray-300">{membro.nome}</span>
                          </label>
                        ))
                      )}
                   </div>
                   <p className="text-xs text-gray-500 mt-1">Selecione quem participa deste grupo.</p>
                </div>

                {erro && (
                  <div className="p-3 bg-red-500/20 border border-red-500 rounded text-red-200 text-sm">
                    {erro}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={fecharFormulario}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 disabled:opacity-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 disabled:opacity-50 transition-colors font-medium"
                  >
                    {loading ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
