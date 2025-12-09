
// types.ts

export interface Membro {
  id: number;
  usuario_id: string;
  nome: string;
  ativo: boolean;
  criado_em: string;
}

export interface Grupo {
  id: number;
  usuario_id: string;
  nome: string;
  tipo_rateio: 'proporcional_receita' | 'fixo';
  ativo?: boolean; // Adicionado V3.4
  criado_em: string;
}

export interface Conta {
  id: number;
  usuario_id: string;
  nome: string;
  tipo: 'conta_corrente' | 'poupanca' | 'cartao_credito' | 'dinheiro' | 'investimento' | 'outros';
  saldo_inicial: number;
  membro_id: number | null;
  grupo_id: number | null;
  ativo?: boolean;
  criado_em: string;
}

export interface Categoria {
  id: number;
  usuario_id: string;
  nome: string;
  categoria_pai_id: number | null;
  ativo?: boolean; // Mantido opcional para compatibilidade
  criado_em: string;
}

export interface PeriodoFinanceiro {
    id: number;
    usuario_id: string;
    nome: string;
    data_inicio: string; // YYYY-MM-DD
    data_fim: string; // YYYY-MM-DD
    ativo: boolean;
    criado_em: string;
}

export interface Transacao {
  id: number;
  usuario_id: string;
  descricao: string | null;
  valor: number;
  data_transacao: string;
  tipo: 'receita' | 'despesa' | 'transferencia';
  status: 'realizada' | 'prevista';
  periodicidade: 'unica' | 'diaria' | 'semanal' | 'quinzenal' | 'mensal' | 'anual';
  categoria_id: number | null;
  conta_id: number;
  periodo_financeiro_id: number | null;
  responsavel_membro_id: number | null;
  responsavel_grupo_id: number | null;
  conta_destino_id: number | null;
  transferencia_vinculada_id: number | null;
  criado_em: string;

  // Campos de join para conveniência da UI
  categorias?: { nome: string };
  contas?: { nome: string };
}