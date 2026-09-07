import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import crypto from "crypto";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type ItemRecebido = {
  id: number;
  quantidade: number;
};

type CorpoPagamento = {
  loja_id?: number;

  itens?: ItemRecebido[];

  cliente_nome?: string;

  cliente_telefone?: string;

  tipo_entrega?:
    | "entrega"
    | "retirada";

  rua?: string;
  numero?: string;
  bairro?: string;
  complemento?: string;

  token?: string;

  payment_method_id?: string;

  payment_type_id?: string;

  installments?: number;

  payer?: {
    email?: string;

    identification?: {
      type?: string;
      number?: string;
    };
  };
};

export async function POST(
  request: NextRequest
) {
  try {
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL não configurado."
      );
    }

    if (!serviceRoleKey) {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY não configurado."
      );
    }

    const body =
      (
        await request.json()
      ) as CorpoPagamento;

    const lojaId =
      Number(
        body.loja_id
      );

    if (
      !Number.isInteger(
        lojaId
      ) ||
      lojaId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Loja inválida.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Array.isArray(
        body.itens
      ) ||
      body.itens.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Carrinho inválido.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !body.cliente_nome?.trim() ||
      !body.cliente_telefone?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Dados do cliente incompletos.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !body.token ||
      !body.payment_method_id ||
      !body.payment_type_id ||
      !body.payer?.email
    ) {
      return NextResponse.json(
        {
          error:
            "Dados do cartão incompletos.",
        },
        {
          status: 400,
        }
      );
    }

    const installments =
      Number(
        body.installments ??
          1
      );

    if (
      !Number.isInteger(
        installments
      ) ||
      installments <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Número de parcelas inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const supabaseAdmin =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession:
              false,

            autoRefreshToken:
              false,
          },
        }
      );

    /*
     * ======================================
     * LOJA
     * ======================================
     */

    const {
      data:
        loja,

      error:
        erroLoja,
    } =
      await supabaseAdmin
        .from(
          "lojas"
        )
        .select(
          "id,ativo,aceita_cartao,mercado_pago_conectado,taxa_entrega,taxa_entrega_a_combinar"
        )
        .eq(
          "id",
          lojaId
        )
        .maybeSingle();

    if (
      erroLoja
    ) {
      throw erroLoja;
    }

    if (!loja) {
      return NextResponse.json(
        {
          error:
            "Loja não encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      loja.ativo !== true ||
      loja.aceita_cartao !==
        true ||
      loja
        .mercado_pago_conectado !==
        true
    ) {
      return NextResponse.json(
        {
          error:
            "Cartão não disponível nesta loja.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * ======================================
     * MERCADO PAGO DA LOJA
     * ======================================
     */

    const {
      data:
        conta,

      error:
        erroConta,
    } =
      await supabaseAdmin
        .from(
          "mercado_pago_contas"
        )
        .select(
          "access_token"
        )
        .eq(
          "loja_id",
          lojaId
        )
        .maybeSingle();

    if (
      erroConta
    ) {
      throw erroConta;
    }

    if (
      !conta?.access_token
    ) {
      return NextResponse.json(
        {
          error:
            "Mercado Pago não conectado.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * ======================================
     * PRODUTOS
     * ======================================
     */

    const ids =
      body.itens.map(
        (
          item
        ) =>
          Number(
            item.id
          )
      );

    const {
      data:
        produtos,

      error:
        erroProdutos,
    } =
      await supabaseAdmin
        .from(
          "produtos"
        )
        .select(
          "id,loja_id,nome,preco,ativo,estoque,estoque_controlado"
        )
        .eq(
          "loja_id",
          lojaId
        )
        .in(
          "id",
          ids
        );

    if (
      erroProdutos
    ) {
      throw erroProdutos;
    }

    if (
      !produtos ||
      produtos.length !==
        ids.length
    ) {
      return NextResponse.json(
        {
          error:
            "Um ou mais produtos não foram encontrados.",
        },
        {
          status: 400,
        }
      );
    }

    let subtotal =
      0;

    const itensPedido:
      {
        produto_id: number;
        nome: string;
        preco: number;
        quantidade: number;
        subtotal: number;
      }[] =
      [];

    for (
      const item of
        body.itens
    ) {
      const quantidade =
        Number(
          item.quantidade
        );

      if (
        !Number.isInteger(
          quantidade
        ) ||
        quantidade <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "Quantidade inválida.",
          },
          {
            status: 400,
          }
        );
      }

      const produto =
        produtos.find(
          (
            p
          ) =>
            Number(
              p.id
            ) ===
            Number(
              item.id
            )
        );

      if (!produto) {
        return NextResponse.json(
          {
            error:
              "Produto não encontrado.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        produto.ativo !==
        true
      ) {
        return NextResponse.json(
          {
            error:
              `${produto.nome} não está disponível.`,
          },
          {
            status: 400,
          }
        );
      }

      if (
        produto
          .estoque_controlado ===
          true &&
        Number(
          produto.estoque
        ) <
          quantidade
      ) {
        return NextResponse.json(
          {
            error:
              `Estoque insuficiente para ${produto.nome}.`,
          },
          {
            status: 400,
          }
        );
      }

      const preco =
        Number(
          produto.preco
        );

      const subtotalItem =
        Number(
          (
            preco *
            quantidade
          ).toFixed(
            2
          )
        );

      subtotal +=
        subtotalItem;

      itensPedido.push({
        produto_id:
          Number(
            produto.id
          ),

        nome:
          produto.nome,

        preco,

        quantidade,

        subtotal:
          subtotalItem,
      });
    }

    subtotal =
      Number(
        subtotal.toFixed(
          2
        )
      );

    /*
     * ======================================
     * ENTREGA
     * ======================================
     */

    let taxaEntrega =
      0;

    if (
      body.tipo_entrega ===
        "entrega"
    ) {
      if (
        loja
          .taxa_entrega_a_combinar
      ) {
        return NextResponse.json(
          {
            error:
              "A taxa de entrega precisa estar definida antes do pagamento com cartão.",
          },
          {
            status: 400,
          }
        );
      }

      taxaEntrega =
        Number(
          loja.taxa_entrega ??
            0
        );
    }

    const total =
      Number(
        (
          subtotal +
          taxaEntrega
        ).toFixed(
          2
        )
      );

    if (
      total <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Total inválido.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ======================================
     * CRIAR PEDIDO ANTES DA COBRANÇA
     * ======================================
     */

    const {
      data:
        pedido,

      error:
        erroPedido,
    } =
      await supabaseAdmin
        .from(
          "pedidos"
        )
        .insert({
          loja_id:
            lojaId,

          cliente_nome:
            body
              .cliente_nome
              .trim(),

          cliente_telefone:
            body
              .cliente_telefone
              .trim(),

          status:
            "aguardando_pagamento",

          tipo_entrega:
            body.tipo_entrega ??
            "retirada",

          forma_pagamento:
            "cartao",

          subtotal,

          taxa_entrega:
            taxaEntrega,

          total,

          rua:
            body.tipo_entrega ===
            "entrega"
              ? body.rua?.trim() ??
                ""
              : "",

          numero:
            body.tipo_entrega ===
            "entrega"
              ? body.numero?.trim() ??
                ""
              : "",

          bairro:
            body.tipo_entrega ===
            "entrega"
              ? body.bairro?.trim() ??
                ""
              : "",

          complemento:
            body.tipo_entrega ===
            "entrega"
              ? body.complemento?.trim() ??
                ""
              : "",

          mercado_pago_status:
            "created",
        })
        .select(
          "id"
        )
        .single();

    if (
      erroPedido
    ) {
      throw erroPedido;
    }

    if (!pedido) {
      throw new Error(
        "Pedido não foi criado."
      );
    }

    /*
     * ======================================
     * ITENS DO PEDIDO
     * ======================================
     */

    const itensComPedido =
      itensPedido.map(
        (
          item
        ) => ({
          pedido_id:
            pedido.id,

          ...item,
        })
      );

    const {
      error:
        erroItens,
    } =
      await supabaseAdmin
        .from(
          "pedido_itens"
        )
        .insert(
          itensComPedido
        );

    if (
      erroItens
    ) {
      throw erroItens;
    }

    /*
     * ======================================
     * CRIAR ORDER NO MERCADO PAGO
     * ======================================
     */

    const idempotencyKey =
      crypto.randomUUID();

    const referencia =
      `pedido-${pedido.id}`;

    const payload = {
      type:
        "online",

      processing_mode:
        "automatic",

      total_amount:
        total.toFixed(
          2
        ),

      external_reference:
        referencia,

      payer: {
        email:
          body.payer.email,

        ...(body.payer
          .identification
          ?.type &&
        body.payer
          .identification
          ?.number
          ? {
              identification:
                {
                  type:
                    body
                      .payer
                      .identification
                      .type,

                  number:
                    body
                      .payer
                      .identification
                      .number,
                },
            }
          : {}),
      },

      transactions: {
        payments: [
          {
            amount:
              total.toFixed(
                2
              ),

            payment_method:
              {
                id:
                  body.payment_method_id,

                type:
                  body.payment_type_id,

                token:
                  body.token,

                installments,
              },
          },
        ],
      },
    };

    const resposta =
      await fetch(
        "https://api.mercadopago.com/v1/orders",
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${conta.access_token}`,

            "Content-Type":
              "application/json",

            "X-Idempotency-Key":
              idempotencyKey,
          },

          body:
            JSON.stringify(
              payload
            ),

          cache:
            "no-store",
        }
      );

    const dados =
      await resposta.json();

    if (
      !resposta.ok
    ) {
      console.error(
        "Mercado Pago recusou Order:",
        dados
      );

      await supabaseAdmin
        .from(
          "pedidos"
        )
        .update({
          status:
            "pagamento_recusado",

          mercado_pago_status:
            "failed",

          mercado_pago_status_detail:
            dados?.message ??
            "Erro Mercado Pago",
        })
        .eq(
          "id",
          pedido.id
        );

      return NextResponse.json(
        {
          error:
            dados?.message ||
            "Não foi possível processar o cartão.",

          pedidoId:
            pedido.id,
        },
        {
          status:
            resposta.status,
        }
      );
    }

    const pagamento =
      dados
        ?.transactions
        ?.payments
        ?.[0];

    const status =
      pagamento?.status ??
      dados?.status ??
      null;

    const statusDetail =
      pagamento
        ?.status_detail ??
      dados
        ?.status_detail ??
      null;

    const orderId =
      dados?.id ??
      null;

    /*
     * ======================================
     * ATUALIZAR PEDIDO
     * ======================================
     */

    const aprovado =
      status ===
        "processed";

    await supabaseAdmin
      .from(
        "pedidos"
      )
      .update({
        mercado_pago_order_id:
          orderId,

        mercado_pago_status:
          status,

        mercado_pago_status_detail:
          statusDetail,

        status:
          aprovado
            ? "novo"
            : "aguardando_pagamento",

        pago_em:
          aprovado
            ? new Date()
                .toISOString()
            : null,
      })
      .eq(
        "id",
        pedido.id
      );

    return NextResponse.json(
      {
        success:
          aprovado,

        pedidoId:
          Number(
            pedido.id
          ),

        orderId,

        status,

        statusDetail,

        total,
      },
      {
        status: 200,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "Erro ao processar pagamento:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível processar o pagamento.",
      },
      {
        status: 500,
      }
    );
  }
}