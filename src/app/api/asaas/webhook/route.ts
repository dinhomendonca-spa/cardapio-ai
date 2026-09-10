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
export const dynamic = "force-dynamic";

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
};

type AssinaturaAtual = {
  status: string;
  inicio_periodo: string | null;
  fim_periodo: string | null;
};

const EVENTOS_PAGOS = new Set([
  "PAYMENT_RECEIVED",
  "PAYMENT_CONFIRMED",
]);

const EVENTOS_BLOQUEIO = new Set([
  "PAYMENT_OVERDUE",
]);

const EVENTOS_CANCELAMENTO = new Set([
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

function adicionarUmMes(
  dataInicial: Date
) {
  const ano =
    dataInicial.getUTCFullYear();

  const mes =
    dataInicial.getUTCMonth();

  const dia =
    dataInicial.getUTCDate();

  const ultimoDiaDoProximoMes =
    new Date(
      Date.UTC(
        ano,
        mes + 2,
        0
      )
    ).getUTCDate();

  const diaFinal =
    Math.min(
      dia,
      ultimoDiaDoProximoMes
    );

  return new Date(
    Date.UTC(
      ano,
      mes + 1,
      diaFinal,
      dataInicial.getUTCHours(),
      dataInicial.getUTCMinutes(),
      dataInicial.getUTCSeconds(),
      dataInicial.getUTCMilliseconds()
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
      error: erroRegistro,
    } = await supabase
      .from(
        "pagamentos_assinatura"
      )
      .select(
        "loja_id, status, pago_em"
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
      registro as PagamentoRegistrado;

    const novoStatus =
      pagamento.status ||
      evento.replace(
        "PAYMENT_",
        ""
      );

    const agoraIso =
      new Date().toISOString();

    const {
      error:
        erroAtualizacaoPagamento,
    } = await supabase
      .from(
        "pagamentos_assinatura"
      )
      .update({
        status: novoStatus,
        atualizado_em: agoraIso,
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

    if (
      EVENTOS_PAGOS.has(evento)
    ) {
      if (
        pagamentoRegistrado.pago_em
      ) {
        const {
          error:
            erroDesbloqueioDuplicado,
        } = await supabase
          .from("lojas")
          .update({
            bloqueada_por_assinatura:
              false,
            atualizado_em:
              agoraIso,
          })
          .eq(
            "id",
            pagamentoRegistrado.loja_id
          );

        if (
          erroDesbloqueioDuplicado
        ) {
          throw new Error(
            "Não foi possível desbloquear a loja."
          );
        }

        return NextResponse.json({
          recebido: true,
          duplicado: true,
          lojaDesbloqueada: true,
        });
      }

      const {
        data: assinaturaData,
        error: erroAssinatura,
      } = await supabase
        .from("assinaturas")
        .select(
          "status, inicio_periodo, fim_periodo"
        )
        .eq(
          "loja_id",
          pagamentoRegistrado.loja_id
        )
        .single();

      if (
        erroAssinatura ||
        !assinaturaData
      ) {
        throw new Error(
          "Assinatura não encontrada."
        );
      }

      const assinatura =
        assinaturaData as
          AssinaturaAtual;

      const agora =
        dataPagamento(
          pagamento
        );

      const fimAtual =
        assinatura.fim_periodo
          ? new Date(
              assinatura.fim_periodo
            )
          : null;

      const possuiPeriodoAtivo =
        assinatura.status ===
          "ACTIVE" &&
        fimAtual !== null &&
        fimAtual.getTime() >
          agora.getTime();

      const inicioDoNovoPeriodo =
        possuiPeriodoAtivo
          ? fimAtual
          : agora;

      const fimDoNovoPeriodo =
        adicionarUmMes(
          inicioDoNovoPeriodo
        );

      const {
        error:
          erroAtivacaoAssinatura,
      } = await supabase
        .from("assinaturas")
        .update({
          status: "ACTIVE",
          plano: "Mensal",
          valor_mensal: 59.9,
          inicio_periodo:
            inicioDoNovoPeriodo
              .toISOString(),
          fim_periodo:
            fimDoNovoPeriodo
              .toISOString(),
          tolerancia_ate: null,
          asaas_ultima_cobranca_id:
            pagamento.id,
          proxima_cobranca:
            dataSomente(
              fimDoNovoPeriodo
            ),
          ultimo_pagamento_em:
            agora.toISOString(),
          lembrete_renovacao_em:
            null,
          cancelado_em: null,
          atualizado_em:
            agoraIso,
        })
        .eq(
          "loja_id",
          pagamentoRegistrado.loja_id
        );

      if (
        erroAtivacaoAssinatura
      ) {
        throw new Error(
          "Não foi possível ativar a assinatura."
        );
      }

      const {
        error: erroDesbloqueio,
      } = await supabase
        .from("lojas")
        .update({
          bloqueada_por_assinatura:
            false,
          atualizado_em:
            agoraIso,
        })
        .eq(
          "id",
          pagamentoRegistrado.loja_id
        );

      if (erroDesbloqueio) {
        throw new Error(
          "Não foi possível desbloquear a loja."
        );
      }

      const {
        error: erroPagoEm,
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
        assinaturaAtivada: true,
        lojaDesbloqueada: true,
        fimPeriodo:
          fimDoNovoPeriodo
            .toISOString(),
      });
    }

    if (
      EVENTOS_BLOQUEIO.has(
        evento
      )
    ) {
      const {
        error:
          erroAssinaturaVencida,
      } = await supabase
        .from("assinaturas")
        .update({
          status: "OVERDUE",
          atualizado_em:
            agoraIso,
        })
        .eq(
          "loja_id",
          pagamentoRegistrado.loja_id
        );

      if (
        erroAssinaturaVencida
      ) {
        throw new Error(
          "Não foi possível marcar a assinatura como vencida."
        );
      }

      const {
        error: erroBloqueio,
      } = await supabase
        .from("lojas")
        .update({
          bloqueada_por_assinatura:
            true,
          atualizado_em:
            agoraIso,
        })
        .eq(
          "id",
          pagamentoRegistrado.loja_id
        );

      if (erroBloqueio) {
        throw new Error(
          "Não foi possível bloquear a loja."
        );
      }

      return NextResponse.json({
        recebido: true,
        assinaturaVencida: true,
        lojaBloqueada: true,
      });
    }

    if (
      EVENTOS_CANCELAMENTO.has(
        evento
      )
    ) {
      const {
        error: erroCancelamento,
      } = await supabase
        .from("assinaturas")
        .update({
          status: "CANCELED",
          cancelado_em:
            agoraIso,
          atualizado_em:
            agoraIso,
        })
        .eq(
          "loja_id",
          pagamentoRegistrado.loja_id
        );

      if (erroCancelamento) {
        throw new Error(
          "Não foi possível cancelar a assinatura."
        );
      }

      const {
        error: erroBloqueio,
      } = await supabase
        .from("lojas")
        .update({
          bloqueada_por_assinatura:
            true,
          atualizado_em:
            agoraIso,
        })
        .eq(
          "id",
          pagamentoRegistrado.loja_id
        );

      if (erroBloqueio) {
        throw new Error(
          "Não foi possível bloquear a loja."
        );
      }

      return NextResponse.json({
        recebido: true,
        assinaturaCancelada: true,
        lojaBloqueada: true,
      });
    }

    return NextResponse.json({
      recebido: true,
      eventoProcessado: false,
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