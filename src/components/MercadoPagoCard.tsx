"use client";

import {
  CardPayment,
  initMercadoPago,
} from "@mercadopago/sdk-react";

import {
  Loader2,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

type Item = {
  id: number;
  quantidade: number;
};

type Props = {
  lojaId: number;

  total: number;

  itens: Item[];

  clienteNome: string;

  clienteTelefone: string;

  tipoEntrega:
    | "entrega"
    | "retirada";

  rua?: string;
  numero?: string;
  bairro?: string;
  complemento?: string;

  onAprovado: (
    dados: {
      pedidoId: number;

      orderId:
        string | null;

      status:
        string | null;

      statusDetail:
        string | null;
    }
  ) => void;
};

export default function MercadoPagoCard({
  lojaId,
  total,
  itens,
  clienteNome,
  clienteTelefone,
  tipoEntrega,
  rua,
  numero,
  bairro,
  complemento,
  onAprovado,
}: Props) {
  const [
    publicKey,
    setPublicKey,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    erro,
    setErro,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    carregando,
    setCarregando,
  ] =
    useState(
      true
    );

  useEffect(() => {
    const carregar =
      async () => {
        try {
          setCarregando(
            true
          );

          setErro(
            null
          );

          const resposta =
            await fetch(
              `/api/mercadopago/config?loja_id=${lojaId}`,
              {
                cache:
                  "no-store",
              }
            );

          const dados =
            await resposta.json();

          if (
            !resposta.ok
          ) {
            throw new Error(
              dados?.error ||
                "Não foi possível carregar o Mercado Pago."
            );
          }

          if (
            !dados.publicKey
          ) {
            throw new Error(
              "Public Key não encontrada."
            );
          }

          initMercadoPago(
            dados.publicKey,
            {
              locale:
                "pt-BR",
            }
          );

          setPublicKey(
            dados.publicKey
          );
        } catch (
          error
        ) {
          console.error(
            "Erro ao inicializar Mercado Pago:",
            error
          );

          setErro(
            error instanceof
              Error
              ? error.message
              : "Não foi possível carregar o pagamento por cartão."
          );
        } finally {
          setCarregando(
            false
          );
        }
      };

    carregar();
  }, [
    lojaId,
  ]);

  if (
    carregando
  ) {
    return (
      <div className="flex min-h-32 items-center justify-center rounded-2xl bg-zinc-50">

        <div className="text-center">

          <Loader2
            size={24}
            className="mx-auto animate-spin text-blue-600"
          />

          <p className="mt-2 text-xs text-zinc-500">
            Carregando pagamento seguro...
          </p>

        </div>

      </div>
    );
  }

  if (
    erro ||
    !publicKey
  ) {
    return (
      <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
        {erro ||
          "Mercado Pago indisponível."}
      </div>
    );
  }

  const initialization = {
    amount:
      total,
  };

  const onSubmit =
    async (
      formData: any,
      additionalData?: any
    ) => {
      const resposta =
        await fetch(
          "/api/mercadopago/pagar",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                loja_id:
                  lojaId,

                itens,

                cliente_nome:
                  clienteNome,

                cliente_telefone:
                  clienteTelefone,

                tipo_entrega:
                  tipoEntrega,

                rua,

                numero,

                bairro,

                complemento,

                token:
                  formData.token,

                payment_method_id:
                  formData
                    .payment_method_id,

                payment_type_id:
                  additionalData
                    ?.paymentTypeId ||
                  "credit_card",

                installments:
                  formData.installments,

                payer:
                  formData.payer,
              }),
          }
        );

      const dados =
        await resposta.json();

      if (
        !resposta.ok
      ) {
        throw new Error(
          dados?.error ||
            "Pagamento não aprovado."
        );
      }

      if (
        dados.status ===
        "processed"
      ) {
        onAprovado({
          pedidoId:
            Number(
              dados.pedidoId
            ),

          orderId:
            dados.orderId ??
            null,

          status:
            dados.status ??
            null,

          statusDetail:
            dados.statusDetail ??
            null,
        });

        return;
      }

      throw new Error(
        dados?.statusDetail ||
          "Pagamento ainda não foi aprovado."
      );
    };

  const onError =
    async (
      error: unknown
    ) => {
      console.error(
        "Erro Card Payment Brick:",
        error
      );
    };

  const onReady =
    async () => {
      //
    };

  return (
    <div className="overflow-hidden rounded-2xl">

      <CardPayment
        initialization={
          initialization
        }
        onSubmit={
          onSubmit
        }
        onReady={
          onReady
        }
        onError={
          onError
        }
      />

    </div>
  );
}