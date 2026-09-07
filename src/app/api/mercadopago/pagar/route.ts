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

  tipo_entrega?:
    | "entrega"
    | "retirada";

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
      !body.token ||
      !body.payment_method_id ||
      !body.payment_type_id ||
      !body.payer?.email
    ) {
      return NextResponse.json(
        {
          error:
            "Dados de pagamento incompletos.",
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

    if (erroLoja) {
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
      !loja.ativo ||
      !loja.aceita_cartao ||
      !loja
        .mercado_pago_conectado
    ) {
      return NextResponse.json(
        {
          error:
            "Cartão não disponível para esta loja.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * ======================================
     * ACCESS TOKEN DA LOJA
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

    if (erroConta) {
      throw erroConta;
    }

    if (
      !conta?.access_token
    ) {
      return NextResponse.json(
        {
          error:
            "Conta Mercado Pago não conectada.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * ======================================
     * BUSCAR PRODUTOS NO BANCO
     * ======================================
     *
     * Nunca confiamos no preço enviado
     * pelo navegador.
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

      subtotal +=
        Number(
          produto.preco
        ) *
        quantidade;
    }

    /*
     * ======================================
     * ENTREGA
     * ======================================
     */

    let taxaEntrega =
      0;

    if (
      body.tipo_entrega ===
      "entrega" &&
      !loja
        .taxa_entrega_a_combinar
    ) {
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
            "Valor do pedido inválido.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ======================================
     * ORDER MERCADO PAGO
     * ======================================
     */

    const referencia =
      `loja-${lojaId}-${crypto.randomUUID()}`;

    const idempotencyKey =
      crypto.randomUUID();

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
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${conta.access_token}`,

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
        "Erro Mercado Pago Orders:",
        dados
      );

      return NextResponse.json(
        {
          error:
            dados?.message ||
            "Pagamento recusado pelo Mercado Pago.",

          details:
            dados,
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

    return NextResponse.json(
      {
        success:
          pagamento?.status ===
          "processed",

        orderId:
          dados?.id ??
          null,

        status:
          pagamento?.status ??
          dados?.status ??
          null,

        statusDetail:
          pagamento
            ?.status_detail ??
          dados
            ?.status_detail ??
          null,

        total,

        referencia,
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