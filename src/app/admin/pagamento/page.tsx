"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  CreditCard,
  KeyRound,
  Link2,
  Loader2,
  Save,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import {
  useStore,
} from "@/context/StoreContext";

import {
  supabase,
} from "@/lib/supabase";

export default function PagamentoAdminPage() {
  const {
    loja,
    carregando,
    recarregarLoja,
  } = useStore();

  const searchParams =
    useSearchParams();

  const [
    chavePix,
    setChavePix,
  ] = useState("");

  const [
    aceitaPix,
    setAceitaPix,
  ] = useState(true);

  const [
    aceitaCartao,
    setAceitaCartao,
  ] = useState(false);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    salvo,
    setSalvo,
  ] = useState(false);

  const [
    copiado,
    setCopiado,
  ] = useState(false);

  const [
    conectando,
    setConectando,
  ] = useState(false);

  const mercadoPagoConectado =
    loja?.mercado_pago_conectado ??
    false;

  /*
   * ==========================================
   * CARREGA CONFIGURAÇÕES DA LOJA
   * ==========================================
   */

  useEffect(() => {
    if (!loja) {
      return;
    }

    setChavePix(
      loja.chave_pix || ""
    );

    setAceitaPix(
      loja.aceita_pix ??
        true
    );

    setAceitaCartao(
      loja.aceita_cartao ??
        false
    );
  }, [loja]);

  /*
   * ==========================================
   * RETORNO DO MERCADO PAGO
   * ==========================================
   */

  useEffect(() => {
    const status =
      searchParams.get(
        "mercadopago"
      );

    if (
      status ===
      "conectado"
    ) {
      recarregarLoja();
    }
  }, [
    searchParams,
    recarregarLoja,
  ]);

  /*
   * ==========================================
   * SALVAR CONFIGURAÇÕES
   * ==========================================
   */

  const salvarConfiguracoes =
    async () => {
      if (!loja) {
        alert(
          "Não foi possível identificar a loja."
        );

        return;
      }

      /*
       * Se Pix estiver ativo,
       * precisamos de uma chave.
       */

      if (
        aceitaPix &&
        !chavePix.trim()
      ) {
        alert(
          "Informe uma chave Pix ou desative o recebimento por Pix."
        );

        return;
      }

      /*
       * Não permitimos cartão sem
       * uma conta Mercado Pago conectada.
       */

      if (
        aceitaCartao &&
        !mercadoPagoConectado
      ) {
        alert(
          "Conecte sua conta Mercado Pago antes de ativar cartão."
        );

        return;
      }

      /*
       * Pelo menos uma forma de
       * pagamento precisa permanecer ativa.
       */

      if (
        !aceitaPix &&
        !aceitaCartao
      ) {
        alert(
          "Ative pelo menos uma forma de pagamento."
        );

        return;
      }

      try {
        setSalvando(
          true
        );

        setSalvo(
          false
        );

        const {
          error,
        } =
          await supabase
            .from(
              "lojas"
            )
            .update({
              chave_pix:
                chavePix.trim(),

              aceita_pix:
                aceitaPix,

              aceita_cartao:
                aceitaCartao,
            })
            .eq(
              "id",
              loja.id
            );

        if (error) {
          throw error;
        }

        await recarregarLoja();

        setSalvo(
          true
        );

        setTimeout(
          () => {
            setSalvo(
              false
            );
          },
          3000
        );
      } catch (
        error
      ) {
        console.error(
          "Erro ao salvar configurações de pagamento:",
          error
        );

        alert(
          "Não foi possível salvar as configurações."
        );
      } finally {
        setSalvando(
          false
        );
      }
    };

  /*
   * ==========================================
   * COPIAR PIX
   * ==========================================
   */

  const copiarChave =
    async () => {
      if (
        !chavePix.trim()
      ) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          chavePix.trim()
        );

        setCopiado(
          true
        );

        setTimeout(
          () => {
            setCopiado(
              false
            );
          },
          2000
        );
      } catch {
        alert(
          "Não foi possível copiar a chave."
        );
      }
    };

  /*
   * ==========================================
   * CONECTAR MERCADO PAGO
   * ==========================================
   */

  const conectarMercadoPago =
    () => {
      if (!loja) {
        alert(
          "Não foi possível identificar a loja."
        );

        return;
      }

      setConectando(
        true
      );

      window.location.href =
        `/api/mercadopago/conectar?loja_id=${loja.id}`;
    };

  /*
   * ==========================================
   * ALTERAR PIX
   * ==========================================
   */

  const alterarPix =
    () => {
      /*
       * Impede desligar Pix se
       * cartão também estiver desligado.
       */

      if (
        aceitaPix &&
        !aceitaCartao
      ) {
        alert(
          "Ative outra forma de pagamento antes de desativar o Pix."
        );

        return;
      }

      setAceitaPix(
        !aceitaPix
      );
    };

  /*
   * ==========================================
   * ALTERAR CARTÃO
   * ==========================================
   */

  const alterarCartao =
    () => {
      if (
        !mercadoPagoConectado
      ) {
        alert(
          "Primeiro conecte sua conta Mercado Pago."
        );

        return;
      }

      /*
       * Impede desligar cartão se
       * Pix também estiver desligado.
       */

      if (
        aceitaCartao &&
        !aceitaPix
      ) {
        alert(
          "Ative outra forma de pagamento antes de desativar o cartão."
        );

        return;
      }

      setAceitaCartao(
        !aceitaCartao
      );
    };

  /*
   * ==========================================
   * CARREGANDO
   * ==========================================
   */

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-blue-50 to-white">
        <Loader2
          size={30}
          className="animate-spin text-blue-600"
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-white pb-10 text-zinc-950">

      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">

          <Link
            href="/admin"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white/60 shadow-sm backdrop-blur-xl transition active:scale-95"
          >
            <ArrowLeft
              size={20}
            />
          </Link>

          <div className="min-w-0">
            <p className="truncate text-[11px] text-zinc-500">
              {loja?.nome ||
                "Sua loja"}
            </p>

            <h1 className="text-lg font-extrabold">
              Pagamentos
            </h1>
          </div>

        </div>
      </header>

      <section className="mx-auto max-w-md space-y-4 px-3 py-4">

        {/* INTRO */}

        <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-700 to-sky-500 p-5 text-white shadow-xl shadow-blue-900/10">

          <div className="flex items-start gap-3">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 backdrop-blur-xl">
              <WalletCards
                size={22}
              />
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-100">
                Recebimentos
              </p>

              <h2 className="mt-1 text-xl font-extrabold">
                Formas de pagamento
              </h2>

              <p className="mt-1 text-xs leading-5 text-blue-50">
                Escolha como seus clientes poderão pagar os pedidos.
              </p>
            </div>

          </div>
        </section>

        {/* PIX */}

        <section className="rounded-[28px] border border-white/70 bg-white/65 p-4 shadow-lg shadow-blue-900/5 backdrop-blur-xl">

          <div className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-blue-700">
                <KeyRound
                  size={19}
                />
              </div>

              <div>
                <h2 className="font-extrabold">
                  Pix
                </h2>

                <p className="text-xs text-zinc-500">
                  Recebimento direto
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={
                alterarPix
              }
              className={`relative h-8 w-14 shrink-0 rounded-full transition ${
                aceitaPix
                  ? "bg-blue-600"
                  : "bg-zinc-300"
              }`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
                  aceitaPix
                    ? "left-7"
                    : "left-1"
                }`}
              />
            </button>

          </div>

          {aceitaPix && (
            <>
              <div className="mt-4">

                <label
                  htmlFor="chavePix"
                  className="mb-1.5 block text-xs font-bold text-zinc-700"
                >
                  Chave Pix
                </label>

                <input
                  id="chavePix"
                  type="text"
                  value={
                    chavePix
                  }
                  onChange={(
                    e
                  ) =>
                    setChavePix(
                      e.target
                        .value
                    )
                  }
                  placeholder="CPF, CNPJ, telefone, e-mail ou chave aleatória"
                  autoComplete="off"
                  className="h-14 w-full rounded-2xl border border-white/80 bg-white/70 px-4 text-sm shadow-inner outline-none backdrop-blur-xl transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                />

              </div>

              {chavePix.trim() && (
                <button
                  type="button"
                  onClick={
                    copiarChave
                  }
                  className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white bg-white/60 text-sm font-bold shadow-sm backdrop-blur-xl transition active:scale-[0.99]"
                >
                  {copiado ? (
                    <>
                      <CheckCircle2
                        size={17}
                      />

                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy
                        size={17}
                      />

                      Copiar chave
                    </>
                  )}
                </button>
              )}
            </>
          )}

        </section>

        {/* MERCADO PAGO */}

        <section className="rounded-[28px] border border-white/70 bg-white/65 p-4 shadow-lg shadow-blue-900/5 backdrop-blur-xl">

          <div className="flex items-start gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <CreditCard
                size={20}
              />
            </div>

            <div className="min-w-0 flex-1">

              <div className="flex flex-wrap items-center gap-2">

                <h2 className="font-extrabold">
                  Mercado Pago
                </h2>

                {mercadoPagoConectado ? (
                  <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-extrabold text-green-700">
                    CONECTADO
                  </span>
                ) : (
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-extrabold text-zinc-500">
                    NÃO CONECTADO
                  </span>
                )}

              </div>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Conecte sua própria conta para receber pagamentos por cartão.
              </p>

            </div>

          </div>

          {!mercadoPagoConectado ? (
            <button
              type="button"
              onClick={
                conectarMercadoPago
              }
              disabled={
                conectando
              }
              className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#009EE3] px-5 font-extrabold text-white shadow-lg transition active:scale-[0.99] disabled:opacity-60"
            >
              {conectando ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  Abrindo Mercado Pago...
                </>
              ) : (
                <>
                  <Link2
                    size={18}
                  />

                  Conectar Mercado Pago
                </>
              )}
            </button>
          ) : (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-green-50 p-4">

              <ShieldCheck
                size={21}
                className="shrink-0 text-green-600"
              />

              <div>
                <p className="text-sm font-extrabold text-green-800">
                  Conta conectada
                </p>

                <p className="mt-0.5 text-xs leading-5 text-green-700">
                  Sua loja já pode ativar pagamentos por cartão.
                </p>
              </div>

            </div>
          )}

        </section>

        {/* CARTÃO */}

        <section
          className={`rounded-[28px] border p-4 shadow-lg shadow-blue-900/5 backdrop-blur-xl ${
            mercadoPagoConectado
              ? "border-white/70 bg-white/65"
              : "border-zinc-200/70 bg-white/40"
          }`}
        >

          <div className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                  mercadoPagoConectado
                    ? "bg-blue-100 text-blue-700"
                    : "bg-zinc-100 text-zinc-400"
                }`}
              >
                <CreditCard
                  size={20}
                />
              </div>

              <div>
                <h2 className="font-extrabold">
                  Cartão de crédito
                </h2>

                <p className="mt-0.5 text-xs text-zinc-500">
                  {mercadoPagoConectado
                    ? "Aceitar pagamentos online"
                    : "Conecte o Mercado Pago primeiro"}
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={
                alterarCartao
              }
              disabled={
                !mercadoPagoConectado
              }
              className={`relative h-8 w-14 shrink-0 rounded-full transition ${
                aceitaCartao
                  ? "bg-blue-600"
                  : "bg-zinc-300"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
                  aceitaCartao
                    ? "left-7"
                    : "left-1"
                }`}
              />
            </button>

          </div>

        </section>

        {/* MENSAGEM RETORNO MP */}

        {searchParams.get(
          "mercadopago"
        ) ===
          "conectado" && (
          <section className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50/90 p-4">

            <CheckCircle2
              size={21}
              className="shrink-0 text-green-600"
            />

            <div>
              <p className="text-sm font-extrabold text-green-800">
                Mercado Pago conectado!
              </p>

              <p className="mt-0.5 text-xs text-green-700">
                Agora você pode ativar pagamentos por cartão.
              </p>
            </div>

          </section>
        )}

        {searchParams.get(
          "mercadopago"
        ) ===
          "erro" && (
          <section className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
            Não foi possível conectar ao Mercado Pago. Tente novamente.
          </section>
        )}

        {searchParams.get(
          "mercadopago"
        ) ===
          "cancelado" && (
          <section className="rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800">
            A conexão com o Mercado Pago foi cancelada.
          </section>
        )}

        {/* SALVO */}

        {salvo && (
          <section className="flex items-center gap-3 rounded-2xl bg-green-50 p-4 text-green-800">

            <CheckCircle2
              size={20}
            />

            <div>
              <p className="text-sm font-bold">
                Configurações salvas
              </p>

              <p className="text-xs">
                As novas formas de pagamento já estão configuradas.
              </p>
            </div>

          </section>
        )}

        {/* SALVAR */}

        <button
          type="button"
          onClick={
            salvarConfiguracoes
          }
          disabled={
            salvando
          }
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-700 to-sky-500 px-5 font-extrabold text-white shadow-xl shadow-blue-900/10 transition active:scale-[0.99] disabled:opacity-60"
        >
          {salvando ? (
            <>
              <Loader2
                size={18}
                className="animate-spin"
              />

              Salvando...
            </>
          ) : (
            <>
              <Save
                size={18}
              />

              Salvar configurações
            </>
          )}
        </button>

      </section>
    </main>
  );
}