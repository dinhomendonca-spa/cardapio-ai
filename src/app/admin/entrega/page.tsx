"use client";

import {
  ArrowLeft,
  ExternalLink,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Save,
  Store,
  Truck,
  WandSparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useStore } from "@/context/StoreContext";

export default function EntregaPage() {
  const { loja, carregando, salvarLoja } = useStore();

  const [taxaEntrega, setTaxaEntrega] = useState("");
  const [retiradaPermitida, setRetiradaPermitida] = useState(true);

  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cep, setCep] = useState("");

  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!loja) return;

    setTaxaEntrega(
      loja.taxa_entrega.toFixed(2).replace(".", ",")
    );

    setRetiradaPermitida(loja.retirada_permitida);
    setEndereco(loja.endereco);
    setNumero(loja.numero);
    setBairro(loja.bairro);
    setCidade(loja.cidade);
    setEstado(loja.estado);
    setCep(loja.cep);
    setGoogleMapsUrl(loja.google_maps_url);
  }, [loja]);

  const enderecoCompleto = useMemo(() => {
    return [
      endereco,
      numero,
      bairro,
      cidade,
      estado,
      cep,
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

  const gerarLinkGoogleMaps = () => {
    if (!enderecoCompleto.trim()) {
      alert("Preencha o endereço antes de gerar o link.");
      return;
    }

    const link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      enderecoCompleto
    )}`;

    setGoogleMapsUrl(link);
  };

  const abrirGoogleMaps = () => {
    if (googleMapsUrl.trim()) {
      window.open(googleMapsUrl, "_blank");
      return;
    }

    if (enderecoCompleto.trim()) {
      const link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        enderecoCompleto
      )}`;

      window.open(link, "_blank");
      return;
    }

    window.open("https://www.google.com/maps", "_blank");
  };

  const salvar = async () => {
    if (!loja) return;

    const taxa = Number(taxaEntrega.replace(",", "."));

    if (Number.isNaN(taxa) || taxa < 0) {
      alert("Informe uma taxa de entrega válida.");
      return;
    }

    try {
      setSalvando(true);

      await salvarLoja({
        nome: loja.nome,
        descricao: loja.descricao,
        whatsapp: loja.whatsapp,
        chave_pix: loja.chave_pix,

        cidade: cidade.trim(),
        estado: estado.trim().toUpperCase(),

        logo: loja.logo,
        banner: loja.banner,
        ativo: loja.ativo,

        taxa_entrega: taxa,
        retirada_permitida: retiradaPermitida,

        endereco: endereco.trim(),
        numero: numero.trim(),
        bairro: bairro.trim(),
        cep: cep.trim(),

        latitude: loja.latitude,
        longitude: loja.longitude,

        google_maps_url: googleMapsUrl.trim(),
      });

      alert("Configurações de entrega salvas.");
    } catch (error) {
      console.error("Erro ao salvar entrega:", error);
      alert("Não foi possível salvar as configurações.");
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100">
        <Loader2 size={28} className="animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 pb-10 text-zinc-950">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-4 px-4 py-4">
          <Link
            href="/admin"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100"
          >
            <ArrowLeft size={20} />
          </Link>

          <div>
            <p className="text-xs text-zinc-500">
              Painel do comerciante
            </p>
            <h1 className="text-lg font-bold">
              Entrega
            </h1>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-md space-y-5 px-4 py-5">
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950 text-white">
              <Truck size={21} />
            </div>

            <div>
              <h2 className="font-bold">
                Configuração da entrega
              </h2>

              <p className="text-sm text-zinc-500">
                Defina taxa e retirada no local
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Taxa de entrega
              </label>

              <input
                value={taxaEntrega}
                onChange={(e) =>
                  setTaxaEntrega(e.target.value)
                }
                placeholder="6,00"
                inputMode="decimal"
                className="w-full rounded-2xl bg-zinc-100 px-4 py-4 outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setRetiradaPermitida(!retiradaPermitida)
              }
              className="flex w-full items-center justify-between rounded-2xl bg-zinc-100 px-4 py-4"
            >
              <div className="text-left">
                <p className="font-semibold">
                  Retirada no local
                </p>

                <p className="text-sm text-zinc-500">
                  Permitir que o cliente busque o pedido
                </p>
              </div>

              <div
                className={`relative h-7 w-12 rounded-full transition ${
                  retiradaPermitida
                    ? "bg-zinc-950"
                    : "bg-zinc-300"
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

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Store size={19} />
            <h2 className="font-bold">
              Endereço da loja
            </h2>
          </div>

          <div className="mt-4 space-y-3">
            <input
              value={endereco}
              onChange={(e) =>
                setEndereco(e.target.value)
              }
              placeholder="Rua / Avenida"
              className="w-full rounded-2xl bg-zinc-100 px-4 py-4 outline-none"
            />

            <div className="grid grid-cols-3 gap-3">
              <input
                value={numero}
                onChange={(e) =>
                  setNumero(e.target.value)
                }
                placeholder="Número"
                className="rounded-2xl bg-zinc-100 px-4 py-4 outline-none"
              />

              <input
                value={bairro}
                onChange={(e) =>
                  setBairro(e.target.value)
                }
                placeholder="Bairro"
                className="col-span-2 rounded-2xl bg-zinc-100 px-4 py-4 outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <input
                value={cidade}
                onChange={(e) =>
                  setCidade(e.target.value)
                }
                placeholder="Cidade"
                className="col-span-2 rounded-2xl bg-zinc-100 px-4 py-4 outline-none"
              />

              <input
                value={estado}
                onChange={(e) =>
                  setEstado(e.target.value)
                }
                placeholder="UF"
                maxLength={2}
                className="rounded-2xl bg-zinc-100 px-4 py-4 uppercase outline-none"
              />
            </div>

            <input
              value={cep}
              onChange={(e) =>
                setCep(e.target.value)
              }
              placeholder="CEP"
              inputMode="numeric"
              className="w-full rounded-2xl bg-zinc-100 px-4 py-4 outline-none"
            />
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <MapPin size={19} />
            <h2 className="font-bold">
              Localização no Google Maps
            </h2>
          </div>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            No computador, gere o link pelo endereço. No celular, você também pode abrir o Google Maps e confirmar o ponto.
          </p>

          <button
            type="button"
            onClick={gerarLinkGoogleMaps}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 py-4 font-semibold text-white"
          >
            <WandSparkles size={18} />
            Gerar link pelo endereço
          </button>

          <button
            type="button"
            onClick={abrirGoogleMaps}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-100 px-5 py-4 font-semibold"
          >
            <ExternalLink size={18} />
            Abrir no Google Maps
          </button>

          <div className="mt-4">
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <LinkIcon size={16} />
              Link da localização
            </label>

            <input
              value={googleMapsUrl}
              onChange={(e) =>
                setGoogleMapsUrl(e.target.value)
              }
              placeholder="Link do Google Maps"
              inputMode="url"
              className="w-full rounded-2xl bg-zinc-100 px-4 py-4 outline-none"
            />
          </div>
        </section>

        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 py-4 font-semibold text-white shadow-lg disabled:opacity-60"
        >
          {salvando ? (
            <>
              <Loader2 size={19} className="animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save size={19} />
              Salvar configurações
            </>
          )}
        </button>
      </section>
    </main>
  );
}