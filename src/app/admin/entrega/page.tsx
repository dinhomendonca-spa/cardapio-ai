"use client";

import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Circle,
  ExternalLink,
  Link as LinkIcon,
  Loader2,
  MapPin,
  PackagePlus,
  Save,
  Store,
  Truck,
  WandSparkles,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useStore,
} from "@/context/StoreContext";

function somenteNumeros(
  valor: string
) {
  return valor.replace(
    /\D/g,
    ""
  );
}

function formatarCep(
  valor: string
) {
  const numeros =
    somenteNumeros(
      valor
    ).slice(0, 8);

  if (
    numeros.length <= 5
  ) {
    return numeros;
  }

  return `${numeros.slice(
    0,
    5
  )}-${numeros.slice(5)}`;
}

function converterValor(
  valor: string
) {
  const normalizado =
    valor
      .trim()
      .replace(/\./g, "")
      .replace(",", ".");

  return Number(
    normalizado
  );
}

export default function EntregaPage() {
  const {
    loja,
    carregando,
    salvarLoja,
  } = useStore();

  const [
    entregaAtiva,
    setEntregaAtiva,
  ] = useState(true);

  const [
    taxaEntrega,
    setTaxaEntrega,
  ] = useState("");

  const [
    taxaACombinar,
    setTaxaACombinar,
  ] = useState(false);

  const [
    retiradaPermitida,
    setRetiradaPermitida,
  ] = useState(true);

  const [
    tempoMinimo,
    setTempoMinimo,
  ] = useState("");

  const [
    tempoMaximo,
    setTempoMaximo,
  ] = useState("");

  const [
    endereco,
    setEndereco,
  ] = useState("");

  const [
    numero,
    setNumero,
  ] = useState("");

  const [
    bairro,
    setBairro,
  ] = useState("");

  const [
    cidade,
    setCidade,
  ] = useState("");

  const [
    estado,
    setEstado,
  ] = useState("");

  const [
    cep,
    setCep,
  ] = useState("");

  const [
    googleMapsUrl,
    setGoogleMapsUrl,
  ] = useState("");

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    salvo,
    setSalvo,
  ] = useState(false);

  useEffect(() => {
    if (!loja) {
      return;
    }

    setEntregaAtiva(
      loja.entrega_ativa ??
      true
    );

    setTaxaEntrega(
      loja.taxa_entrega
        .toFixed(2)
        .replace(".", ",")
    );

    setTaxaACombinar(
      loja.taxa_entrega_a_combinar
    );

    setRetiradaPermitida(
      loja.retirada_permitida
    );

    setTempoMinimo(
      String(
        loja.tempo_entrega_min ??
        35
      )
    );

    setTempoMaximo(
      String(
        loja.tempo_entrega_max ??
        50
      )
    );

    setEndereco(
      loja.endereco
    );

    setNumero(
      loja.numero
    );

    setBairro(
      loja.bairro
    );

    setCidade(
      loja.cidade
    );

    setEstado(
      loja.estado
    );

    setCep(
      formatarCep(
        loja.cep
      )
    );

    setGoogleMapsUrl(
      loja.google_maps_url
    );
  }, [
    loja,
  ]);

  const taxa =
    converterValor(
      taxaEntrega
    );

  const minimo =
    Number(
      tempoMinimo
    );

  const maximo =
    Number(
      tempoMaximo
    );

  const possuiModalidade =
    entregaAtiva ||
    retiradaPermitida;

  const taxaValida =
    !entregaAtiva ||
    taxaACombinar ||
    (
      Number.isFinite(taxa) &&
      taxa >= 0
    );

  const prazoValido =
    !entregaAtiva ||
    (
      Number.isInteger(minimo) &&
      Number.isInteger(maximo) &&
      minimo > 0 &&
      maximo >= minimo
    );

  const enderecoValido =
    endereco.trim().length >= 3 &&
    numero.trim().length >= 1 &&
    bairro.trim().length >= 2 &&
    cidade.trim().length >= 2 &&
    estado.trim().length === 2 &&
    somenteNumeros(
      cep
    ).length === 8;

  const etapaCompleta =
    possuiModalidade &&
    taxaValida &&
    prazoValido &&
    enderecoValido;

  const enderecoCompleto =
    useMemo(() => {
      return [
        endereco.trim(),
        numero.trim(),
        bairro.trim(),
        cidade.trim(),
        estado
          .trim()
          .toUpperCase(),
        formatarCep(cep),
      ]
        .filter(Boolean)
        .join(", ");
    }, [
      endereco,
      numero,
      bairro,
      cidade,
      estado,
      cep,
    ]);

  const gerarLinkGoogleMaps =
    () => {
      if (
        !enderecoValido
      ) {
        alert(
          "Preencha o endereço completo antes de gerar o link."
        );

        return;
      }

      const link =
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          enderecoCompleto
        )}`;

      setGoogleMapsUrl(
        link
      );

      setSalvo(false);
    };

  const abrirGoogleMaps =
    () => {
      const link =
        googleMapsUrl.trim() ||
        (
          enderecoCompleto
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                enderecoCompleto
              )}`
            : "https://www.google.com/maps"
        );

      window.open(
        link,
        "_blank",
        "noopener,noreferrer"
      );
    };

  const salvar =
    async () => {
      if (!loja) {
        return;
      }

      if (
        !possuiModalidade
      ) {
        alert(
          "Ative pelo menos entrega ou retirada no local."
        );

        return;
      }

      if (
        !taxaValida
      ) {
        alert(
          "Informe uma taxa de entrega válida."
        );

        return;
      }

      if (
        !prazoValido
      ) {
        alert(
          "Informe um prazo válido. O prazo máximo não pode ser menor que o mínimo."
        );

        return;
      }

      if (
        !enderecoValido
      ) {
        alert(
          "Preencha o endereço completo e informe um CEP com 8 números."
        );

        return;
      }

      try {
        setSalvando(true);
        setSalvo(false);

        await salvarLoja({
          entrega_ativa:
            entregaAtiva,

          taxa_entrega:
            entregaAtiva &&
            !taxaACombinar
              ? taxa
              : 0,

          taxa_entrega_a_combinar:
            entregaAtiva &&
            taxaACombinar,

          retirada_permitida:
            retiradaPermitida,

          tempo_entrega_min:
            entregaAtiva
              ? minimo
              : 0,

          tempo_entrega_max:
            entregaAtiva
              ? maximo
              : 0,

          endereco:
            endereco.trim(),

          numero:
            numero.trim(),

          bairro:
            bairro.trim(),

          cidade:
            cidade.trim(),

          estado:
            estado
              .trim()
              .toUpperCase(),

          cep:
            somenteNumeros(
              cep
            ),

          google_maps_url:
            googleMapsUrl.trim(),
        });

        setSalvo(true);
      } catch (error) {
        console.error(
          "Erro ao salvar entrega:",
          error
        );

        alert(
          "Não foi possível salvar as configurações."
        );
      } finally {
        setSalvando(false);
      }
    };

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020b18]">
        <div className="text-center">
          <Loader2
            size={30}
            className="mx-auto animate-spin text-sky-400"
          />

          <p className="mt-3 text-sm text-slate-400">
            Carregando configurações...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020b18] pb-12 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#020b18]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-4 px-4 py-4">
          <Link
            href="/admin/loja"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5"
          >
            <ArrowLeft
              size={20}
            />
          </Link>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-400">
              Configuração inicial
            </p>

            <h1 className="truncate text-lg font-black">
              Entrega e retirada
            </h1>
          </div>

          <div className="ml-auto rounded-full bg-sky-500/15 px-3 py-1.5 text-xs font-bold text-sky-300">
            2 de 4
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-md space-y-5 px-4 py-5">
        <section className="rounded-[28px] border border-sky-300/20 bg-gradient-to-br from-sky-500/20 to-blue-600/10 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500">
              <Truck
                size={22}
              />
            </div>

            <div>
              <h2 className="font-black">
                Como os pedidos serão entregues?
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-300">
                Ative entrega, retirada no local ou as duas opções.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
          <div className="flex items-center gap-3">
            <Truck
              size={20}
              className="text-sky-300"
            />

            <div>
              <h2 className="font-bold">
                Modalidades
              </h2>

              <p className="text-xs text-slate-400">
                Escolha pelo menos uma
              </p>
            </div>

            {possuiModalidade ? (
              <Check
                size={20}
                className="ml-auto text-emerald-400"
              />
            ) : (
              <Circle
                size={20}
                className="ml-auto text-red-400"
              />
            )}
          </div>

          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={() => {
                setEntregaAtiva(
                  !entregaAtiva
                );

                setSalvo(false);
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] p-4"
            >
              <div className="pr-4 text-left">
                <p className="font-bold">
                  Entrega no endereço
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  O pedido será levado até o cliente
                </p>
              </div>

              <div
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                  entregaAtiva
                    ? "bg-sky-500"
                    : "bg-slate-700"
                }`}
              >
                <div
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                    entregaAtiva
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setRetiradaPermitida(
                  !retiradaPermitida
                );

                setSalvo(false);
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] p-4"
            >
              <div className="pr-4 text-left">
                <p className="font-bold">
                  Retirada no local
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  O cliente poderá buscar o pedido na loja
                </p>
              </div>

              <div
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                  retiradaPermitida
                    ? "bg-emerald-500"
                    : "bg-slate-700"
                }`}
              >
                <div
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                    retiradaPermitida
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </div>
            </button>
          </div>
        </section>

        {entregaAtiva && (
          <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
            <div className="flex items-center gap-3">
              <Truck
                size={20}
                className="text-violet-300"
              />

              <div>
                <h2 className="font-bold">
                  Taxa e prazo
                </h2>

                <p className="text-xs text-slate-400">
                  Valores mostrados no checkout
                </p>
              </div>

              {taxaValida &&
              prazoValido ? (
                <Check
                  size={20}
                  className="ml-auto text-emerald-400"
                />
              ) : (
                <Circle
                  size={20}
                  className="ml-auto text-red-400"
                />
              )}
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-xs font-bold text-slate-300">
                Taxa de entrega
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  R$
                </span>

                <input
                  value={taxaEntrega}
                  onChange={(event) => {
                    setTaxaEntrega(
                      event.target.value
                    );

                    setSalvo(false);
                  }}
                  placeholder="6,00"
                  inputMode="decimal"
                  disabled={
                    taxaACombinar
                  }
                  className={`h-14 w-full rounded-2xl border pl-12 pr-4 outline-none ${
                    taxaACombinar
                      ? "cursor-not-allowed border-white/5 bg-white/[0.03] text-slate-600"
                      : "border-white/10 bg-white/[0.07] focus:border-sky-400"
                  }`}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setTaxaACombinar(
                    !taxaACombinar
                  );

                  setSalvo(false);
                }}
                className="mt-3 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] p-4"
              >
                <div className="pr-4 text-left">
                  <p className="font-bold">
                    Taxa a combinar
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    O valor será confirmado diretamente com o cliente
                  </p>
                </div>

                <div
                  className={`relative h-7 w-12 shrink-0 rounded-full ${
                    taxaACombinar
                      ? "bg-violet-500"
                      : "bg-slate-700"
                  }`}
                >
                  <div
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                      taxaACombinar
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </div>
              </button>

              <div className="mt-5">
                <label className="mb-2 block text-xs font-bold text-slate-300">
                  Prazo estimado
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      value={tempoMinimo}
                      onChange={(event) => {
                        setTempoMinimo(
                          somenteNumeros(
                            event.target.value
                          ).slice(
                            0,
                            3
                          )
                        );

                        setSalvo(false);
                      }}
                      placeholder="35"
                      inputMode="numeric"
                      className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 outline-none focus:border-violet-400"
                    />

                    <p className="mt-1 text-xs text-slate-500">
                      Mínimo em minutos
                    </p>
                  </div>

                  <div>
                    <input
                      value={tempoMaximo}
                      onChange={(event) => {
                        setTempoMaximo(
                          somenteNumeros(
                            event.target.value
                          ).slice(
                            0,
                            3
                          )
                        );

                        setSalvo(false);
                      }}
                      placeholder="50"
                      inputMode="numeric"
                      className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 outline-none focus:border-violet-400"
                    />

                    <p className="mt-1 text-xs text-slate-500">
                      Máximo em minutos
                    </p>
                  </div>
                </div>

                {!prazoValido && (
                  <p className="mt-2 text-xs font-medium text-red-300">
                    O prazo máximo deve ser igual ou maior que o mínimo.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
          <div className="flex items-center gap-3">
            <Store
              size={20}
              className="text-amber-300"
            />

            <div>
              <h2 className="font-bold">
                Endereço da loja
              </h2>

              <p className="text-xs text-slate-400">
                Local de saída ou retirada
              </p>
            </div>

            {enderecoValido ? (
              <Check
                size={20}
                className="ml-auto text-emerald-400"
              />
            ) : (
              <Circle
                size={20}
                className="ml-auto text-slate-600"
              />
            )}
          </div>

          <div className="mt-5 space-y-3">
            <input
              value={endereco}
              onChange={(event) => {
                setEndereco(
                  event.target.value
                );

                setSalvo(false);
              }}
              placeholder="Rua ou avenida"
              className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 outline-none focus:border-amber-400"
            />

            <div className="grid grid-cols-3 gap-3">
              <input
                value={numero}
                onChange={(event) => {
                  setNumero(
                    event.target.value
                  );

                  setSalvo(false);
                }}
                placeholder="Número"
                className="h-14 rounded-2xl border border-white/10 bg-white/[0.07] px-4 outline-none focus:border-amber-400"
              />

              <input
                value={bairro}
                onChange={(event) => {
                  setBairro(
                    event.target.value
                  );

                  setSalvo(false);
                }}
                placeholder="Bairro"
                className="col-span-2 h-14 rounded-2xl border border-white/10 bg-white/[0.07] px-4 outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <input
                value={cidade}
                onChange={(event) => {
                  setCidade(
                    event.target.value
                  );

                  setSalvo(false);
                }}
                placeholder="Cidade"
                className="col-span-2 h-14 rounded-2xl border border-white/10 bg-white/[0.07] px-4 outline-none focus:border-amber-400"
              />

              <input
                value={estado}
                onChange={(event) => {
                  setEstado(
                    event.target.value
                  );

                  setSalvo(false);
                }}
                placeholder="UF"
                maxLength={2}
                className="h-14 rounded-2xl border border-white/10 bg-white/[0.07] px-4 uppercase outline-none focus:border-amber-400"
              />
            </div>

            <input
              value={cep}
              onChange={(event) => {
                setCep(
                  formatarCep(
                    event.target.value
                  )
                );

                setSalvo(false);
              }}
              placeholder="00000-000"
              inputMode="numeric"
              maxLength={9}
              className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 outline-none focus:border-amber-400"
            />
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
          <div className="flex items-center gap-3">
            <MapPin
              size={20}
              className="text-red-300"
            />

            <div>
              <h2 className="font-bold">
                Localização no mapa
              </h2>

              <p className="text-xs text-slate-400">
                Ajude o cliente a encontrar a loja
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              gerarLinkGoogleMaps
            }
            className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 font-bold"
          >
            <WandSparkles
              size={18}
            />

            Gerar link pelo endereço
          </button>

          <button
            type="button"
            onClick={
              abrirGoogleMaps
            }
            className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] font-bold"
          >
            <ExternalLink
              size={18}
            />

            Conferir no Google Maps
          </button>

          <div className="mt-4">
            <label className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-300">
              <LinkIcon
                size={15}
              />

              Link da localização
            </label>

            <input
              value={googleMapsUrl}
              onChange={(event) => {
                setGoogleMapsUrl(
                  event.target.value
                );

                setSalvo(false);
              }}
              placeholder="O link será gerado automaticamente"
              inputMode="url"
              className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 outline-none focus:border-red-400"
            />
          </div>
        </section>

        {salvo && (
          <section className="rounded-[24px] border border-emerald-400/25 bg-emerald-400/10 p-4">
            <div className="flex items-start gap-3">
              <Check
                size={21}
                className="mt-0.5 shrink-0 text-emerald-400"
              />

              <div>
                <p className="font-bold text-emerald-200">
                  Segunda etapa concluída
                </p>

                <p className="mt-1 text-sm leading-5 text-slate-300">
                  Agora cadastre o primeiro produto da loja.
                </p>
              </div>
            </div>

            <Link
              href="/admin/produtos/novo"
              className="mt-4 flex h-14 items-center justify-between rounded-2xl bg-emerald-500 px-5 font-bold"
            >
              <span className="flex items-center gap-2">
                <PackagePlus
                  size={19}
                />

                Cadastrar produto
              </span>

              <ArrowRight
                size={19}
              />
            </Link>
          </section>
        )}

        <button
          type="button"
          onClick={salvar}
          disabled={
            salvando ||
            !etapaCompleta
          }
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 font-bold shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
        >
          {salvando ? (
            <>
              <Loader2
                size={19}
                className="animate-spin"
              />

              Salvando...
            </>
          ) : (
            <>
              <Save
                size={19}
              />

              Salvar e continuar
            </>
          )}
        </button>

        {!etapaCompleta && (
          <p className="text-center text-xs leading-5 text-slate-500">
            Escolha uma modalidade e preencha corretamente os dados obrigatórios.
          </p>
        )}
      </section>
    </main>
  );
}