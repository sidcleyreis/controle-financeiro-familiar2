
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';
import type { Membro, Categoria, Conta, Grupo } from './types';
import ConfirmationModal from './ConfirmationModal';
import ContasTab from './ContasTab';
import GruposTab from './GruposTab';
import PeriodosTab from './PeriodosTab';

interface ConfiguracoesModalProps {
  isOpen: boolean;
  onClose: () => void;
  session?: Session;
  
  // Membros props
  membros: Membro[];
  onMembroAdicionado: (membro: Membro) => void;
  onMembroAtualizado: (membro: Membro) => void;
  onMembroExcluido: (id: number) => void;
  
  // Categorias props
  categorias: Categoria[];
  onCategoriaAdicionada: (categoria: Categoria) => void;
  onCategoriaAtualizada: (categoria: Categoria) => void;
  onCategoriaExcluida: (id: number) => void;

  // Contas props
  contas: Conta[];
  onContaAdicionada: (conta: Conta) => void;
  onContaAtualizada: (conta: Conta) => void;
  onContaExcluida: (id: number) => void;

  // Grupos props
  grupos?: Grupo[];
  onGrupoAdicionado?: (grupo: Grupo) => void;
  onGrupoAtualizado?: (grupo: Grupo) => void;
  onGrupoExcluido?: (id: number) => void;
}

const PencilIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L15.232 5.232z" /></svg> );
const TrashIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> );

export default function ConfiguracoesModal({
  isOpen,
  onClose,
  session,
  membros,
  onMembroAdicionado,
  onMembroAtualizado,
  onMembroExcluido,
  categorias,
  onCategoriaAdicionada,
  onCategoriaAtualizada,
  onCategoriaExcluida,
  contas,
  onContaAdicionada,
  onContaAtualizada,
  onContaExcluida,
  grupos = [],
  onGrupoAdicionado = () => {},
  onGrupoAtualizado = () => {},
  onGrupoExcluido = () => {},
}: ConfiguracoesModalProps) {
  const [activeTab, setActiveTab] = useState('membros');
  
  // State for Membros Tab
  const [nomeMembro, setNomeMembro] = useState('');
  const [editingMembro, setEditingMembro] = useState<Membro | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [membroToDelete, setMembroToDelete] = useState<Membro | null>(null);

  // State for Categorias Tab
  const [nomeCategoria, setNomeCategoria] = useState('');
  const [categoriaPaiId, setCategoriaPaiId] = useState<string>('');
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [isConfirmDeleteCategoriaOpen, setIsConfirmDeleteCategoriaOpen] = useState(false);
  const [categoriaToDelete, setCategoriaToDelete] = useState<Categoria | null>(null);

  // State for Grupos Tab (Confirmation)
  const [isConfirmDeleteGrupoOpen, setIsConfirmDeleteGrupoOpen] = useState(false);
  const [grupoToDelete, setGrupoToDelete] = useState<Grupo | null>(null);
  const [grupoDeleteMessage, setGrupoDeleteMessage] = useState<string>('');
  const [grupoDeleteAction, setGrupoDeleteAction] = useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state on close
      setActiveTab('membros');
      setNomeMembro('');
      setEditingMembro(null);
      setError(null);
      setLoading(false);
      
      setNomeCategoria('');
      setCategoriaPaiId('');
      setEditingCategoria(null);
      setCategoriaToDelete(null);

      // Reset Grupos
      setGrupoToDelete(null);
      setGrupoDeleteMessage('');
      setGrupoDeleteAction(null);
    }
  }, [isOpen]);

  // Helper to extract error message safely
  const extractError = (err: any) => {
      if (typeof err === 'string') return err;
      if (err instanceof Error) return err.message;
      return err?.message || err?.error_description || JSON.stringify(err);
  };

  // --- Lógica Membros ---
  const handleMembroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeMembro.trim()) {
      setError('O nome do membro não pode ser vazio.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (editingMembro) {
        // Update
        if (session) {
          const { data, error } = await supabase!
            .from('membros')
            .update({ nome: nomeMembro })
            .eq('id', editingMembro.id)
            .select()
            .single();
          if (error) throw error;
          onMembroAtualizado(data);
        } else {
            // Demo mode
            onMembroAtualizado({ ...editingMembro, nome: nomeMembro });
        }
      } else {
        // Insert
        if (session) {
            const { data, error } = await supabase!
            .from('membros')
            .insert({ nome: nomeMembro, usuario_id: session.user.id, ativo: true })
            .select()
            .single();
            if (error) throw error;
            onMembroAdicionado(data);
        } else {
            // Demo mode
            const novoMembro: Membro = { id: Math.random(), nome: nomeMembro, usuario_id: 'demo', ativo: true, criado_em: new Date().toISOString() };
            onMembroAdicionado(novoMembro);
        }
      }
      setNomeMembro('');
      setEditingMembro(null);
    } catch (err: any) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditMembroClick = (membro: Membro) => {
    setEditingMembro(membro);
    setNomeMembro(membro.nome);
  };
  
  const handleCancelEditMembro = () => {
    setEditingMembro(null);
    setNomeMembro('');
    setError(null);
  };
  
  const handleDeleteMembroRequest = (membro: Membro) => {
    setMembroToDelete(membro);
    setIsConfirmDeleteOpen(true);
  }

  const handleDeleteMembroConfirm = async () => {
    if(!membroToDelete) return;
  
    setLoading(true);
    setError(null);
  
    try {
      if(session) {
        // Verificar se há transações vinculadas
        const { data: transacoesVinculadas, error: checkError } = await supabase!
          .from('transacoes')
          .select('id')
          .eq('responsavel_membro_id', membroToDelete.id)
          .limit(1);
  
        if (checkError) throw checkError;
  
        if (transacoesVinculadas && transacoesVinculadas.length > 0) {
          // Tem transações: apenas desativar
          const { error } = await supabase!
            .from('membros')
            .update({ ativo: false })
            .eq('id', membroToDelete.id);
  
          if (error) throw error;
  
          // Atualizar estado local
          onMembroAtualizado({ ...membroToDelete, ativo: false });
          setError('Membro desativado (possui transações vinculadas)');
        } else {
          // Sem transações: excluir fisicamente
          const { error } = await supabase!
            .from('membros')
            .delete()
            .eq('id', membroToDelete.id);
  
          if (error) throw error;
          onMembroExcluido(membroToDelete.id);
        }
      } else {
        // Modo demo: sempre excluir
        onMembroExcluido(membroToDelete.id);
      }
  
      setIsConfirmDeleteOpen(false);
      setMembroToDelete(null);
    } catch (err: any) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };


  // --- Lógica Categorias ---

  const handleCategoriaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeCategoria.trim()) {
      setError('O nome da categoria não pode ser vazio.');
      return;
    }
    setLoading(true);
    setError(null);

    const paiId = categoriaPaiId ? parseInt(categoriaPaiId) : null;

    try {
      if (editingCategoria) {
        // Update
        if (session) {
          const { data, error } = await supabase!
            .from('categorias')
            .update({ nome: nomeCategoria, categoria_pai_id: paiId })
            .eq('id', editingCategoria.id)
            .select()
            .single();
          if (error) throw error;
          onCategoriaAtualizada(data);
        } else {
            // Demo mode
            onCategoriaAtualizada({ ...editingCategoria, nome: nomeCategoria, categoria_pai_id: paiId });
        }
      } else {
        // Insert
        if (session) {
            const { data, error } = await supabase!
            .from('categorias')
            .insert({ nome: nomeCategoria, usuario_id: session.user.id, categoria_pai_id: paiId })
            .select()
            .single();
            if (error) throw error;
            onCategoriaAdicionada(data);
        } else {
            // Demo mode
            const novaCategoria: Categoria = { 
                id: Math.random(), 
                nome: nomeCategoria, 
                usuario_id: 'demo', 
                categoria_pai_id: paiId,
                criado_em: new Date().toISOString(),
            };
            onCategoriaAdicionada(novaCategoria);
        }
      }
      setNomeCategoria('');
      setCategoriaPaiId('');
      setEditingCategoria(null);
    } catch (err: any) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategoriaClick = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setNomeCategoria(categoria.nome);
    setCategoriaPaiId(categoria.categoria_pai_id ? String(categoria.categoria_pai_id) : '');
  };

  const handleCancelEditCategoria = () => {
    setEditingCategoria(null);
    setNomeCategoria('');
    setCategoriaPaiId('');
    setError(null);
  };

  const handleDeleteCategoriaRequest = (categoria: Categoria) => {
      setCategoriaToDelete(categoria);
      setIsConfirmDeleteCategoriaOpen(true);
  }

  const handleDeleteCategoriaConfirm = async () => {
    if(!categoriaToDelete) return;
    setLoading(true);
    setError(null);

    try {
        if (session) {
            const { error } = await supabase!
                .from('categorias')
                .delete()
                .eq('id', categoriaToDelete.id);

            if (error) throw error;
            onCategoriaExcluida(categoriaToDelete.id);
        } else {
            // Demo mode
            onCategoriaExcluida(categoriaToDelete.id);
        }
        setIsConfirmDeleteCategoriaOpen(false);
        setCategoriaToDelete(null);
    } catch (err: any) {
        setError(extractError(err));
    } finally {
        setLoading(false);
    }
  }

  // --- Lógica Grupos (Confirmação) ---

  const handleGrupoDeleteRequest = (grupo: Grupo, message: string, onConfirm: () => Promise<void>) => {
    setGrupoToDelete(grupo);
    setGrupoDeleteMessage(message);
    setGrupoDeleteAction(() => onConfirm);
    setIsConfirmDeleteGrupoOpen(true);
  };

  const handleGrupoDeleteConfirm = async () => {
    if (grupoDeleteAction) {
      setLoading(true); 
      try {
        await grupoDeleteAction();
        setIsConfirmDeleteGrupoOpen(false);
        setGrupoToDelete(null);
        setGrupoDeleteMessage('');
        setGrupoDeleteAction(null);
      } catch (e) {
        console.error("Erro ao executar exclusão do grupo via modal:", e);
      } finally {
        setLoading(false);
      }
    }
  };


  // Renders

  const renderMembrosTab = () => (
    <div>
        <form onSubmit={handleMembroSubmit} className="flex gap-2 mb-4">
            <input
                type="text"
                value={nomeMembro}
                onChange={(e) => setNomeMembro(e.target.value)}
                placeholder={editingMembro ? "Editar nome" : "Novo membro"}
                className="flex-grow bg-gray-800 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary text-white"
                disabled={loading}
                autoFocus
            />
            <button type="submit" className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-emerald-600 disabled:opacity-50" disabled={loading}>
                {loading ? '...' : (editingMembro ? 'Atualizar' : 'Salvar')}
            </button>
            {editingMembro && (
                <button type="button" onClick={handleCancelEditMembro} className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500">
                    Cancelar
                </button>
            )}
        </form>
        {error && activeTab === 'membros' && <p className="text-sm text-brand-secondary text-center mb-4">{error}</p>}
        
        <ul className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {membros.filter(m => m.ativo !== false).map(membro => (
                <li key={membro.id} className="flex justify-between items-center bg-gray-600 p-2 rounded-md">
                    <span className="text-white">{membro.nome}</span>
                    <div className="flex gap-2">
                        <button onClick={() => handleEditMembroClick(membro)} className="text-blue-400 hover:text-blue-300"><PencilIcon /></button>
                        <button onClick={() => handleDeleteMembroRequest(membro)} className="text-red-400 hover:text-red-300"><TrashIcon /></button>
                    </div>
                </li>
            ))}
        </ul>
    </div>
  );

  const renderCategoriasTab = () => {
    const categoriasPai = categorias.filter(c => !c.categoria_pai_id).sort((a,b) => a.nome.localeCompare(b.nome));
    const categoriasPaiOptions = categoriasPai.filter(c => !editingCategoria || c.id !== editingCategoria.id);

    return (
      <div>
          <form onSubmit={handleCategoriaSubmit} className="space-y-3 mb-4">
               <div className="flex gap-2">
                  <input
                      type="text"
                      value={nomeCategoria}
                      onChange={(e) => setNomeCategoria(e.target.value)}
                      placeholder={editingCategoria ? "Editar categoria" : "Nova categoria"}
                      className="flex-grow bg-gray-800 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary text-white"
                      disabled={loading}
                  />
                  <select
                      value={categoriaPaiId}
                      onChange={(e) => setCategoriaPaiId(e.target.value)}
                      className="bg-gray-800 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary text-white max-w-[150px]"
                      disabled={loading}
                  >
                      <option value="">Sem pai</option>
                      {categoriasPaiOptions.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.nome}</option>
                      ))}
                  </select>
               </div>
              <div className="flex justify-end gap-2">
                  {editingCategoria && (
                      <button type="button" onClick={handleCancelEditCategoria} className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500">
                          Cancelar
                      </button>
                  )}
                  <button type="submit" className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-emerald-600 disabled:opacity-50" disabled={loading}>
                      {loading ? '...' : (editingCategoria ? 'Atualizar' : 'Salvar')}
                  </button>
              </div>
          </form>
          {error && activeTab === 'categorias' && <p className="text-sm text-brand-secondary text-center mb-4">{error}</p>}

          <ul className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {categoriasPai.map(pai => (
                <React.Fragment key={pai.id}>
                    <li className="flex justify-between items-center bg-gray-600 p-2 rounded-md">
                        <span className="text-white font-semibold">{pai.nome}</span>
                        <div className="flex gap-2">
                            <button onClick={() => handleEditCategoriaClick(pai)} className="text-blue-400 hover:text-blue-300"><PencilIcon /></button>
                            <button onClick={() => handleDeleteCategoriaRequest(pai)} className="text-red-400 hover:text-red-300"><TrashIcon /></button>
                        </div>
                    </li>
                    {categorias.filter(c => c.categoria_pai_id === pai.id).sort((a,b) => a.nome.localeCompare(b.nome)).map(filho => (
                         <li key={filho.id} className="flex justify-between items-center bg-gray-600/50 p-2 rounded-md ml-6 border-l-2 border-gray-500">
                            <span className="text-gray-300 flex items-center text-sm"><span className="mr-2 text-gray-500">↳</span> {filho.nome}</span>
                            <div className="flex gap-2">
                                <button onClick={() => handleEditCategoriaClick(filho)} className="text-blue-400 hover:text-blue-300"><PencilIcon /></button>
                                <button onClick={() => handleDeleteCategoriaRequest(filho)} className="text-red-400 hover:text-red-300"><TrashIcon /></button>
                            </div>
                        </li>
                    ))}
                </React.Fragment>
            ))}
            {categorias.length === 0 && <p className="text-gray-400 text-center py-4">Nenhuma categoria cadastrada.</p>}
          </ul>
      </div>
    );
  };

  const renderContasTab = () => (
    <ContasTab
      contas={contas}
      membros={membros}
      grupos={grupos}
      onContaAdicionada={onContaAdicionada}
      onContaAtualizada={onContaAtualizada}
      onContaExcluida={onContaExcluida}
    />
  );

  const renderGruposTab = () => (
    <GruposTab
      grupos={grupos}
      membros={membros}
      onGrupoAdicionado={onGrupoAdicionado}
      onGrupoAtualizado={onGrupoAtualizado}
      onGrupoExcluido={onGrupoExcluido}
      onRequestDelete={handleGrupoDeleteRequest}
    />
  );
  
  const renderPeriodosTab = () => (
    <PeriodosTab />
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 transition-opacity duration-300"
      style={{ animation: 'fadeIn 0.3s ease' }}
      onClick={onClose}
    >
       <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
      <div
        className="bg-gray-700 p-6 rounded-lg shadow-xl w-full max-w-3xl relative"
        style={{ animation: 'slideIn 0.3s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl">&times;</button>
        
        <h2 className="text-xl font-bold mb-6 text-white text-center">Configurações</h2>
        
        <div className="flex border-b border-gray-600 mb-6 overflow-x-auto">
            <button
                className={`flex-1 py-2 px-2 text-center font-medium transition-colors whitespace-nowrap ${activeTab === 'periodos' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('periodos')}
            >
                Períodos
            </button>
            <button
                className={`flex-1 py-2 px-2 text-center font-medium transition-colors whitespace-nowrap ${activeTab === 'membros' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('membros')}
            >
                Membros
            </button>
            <button
                className={`flex-1 py-2 px-2 text-center font-medium transition-colors whitespace-nowrap ${activeTab === 'grupos' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('grupos')}
            >
                Grupos
            </button>
            <button
                className={`flex-1 py-2 px-2 text-center font-medium transition-colors whitespace-nowrap ${activeTab === 'categorias' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('categorias')}
            >
                Categorias
            </button>
            <button
                className={`flex-1 py-2 px-2 text-center font-medium transition-colors whitespace-nowrap ${activeTab === 'contas' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('contas')}
            >
                Contas
            </button>
        </div>

        {activeTab === 'periodos' && renderPeriodosTab()}
        {activeTab === 'membros' && renderMembrosTab()}
        {activeTab === 'grupos' && renderGruposTab()}
        {activeTab === 'categorias' && renderCategoriasTab()}
        {activeTab === 'contas' && renderContasTab()}

      </div>

      {/* Modais de Confirmação */}
      <ConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => { setIsConfirmDeleteOpen(false); setMembroToDelete(null); }}
        onConfirm={handleDeleteMembroConfirm}
        title="Excluir Membro"
        message={`Excluir "${membroToDelete?.nome}"? Se houver transações vinculadas, o membro será apenas desativado.`}
        loading={loading}
      />
      
      <ConfirmationModal
        isOpen={isConfirmDeleteCategoriaOpen}
        onClose={() => { setIsConfirmDeleteCategoriaOpen(false); setCategoriaToDelete(null); }}
        onConfirm={handleDeleteCategoriaConfirm}
        title="Excluir Categoria"
        message={`Excluir "${categoriaToDelete?.nome}"? Transações vinculadas perderão a categoria.`}
        loading={loading}
      />

      <ConfirmationModal
        isOpen={isConfirmDeleteGrupoOpen}
        onClose={() => { setIsConfirmDeleteGrupoOpen(false); setGrupoToDelete(null); setGrupoDeleteMessage(''); setGrupoDeleteAction(null); }}
        onConfirm={handleGrupoDeleteConfirm}
        title="Excluir Grupo"
        message={grupoDeleteMessage || `Deseja realmente excluir o grupo "${grupoToDelete?.nome}"?`}
        loading={loading}
      />
    </div>
  );
}