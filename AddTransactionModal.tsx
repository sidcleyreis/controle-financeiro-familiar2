import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';
import type { Transacao, Membro, Grupo, Conta, Categoria } from './types';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session?: Session;
  onTransacaoAdicionada: (transacao: Transacao) => void;
  onTransacaoAtualizada: (transacao: Transacao) => void;
  transactionToEdit: Transacao | null;
  membros: Membro[];
  grupos: Grupo[];
  contas: Conta[];
  categorias: Categoria[];
  activePeriodoId?: number | null;
}

export default function AddTransactionModal({ 
    isOpen, 
    onClose, 
    session, 
    onTransacaoAdicionada, 
    onTransacaoAtualizada, 
    transactionToEdit,
    membros,
    grupos,
    contas,
    categorias,
    activePeriodoId
}: AddTransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [tipo, setTipo] = useState<'receita' | 'despesa' | 'transferencia'>('despesa');
  const [status, setStatus] = useState<'realizada' | 'prevista'>('realizada');
  const [periodicidade, setPeriodicidade] = useState<'unica' | 'mensal' | 'anual'>('unica');
  const [contaId, setContaId] = useState<string>('');
  const [contaDestinoId, setContaDestinoId] = useState<string>(''); // Novo campo
  const [categoriaId, setCategoriaId] = useState<string>('');
  const [responsavel, setResponsavel] = useState<string>('');

  const isEditing = transactionToEdit !== null;
  const isTransferencia = tipo === 'transferencia';

  const responsaveisOptions = useMemo(() => {
    const mem = membros.map(m => ({ value: `membro-${m.id}`, label: m.nome }));
    const grp = grupos.map(g => ({ value: `grupo-${g.id}`, label: `Grupo: ${g.nome}` }));
    return [...mem, ...grp];
  }, [membros, grupos]);
  
  useEffect(() => {
    if (isOpen) {
        if (isEditing) {
            setDescricao(transactionToEdit.descricao || '');
            setValor(String(transactionToEdit.valor).replace('.', ','));
            setData(new Date(transactionToEdit.data_transacao).toISOString().split('T')[0]);
            setTipo(transactionToEdit.tipo);
            setStatus(transactionToEdit.status);
            setPeriodicidade(transactionToEdit.periodicidade as any);
            setContaId(String(transactionToEdit.conta_id));
            setContaDestinoId(String(transactionToEdit.conta_destino_id || '')); // Carrega destino se houver
            setCategoriaId(String(transactionToEdit.categoria_id || ''));
            if(transactionToEdit.responsavel_membro_id) {
                setResponsavel(`membro-${transactionToEdit.responsavel_membro_id}`);
            } else if (transactionToEdit.responsavel_grupo_id) {
                setResponsavel(`grupo-${transactionToEdit.responsavel_grupo_id}`);
            } else {
                setResponsavel('');
            }
        } else {
            // Reset form for adding new
            setDescricao('');
            setValor('');
            setData(new Date().toISOString().split('T')[0]);
            setTipo('despesa');
            setStatus('realizada');
            setPeriodicidade('unica');
            setContaId('');
            setContaDestinoId('');
            setCategoriaId('');
            setResponsavel('');
            setError(null);
        }
    }
  }, [isOpen, transactionToEdit, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações Básicas
    if (!descricao.trim() && !isTransferencia) {
        setError('Descrição é obrigatória.');
        return;
    }
    if (!valor || !data || !contaId) {
      setError('Valor, data e conta de origem são obrigatórios.');
      return;
    }

    const valorNumerico = parseFloat(valor.replace(',', '.'));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
        setError('O valor inserido deve ser um número positivo.');
        return;
    }

    // Validação específica de Transferência
    if (isTransferencia) {
        if (!contaDestinoId) {
            setError('Selecione a conta de destino para a transferência.');
            return;
        }
        if (contaId === contaDestinoId) {
            setError('A conta de origem e destino não podem ser a mesma.');
            return;
        }
    }

    setLoading(true);

    const [responsavelTipo, responsavelId] = responsavel.split('-');
    const responsavel_membro_id = responsavelTipo === 'membro' ? parseInt(responsavelId) : null;
    const responsavel_grupo_id = responsavelTipo === 'grupo' ? parseInt(responsavelId) : null;

    // Dados base comuns
    const baseTransactionData = {
      valor: valorNumerico,
      data_transacao: data,
      tipo,
      periodicidade, // Transferências podem ser recorrentes também
      periodo_financeiro_id: activePeriodoId,
      criado_em: new Date().toISOString()
    };

    try {
        if (isTransferencia && !isEditing) {
            // --- CRIAÇÃO DE TRANSFERÊNCIA (DUPLA ENTRADA) ---
            const contaOrigem = contas.find(c => c.id === parseInt(contaId));
            const contaDestino = contas.find(c => c.id === parseInt(contaDestinoId));
            const descFinal = descricao.trim() || `Transferência`;

            // 1. Transação de SAÍDA (Origem)
            const transacaoSaida = {
                ...baseTransactionData,
                conta_id: parseInt(contaId),
                conta_destino_id: parseInt(contaDestinoId),
                descricao: `Envio p/ ${contaDestino?.nome}: ${descFinal}`,
                status: 'realizada', // Transferências geralmente são imediatas, mas poderia ser previsto
                categoria_id: null,
                responsavel_membro_id: null, // Geralmente neutro, ou herda do dono da conta
                responsavel_grupo_id: null,
            };

            // 2. Transação de ENTRADA (Destino)
            const transacaoEntrada = {
                ...baseTransactionData,
                conta_id: parseInt(contaDestinoId),
                conta_destino_id: parseInt(contaId), // Aponta de volta para origem (opcional, mas bom para rastro)
                descricao: `Recebido de ${contaOrigem?.nome}: ${descFinal}`,
                status: 'realizada',
                categoria_id: null,
                responsavel_membro_id: null,
                responsavel_grupo_id: null,
            };

            if (session) {
                // Inserir Saída
                const { data: saidaData, error: saidaError } = await supabase!
                    .from('transacoes')
                    .insert({ ...transacaoSaida, usuario_id: session.user.id })
                    .select()
                    .single();
                
                if (saidaError) throw saidaError;

                // Inserir Entrada (vinculando à saída)
                const { data: entradaData, error: entradaError } = await supabase!
                    .from('transacoes')
                    .insert({ 
                        ...transacaoEntrada, 
                        usuario_id: session.user.id,
                        transferencia_vinculada_id: saidaData.id 
                    })
                    .select()
                    .single();

                if (entradaError) {
                    // Se falhar a segunda, idealmente deletaríamos a primeira. Para MVP, alertamos.
                    console.error('Erro ao criar perna de entrada da transferência:', entradaError);
                } else {
                    // Atualizar a saída com o link para a entrada
                    await supabase!
                        .from('transacoes')
                        .update({ transferencia_vinculada_id: entradaData.id })
                        .eq('id', saidaData.id);
                    
                    // Notificar UI (adicionamos as duas para atualizar saldo visualmente)
                    onTransacaoAdicionada(saidaData);
                    onTransacaoAdicionada(entradaData);
                }
            } else {
                // Modo Demo
                const idSaida = Math.random();
                const idEntrada = Math.random();
                
                const tSaida = { ...transacaoSaida, id: idSaida, usuario_id: 'demo', contas: { nome: contaOrigem?.nome }, transferencia_vinculada_id: idEntrada } as any;
                const tEntrada = { ...transacaoEntrada, id: idEntrada, usuario_id: 'demo', contas: { nome: contaDestino?.nome }, transferencia_vinculada_id: idSaida } as any;
                
                onTransacaoAdicionada(tSaida);
                onTransacaoAdicionada(tEntrada);
            }

        } else {
            // --- FLUXO PADRÃO (Receita, Despesa ou Edição Simples) ---
            
            const transactionData = {
                ...baseTransactionData,
                descricao,
                status: isTransferencia ? 'realizada' : status, // Força realizada se for transferência editada por enquanto
                conta_id: parseInt(contaId),
                categoria_id: isTransferencia ? null : (categoriaId ? parseInt(categoriaId) : null),
                responsavel_membro_id: isTransferencia ? null : responsavel_membro_id,
                responsavel_grupo_id: isTransferencia ? null : responsavel_grupo_id,
                conta_destino_id: isTransferencia ? parseInt(contaDestinoId) : null,
            };

            if (isEditing) {
                 if (session) {
                    const { data, error } = await supabase!
                    .from('transacoes')
                    .update(transactionData)
                    .eq('id', transactionToEdit.id)
                    .select()
                    .single();
                    
                    if (error) throw error;
                    onTransacaoAtualizada(data);
                } else {
                    // Demo mode edit
                    const transacaoAtualizada = { 
                        ...transactionToEdit, 
                        ...transactionData, 
                        id: transactionToEdit.id, 
                        contas: {nome: contas.find(c=>c.id === parseInt(contaId))?.nome || ''}, 
                        categorias: {nome: categorias.find(c=>c.id === parseInt(categoriaId))?.nome || ''} 
                    };
                    onTransacaoAtualizada(transacaoAtualizada as Transacao);
                }
            } else {
                // Insert Simples (Receita/Despesa)
                if (session) {
                    const { data, error } = await supabase!
                    .from('transacoes')
                    .insert({ ...transactionData, usuario_id: session.user.id })
                    .select()
                    .single();
    
                    if (error) throw error;
                    onTransacaoAdicionada(data);
                } else {
                    // Demo mode add
                    const novaTransacao: Transacao = {
                        id: Math.random(),
                        ...transactionData,
                        usuario_id: 'demo',
                        criado_em: new Date().toISOString(),
                        contas: {nome: contas.find(c=>c.id === parseInt(contaId))?.nome || ''},
                        categorias: {nome: categorias.find(c=>c.id === parseInt(categoriaId))?.nome || ''},
                        transferencia_vinculada_id: null
                    } as unknown as Transacao;
                    onTransacaoAdicionada(novaTransacao);
                }
            }
        }
        onClose();
    } catch (err: any) {
      console.error('Error in AddTransactionModal:', err);
      // Safe error extraction to prevent [object Object]
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
        className="bg-gray-700 p-6 rounded-lg shadow-xl w-full max-w-md relative"
        style={{ animation: 'slideIn 0.3s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl">&times;</button>
        <h2 className="text-xl font-bold mb-6 text-white text-center">{isEditing ? 'Editar Transação' : 'Adicionar Nova Transação'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <Input 
            label="Descrição" 
            id="descricao" 
            value={descricao} 
            onChange={setDescricao} 
            placeholder={isTransferencia ? "Opcional (gerado auto)" : "Ex: Supermercado do Mês"} 
            autoFocus 
          />
          
          <div className="grid grid-cols-2 gap-4">
             <Input label="Valor (R$)" id="valor" value={valor} onChange={setValor} placeholder="150,00" />
             <Input label="Data" id="data" type="date" value={data} onChange={setData} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select label="Tipo" id="tipo" value={tipo} onChange={setTipo}>
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
              <option value="transferencia">Transferência</option>
            </Select>
            
            {/* Oculta Status se for Transferência */}
            {!isTransferencia ? (
                <Select label="Status" id="status" value={status} onChange={setStatus}>
                    <option value="realizada">Realizada</option>
                    <option value="prevista">Prevista</option>
                </Select>
            ) : (
                 <Select label="Periodicidade" id="periodicidade" value={periodicidade} onChange={setPeriodicidade}>
                  <option value="unica">Única</option>
                  <option value="mensal">Mensal</option>
                  <option value="anual">Anual</option>
               </Select>
            )}
          </div>

           {/* Se for transferência, mostra Origem -> Destino */}
           <div className={isTransferencia ? "p-3 bg-gray-600 rounded border border-gray-500 space-y-3" : ""}>
               <Select 
                    label={isTransferencia ? "Conta Origem (Sai de)" : "Conta"} 
                    id="contaId" 
                    value={contaId} 
                    onChange={setContaId} 
                    placeholder="Selecione a conta..."
                >
                  {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
               </Select>

               {isTransferencia && (
                   <Select 
                        label="Conta Destino (Vai para)" 
                        id="contaDestinoId" 
                        value={contaDestinoId} 
                        onChange={setContaDestinoId} 
                        placeholder="Selecione o destino..."
                    >
                      {contas.filter(c => String(c.id) !== contaId).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                   </Select>
               )}
           </div>
          
           {/* Oculta Categoria e Responsável se for Transferência */}
           {!isTransferencia && (
               <>
                   <Select label="Categoria" id="categoriaId" value={categoriaId} onChange={setCategoriaId} placeholder="Nenhuma">
                       {categorias.filter(c => c.categoria_pai_id === null).map(catPai => (
                           <optgroup key={catPai.id} label={catPai.nome}>
                                <option value={catPai.id}>{catPai.nome} (Geral)</option>
                                {categorias.filter(c => c.categoria_pai_id === catPai.id).map(subCat => (
                                    <option key={subCat.id} value={subCat.id}>&nbsp;&nbsp;&nbsp;{subCat.nome}</option>
                                ))}
                           </optgroup>
                       ))}
                   </Select>

                    <div className="grid grid-cols-2 gap-4">
                       <Select label="Periodicidade" id="periodicidade" value={periodicidade} onChange={setPeriodicidade}>
                          <option value="unica">Única</option>
                          <option value="mensal">Mensal</option>
                          <option value="anual">Anual</option>
                       </Select>
                       <Select label="Responsável" id="responsavel" value={responsavel} onChange={setResponsavel} placeholder="Ninguém">
                          {responsaveisOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                       </Select>
                    </div>
                </>
           )}
         
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full font-bold py-3 px-4 rounded-md transition duration-300 text-white ${isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-brand-primary hover:bg-emerald-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Adicionar Transação')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componentes auxiliares para o formulário
const Input = ({ label, id, value, onChange, ...props }: any) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
    <input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary text-white"
      {...props}
    />
  </div>
);

const Select = ({ label, id, value, onChange, placeholder, children, ...props }: any) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary text-white"
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  </div>
);