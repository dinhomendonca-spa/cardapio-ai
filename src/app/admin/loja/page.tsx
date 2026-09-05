"use client";

import Image from "next/image";
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  Save,
  Store,
} from "lucide-react";
import Link from "next/link";
import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { useStore } from "@/context/StoreContext";
import { supabase } from "@/lib/supabase";

export default function LojaPage() {
  const { loja, carregando, salvarLoja } = useStore();

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  const [logoArquivo, setLogoArquivo] = useState<File | null>(null);
  const [bannerArquivo, setBannerArquivo] = useState<File | null>(null);

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!loja) return;

    setNome(loja.nome);
    setDescricao(loja.descricao);
    setWhatsapp(loja.whatsapp);
    setChavePix(loja.chave_pix);
    setCidade(loja.cidade);
    setEstado(loja.estado);
  }, [loja]);

  const selecionarLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];

    if (!arquivo) return;

    setLogoArquivo(arquivo);
    setLogoPreview(URL.createObjectURL(arquivo));
  };

  const selecionarBanner = (event: ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];

    if (!arquivo) return;

    setBannerArquivo(arquivo);
    setBannerPreview(URL.createObjectURL(arquivo));
  };

  const uploadImagem = async (
    arquivo: File,
    prefixo: string
  ) => {
    const extensao = arquivo.name.split(".").pop();
    const nomeArquivo = `${prefixo}-${Date.now()}-${crypto.randomUUID()}.${extensao}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(nomeArquivo, arquivo, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(nomeArquivo);

    return data.publicUrl;
  };

  const salvar = async () => {
    if (!nome.trim()) {
      alert("Informe o nome da loja.");
      return;
    }

    try {
      setSalvando(true);

      let logoUrl = loja?.logo ?? "";
      let bannerUrl = loja?.banner ?? "";

      if (logoArquivo) {
        logoUrl = await uploadImagem(logoArquivo, "logo");
      }

      if (bannerArquivo) {
        bannerUrl = await uploadImagem(
          bannerArquivo,
          "banner"
        );
      }

      await salvarLoja({
        nome: nome.trim(),
        descricao: descricao.trim(),
        whatsapp: whatsapp.trim(),
        chave_pix: chavePix.trim(),
        cidade: cidade.trim(),
        estado: estado.trim().toUpperCase(),
        logo: logoUrl,
        banner: bannerUrl,
        ativo: loja?.ativo ?? true,

        taxa_entrega: loja?.taxa_entrega ?? 0,
        retirada_permitida:
          loja?.retirada_permitida ?? true,
        endereco: loja?.endereco ?? "",
        numero: loja?.numero ?? "",
        bairro: loja?.bairro ?? "",
        cep: loja?.cep ?? "",
        latitude: loja?.latitude ?? null,
        longitude: loja?.longitude ?? null,
        google_maps_url:
          loja?.google_maps_url ?? "",
      });

      setLogoArquivo(null);
      setBannerArquivo(null);
      setLogoPreview(null);
      setBannerPreview(null);

      alert("Dados da loja salvos.");
    } catch (error) {
      console.error("Erro ao salvar loja:", error);
      alert("Não foi possível salvar os dados da loja.");
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100">
        <Loader2
          className="animate-spin"
          size={28}
        />
      </main>
    );
  }

  const logoAtual =
    logoPreview ||
    loja?.logo ||
    "/images/logo.png";

  const bannerAtual =
    bannerPreview ||
    loja?.banner ||
    "/images/banner.png";

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
              Dados da loja
            </h1>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-md space-y-5 px-4 py-5">
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950 text-white">
              <Store size={21} />
            </div>

            <div>
              <h2 className="font-bold">
                Identidade da loja
              </h2>

              <p className="text-sm text-zinc-500">
                Informações exibidas no cardápio
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <input
              value={nome}
              onChange={(e) =>
                setNome(e.target.value)
              }
              placeholder="Nome da loja"
              className="w-full rounded-2xl bg-zinc-100 px-4 py-4 outline-none"
            />

            <textarea
              value={descricao}
              onChange={(e) =>
                setDescricao(e.target.value)
              }
              placeholder="Descrição"
              rows={3}
              className="w-full resize-none rounded-2xl bg-zinc-100 px-4 py-4 outline-none"
            />
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="font-bold">
            Imagens
          </h2>

          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={selecionarLogo}
            className="hidden"
          />

          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={selecionarBanner}
            className="hidden"
          />

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                logoInputRef.current?.click()
              }
              className="relative min-h-32 overflow-hidden rounded-2xl border-2 border-dashed border-zinc-200"
            >
              <Image
                src={logoAtual}
                alt="Logo da loja"
                fill
                className="object-cover"
                unoptimized={Boolean(logoPreview)}
              />

              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 text-white">
                <ImagePlus size={22} />
                <span className="mt-2 text-sm font-semibold">
                  Trocar logo
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                bannerInputRef.current?.click()
              }
              className="relative min-h-32 overflow-hidden rounded-2xl border-2 border-dashed border-zinc-200"
            >
              <Image
                src={bannerAtual}
                alt="Banner da loja"
                fill
                className="object-cover"
                unoptimized={Boolean(bannerPreview)}
              />

              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 text-white">
                <ImagePlus size={22} />
                <span className="mt-2 text-sm font-semibold">
                  Trocar banner
                </span>
              </div>
            </button>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="font-bold">
            Contato e pagamento
          </h2>

          <div className="mt-4 space-y-3">
            <input
              value={whatsapp}
              onChange={(e) =>
                setWhatsapp(e.target.value)
              }
              placeholder="WhatsApp"
              inputMode="tel"
              className="w-full rounded-2xl bg-zinc-100 px-4 py-4 outline-none"
            />

            <input
              value={chavePix}
              onChange={(e) =>
                setChavePix(e.target.value)
              }
              placeholder="Chave Pix"
              className="w-full rounded-2xl bg-zinc-100 px-4 py-4 outline-none"
            />
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="font-bold">
            Localização
          </h2>

          <div className="mt-4 grid grid-cols-3 gap-3">
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
        </section>

        <button
          onClick={salvar}
          disabled={salvando}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 py-4 font-semibold text-white shadow-lg disabled:opacity-60"
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
              <Save size={19} />
              Salvar alterações
            </>
          )}
        </button>
      </section>
    </main>
  );
}