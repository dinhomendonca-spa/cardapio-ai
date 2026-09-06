"use client";

import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Copy,
  CreditCard,
  KeyRound,
  Loader2,
  Save,
} from "lucide-react";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useStore,
} from "@/context/StoreContext";

import {
  supabase,
} from "@/lib/supabase";

type TipoChavePix =
  | "cpf"
  | "cnpj"
  | "telefone"
  | "email"
  | "aleatoria"
  | "desconhecida";

function somenteNumeros(
  valor: string
) {
  return valor.replace(
    /\D/g,
    ""
  );
}

function detectarTipoChave(
  valor: string
): TipoChavePix {
  const chave =
    valor.trim();

  if (!chave) {
    return "desconhecida";
  }

  if (
    chave.includes("@")
  ) {
    return "email";
  }

  const uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

  if (
    uuidRegex.test(
      chave
    )
  ) {
    return "aleatoria";
  }

  if (
    chave.startsWith("+")
  ) {
    return "telefone";
  }

  const numeros =
    somenteNumeros(
      chave
    );

  if (
    numeros.length === 11
  ) {
    return "cpf";
  }

  if (
    numeros.length === 14
  ) {
    return "cnpj";
  }

  return "desconhecida";
}

function validarCpf(
  valor: string
) {
  const cpf =
    somenteNumeros(
      valor
    );

  if (
    cpf.length !== 11
  ) {
    return false;
  }

  if (
    /^(\d)\1{10}$/.test(
      cpf
    )
  ) {
    return false;
  }

  let soma = 0;

  for (
    let i = 0;
    i < 9;
    i++
  ) {
    soma +=
      Number(
        cpf[i]
      ) *
      (10 - i);
  }

  let digito =
    (soma * 10) %
    11;

  if (
    digito === 10
  ) {
    digito = 0;
  }

  if (
    digito !==
    Number(cpf[9])
  ) {
    return false;
  }

  soma = 0;

  for (
    let i = 0;
    i < 10;
    i++
  ) {
    soma +=
      Number(
        cpf[i]
      ) *
      (11 - i);
  }

  digito =
    (soma * 10) %
    11;

  if (
    digito === 10
  ) {
    digito = 0;
  }

  return (
    digito ===
    Number(cpf[10])
  );
}

function validarCnpj(
  valor: string
) {
  const cnpj =
    somenteNumeros(
      valor
    );

  if (
    cnpj.length !== 14
  ) {
    return false;
  }

  if (
    /^(\d)\1{13}$/.test(
      cnpj
    )
  ) {
    return false;
  }

  const calcularDigito = (
    base: string,
    pesos: number[]
  ) => {
    const soma =
      base
        .split("")
        .reduce(
          (
            total,
            digito,
            indice
          ) =>
            total +
            Number(
              digito
            ) *
            pesos[
              indice
            ],
          0
        );

    const resto =
      soma % 11;

    return resto < 2
      ? 0
      : 11 - resto;
  };

  const primeiro =
    calcularDigito(
      cnpj.slice(
        0,
        12
      ),
      [
        5,
        4,
        3,
        2,
        9,
        8,
        7,
        6,
        5,
        4,
        3,
        2,
      ]
    );

  const segundo =
    calcularDigito(
      cnpj.slice(
        0,
        12
      ) +
        primeiro,
      [
        6,
        5,
        4,
        3,
        2,
        9,
        8,
        7,
        6,
        5,
        4,
        3,
        2,
      ]
    );

  return (
    primeiro ===
      Number(
        cnpj[12]
      ) &&
    segundo ===
      Number(
        cnpj[13]
      )
  );
}

function validarEmail(
  valor: string
) {
  const email =
    valor.trim();

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function validarTelefone(
  valor: string
) {
  const chave =
    valor.trim();

  if (
    !chave.startsWith(
      "+"
    )
  ) {
    return false;
  }

  const numeros =
    somenteNumeros(
      chave
    );

  /*
   * Formato esperado para Brasil:
   * +55 + DDD + telefone
   *
   * Ex:
   * +5522999999999
   */
  return (
    numeros.startsWith(
      "55"
    ) &&
    (
      numeros.length ===
        12 ||
      numeros.length ===
        13
    )
  );
}

function validarChaveAleatoria(
  valor: string
) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
    valor.trim()
  );
}

function validarChavePix(
  valor: string
) {
  const tipo =
    detectarTipoChave(
      valor
    );

  switch (tipo) {
    case "cpf":
      return {
        valido:
          validarCpf(
            valor
          ),

        tipo,

        mensagem:
          "CPF deve ter 11 números e ser válido.",
      };

    case "cnpj":
      return {
        valido:
          validarCnpj(
            valor
          ),

        tipo,

        mensagem:
          "CNPJ deve ter 14 números e ser válido.",
      };

    case "telefone":
      return {
        valido:
          validarTelefone(
            valor
          ),

        tipo,

        mensagem:
          "Telefone deve estar no formato internacional, por exemplo: +5522999999999.",
      };

    case "email":
      return {
        valido:
          validarEmail(
            valor
          ),

        tipo,

        mensagem:
          "Informe um e-mail válido, por exemplo: contato@empresa.com.",
      };

    case "aleatoria":
      return {
        valido:
          validarChaveAleatoria(
            valor
          ),

        tipo,

        mensagem:
          "A chave aleatória deve ser informada completa, no formato UUID.",
      };

    default:
      return {
        valido:
          false,

        tipo:
          "desconhecida" as TipoChavePix,

        mensagem:
          "Formato não reconhecido. Use CPF, CNPJ, telefone com +55, e-mail ou chave aleatória.",
      };
  }
}

function nomeTipo(
  tipo: TipoChavePix
) {
  switch (tipo) {
    case "cpf":
      return "CPF";

    case "cnpj":
      return "CNPJ";

    case "telefone":
      return "Telefone";

    case "email":
      return "E-mail";

    case "aleatoria":
      return "Chave aleatória";

    default:
      return "Não identificado";
  }
}

export default function PagamentoAdminPage() {
  const {
    loja,
    carregando,
    recarregarLoja,
  } = useStore();

  const [
    chavePix,
    setChavePix,
  ] = useState("");

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

  useEffect(() => {
    if (!loja) {
      return;
    }

    setChavePix(
      loja.chave_pix ||
        ""
    );
  }, [
    loja,
  ]);

  const validacao =
    useMemo(
      () =>
        validarChavePix(
          chavePix
        ),
      [
        chavePix,
      ]
    );

  const salvarPix =
    async () => {
      if (!loja) {
        alert(
          "Não foi possível identificar a loja."
        );

        return;
      }

      if (
        !chavePix.trim()
      ) {
        alert(
          "Informe uma chave Pix."
        );

        return;
      }

      if (
        !validacao.valido
      ) {
        alert(
          validacao.mensagem
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
          "Erro ao salvar Pix:",
          error
        );

        alert(
          "Não foi possível salvar a chave Pix."
        );
      } finally {
        setSalvando(
          false
        );
      }
    };

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

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100">
        <Loader2
          size={28}
          className="animate-spin text-zinc-500"
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 pb-10 text-zinc-950">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <Link
            href="/admin"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 active:scale-95"
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
              Pagamento
            </h1>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-md space-y-3 px-3 py-3">
        <section className="rounded-3xl bg-zinc-950 p-5 text-white shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <CreditCard
                size={20}
              />
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Recebimentos
              </p>

              <h2 className="mt-1 text-lg font-extrabold">
                Configure seu Pix
              </h2>

              <p className="mt-1 text-xs leading-5 text-zinc-300">
                O sistema valida o formato da chave antes de permitir o cadastro.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
              <KeyRound
                size={18}
              />
            </div>

            <div>
              <h2 className="font-extrabold">
                Chave Pix
              </h2>

              <p className="mt-0.5 text-xs leading-5 text-zinc-500">
                CPF, CNPJ, telefone, e-mail ou chave aleatória.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="chavePix"
              className="mb-1.5 block text-xs font-bold text-zinc-700"
            >
              Chave Pix *
            </label>

            <input
              id="chavePix"
              type="text"
              value={
                chavePix
              }
              onChange={(
                event
              ) =>
                setChavePix(
                  event.target
                    .value
                )
              }
              placeholder="Digite a chave Pix"
              autoComplete="off"
              className={`h-14 w-full rounded-2xl border px-4 text-base outline-none ${
                chavePix.trim()
                  ? validacao.valido
                    ? "border-green-300 bg-green-50"
                    : "border-red-300 bg-red-50"
                  : "border-transparent bg-zinc-100"
              }`}
            />

            {chavePix.trim() && (
              <div
                className={`mt-3 rounded-2xl p-3 ${
                  validacao.valido
                    ? "bg-green-50"
                    : "bg-red-50"
                }`}
              >
                <div className="flex items-start gap-2">
                  {validacao.valido ? (
                    <CheckCircle2
                      size={
                        18
                      }
                      className="mt-0.5 shrink-0 text-green-600"
                    />
                  ) : (
                    <AlertTriangle
                      size={
                        18
                      }
                      className="mt-0.5 shrink-0 text-red-600"
                    />
                  )}

                  <div>
                    <p
                      className={`text-xs font-bold ${
                        validacao.valido
                          ? "text-green-800"
                          : "text-red-800"
                      }`}
                    >
                      {validacao.valido
                        ? `Formato reconhecido: ${nomeTipo(
                            validacao.tipo
                          )}`
                        : "Chave fora do padrão"}
                    </p>

                    {!validacao.valido && (
                      <p className="mt-1 text-xs leading-5 text-red-700">
                        {
                          validacao.mensagem
                        }
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {chavePix.trim() && (
            <button
              type="button"
              onClick={
                copiarChave
              }
              className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-100 text-sm font-bold"
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
        </section>

        <section className="rounded-3xl bg-blue-50 p-4">
          <p className="text-sm font-extrabold text-blue-900">
            Formatos aceitos
          </p>

          <div className="mt-3 space-y-2 text-xs leading-5 text-blue-800">
            <p>
              <strong>
                CPF:
              </strong>{" "}
              somente 11 números.
            </p>

            <p>
              <strong>
                CNPJ:
              </strong>{" "}
              somente 14 números.
            </p>

            <p>
              <strong>
                Telefone:
              </strong>{" "}
              use código do país + DDD + número.
              Exemplo: +5522999999999.
            </p>

            <p>
              <strong>
                E-mail:
              </strong>{" "}
              exatamente o e-mail cadastrado como chave Pix.
            </p>

            <p>
              <strong>
                Chave aleatória:
              </strong>{" "}
              copie a chave completa fornecida pelo banco.
            </p>
          </div>
        </section>

        <section className="rounded-3xl bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0 text-amber-700"
            />

            <div>
              <p className="text-sm font-bold text-amber-900">
                Atenção
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-800">
                Um formato válido não garante que a chave esteja realmente cadastrada no Pix. Confira no aplicativo do banco antes de disponibilizar o cardápio.
              </p>
            </div>
          </div>
        </section>

        {salvo && (
          <section className="flex items-center gap-3 rounded-2xl bg-green-50 p-4 text-green-800">
            <CheckCircle2
              size={20}
            />

            <div>
              <p className="text-sm font-bold">
                Chave Pix salva
              </p>

              <p className="text-xs">
                Os próximos pedidos já utilizarão essa chave.
              </p>
            </div>
          </section>
        )}

        <button
          type="button"
          onClick={
            salvarPix
          }
          disabled={
            salvando ||
            !validacao.valido
          }
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 font-bold text-white shadow-lg active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-zinc-300"
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

              Salvar chave Pix
            </>
          )}
        </button>
      </section>
    </main>
  );
}