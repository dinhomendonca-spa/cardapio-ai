"use client";

import {
  ArrowLeft,
  Check,
  ChevronRight,
  CreditCard,
  MapPin,
  Minus,
  Navigation,
  Phone,
  Plus,
  ShoppingBag,
  Truck,
  User,
} from "lucide-react";

import Link from "next/link";
import { useState } from "react";

import { useCart } from "@/context/CartContext";
import { useStore } from "@/context/StoreContext";

export default function CheckoutPage() {
  const {
    itens,
    adicionarProduto,
    removerProduto,
    valorTotal,
    dadosCheckout,
    salvarDadosCheckout,
  } = useCart();

  const { loja } = useStore();

  const [clienteNome, setClienteNome] = useState(
    dadosCheckout.clienteNome || ""
  );

  const [clienteTelefone, setClienteTelefone] = useState(
    dadosCheckout.clienteTelefone || ""
  );

  const [tipoEntrega, setTipoEntrega] = useState<
    "entrega" | "retirada"
  >(dadosCheckout.tipoEntrega || "entrega");

  const [rua, setRua] = useState(
    dadosCheckout.rua || ""
  );

  const [numero, setNumero] = useState(
    dadosCheckout.numero || ""
  );

  const [bairro, setBairro] = useState(
    dadosCheckout.bairro || ""
  );

  const [complemento, setComplemento] = useState(
    dadosCheckout.complemento || ""
  );

  const [erroNome, setErroNome] = useState(false);
  const [erroTelefone, setErroTelefone] = useState(false);
  const [erroRua, setErroRua] = useState(false);
  const [erroNumero, setErroNumero] = useState(false);
  const [erroBairro, setErroBairro] = useState(false);

  const retiradaPermitida =
    loja?.retirada_permitida ?? true;

  const taxaEntrega =
    tipoEntrega === "entrega"
      ? loja?.taxa_entrega ?? 0
      : 0;

  const total = valorTotal + taxaEntrega;

  const quantidadeTotal = itens.reduce(
    (total, item) => total + item.quantidade,
    0
  );

  const formatarPreco = (valor: number) =>
    valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const formatarTelefone = (valor: string) => {
    const numeros = valor
      .replace(/\D/g, "")
      .slice(0, 11);

    if (numeros.length <= 2) {
      return numeros;
    }

    if (numeros.length <= 6) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    }

    if (numeros.length <= 10) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(
        2,
        6
      )}-${numeros.slice(6)}`;
    }

    return `(${numeros.slice(0, 2)}) ${numeros.slice(
      2,
      7
    )}-${numeros.slice(7)}`;
  };

  const telefoneNumeros =
    clienteTelefone.replace(/\D/g, "");

  const enderecoCompleto = [
    rua,
    numero,
    bairro,
    loja?.cidade,
    loja?.estado,
  ]
    .filter(Boolean)
    .join(", ");

  const abrirEnderecoMaps = () => {
    if (
      !rua.trim() ||
      !numero.trim() ||
      !bairro.trim()
    ) {
      alert(
        "Preencha Rua, Número e Bairro antes de conferir no Google Maps."
      );

      return;
    }

    const url =
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        enderecoCompleto
      )}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const validarCheckout = () => {
    const nomeInvalido =
      clienteNome.trim().length < 2;

    const telefoneInvalido =
      telefoneNumeros.length < 10;

    setErroNome(nomeInvalido);
    setErroTelefone(telefoneInvalido);

    let enderecoInvalido = false;

    if (tipoEntrega === "entrega") {
      const ruaInvalida = !rua.trim();
      const numeroInvalido = !numero.trim();
      const bairroInvalido = !bairro.trim();

      setErroRua(ruaInvalida);
      setErroNumero(numeroInvalido);
      setErroBairro(bairroInvalido);

      enderecoInvalido =
        ruaInvalida ||
        numeroInvalido ||
        bairroInvalido;
    } else {
      setErroRua(false);
      setErroNumero(false);
      setErroBairro(false);
    }

    if (nomeInvalido || telefoneInvalido) {
      return {
        valido: false,
        mensagem:
          "Informe seu nome e WhatsApp para continuar.",
      };
    }

    if (enderecoInvalido) {
      return {
        valido: false,
        mensagem:
          "Preencha Rua, Número e Bairro para continuar com a entrega.",
      };
    }

    return {
      valido: true,
      mensagem: "",
    };
  };

  const salvarCheckout = (
    event: React.MouseEvent<HTMLAnchorElement>
  ) => {
    const resultado = validarCheckout();

    if (!resultado.valido) {
      event.preventDefault();

      alert(resultado.mensagem);

      return;
    }

    salvarDadosCheckout({
      clienteNome: clienteNome.trim(),
      clienteTelefone: telefoneNumeros,

      tipoEntrega,

      rua:
        tipoEntrega === "entrega"
          ? rua.trim()
          : "",

      numero:
        tipoEntrega === "entrega"
          ? numero.trim()
          : "",

      bairro:
        tipoEntrega === "entrega"
          ? bairro.trim()
          : "",

      complemento:
        tipoEntrega === "entrega"
          ? complemento.trim()
          : "",

      taxaEntrega,
    });
  };

  if (itens.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
            <ShoppingBag
              size={28}
              className="text-zinc-400"
            />
          </div>

          <h1 className="mt-4 text-xl font-extrabold">
            Seu carrinho está vazio
          </h1>

          <p className="mt-2 text-sm leading-5 text-zinc-500">
            Escolha seus produtos antes de finalizar o pedido.
          </p>

          <Link
            href="/menu"
            className="mt-5 flex min-h-14 w-full items-center justify-center rounded-2xl bg-zinc-950 px-5 font-bold text-white"
          >
            Voltar à loja
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 pb-36 text-zinc-950">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <Link
            href="/menu"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 active:scale-95"
          >
            <ArrowLeft size={20} />
          </Link>

          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium text-zinc-500">
              {loja?.nome || "Sua loja"}
            </p>

            <h1 className="text-lg font-extrabold">
              Seu pedido
            </h1>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-md space-y-3 px-3 py-3">
        {/* CARRINHO */}
        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Carrinho
              </p>

              <h2 className="mt-0.5 font-extrabold">
                {quantidadeTotal}{" "}
                {quantidadeTotal === 1
                  ? "item"
                  : "itens"}
              </h2>
            </div>

            <span className="text-lg font-extrabold">
              {formatarPreco(valorTotal)}
            </span>
          </div>

          <div className="space-y-2">
            {itens.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-5">
                    {item.nome}
                  </p>

                  <p className="mt-0.5 text-xs text-zinc-500">
                    {formatarPreco(item.preco)} cada
                  </p>
                </div>

                <div className="flex shrink-0 items-center rounded-xl bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() =>
                      removerProduto(item.id)
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                  >
                    <Minus size={14} />
                  </button>

                  <span className="w-7 text-center text-xs font-bold">
                    {item.quantidade}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      adicionarProduto({
                        id: item.id,
                        nome: item.nome,
                        preco: item.preco,
                        imagem: item.imagem,
                      })
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-white"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* DADOS DO CLIENTE */}
        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
              <User size={18} />
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Identificação
              </p>

              <h2 className="mt-0.5 font-extrabold">
                Seus dados
              </h2>

              <p className="mt-0.5 text-xs leading-5 text-zinc-500">
                Precisamos desses dados para identificar seu pedido.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {/* NOME */}
            <div>
              <label
                htmlFor="clienteNome"
                className="mb-1.5 block text-xs font-bold text-zinc-700"
              >
                Nome *
              </label>

              <div className="relative">
                <User
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                />

                <input
                  id="clienteNome"
                  name="clienteNome"
                  type="text"
                  value={clienteNome}
                  onChange={(e) => {
                    setClienteNome(e.target.value);

                    if (
                      e.target.value.trim().length >= 2
                    ) {
                      setErroNome(false);
                    }
                  }}
                  placeholder="Seu nome"
                  autoComplete="name"
                  className={`h-14 w-full appearance-none rounded-2xl border pl-11 pr-4 text-base outline-none ${
                    erroNome
                      ? "border-red-500 bg-red-50"
                      : "border-transparent bg-zinc-100 focus:border-zinc-300 focus:bg-white"
                  }`}
                />
              </div>

              {erroNome && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  Informe seu nome.
                </p>
              )}
            </div>

            {/* WHATSAPP */}
            <div>
              <label
                htmlFor="clienteTelefone"
                className="mb-1.5 block text-xs font-bold text-zinc-700"
              >
                WhatsApp *
              </label>

              <div className="relative">
                <Phone
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                />

                <input
                  id="clienteTelefone"
                  name="clienteTelefone"
                  type="tel"
                  value={clienteTelefone}
                  onChange={(e) => {
                    const telefone =
                      formatarTelefone(
                        e.target.value
                      );

                    setClienteTelefone(
                      telefone
                    );

                    if (
                      telefone.replace(/\D/g, "")
                        .length >= 10
                    ) {
                      setErroTelefone(false);
                    }
                  }}
                  placeholder="(22) 99999-9999"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={15}
                  className={`h-14 w-full appearance-none rounded-2xl border pl-11 pr-4 text-base outline-none ${
                    erroTelefone
                      ? "border-red-500 bg-red-50"
                      : "border-transparent bg-zinc-100 focus:border-zinc-300 focus:bg-white"
                  }`}
                />
              </div>

              {erroTelefone && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  Informe um WhatsApp válido com DDD.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* RECEBIMENTO */}
        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Recebimento
          </p>

          <h2 className="mt-0.5 font-extrabold">
            Como você quer receber?
          </h2>

          <div
            className={`mt-3 grid gap-2 ${
              retiradaPermitida
                ? "grid-cols-2"
                : "grid-cols-1"
            }`}
          >
            <button
              type="button"
              onClick={() =>
                setTipoEntrega("entrega")
              }
              className={`relative min-h-[104px] rounded-2xl border-2 p-3 text-left ${
                tipoEntrega === "entrega"
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-zinc-200 bg-white"
              }`}
            >
              {tipoEntrega === "entrega" && (
                <div className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-zinc-950">
                  <Check size={12} />
                </div>
              )}

              <Truck size={20} />

              <p className="mt-4 text-sm font-bold">
                Entrega
              </p>

              <p className="mt-0.5 text-[11px] opacity-70">
                {taxaEntrega === 0
                  ? "Grátis"
                  : `+ ${formatarPreco(
                      loja?.taxa_entrega ?? 0
                    )}`}
              </p>
            </button>

            {retiradaPermitida && (
              <button
                type="button"
                onClick={() => {
                  setTipoEntrega("retirada");

                  setErroRua(false);
                  setErroNumero(false);
                  setErroBairro(false);
                }}
                className={`relative min-h-[104px] rounded-2xl border-2 p-3 text-left ${
                  tipoEntrega === "retirada"
                    ? "border-zinc-950 bg-zinc-950 text-white"
                    : "border-zinc-200 bg-white"
                }`}
              >
                {tipoEntrega === "retirada" && (
                  <div className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-zinc-950">
                    <Check size={12} />
                  </div>
                )}

                <ShoppingBag size={20} />

                <p className="mt-4 text-sm font-bold">
                  Retirada
                </p>

                <p className="mt-0.5 text-[11px] opacity-70">
                  Sem taxa
                </p>
              </button>
            )}
          </div>
        </section>

        {/* ENDEREÇO */}
        {tipoEntrega === "entrega" ? (
          <section className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                <MapPin size={18} />
              </div>

              <div>
                <h2 className="font-extrabold">
                  Endereço da entrega
                </h2>

                <p className="mt-0.5 text-xs leading-5 text-zinc-500">
                  Rua, número e bairro são obrigatórios.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor="rua"
                  className="mb-1.5 block text-xs font-bold text-zinc-700"
                >
                  Rua / Avenida *
                </label>

                <input
                  id="rua"
                  name="rua"
                  type="text"
                  value={rua}
                  onChange={(e) => {
                    setRua(e.target.value);

                    if (e.target.value.trim()) {
                      setErroRua(false);
                    }
                  }}
                  placeholder="Ex.: Rua das Flores"
                  autoComplete="address-line1"
                  className={`h-14 w-full appearance-none rounded-2xl border px-4 text-base outline-none ${
                    erroRua
                      ? "border-red-500 bg-red-50"
                      : "border-transparent bg-zinc-100 focus:border-zinc-300 focus:bg-white"
                  }`}
                />

                {erroRua && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    Informe a rua.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-[105px_minmax(0,1fr)] gap-2">
                <div>
                  <label
                    htmlFor="numero"
                    className="mb-1.5 block text-xs font-bold text-zinc-700"
                  >
                    Número *
                  </label>

                  <input
                    id="numero"
                    name="numero"
                    type="text"
                    value={numero}
                    onChange={(e) => {
                      setNumero(e.target.value);

                      if (e.target.value.trim()) {
                        setErroNumero(false);
                      }
                    }}
                    placeholder="123"
                    inputMode="numeric"
                    autoComplete="address-line2"
                    className={`h-14 w-full appearance-none rounded-2xl border px-3 text-base outline-none ${
                      erroNumero
                        ? "border-red-500 bg-red-50"
                        : "border-transparent bg-zinc-100 focus:border-zinc-300 focus:bg-white"
                    }`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="bairro"
                    className="mb-1.5 block text-xs font-bold text-zinc-700"
                  >
                    Bairro *
                  </label>

                  <input
                    id="bairro"
                    name="bairro"
                    type="text"
                    value={bairro}
                    onChange={(e) => {
                      setBairro(e.target.value);

                      if (e.target.value.trim()) {
                        setErroBairro(false);
                      }
                    }}
                    placeholder="Seu bairro"
                    autoComplete="address-level3"
                    className={`h-14 w-full appearance-none rounded-2xl border px-4 text-base outline-none ${
                      erroBairro
                        ? "border-red-500 bg-red-50"
                        : "border-transparent bg-zinc-100 focus:border-zinc-300 focus:bg-white"
                    }`}
                  />
                </div>
              </div>

              {(erroNumero || erroBairro) && (
                <p className="text-xs font-medium text-red-600">
                  Preencha número e bairro.
                </p>
              )}

              <div>
                <label
                  htmlFor="complemento"
                  className="mb-1.5 block text-xs font-bold text-zinc-700"
                >
                  Complemento

                  <span className="ml-1 font-normal text-zinc-400">
                    opcional
                  </span>
                </label>

                <input
                  id="complemento"
                  name="complemento"
                  type="text"
                  value={complemento}
                  onChange={(e) =>
                    setComplemento(e.target.value)
                  }
                  placeholder="Casa, apto, bloco ou referência"
                  autoComplete="off"
                  className="h-14 w-full appearance-none rounded-2xl border border-transparent bg-zinc-100 px-4 text-base outline-none focus:border-zinc-300 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={abrirEnderecoMaps}
              className="mt-4 flex min-h-14 w-full items-center justify-between rounded-2xl border border-zinc-200 bg-white px-3 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
                  <Navigation size={17} />
                </div>

                <div>
                  <p className="text-sm font-bold">
                    Conferir no Google Maps
                  </p>

                  <p className="text-[11px] text-zinc-500">
                    Verifique o endereço da entrega
                  </p>
                </div>
              </div>

              <ChevronRight
                size={18}
                className="text-zinc-400"
              />
            </button>
          </section>
        ) : (
          <section className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                <MapPin size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="font-extrabold">
                  Retirada na loja
                </h2>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  {[
                    loja?.endereco,
                    loja?.numero,
                    loja?.bairro,
                    loja?.cidade,
                    loja?.estado,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>

                {loja?.google_maps_url && (
                  <a
                    href={loja.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold"
                  >
                    <Navigation size={14} />

                    Abrir no Google Maps
                  </a>
                )}
              </div>
            </div>
          </section>
        )}

        {/* PAGAMENTO */}
        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
                <CreditCard size={18} />
              </div>

              <div>
                <h2 className="text-sm font-extrabold">
                  Pagamento
                </h2>

                <p className="text-xs text-zinc-500">
                  Pix
                </p>
              </div>
            </div>

            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950 text-white">
              <Check size={14} />
            </div>
          </div>
        </section>

        {/* RESUMO */}
        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold">
              Resumo
            </h2>

            <span className="text-xs text-zinc-500">
              {quantidadeTotal}{" "}
              {quantidadeTotal === 1
                ? "item"
                : "itens"}
            </span>
          </div>

          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between text-zinc-500">
              <span>Produtos</span>

              <span>
                {formatarPreco(valorTotal)}
              </span>
            </div>

            <div className="flex justify-between text-zinc-500">
              <span>
                {tipoEntrega === "entrega"
                  ? "Entrega"
                  : "Retirada"}
              </span>

              <span>
                {taxaEntrega === 0
                  ? "Grátis"
                  : formatarPreco(taxaEntrega)}
              </span>
            </div>

            <div className="mt-3 flex items-end justify-between border-t border-zinc-100 pt-3">
              <span className="font-bold">
                Total
              </span>

              <span className="text-2xl font-extrabold">
                {formatarPreco(total)}
              </span>
            </div>
          </div>
        </section>
      </section>

      {/* CONTINUAR */}
      <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-zinc-200 bg-white/95 px-3 pt-2 pb-[max(10px,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.10)] backdrop-blur">
        <Link
          href="/pagamento"
          onClick={salvarCheckout}
          className="mx-auto flex h-16 w-full max-w-md items-center justify-between rounded-2xl bg-zinc-950 px-5 text-white shadow-xl active:scale-[0.99]"
        >
          <div>
            <p className="text-[11px] text-zinc-400">
              Total do pedido
            </p>

            <p className="text-lg font-extrabold">
              {formatarPreco(total)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">
              Continuar
            </span>

            <ChevronRight size={18} />
          </div>
        </Link>
      </div>
    </main>
  );
}
