# Controle Financeiro Familiar com Supabase

Este documento contém as instruções para configurar e entender a estrutura do banco de dados do aplicativo.

---

## 1. Configuração do Banco de Dados (V3.3 - Final)

A estrutura abaixo é a versão final e corrigida, pronta para ser executada.

### ⚠️ AVISO IMPORTANTE: PERDA DE DADOS

A execução do script irá apagar completamente suas tabelas e dados financeiros existentes para criar a nova estrutura.

### Instruções

1.  **Copie o script SQL abaixo**, começando de `--- LIMPEZA GERAL ---` até `--- FIM DO SCRIPT ---`.
2.  Acesse seu projeto no [Supabase](https://supabase.com/).
3.  No menu lateral, navegue até **SQL Editor**.
4.  Clique em **+ New query**.
5.  **Cole o script** que você copiou no editor.
6.  Clique em **RUN**.

Após a execução, a nova estrutura do banco de dados estará pronta.

---

## 2. Script SQL para Execução (V3.3)

```sql
--- LIMPEZA GERAL ---
-- Apaga as tabelas antigas se elas existirem, evitando erros de "tabela já existe".
-- A ordem é importante para remover primeiro as tabelas que possuem Foreign Keys.
DROP TABLE IF EXISTS transacoes CASCADE;
DROP TABLE IF EXISTS metas CASCADE;
DROP TABLE IF EXISTS periodos_financeiros CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS contas CASCADE;
DROP TABLE IF EXISTS grupos_membros CASCADE;
DROP TABLE IF EXISTS grupos CASCADE;
DROP TABLE IF EXISTS membros CASCADE;


--- CRIAÇÃO DAS TABELAS ---

-- Tabela de Membros da Família
CREATE TABLE membros (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE membros IS 'Armazena os membros da família vinculados a um usuário autenticado.';

-- Tabela de Grupos
CREATE TABLE grupos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  tipo_rateio VARCHAR(30) DEFAULT 'proporcional_receita' NOT NULL 
    CHECK (tipo_rateio IN ('proporcional_receita', 'fixo')),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE grupos IS 'Grupos de membros para despesas compartilhadas (ex: Família, Viagem).';

-- Tabela de Associação Membros-Grupos (N:N)
CREATE TABLE grupos_membros (
  grupo_id BIGINT REFERENCES grupos(id) ON DELETE CASCADE NOT NULL,
  membro_id BIGINT REFERENCES membros(id) ON DELETE CASCADE NOT NULL,
  percentual_participacao NUMERIC(5, 2) CHECK (percentual_participacao >= 0 AND percentual_participacao <= 100),
  PRIMARY KEY (grupo_id, membro_id)
);
COMMENT ON TABLE grupos_membros IS 'Tabela de ligação que define quais membros pertencem a quais grupos e sua participação.';

-- Tabela de Contas (Bancárias, Cartões, etc.)
CREATE TABLE contas (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(30) NOT NULL 
    CHECK (tipo IN ('conta_corrente', 'poupanca', 'cartao_credito', 'dinheiro', 'investimento', 'outros')),
  saldo_inicial NUMERIC(15, 2) DEFAULT 0.00,
  membro_id BIGINT REFERENCES membros(id) ON DELETE SET NULL,
  grupo_id BIGINT REFERENCES grupos(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_conta_owner CHECK ((membro_id IS NOT NULL AND grupo_id IS NULL) OR (membro_id IS NULL AND grupo_id IS NOT NULL))
);
COMMENT ON TABLE contas IS 'Contas bancárias, cartões, etc. Uma conta pertence a UM membro OU a UM grupo.';

-- Tabela de Categorias (com Hierarquia)
CREATE TABLE categorias (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  categoria_pai_id BIGINT REFERENCES categorias(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE categorias IS 'Categorias e subcategorias para as transações.';

-- Tabela de Períodos Financeiros
CREATE TABLE periodos_financeiros (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  ativo BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE periodos_financeiros IS 'Períodos financeiros customizados (ex: 15/Nov a 14/Dez).';

-- Tabela de Metas de Gastos
CREATE TABLE metas (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  -- CORRIGIDO V3.2: categoria_id pode ser NULL para metas gerais (sem categoria específica)
  categoria_id BIGINT REFERENCES categorias(id) ON DELETE CASCADE,
  periodo_id BIGINT REFERENCES periodos_financeiros(id) ON DELETE CASCADE NOT NULL,
  valor_limite NUMERIC(15, 2) NOT NULL,
  membro_id BIGINT REFERENCES membros(id) ON DELETE CASCADE,
  grupo_id BIGINT REFERENCES grupos(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_meta_owner CHECK ((membro_id IS NOT NULL AND grupo_id IS NULL) OR (membro_id IS NULL AND grupo_id IS NOT NULL))
);
COMMENT ON TABLE metas IS 'Metas de gastos para membros ou grupos, por categoria ou geral.';

-- Tabela Principal de Transações
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
  -- CORRIGIDO V3.1: Adicionado campo periodicidade
  periodicidade VARCHAR(20) DEFAULT 'unica' NOT NULL
    CHECK (periodicidade IN ('unica', 'diaria', 'semanal', 'quinzenal', 'mensal', 'anual')),
  categoria_id BIGINT REFERENCES categorias(id) ON DELETE SET NULL,
  conta_id BIGINT REFERENCES contas(id) ON DELETE CASCADE NOT NULL,
  periodo_financeiro_id BIGINT REFERENCES periodos_financeiros(id) ON DELETE SET NULL,
  -- Responsável pode ser um membro ou um grupo
  responsavel_membro_id BIGINT REFERENCES membros(id) ON DELETE SET NULL,
  responsavel_grupo_id BIGINT REFERENCES grupos(id) ON DELETE SET NULL,
  -- Campos para transferência
  conta_destino_id BIGINT REFERENCES contas(id) ON DELETE SET NULL,
  transferencia_vinculada_id BIGINT REFERENCES transacoes(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE transacoes IS 'Registra todas as movimentações financeiras.';


--- ÍNDICES PARA PERFORMANCE ---
CREATE INDEX idx_transacoes_usuario_data ON transacoes(usuario_id, data_transacao DESC);
CREATE INDEX idx_contas_usuario ON contas(usuario_id);
CREATE INDEX idx_categorias_usuario ON categorias(usuario_id);
-- CORRIGIDO V3.1: Garante que apenas um período pode estar ativo por usuário
CREATE UNIQUE INDEX idx_periodo_ativo_unico ON periodos_financeiros(usuario_id) WHERE ativo = true;


--- ROW LEVEL SECURITY (RLS) ---
-- Habilita RLS em todas as tabelas
ALTER TABLE membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodos_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Usuários podem gerenciar seus próprios dados" ON membros FOR ALL USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários podem gerenciar seus próprios dados" ON grupos FOR ALL USING (auth.uid() = usuario_id);
-- CORRIGIDO V3.1: Política de RLS segura
CREATE POLICY "Usuários podem visualizar seus grupos_membros" ON grupos_membros FOR SELECT USING (grupo_id IN (SELECT id FROM grupos WHERE usuario_id = auth.uid()));
CREATE POLICY "Usuários podem inserir em seus grupos_membros" ON grupos_membros FOR INSERT WITH CHECK (grupo_id IN (SELECT id FROM grupos WHERE usuario_id = auth.uid()));
CREATE POLICY "Usuários podem gerenciar seus próprios dados" ON contas FOR ALL USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários podem gerenciar seus próprios dados" ON categorias FOR ALL USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários podem gerenciar seus próprios dados" ON periodos_financeiros FOR ALL USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários podem gerenciar seus próprios dados" ON metas FOR ALL USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários podem gerenciar seus próprios dados" ON transacoes FOR ALL USING (auth.uid() = usuario_id);


--- DADOS DE EXEMPLO (OPCIONAL) ---
/*
-- CORRIGIDO V3.1: Bloco para inserir dados de exemplo buscando o ID do usuário automaticamente.
-- Para usar, descomente este bloco (remova o /* e o */) e execute APÓS a criação das tabelas.
DO $$
DECLARE
    v_usuario_id UUID;
BEGIN
    -- Pega o UUID do primeiro usuário da tabela de autenticação (ajuste se necessário)
    SELECT id INTO v_usuario_id FROM auth.users LIMIT 1;

    -- Se não encontrar usuário, encerra
    IF v_usuario_id IS NULL THEN
        RAISE NOTICE 'Nenhum usuário encontrado em auth.users. Dados de exemplo não inseridos.';
        RETURN;
    END IF;

    -- Membros
    INSERT INTO membros (usuario_id, nome) VALUES (v_usuario_id, 'Sid'), (v_usuario_id, 'Tati');
    -- Grupos
    INSERT INTO grupos (usuario_id, nome) VALUES (v_usuario_id, 'Família');
    -- Contas
    INSERT INTO contas (usuario_id, nome, tipo, saldo_inicial, membro_id) VALUES (v_usuario_id, 'Conta BB do Sid', 'conta_corrente', 1500.00, (SELECT id FROM membros WHERE nome = 'Sid'));
    INSERT INTO contas (usuario_id, nome, tipo, saldo_inicial, grupo_id) VALUES (v_usuario_id, 'Cartão Família', 'cartao_credito', 0.00, (SELECT id FROM grupos WHERE nome = 'Família'));
    -- Categorias
    INSERT INTO categorias (usuario_id, nome) VALUES (v_usuario_id, 'Moradia'), (v_usuario_id, 'Alimentação');
    INSERT INTO categorias (usuario_id, nome, categoria_pai_id) VALUES (v_usuario_id, 'Aluguel', (SELECT id FROM categorias WHERE nome = 'Moradia')), (v_usuario_id, 'Supermercado', (SELECT id FROM categorias WHERE nome = 'Alimentação'));
    -- Período Financeiro
    INSERT INTO periodos_financeiros (usuario_id, nome, data_inicio, data_fim, ativo) VALUES (v_usuario_id, 'Dezembro 2025', '2025-12-01', '2025-12-31', true);
    -- Metas
    INSERT INTO metas (usuario_id, categoria_id, periodo_id, valor_limite, grupo_id) VALUES (v_usuario_id, (SELECT id FROM categorias WHERE nome = 'Alimentação'), (SELECT id FROM periodos_financeiros WHERE nome = 'Dezembro 2025'), 1200.00, (SELECT id FROM grupos WHERE nome = 'Família'));
    -- Meta geral (sem categoria) - V3.2
    INSERT INTO metas (usuario_id, categoria_id, periodo_id, valor_limite, grupo_id) VALUES (v_usuario_id, NULL, (SELECT id FROM periodos_financeiros WHERE nome = 'Dezembro 2025'), 5000.00, (SELECT id FROM grupos WHERE nome = 'Família'));
END $$;
*/

--- FIM DO SCRIPT ---
```

---

## 3. Documentação da Estrutura

### Diagrama de Relacionamentos (ERD)

```
(1) auth.users --< (N) membros, grupos, contas, categorias, etc.

(1) membros <--> (N) grupos_membros <--> (1) grupos

(1) contas  --> (1) membro OU (1) grupo
(1) metas   --> (1) membro OU (1) grupo

(1) categorias <-- (N) subcategorias (auto-relacionamento)

(1) periodos_financeiros --< (N) metas
(1) periodos_financeiros --< (N) transacoes

(1) transacoes --> (1) conta (origem)
(1) transacoes --> (1) conta (destino, opcional)
(1) transacoes --> (1) categoria (opcional)
(1) transacoes --> (1) membro (responsável, opcional)
(1) transacoes --> (1) grupo (responsável, opcional)
```

### Descrição das Tabelas

-   **`membros`**: Armazena os membros da família.
-   **`grupos`**: Define grupos (ex: "Família") para despesas compartilhadas.
-   **`grupos_membros`**: Liga membros a grupos.
-   **`contas`**: Contas bancárias, cartões, etc. Pertence a **um** membro ou **um** grupo.
-   **`categorias`**: Categorias ("Alimentação") e subcategorias ("Supermercado").
-   **`periodos_financeiros`**: Períodos customizados ("15/Nov a 14/Dez").
-   **`metas`**: Limites de gastos. Pode ser para uma categoria específica ou uma meta geral (deixando `categoria_id` como `NULL`).
-   **`transacoes`**: O coração do sistema, registrando cada receita e despesa com todos os detalhes necessários.

---

## 4. Próximos Passos (Front-end)

Após executar o script SQL, a aplicação React já deve ser compatível com a nova estrutura. O próximo passo será criar as interfaces para gerenciar os cadastros auxiliares (membros, grupos, contas, etc.).
