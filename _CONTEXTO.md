📄 CONTEXTO ATUALIZADO DO PROJETO
INFORMAÇÕES GERAIS 

Data: 01/12/2025

Nome: Controle Financeiro Familiar
Stack: React + TypeScript + Supabase (PostgreSQL)
Modo: Produção (com login) + Demo (sem login)
Status atual:
Membros ✅
Categorias ✅
Contas ✅
Grupos ✅ (CRUD completo, soft delete, multi-select, exibição de membros, mensagens de exclusão dinâmicas)
Integração Grupos ↔ Contas 🔴 (pendente)
Períodos Financeiros 🔴
Metas 🔴
Integração completa 🔴
ARQUITETURA DO BANCO (V3.4)

8 Tabelas:
membros: id, usuario_id, nome, ativo (boolean), criado_em
grupos: id, usuario_id, nome, tipo_rateio, ativo (boolean), criado_em
grupos_membros: grupo_id, membro_id, criado_em (PK composta)
contas: id, usuario_id, nome, tipo, saldo_inicial, membro_id (nullable), grupo_id (nullable), ativo (boolean), criado_em
categorias: id, usuario_id, nome, categoria_pai_id (nullable), criado_em
periodos_financeiros: id, usuario_id, nome, data_inicio, data_fim, ativo (boolean, único por usuário), criado_em
metas: id, usuario_id, nome, valor_alvo, categoria_id, periodo_financeiro_id, membro_id (nullable), grupo_id (nullable), criado_em
transacoes: id, usuario_id, descricao, valor, data_transacao, tipo, status, periodicidade, categoria_id (nullable), conta_id, periodo_financeiro_id, responsavel_membro_id (nullable), responsavel_grupo_id (nullable), conta_destino_id (nullable), transferencia_vinculada_id (nullable), criado_em
Constraints Críticas:
Contas: membro_id OU grupo_id (exclusivo, um obrigatório)
Metas: membro_id OU grupo_id (exclusivo)
Transações: responsavel_membro_id OU responsavel_grupo_id OU nenhum
Períodos: apenas um ativo = true por usuario_id
Categorias: hierárquicas (categoria_pai_id opcional)
RLS (Row Level Security): ✅ Ativo em todas as tabelas (usuario_id = auth.uid())
Regras de Exclusão:
Membros: Soft delete (ativo = false) se houver transações, senão hard delete
Categorias: Hard delete (banco tem ON DELETE SET NULL)
Contas: Soft delete (ativo = false) se houver transações, senão hard delete
Grupos: Soft delete (ativo = false) se houver contas/transações, senão hard delete (implementado)
Migration V3.4 (executada):
sql
Copiar

<span>    </span><span class="token" style="color:#a04900">ALTER</span><span> </span><span class="token" style="color:#a04900">TABLE</span><span> contas </span><span class="token" style="color:#a04900">ADD</span><span> </span><span class="token" style="color:#a04900">COLUMN</span><span> ativo </span><span class="token" style="color:#a04900">BOOLEAN</span><span> </span><span class="token" style="color:#a04900">NOT</span><span> </span><span class="token" style="color:#755f00">NULL</span><span> </span><span class="token" style="color:#a04900">DEFAULT</span><span> </span><span class="token" style="color:#755f00">true</span><span class="token" style="color:#111b27">;</span><span>
</span><span>    </span><span class="token" style="color:#a04900">ALTER</span><span> </span><span class="token" style="color:#a04900">TABLE</span><span> grupos </span><span class="token" style="color:#a04900">ADD</span><span> </span><span class="token" style="color:#a04900">COLUMN</span><span> ativo </span><span class="token" style="color:#a04900">BOOLEAN</span><span> </span><span class="token" style="color:#a04900">NOT</span><span> </span><span class="token" style="color:#755f00">NULL</span><span> </span><span class="token" style="color:#a04900">DEFAULT</span><span> </span><span class="token" style="color:#755f00">true</span><span class="token" style="color:#111b27">;</span><span>
</span><span>    </span><span class="token" style="color:#a04900">CREATE</span><span> </span><span class="token" style="color:#a04900">INDEX</span><span> idx_contas_ativo </span><span class="token" style="color:#a04900">ON</span><span> contas</span><span class="token" style="color:#111b27">(</span><span>ativo</span><span class="token" style="color:#111b27">)</span><span class="token" style="color:#111b27">;</span><span>
</span><span>    </span><span class="token" style="color:#a04900">CREATE</span><span> </span><span class="token" style="color:#a04900">INDEX</span><span> idx_grupos_ativo </span><span class="token" style="color:#a04900">ON</span><span> grupos</span><span class="token" style="color:#111b27">(</span><span>ativo</span><span class="token" style="color:#111b27">)</span><span class="token" style="color:#111b27">;</span><span>
</span>    
FRONT-END ATUAL

Componentes Principais:
MainLayout.tsx: Gerencia estado global, navegação, handlers CRUD, mock data.
DashboardView.tsx: Resumo financeiro, últimas transações.
TransacoesView.tsx
AddTransactionModal.tsx
ConfiguracoesModal.tsx: Modal pai com abas.
MembrosTab.tsx (implementado dentro de ConfiguracoesModal.tsx)
CategoriasTab.tsx (implementado dentro de ConfiguracoesModal.tsx)
ContasTab.tsx: CRUD completo, mapeamento de tipos.
GruposTab.tsx: CRUD completo, soft delete com verificação de vínculos, multi-select de membros, exibição de membros vinculados, mensagens de exclusão dinâmicas.
ConfirmationModal.tsx: Modal genérico para confirmação de ações.
Tipos TypeScript: Definidos em types.ts.
Conexão Supabase: supabaseClient.ts.
REGRAS DE DESENVOLVIMENTO

Sempre filtrar por usuario_id em queries Supabase: .eq('usuario_id', session.user.id)
Modo demo: Simular CRUD sem banco (arrays locais)
Feedback visual: Loading, erro, sucesso
Dark theme: bg-gray-800, text-gray-100
Botões: emerald-500 (salvar), red-500 (cancelar/excluir)
Validações: Antes de enviar ao banco
Soft delete: Verificar vínculos antes de excluir fisicamente
CHECKLIST DE PROGRESSO

[x] MainLayout.tsx ✅
[x] DashboardView.tsx ✅
[x] TransacoesView.tsx ✅
[x] AddTransactionModal.tsx ✅
[x] ConfiguracoesModal.tsx (estrutura) ✅
[x] Aba Membros ✅
[x] Aba Categorias ✅
[x] ContasTab ✅ (CRUD completo, mapeamento de tipos)
[x] GruposTab ✅ (CRUD completo, soft delete, multi-select, exibição de membros, mensagens de exclusão dinâmicas)
[ ] Integração Grupos ↔ Contas 🔴 (próxima)
[ ] Períodos Financeiros 🔴
[ ] Metas 🔴
[ ] Integração completa 🔴
PRÓXIMOS PASSOS

ContasTab.tsx: Integrar Grupos no select de proprietário (membro OU grupo).