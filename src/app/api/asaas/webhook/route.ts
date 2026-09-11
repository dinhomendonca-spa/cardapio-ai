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
};

type EventoWebhook = {
  event?: string;
  payment?: PagamentoWebhook;
};

type PagamentoRegistrado = {
  loja_id: number;
  status: string;
  pago_em: string | null;

  plano:
    | "mensal"
    | "anual"
    | string;

  meses_creditados: number;

  valor_contratado:
    | number
    | string;
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

    const {
      data: registro,
      error:
        erroRegistro,
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
          valor_contratado
        `
      )
      .eq(
        "asaas_pagamento_id",
        pagamento.id
      )
      .maybeSingle();

    if (erroRegistro) {
      throw new Error(
        "Não foi possível localizar o pagamento."
      );
    }

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
        status: novoStatus,

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
       * O Asaas pode enviar
       * PAYMENT_CONFIRMED e depois
       * PAYMENT_RECEIVED para a
       * mesma cobrança.
       *
       * Não podemos adicionar
       * meses duas vezes.
       */
      if (
        pagamentoRegistrado
          .pago_em
      ) {
        return NextResponse.json({
          recebido: true,
          duplicado: true,
        });
      }

      const assinatura =
        await buscarAssinatura(
          supabase,
          pagamentoRegistrado
            .loja_id
        );

      /*
       * O plano vem do nosso banco,
       * não do valor recebido no
       * webhook.
       *
       * Isso evita que alterações
       * futuras de preço confundam
       * a regra.
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

      /*
       * No plano anual este campo
       * representa o equivalente
       * mensal:
       *
       * 597 / 12 = 49,75
       */
      const valorMensal =
        ehAnual
          ? Number(
              (
                valorContratado /
                12
              ).toFixed(2)
            )
          : valorContratado;

      const agora =
        dataPagamento(
          pagamento
        );

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
       * Se o cliente ainda possui
       * dias pagos, o novo período
       * começa depois deles.
       *
       * Exemplo:
       * ainda tem 10 dias do mensal
       * e compra o anual.
       *
       * Ele não perde os 10 dias.
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
       * MENSAL:
       * próxima cobrança na data
       * de término.
       *
       * ANUAL:
       * nenhuma nova cobrança
       * automática durante o
       * contrato.
       */
      const proximaCobranca =
        ehAnual
          ? null
          : dataSomente(
              fimDoNovoPeriodo
            );

      const agoraIso =
        new Date()
          .toISOString();

      const {
        error:
          erroAtivacaoAssinatura,
      } = await supabase
        .from("assinaturas")
        .update({
          status: "ACTIVE",

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
            agoraIso,
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

      /*
       * Libera a loja.
       */
      const {
        error: erroLoja,
      } = await supabase
        .from("lojas")
        .update({
          ativo: true,

          atualizado_em:
            agoraIso,
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
       * Marca a cobrança como
       * processada.
       *
       * Essa informação também
       * impede crédito duplicado.
       */
      const {
        error:
          erroPagoEm,
      } = await supabase
        .from(
          "pagamentos_assinatura"
        )
        .update({
          pago_em:
            agora.toISOString(),

          atualizado_em:
            agoraIso,
        })
        .eq(
          "asaas_pagamento_id",
          pagamento.id
        );

      if (erroPagoEm) {
        throw new Error(
          "Não foi possível finalizar o pagamento."
        );
      }

      return NextResponse.json({
        recebido: true,

        assinaturaAtivada:
          true,

        plano:
          nomePlano,

        valorContratado,

        mesesCreditados:
          mesesCredito,

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

      const ehUltimaCobrancaDaAssinatura =
        assinatura
          .asaas_ultima_cobranca_id ===
        pagamento.id;

      /*
       * IMPORTANTE:
       *
       * Se existir um período pago
       * ativo por outra cobrança,
       * uma cobrança antiga vencida
       * não pode bloquear a loja.
       *
       * Isso protege principalmente
       * quem comprou o plano anual.
       */
      if (
        possuiAcessoPagoAtivo &&
        !ehUltimaCobrancaDaAssinatura
      ) {
        return NextResponse.json({
          recebido: true,

          ignorado: true,

          motivo:
            "Existe um período pago ativo. A cobrança vencida é anterior à assinatura atual.",
        });
      }

      const {
        error,
      } = await supabase
        .from("assinaturas")
        .update({
          status:
            "OVERDUE",

          atualizado_em:
            agora
              .toISOString(),
        })
        .eq(
          "loja_id",
          pagamentoRegistrado
            .loja_id
        );

      if (error) {
        throw new Error(
          "Não foi possível marcar a assinatura como vencida."
        );
      }

      return NextResponse.json({
        recebido: true,
        assinaturaVencida:
          true,
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

      /*
       * Uma cobrança histórica
       * estornada não deve cancelar
       * uma assinatura mais recente.
       *
       * Exemplo:
       *
       * cliente tinha mensal,
       * depois comprou anual.
       *
       * Um evento antigo do mensal
       * não derruba o anual.
       */
      if (
        assinatura
          .asaas_ultima_cobranca_id &&
        assinatura
          .asaas_ultima_cobranca_id !==
          pagamento.id
      ) {
        return NextResponse.json({
          recebido: true,

          ignorado: true,

          motivo:
            "O evento pertence a uma cobrança anterior e não à assinatura atual.",
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
          ativo: false,

          atualizado_em:
            agora,
        })
        .eq(
          "id",
          pagamentoRegistrado
            .loja_id
        );

      if (erroBloqueio) {
        throw new Error(
          "Não foi possível bloquear a loja."
        );
      }

      return NextResponse.json({
        recebido: true,

        assinaturaCancelada:
          true,
      });
    }

    /*
     * Eventos do Asaas que não
     * alteram o acesso.
     */
    return NextResponse.json({
      recebido: true,
      eventoProcessado:
        false,
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
        recebido: false,

        erro:
          "Não foi possível processar o webhook.",
      },
      {
        status: 500,
      }
    );
  }
}