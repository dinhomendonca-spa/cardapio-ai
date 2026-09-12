import {
  timingSafeEqual,
} from "node:crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getSupabaseAdmin,
} from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export const dynamic =
  "force-dynamic";

type PagamentoWebhook = {
  id?: string;
  status?: string;
  value?: number;
  dueDate?: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  confirmedDate?: string;
  externalReference?: string;
  installment?: string;
  billingType?: string;
  invoiceUrl?: string;
};

type EventoWebhook = {
  id?: string;
  event?: string;
  payment?: PagamentoWebhook;
};

type PagamentoRegistrado = {
  loja_id: number;

  status: string;

  pago_em:
    | string
    | null;

  plano:
    | "mensal"
    | "anual"
    | string;

  meses_creditados: number;

  valor_contratado:
    | number
    | string;

  asaas_parcelamento_id:
    | string
    | null;

  forma_pagamento:
    | string
    | null;
};

type AssinaturaAtual = {
  status: string;

  inicio_periodo:
    | string
    | null;

  fim_periodo:
    | string
    | null;

  asaas_ultima_cobranca_id:
    | string
    | null;
};

const EVENTOS_PAGOS =
  new Set([
    "PAYMENT_RECEIVED",
    "PAYMENT_CONFIRMED",
  ]);

const EVENTOS_BLOQUEIO =
  new Set([
    "PAYMENT_OVERDUE",
  ]);

const EVENTOS_CANCELAMENTO =
  new Set([
    "PAYMENT_REFUNDED",
    "PAYMENT_REFUND_IN_PROGRESS",
    "PAYMENT_CHARGEBACK_REQUESTED",
    "PAYMENT_CHARGEBACK_DISPUTE",
    "PAYMENT_AWAITING_CHARGEBACK_REVERSAL",
    "PAYMENT_DELETED",
  ]);

function tokenValido(
  recebido: string,
  esperado: string
) {
  const bufferRecebido =
    Buffer.from(recebido);

  const bufferEsperado =
    Buffer.from(esperado);

  if (
    bufferRecebido.length !==
    bufferEsperado.length
  ) {
    return false;
  }

  return timingSafeEqual(
    bufferRecebido,
    bufferEsperado
  );
}

function adicionarMeses(
  dataInicial: Date,
  quantidadeMeses: number
) {
  const ano =
    dataInicial.getUTCFullYear();

  const mes =
    dataInicial.getUTCMonth();

  const dia =
    dataInicial.getUTCDate();

  const hora =
    dataInicial.getUTCHours();

  const minuto =
    dataInicial.getUTCMinutes();

  const segundo =
    dataInicial.getUTCSeconds();

  const milissegundo =
    dataInicial.getUTCMilliseconds();

  const primeiroDiaMesDestino =
    new Date(
      Date.UTC(
        ano,
        mes + quantidadeMeses,
        1,
        hora,
        minuto,
        segundo,
        milissegundo
      )
    );

  const anoDestino =
    primeiroDiaMesDestino
      .getUTCFullYear();

  const mesDestino =
    primeiroDiaMesDestino
      .getUTCMonth();

  const ultimoDiaMesDestino =
    new Date(
      Date.UTC(
        anoDestino,
        mesDestino + 1,
        0
      )
    ).getUTCDate();

  const diaDestino =
    Math.min(
      dia,
      ultimoDiaMesDestino
    );

  return new Date(
    Date.UTC(
      anoDestino,
      mesDestino,
      diaDestino,
      hora,
      minuto,
      segundo,
      milissegundo
    )
  );
}

function dataSomente(
  data: Date
) {
  return data
    .toISOString()
    .slice(0, 10);
}

function dataPagamento(
  pagamento: PagamentoWebhook
) {
  const valor =
    pagamento.paymentDate ||
    pagamento.clientPaymentDate ||
    pagamento.confirmedDate;

  if (!valor) {
    return new Date();
  }

  const data =
    new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return new Date();
  }

  return data;
}

function converterNumero(
  valor:
    | number
    | string
    | null
    | undefined,
  padrao: number
) {
  const numero =
    Number(valor);

  if (
    Number.isNaN(numero)
  ) {
    return padrao;
  }

  return numero;
}

async function buscarAssinatura(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  lojaId: number
) {
  const {
    data,
    error,
  } = await supabase
    .from("assinaturas")
    .select(
      `
        status,
        inicio_periodo,
        fim_periodo,
        asaas_ultima_cobranca_id
      `
    )
    .eq(
      "loja_id",
      lojaId
    )
    .single();

  if (
    error ||
    !data
  ) {
    throw new Error(
      "Assinatura não encontrada."
    );
  }

  return data as
    AssinaturaAtual;
}

async function buscarPagamentoPorId(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  pagamentoId: string
) {
  const {
    data,
    error,
  } = await supabase
    .from(
      "pagamentos_assinatura"
    )
    .select(
      `
        loja_id,
        status,
        pago_em,
        plano,
        meses_creditados,
        valor_contratado,
        asaas_parcelamento_id,
        forma_pagamento
      `
    )
    .eq(
      "asaas_pagamento_id",
      pagamentoId
    )
    .maybeSingle();

  if (error) {
    throw new Error(
      "Não foi possível localizar o pagamento."
    );
  }

  return data as
    | PagamentoRegistrado
    | null;
}

async function registrarParcelaDesconhecida(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  pagamento: PagamentoWebhook
) {
  if (
    !pagamento.id ||
    !pagamento.installment
  ) {
    return null;
  }

  /*
   * Caso o Asaas envie um evento de
   * uma parcela antes de termos essa
   * parcela específica no banco,
   * localizamos outra cobrança do
   * mesmo parcelamento e usamos seus
   * dados como referência.
   */

  const {
    data: referencia,
    error: erroReferencia,
  } = await supabase
    .from(
      "pagamentos_assinatura"
    )
    .select(
      `
        loja_id,
        plano,
        meses_creditados,
        valor_contratado,
        forma_pagamento
      `
    )
    .eq(
      "asaas_parcelamento_id",
      pagamento.installment
    )
    .limit(1)
    .maybeSingle();

  if (erroReferencia) {
    throw new Error(
      "Não foi possível identificar o parcelamento."
    );
  }

  if (!referencia) {
    return null;
  }

  const novoRegistro = {
    loja_id:
      Number(
        referencia.loja_id
      ),

    asaas_pagamento_id:
      pagamento.id,

    asaas_parcelamento_id:
      pagamento.installment,

    forma_pagamento:
      referencia
        .forma_pagamento ||
      "cartao",

    status:
      pagamento.status ||
      "PENDING",

    valor:
      Number(
        pagamento.value ??
          0
      ),

    vencimento:
      pagamento.dueDate ??
      null,

    link_pagamento:
      pagamento.invoiceUrl ??
      null,

    pix_copia_cola:
      null,

    plano:
      referencia.plano,

    meses_creditados:
      Number(
        referencia
          .meses_creditados
      ),

    valor_contratado:
      Number(
        referencia
          .valor_contratado
      ),
  };

  const {
    error: erroInsercao,
  } = await supabase
    .from(
      "pagamentos_assinatura"
    )
    .insert(
      novoRegistro
    );

  if (erroInsercao) {
    /*
     * Pode ocorrer se outro webhook
     * registrar a mesma parcela quase
     * simultaneamente.
     *
     * Nesse caso tentamos apenas
     * buscar novamente.
     */

    const existente =
      await buscarPagamentoPorId(
        supabase,
        pagamento.id
      );

    if (existente) {
      return existente;
    }

    throw new Error(
      "Não foi possível registrar a parcela recebida."
    );
  }

  return await buscarPagamentoPorId(
    supabase,
    pagamento.id
  );
}

async function buscarOuRegistrarPagamento(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  pagamento: PagamentoWebhook
) {
  if (!pagamento.id) {
    return null;
  }

  const existente =
    await buscarPagamentoPorId(
      supabase,
      pagamento.id
    );

  if (existente) {
    return existente;
  }

  if (
    pagamento.installment
  ) {
    return await registrarParcelaDesconhecida(
      supabase,
      pagamento
    );
  }

  return null;
}

async function parcelamentoJaCreditado(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  parcelamentoId: string
) {
  const {
    data,
    error,
  } = await supabase
    .from(
      "pagamentos_assinatura"
    )
    .select(
      `
        asaas_pagamento_id,
        pago_em
      `
    )
    .eq(
      "asaas_parcelamento_id",
      parcelamentoId
    )
    .not(
      "pago_em",
      "is",
      null
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      "Não foi possível verificar o crédito do parcelamento."
    );
  }

  return Boolean(
    data?.pago_em
  );
}

async function marcarPagamentoComoPago(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  pagamentoId: string,
  pagoEm: string
) {
  const {
    error,
  } = await supabase
    .from(
      "pagamentos_assinatura"
    )
    .update({
      pago_em:
        pagoEm,

      atualizado_em:
        new Date()
          .toISOString(),
    })
    .eq(
      "asaas_pagamento_id",
      pagamentoId
    );

  if (error) {
    throw new Error(
      "Não foi possível finalizar o pagamento."
    );
  }
}

async function obterParcelamentoDaCobranca(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  pagamentoId:
    | string
    | null
) {
  if (!pagamentoId) {
    return null;
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      "pagamentos_assinatura"
    )
    .select(
      "asaas_parcelamento_id"
    )
    .eq(
      "asaas_pagamento_id",
      pagamentoId
    )
    .maybeSingle();

  if (error) {
    throw new Error(
      "Não foi possível verificar a cobrança atual."
    );
  }

  return (
    data
      ?.asaas_parcelamento_id ??
    null
  ) as
    | string
    | null;
}

async function pertenceACompraAtual(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  assinatura: AssinaturaAtual,
  pagamentoId: string,
  pagamentoRegistrado:
    PagamentoRegistrado
) {
  /*
   * Cobrança avulsa atual.
   */

  if (
    assinatura
      .asaas_ultima_cobranca_id ===
    pagamentoId
  ) {
    return true;
  }

  /*
   * Em um parcelamento, cada parcela
   * possui um payment.id diferente.
   *
   * Por isso comparamos o ID do
   * parcelamento da cobrança recebida
   * com o parcelamento da cobrança
   * atualmente vinculada à assinatura.
   */

  const parcelamentoAtual =
    pagamentoRegistrado
      .asaas_parcelamento_id;

  if (!parcelamentoAtual) {
    return false;
  }

  const parcelamentoDaAssinatura =
    await obterParcelamentoDaCobranca(
      supabase,
      assinatura
        .asaas_ultima_cobranca_id
    );

  return (
    parcelamentoDaAssinatura ===
    parcelamentoAtual
  );
}

export async function POST(
  request: NextRequest
) {
  try {
    const tokenEsperado =
      process.env
        .ASAAS_WEBHOOK_TOKEN;

    const tokenRecebido =
      request.headers.get(
        "asaas-access-token"
      ) ?? "";

    if (
      !tokenEsperado ||
      !tokenRecebido ||
      !tokenValido(
        tokenRecebido,
        tokenEsperado
      )
    ) {
      return NextResponse.json(
        {
          recebido: false,

          erro:
            "Webhook não autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const corpo =
      (await request.json()) as
        EventoWebhook;

    const evento =
      corpo.event ?? "";

    const pagamento =
      corpo.payment;

    if (
      !evento ||
      !pagamento?.id
    ) {
      return NextResponse.json(
        {
          recebido: false,

          erro:
            "Evento inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      getSupabaseAdmin();

    const registro =
      await buscarOuRegistrarPagamento(
        supabase,
        pagamento
      );

    /*
     * Se o pagamento não pertence
     * ao Visite Minha Loja,
     * ignoramos normalmente.
     */

    if (!registro) {
      return NextResponse.json({
        recebido: true,

        ignorado: true,

        motivo:
          "Pagamento não pertence a uma assinatura cadastrada.",
      });
    }

    const pagamentoRegistrado =
      registro as
        PagamentoRegistrado;

    const novoStatus =
      pagamento.status ||
      evento.replace(
        "PAYMENT_",
        ""
      );

    const {
      error:
        erroAtualizacaoPagamento,
    } = await supabase
      .from(
        "pagamentos_assinatura"
      )
      .update({
        status:
          novoStatus,

        asaas_parcelamento_id:
          pagamento.installment ||
          pagamentoRegistrado
            .asaas_parcelamento_id ||
          null,

        atualizado_em:
          new Date()
            .toISOString(),
      })
      .eq(
        "asaas_pagamento_id",
        pagamento.id
      );

    if (
      erroAtualizacaoPagamento
    ) {
      throw new Error(
        "Não foi possível atualizar o pagamento."
      );
    }

    /*
     * ==========================================
     * PAGAMENTO CONFIRMADO
     * ==========================================
     */

    if (
      EVENTOS_PAGOS.has(
        evento
      )
    ) {
      /*
       * Primeiro protegemos contra
       * repetição do mesmo payment.id.
       *
       * O Asaas pode enviar
       * PAYMENT_CONFIRMED e depois
       * PAYMENT_RECEIVED para a mesma
       * cobrança.
       */

      if (
        pagamentoRegistrado
          .pago_em
      ) {
        return NextResponse.json({
          recebido: true,

          duplicado: true,

          motivo:
            "Esta cobrança já havia sido processada.",
        });
      }

      const agora =
        dataPagamento(
          pagamento
        );

      const agoraIso =
        agora.toISOString();

      const ehParcelamentoAnual =
        pagamentoRegistrado
          .plano ===
          "anual" &&
        Boolean(
          pagamentoRegistrado
            .asaas_parcelamento_id
        );

      /*
       * ========================================
       * PROTEÇÃO ESPECIAL DO ANUAL PARCELADO
       * ========================================
       *
       * As 12 parcelas têm IDs diferentes.
       *
       * A primeira confirmação ativa os
       * 12 meses.
       *
       * As confirmações posteriores atualizam
       * suas próprias cobranças, mas NÃO
       * adicionam outros 12 meses.
       */

      if (
        ehParcelamentoAnual &&
        pagamentoRegistrado
          .asaas_parcelamento_id
      ) {
        const jaCreditado =
          await parcelamentoJaCreditado(
            supabase,
            pagamentoRegistrado
              .asaas_parcelamento_id
          );

        if (jaCreditado) {
          await marcarPagamentoComoPago(
            supabase,
            pagamento.id,
            agoraIso
          );

          return NextResponse.json({
            recebido: true,

            parcelaProcessada:
              true,

            assinaturaJaCreditada:
              true,

            asaasParcelamentoId:
              pagamentoRegistrado
                .asaas_parcelamento_id,
          });
        }
      }

      const assinatura =
        await buscarAssinatura(
          supabase,
          pagamentoRegistrado
            .loja_id
        );

      /*
       * A quantidade de meses vem do
       * nosso banco, e não do valor
       * recebido pelo webhook.
       */

      const ehAnual =
        pagamentoRegistrado
          .plano ===
          "anual" ||
        pagamentoRegistrado
          .meses_creditados ===
          12;

      const mesesCredito =
        ehAnual
          ? 12
          : 1;

      const valorPadrao =
        ehAnual
          ? 597
          : 59.9;

      const valorContratado =
        converterNumero(
          pagamentoRegistrado
            .valor_contratado,
          valorPadrao
        );

      const nomePlano =
        ehAnual
          ? "Anual Promocional"
          : "Mensal";

      const valorMensal =
        ehAnual
          ? Number(
              (
                valorContratado /
                12
              ).toFixed(2)
            )
          : valorContratado;

      const fimAtual =
        assinatura.fim_periodo
          ? new Date(
              assinatura
                .fim_periodo
            )
          : null;

      const fimAtualValido =
        fimAtual &&
        !Number.isNaN(
          fimAtual.getTime()
        );

      /*
       * Caso futuramente exista
       * renovação, o cliente não
       * perde dias que já estavam
       * pagos.
       */

      const possuiPeriodoAtivo =
        assinatura.status ===
          "ACTIVE" &&
        fimAtualValido &&
        fimAtual!.getTime() >
          agora.getTime();

      const inicioDoNovoPeriodo =
        possuiPeriodoAtivo
          ? fimAtual!
          : agora;

      const fimDoNovoPeriodo =
        adicionarMeses(
          inicioDoNovoPeriodo,
          mesesCredito
        );

      /*
       * No anual não criamos
       * renovação automática.
       *
       * No mensal mantemos o
       * término como referência da
       * próxima cobrança.
       */

      const proximaCobranca =
        ehAnual
          ? null
          : dataSomente(
              fimDoNovoPeriodo
            );

      const atualizadoEm =
        new Date()
          .toISOString();

      const {
        error:
          erroAtivacaoAssinatura,
      } = await supabase
        .from("assinaturas")
        .update({
          status:
            "ACTIVE",

          plano:
            nomePlano,

          valor_mensal:
            valorMensal,

          inicio_periodo:
            inicioDoNovoPeriodo
              .toISOString(),

          fim_periodo:
            fimDoNovoPeriodo
              .toISOString(),

          tolerancia_ate:
            null,

          /*
           * Mantemos a cobrança que
           * efetivamente ativou a
           * assinatura.
           *
           * Para parcelas seguintes,
           * pertenceACompraAtual()
           * consegue comparar pelo
           * asaas_parcelamento_id.
           */

          asaas_ultima_cobranca_id:
            pagamento.id,

          proxima_cobranca:
            proximaCobranca,

          ultimo_pagamento_em:
            agora.toISOString(),

          lembrete_renovacao_em:
            null,

          cancelado_em:
            null,

          atualizado_em:
            atualizadoEm,
        })
        .eq(
          "loja_id",
          pagamentoRegistrado
            .loja_id
        );

      if (
        erroAtivacaoAssinatura
      ) {
        throw new Error(
          "Não foi possível ativar a assinatura."
        );
      }

      const {
        error: erroLoja,
      } = await supabase
        .from("lojas")
        .update({
          ativo:
            true,

          atualizado_em:
            atualizadoEm,
        })
        .eq(
          "id",
          pagamentoRegistrado
            .loja_id
        );

      if (erroLoja) {
        throw new Error(
          "Não foi possível ativar a loja."
        );
      }

      /*
       * Esta marcação é a trava
       * contra crédito duplicado.
       *
       * No parcelamento anual, depois
       * dela as demais parcelas verão
       * que o parcelamento inteiro já
       * concedeu os 12 meses.
       */

      await marcarPagamentoComoPago(
        supabase,
        pagamento.id,
        agoraIso
      );

      return NextResponse.json({
        recebido:
          true,

        assinaturaAtivada:
          true,

        plano:
          nomePlano,

        valorContratado,

        mesesCreditados:
          mesesCredito,

        asaasParcelamentoId:
          pagamentoRegistrado
            .asaas_parcelamento_id,

        inicioPeriodo:
          inicioDoNovoPeriodo
            .toISOString(),

        fimPeriodo:
          fimDoNovoPeriodo
            .toISOString(),

        proximaCobranca,
      });
    }

    /*
     * ==========================================
     * COBRANÇA VENCIDA
     * ==========================================
     */

    if (
      EVENTOS_BLOQUEIO.has(
        evento
      )
    ) {
      const assinatura =
        await buscarAssinatura(
          supabase,
          pagamentoRegistrado
            .loja_id
        );

      const agora =
        new Date();

      const fimPeriodo =
        assinatura.fim_periodo
          ? new Date(
              assinatura
                .fim_periodo
            )
          : null;

      const fimPeriodoValido =
        fimPeriodo &&
        !Number.isNaN(
          fimPeriodo.getTime()
        );

      const possuiAcessoPagoAtivo =
        assinatura.status ===
          "ACTIVE" &&
        fimPeriodoValido &&
        fimPeriodo!.getTime() >
          agora.getTime();

      const pertenceAtual =
        await pertenceACompraAtual(
          supabase,
          assinatura,
          pagamento.id,
          pagamentoRegistrado
        );

      /*
       * Uma cobrança histórica não
       * pode bloquear uma assinatura
       * posterior.
       */

      if (
        possuiAcessoPagoAtivo &&
        !pertenceAtual
      ) {
        return NextResponse.json({
          recebido:
            true,

          ignorado:
            true,

          motivo:
            "Existe um período pago ativo. A cobrança vencida pertence a uma contratação anterior.",
        });
      }

      const atualizadoEm =
        agora.toISOString();

      const {
        error:
          erroAssinaturaVencida,
      } = await supabase
        .from("assinaturas")
        .update({
          status:
            "OVERDUE",

          atualizado_em:
            atualizadoEm,
        })
        .eq(
          "loja_id",
          pagamentoRegistrado
            .loja_id
        );

      if (
        erroAssinaturaVencida
      ) {
        throw new Error(
          "Não foi possível marcar a assinatura como vencida."
        );
      }

      /*
       * Também bloqueamos a loja
       * enquanto a contratação atual
       * estiver inadimplente.
       */

      const {
        error:
          erroBloqueioLoja,
      } = await supabase
        .from("lojas")
        .update({
          ativo:
            false,

          atualizado_em:
            atualizadoEm,
        })
        .eq(
          "id",
          pagamentoRegistrado
            .loja_id
        );

      if (
        erroBloqueioLoja
      ) {
        throw new Error(
          "Não foi possível bloquear a loja."
        );
      }

      return NextResponse.json({
        recebido:
          true,

        assinaturaVencida:
          true,

        acessoBloqueado:
          true,

        asaasParcelamentoId:
          pagamentoRegistrado
            .asaas_parcelamento_id,
      });
    }

    /*
     * ==========================================
     * ESTORNO / CHARGEBACK / CANCELAMENTO
     * ==========================================
     */

    if (
      EVENTOS_CANCELAMENTO.has(
        evento
      )
    ) {
      const assinatura =
        await buscarAssinatura(
          supabase,
          pagamentoRegistrado
            .loja_id
        );

      const pertenceAtual =
        await pertenceACompraAtual(
          supabase,
          assinatura,
          pagamento.id,
          pagamentoRegistrado
        );

      /*
       * Uma cobrança antiga, mesmo
       * que seja estornada depois,
       * não deve derrubar uma
       * assinatura comprada
       * posteriormente.
       */

      if (
        assinatura
          .asaas_ultima_cobranca_id &&
        !pertenceAtual
      ) {
        return NextResponse.json({
          recebido:
            true,

          ignorado:
            true,

          motivo:
            "O evento pertence a uma contratação anterior e não à assinatura atual.",
        });
      }

      const agora =
        new Date()
          .toISOString();

      const {
        error:
          erroCancelamento,
      } = await supabase
        .from("assinaturas")
        .update({
          status:
            "CANCELED",

          proxima_cobranca:
            null,

          cancelado_em:
            agora,

          atualizado_em:
            agora,
        })
        .eq(
          "loja_id",
          pagamentoRegistrado
            .loja_id
        );

      if (
        erroCancelamento
      ) {
        throw new Error(
          "Não foi possível cancelar a assinatura."
        );
      }

      const {
        error:
          erroBloqueio,
      } = await supabase
        .from("lojas")
        .update({
          ativo:
            false,

          atualizado_em:
            agora,
        })
        .eq(
          "id",
          pagamentoRegistrado
            .loja_id
        );

      if (
        erroBloqueio
      ) {
        throw new Error(
          "Não foi possível bloquear a loja."
        );
      }

      return NextResponse.json({
        recebido:
          true,

        assinaturaCancelada:
          true,

        acessoBloqueado:
          true,

        asaasParcelamentoId:
          pagamentoRegistrado
            .asaas_parcelamento_id,
      });
    }

    /*
     * PAYMENT_CREATED,
     * PAYMENT_UPDATED e demais
     * eventos apenas sincronizam o
     * status da cobrança.
     */

    return NextResponse.json({
      recebido:
        true,

      eventoProcessado:
        false,

      pagamentoId:
        pagamento.id,

      asaasParcelamentoId:
        pagamentoRegistrado
          .asaas_parcelamento_id,
    });
  } catch (error) {
    console.error(
      "Erro no webhook do Asaas:",
      error instanceof Error
        ? error.message
        : error
    );

    return NextResponse.json(
      {
        recebido:
          false,

        erro:
          "Não foi possível processar o webhook.",
      },
      {
        status: 500,
      }
    );
  }
}