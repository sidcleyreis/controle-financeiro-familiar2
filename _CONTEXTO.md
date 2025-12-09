CONTEXTO ATUALIZADO DO PROJETO
03/12/2025

INFORMAÇÕES GERAIS

Nome: Controle Financeiro Familiar
Stack: React + TypeScript + Supabase (PostgreSQL)
Modo: Produção (com login) + Demo (sem login)
Status atual:
Membros ✅
Categorias ✅
Contas ✅ (CRUD completo, mapeamento de tipos, integração com Grupos/Membros, soft delete, formatação monetária, layout ajustado)
Grupos ✅ (CRUD completo, soft delete, multi-select, exibição de membros, mensagens de exclusão dinâmicas)
Integração Grupos ↔ Contas ✅
README.md ✅ (Atualizado e completo)
Períodos Financeiros 🔴
Metas 🔴
Integração completa 🔴
ARQUITETURA DO BANCO (V3.4)

8 Tabelas:
membros: id, usuario_id, nome, ativo (boolean), criado_em
grupos: id, usuario_id, nome, tipo_rateio, ativo (boolean), criado_em
grupos_membros: grupo_id, membro_id, percentual_participacao, criado_em (PK composta)
contas: id, usuario_id, nome, tipo, saldo_inicial, membro_id (nullable), grupo_id (nullable), ativo (boolean), criado_em (CONSTRAINT chk_conta_owner)
categorias: id, usuario_id, nome, categoria_pai_id (hierarquia), criado_em
periodos_financeiros: id, usuario_id, nome, data_inicio, data_fim, ativo (único), criado_em
metas: id, usuario_id, categoria_id (nullable), periodo_id, valor_limite, membro_id (nullable), grupo_id (nullable), criado_em (CONSTRAINT chk_meta_owner)
transacoes: id, usuario_id, descricao, valor, data_transacao, tipo, status, periodicidade, categoria_id, conta_id, periodo_financeiro_id, responsavel_membro_id (nullable), responsavel_grupo_id (nullable), conta_destino_id (nullable), transferencia_vinculada_id (nullable), criado_em
FRONT-END ATUAL

MainLayout.tsx (navegação Dashboard | Transações)
DashboardView.tsx, TransacoesView.tsx
AddTransactionModal.tsx, ConfirmationModal.tsx
ConfiguracoesModal.tsx (modal principal com abas)
MembrosTab.tsx, CategoriasTab.tsx, ContasTab.tsx, GruposTab.tsx (abas de cadastro)
types.ts (definições TypeScript)
supabaseClient.ts (conexão)
REGRAS E ESTILO

RLS: Ativo (usuário vê só seus dados, filtro usuario_id)
Tema: Dark theme (bg-gray-800, text-gray-100)
CSS: Tailwind CSS
Botões: emerald-500 (salvar/confirmar), red-500 (cancelar/excluir), gray-600 (cancelar)
Validações: Antes de enviar ao banco
Soft delete: Verificar vínculos antes de excluir fisicamente
Modo Demo: Funcionalidades básicas simuladas sem Supabase se session undefined.
CHECKLIST DE PROGRESSO

[x] MainLayout.tsx ✅
[x] DashboardView.tsx ✅
[x] TransacoesView.tsx ✅
[x] AddTransactionModal.tsx ✅
[x] ConfiguracoesModal.tsx (estrutura e layout) ✅
[x] Aba Membros ✅
[x] Aba Categorias ✅
[x] Aba Contas ✅ (CRUD completo, mapeamento de tipos, integração com Grupos/Membros, soft delete, formatação monetária, layout ajustado)
[x] Aba Grupos ✅ (CRUD completo, soft delete, multi-select, exibição de membros, mensagens de exclusão dinâmicas)
[x] Integração Grupos ↔ Contas ✅
[x] README.md ✅
[ ] Períodos Financeiros 🔴
[ ] Metas 🔴
[ ] Integração completa 🔴
PRÓXIMOS PASSOS

Implementar a aba de Períodos Financeiros dentro do ConfiguracoesModal.tsx.
