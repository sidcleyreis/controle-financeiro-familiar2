# Controle Financeiro Familiar

> **"Sua gestão financeira familiar simplificada e inteligente."**

## Sobre o Projeto

O **Controle Financeiro Familiar** é um aplicativo web desenvolvido para facilitar a gestão das finanças de casa. Diferente de planilhas complexas ou apps genéricos, ele foi desenhado pensando na dinâmica familiar, permitindo múltiplos membros, compartilhamento de despesas em grupos e um controle detalhado de receitas e despesas.

O foco principal é a usabilidade e a integridade dos dados, oferecendo funcionalidades avançadas como exclusão lógica (soft delete) para preservar o histórico financeiro.

---

## 🚀 Tecnologias Utilizadas

*   **Frontend**: React 19, TypeScript, Tailwind CSS
*   **Backend & Banco de Dados**: Supabase (PostgreSQL)
*   **Segurança**: Autenticação nativa Supabase e RLS (Row Level Security)
*   **Build Tool**: Vite

---

## ✅ Funcionalidades Atuais

O projeto encontra-se em fase de desenvolvimento (MVP). As funcionalidades já implementadas incluem:

*   **Autenticação**: Sistema seguro de login e cadastro de usuários via e-mail.
*   **Gestão de Membros**: Cadastro de familiares. O sistema impede a exclusão acidental de membros que já possuem transações, apenas desativando-os.
*   **Gestão de Grupos**: Criação de grupos de despesa (ex: "Casa", "Viagem") com seleção múltipla de participantes e lógica de rateio (Proporcional ou Fixo).
*   **Gestão de Categorias**: Organização hierárquica (Categoria Pai > Subcategoria).
*   **Gestão de Contas**: Controle de contas bancárias, cartões e dinheiro físico.
    *   Associação flexível: Uma conta pode pertencer a um Membro OU a um Grupo.
    *   Formatação monetária inteligente (R$).
*   **Interface de Configurações**: Modal unificado e responsivo para gerenciar todos os cadastros auxiliares.
*   **Visualização de Dados**: Dashboard com gráficos e listagem de transações (estrutura base).

---

## 🛠️ Como Rodar o Projeto

### Pré-requisitos
*   Node.js instalado.
*   Uma conta gratuita no [Supabase](https://supabase.com/).

### Passo a Passo

1.  **Clone o repositório**
    ```bash
    git clone https://github.com/SEU_USUARIO/controle-financeiro-familiar.git
    cd controle-financeiro-familiar
    ```

2.  **Instale as dependências**
    ```bash
    npm install
    # ou
    yarn install
    ```

3.  **Configuração do Supabase**
    *   Crie um novo projeto no painel do Supabase.
    *   Vá em `Project Settings` > `API`.
    *   Copie a `Project URL` e a `anon public key`.

4.  **Variáveis de Ambiente**
    *   Crie um arquivo `.env.local` na raiz do projeto.
    *   Adicione suas credenciais:
    ```env
    VITE_SUPABASE_URL="SUA_SUPABASE_URL_AQUI"
    VITE_SUPABASE_ANON_KEY="SUA_SUPABASE_ANON_KEY_AQUI"
    ```
    *(Nota: Se estiver usando o arquivo `supabaseClient.ts` com hardcode para testes, edite-o diretamente).*

5.  **Configuração do Banco de Dados**
    *   Copie o script SQL disponível na seção abaixo ("Script SQL do Banco de Dados").
    *   No painel do Supabase, vá em **SQL Editor** > **New Query**.
    *   Cole o script e clique em **RUN**.
    *   ⚠️ **Atenção**: Isso irá apagar/recriar as tabelas. Use apenas na configuração inicial.

6.  **Inicie o projeto**
    ```bash
    npm run dev
    ```
    Acesse `http://localhost:5173` no seu navegador.

---

## 🗄️ Estrutura do Banco de Dados (V3.4)

O sistema utiliza 8 tabelas principais, todas protegidas por **RLS (Row Level Security)**, garantindo que cada usuário acesse apenas seus próprios dados.

1.  **`membros`**: Pessoas da família.
2.  **`grupos`**: Agrupadores de despesas (ex: Família).
3.  **`grupos_membros`**: Tabela associativa (N:N) ligando membros aos grupos.
4.  **`contas`**: Origens dos recursos (Bancos, Cartões). Pode pertencer a um membro ou grupo.
5.  **`categorias`**: Classificação das transações (Hierárquica).
6.  **`periodos_financeiros`**: Definição de meses/períodos fiscais customizados.
7.  **`metas`**: Orçamentos definidos por categoria/período.
8.  **`transacoes`**: Registro financeiro central.

---

## 🔮 Próximos Passos (Roadmap MVP)

*   [ ] Implementar gestão de Períodos Financeiros (Datas customizadas).
*   [ ] Implementar gestão de Metas de Gastos.
*   [ ] Finalizar lógica complexa de Transações (Recorrência e Parcelamento).
*   [ ] Relatórios avançados no Dashboard.

**Prazo estimado para o MVP:** 31/01/2026.

---

## 📝 Script SQL do Banco de Dados

Copie e execute este script no SQL Editor do Supabase para criar a estrutura completa (Versão 3.4).

```sql
--- LIMPEZA GERAL ---
DROP TABLE IF EXISTS transacoes CASCADE;
DROP TABLE IF EXISTS metas CASCADE;
DROP TABLE IF EXISTS periodos_financeiros CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS contas CASCADE;
DROP TABLE IF EXISTS grupos_membros CASCADE;
DROP TABLE IF EXISTS grupos CASCADE;
DROP TABLE IF EXISTS membros CASCADE;

--- CRIAÇÃO DAS TABELAS ---

-- 1. Membros
CREATE TABLE membros (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Grupos
CREATE TABLE grupos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  tipo_rateio VARCHAR(30) DEFAULT 'proporcional_receita' NOT NULL 
    CHECK (tipo_rateio IN ('proporcional_receita', 'fixo')),
  ativo BOOLEAN DEFAULT TRUE, -- Adicionado na V3.4
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Associação Membros-Grupos
CREATE TABLE grupos_membros (
  grupo_id BIGINT REFERENCES grupos(id) ON DELETE CASCADE NOT NULL,
  membro_id BIGINT REFERENCES membros(id) ON DELETE CASCADE NOT NULL,
  percentual_participacao NUMERIC(5, 2) CHECK (percentual_participacao >= 0 AND percentual_participacao <= 100),
  PRIMARY KEY (grupo_id, membro_id)
);

-- 4. Contas
CREATE TABLE contas (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(30) NOT NULL 
    CHECK (tipo IN ('conta_corrente', 'poupanca', 'cartao_credito', 'dinheiro', 'investimento', 'outros')),
  saldo_inicial NUMERIC(15, 2) DEFAULT 0.00,
  membro_id BIGINT REFERENCES membros(id) ON DELETE SET NULL,
  grupo_id BIGINT REFERENCES grupos(id) ON DELETE SET NULL,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_conta_owner CHECK ((membro_id IS NOT NULL AND grupo_id IS NULL) OR (membro_id IS NULL AND grupo_id IS NOT NULL))
);

-- 5. Categorias
CREATE TABLE categorias (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  categoria_pai_id BIGINT REFERENCES categorias(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Períodos Financeiros
CREATE TABLE periodos_financeiros (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  ativo BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Metas
CREATE TABLE metas (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  categoria_id BIGINT REFERENCES categorias(id) ON DELETE CASCADE,
  periodo_id BIGINT REFERENCES periodos_financeiros(id) ON DELETE CASCADE NOT NULL,
  valor_limite NUMERIC(15, 2) NOT NULL,
  membro_id BIGINT REFERENCES membros(id) ON DELETE CASCADE,
  grupo_id BIGINT REFERENCES grupos(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_meta_owner CHECK ((membro_id IS NOT NULL AND grupo_id IS NULL) OR (membro_id IS NULL AND grupo_id IS NOT NULL))
);

-- 8. Transações
CREATE TABLE transacoes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  descricao TEXT,
  valor NUMERIC(15, 2) NOT NULL,
  data_transacao DATE NOT NULL,
  tipo VARCHAR(20) NOT NULL 
    CHECK (tipo IN ('receita', 'despesa', 'transferencia')),
  status VARCHAR(20) DEFAULT 'realizada' NOT NULL 
    CHECK (status IN ('realizada', 'prevista')),
  periodicidade VARCHAR(20) DEFAULT 'unica' NOT NULL
    CHECK (periodicidade IN ('unica', 'diaria', 'semanal', 'quinzenal', 'mensal', 'anual')),
  categoria_id BIGINT REFERENCES categorias(id) ON DELETE SET NULL,
  conta_id BIGINT REFERENCES contas(id) ON DELETE CASCADE NOT NULL,
  periodo_financeiro_id BIGINT REFERENCES periodos_financeiros(id) ON DELETE SET NULL,
  responsavel_membro_id BIGINT REFERENCES membros(id) ON DELETE SET NULL,
  responsavel_grupo_id BIGINT REFERENCES grupos(id) ON DELETE SET NULL,
  conta_destino_id BIGINT REFERENCES contas(id) ON DELETE SET NULL,
  transferencia_vinculada_id BIGINT REFERENCES transacoes(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

--- ÍNDICES ---
CREATE INDEX idx_transacoes_usuario_data ON transacoes(usuario_id, data_transacao DESC);
CREATE INDEX idx_contas_usuario ON contas(usuario_id);
CREATE UNIQUE INDEX idx_periodo_ativo_unico ON periodos_financeiros(usuario_id) WHERE ativo = true;

--- RLS (SEGURANÇA) ---
ALTER TABLE membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodos_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "RLS Membros" ON membros FOR ALL USING (auth.uid() = usuario_id);
CREATE POLICY "RLS Grupos" ON grupos FOR ALL USING (auth.uid() = usuario_id);
CREATE POLICY "RLS Grupos Membros Select" ON grupos_membros FOR SELECT USING (grupo_id IN (SELECT id FROM grupos WHERE usuario_id = auth.uid()));
CREATE POLICY "RLS Grupos Membros Insert" ON grupos_membros FOR INSERT WITH CHECK (grupo_id IN (SELECT id FROM grupos WHERE usuario_id = auth.uid()));
CREATE POLICY "RLS Grupos Membros Delete" ON grupos_membros FOR DELETE USING (grupo_id IN (SELECT id FROM grupos WHERE usuario_id = auth.uid()));
CREATE POLICY "RLS Contas" ON contas FOR ALL USING (auth.uid() = usuario_id);
CREATE POLICY "RLS Categorias" ON categorias FOR ALL USING (auth.uid() = usuario_id);
CREATE POLICY "RLS Periodos" ON periodos_financeiros FOR ALL USING (auth.uid() = usuario_id);
CREATE POLICY "RLS Metas" ON metas FOR ALL USING (auth.uid() = usuario_id);
CREATE POLICY "RLS Transacoes" ON transacoes FOR ALL USING (auth.uid() = usuario_id);
```
