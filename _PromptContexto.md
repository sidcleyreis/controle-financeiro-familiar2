import React from 'react';

const PROMPT_TEXT = `
📋 PROMPT PARA SALVAR CONTEXTO DO PROJETO
Cole este prompt no final de cada sessão:

TAREFA: Atualizar o contexto completo do projeto "Controle Financeiro Familiar" com o progresso da sessão atual.

INSTRUÇÕES:

Analise os arquivos anexados e atualize o documento de contexto seguindo esta estrutura:

INFORMAÇÕES GERAIS
Nome do projeto
Stack tecnológica
Modos de operação (Produção/Demo)
Status atual das funcionalidades (✅ ✓ 🟡 🔴)
ARQUITETURA DO BANCO (Versão X.X)
Tabelas:

Lista completa de tabelas com campos principais
Tipos de dados relevantes
Relacionamentos importantes
Constraints:

Regras de exclusividade (OU/E)
Campos únicos
Validações do banco
RLS (Row Level Security):

Regras ativas
Filtros obrigatórios
Exclusões:

Estratégia por tabela (soft/hard delete)
Verificações de vínculos
Migrations executadas:

Histórico de alterações no banco
Scripts SQL aplicados
FRONT-END ATUAL
Componentes principais:

Lista de arquivos .tsx com descrição breve
Responsabilidade de cada componente
Fluxo de dados:

MainLayout (estado global)
  ↓
  ├─ Componente A (props)
  ├─ Componente B (props + callbacks)
  └─ Componente C
       ↓
       └─ Subcomponentes
Handlers no MainLayout:

typescript
Copiar

// Entidade A
handleAAdicionado(item)
handleAAtualizado(item)
handleAExcluido(id)

// Entidade B
...
MAPEAMENTOS E CONSTANTES
Tipos/Enums:

Mapeamentos Display ↔ Banco
Constantes importantes
Conversões necessárias
PROBLEMAS RESOLVIDOS RECENTEMENTE
Para cada problema:

Sintoma: O que o usuário reportou
Causa raiz: Diagnóstico técnico
Solução: Como foi corrigido
Arquivos alterados: Lista de arquivos modificados
AJUSTES PENDENTES
Lista de tarefas conhecidas:

[ ] Descrição do ajuste (arquivo.tsx linha X)
[ ] Próxima correção necessária
PRÓXIMA ETAPA
Objetivo da próxima sessão:

Funcionalidade a implementar
Componentes a criar
Integrações necessárias
Preparação:

Migrations SQL necessárias
Tipos TypeScript a adicionar
Handlers a criar no MainLayout
REGRAS DE DESENVOLVIMENTO
Filtros obrigatórios em queries
Padrões de UI (cores, estilos)
Validações necessárias
Feedback visual esperado
CHECKLIST DE PROGRESSO
[x] Componente A ✅
[x] Componente B ✅
[ ] Componente C 🟡 (ajuste pendente)
[ ] Componente D 🔴 (próximo)
IMPORTANTE:

Seja objetivo: Evite repetir informações óbvias
Destaque mudanças: Marque claramente o que foi alterado nesta sessão
Mantenha histórico: Não apague problemas resolvidos, mova para seção "Resolvidos"
Atualize status: Mude ícones de progresso (🔴 → 🟡 → ✅)
Liste arquivos modificados: Facilita restaurar contexto na próxima sessão
FORMATO DE SAÍDA:

Gere um documento markdown completo e estruturado que eu possa:

Copiar e colar no início da próxima sessão
Usar como referência durante desenvolvimento
Compartilhar com outros desenvolvedores (se necessário)
🎯 COMO USAR ESTE PROMPT
No final de cada sessão:

Anexe os arquivos modificados (ou cole o código se preferir)
Cole este prompt
Adicione observações específicas:
   Observações desta sessão:
   - Implementamos ContasTab completo
   - Corrigimos mapeamento de tipos (dinheiro → Carteira)
   - Migration V3.4 executada (campo ativo em contas e grupos)
   - Próxima sessão: Cadastro de Grupos
Aguarde o contexto atualizado
Salve em arquivo (ex: CONTEXTO_PROJETO_2025-11-20.md)
`;

export default function PromptContexto() {
  return (
    <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', padding: '20px' }}>
      {PROMPT_TEXT}
    </div>
  );
}
