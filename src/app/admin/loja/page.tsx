"use client";

import Image from "next/image";
import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Circle,
  ImageIcon,
  ImagePlus,
  Loader2,
  MapPin,
  MessageCircle,
  Save,
  Sparkles,
  Store,
} from "lucide-react";

import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useStore,
} from "@/context/StoreContext";

import {
  supabase,
} from "@/lib/supabase";

import {
  validarChavePix,
} from "@/lib/validarChavePix";

const TAMANHO_MAXIMO =
  5 * 1024 * 1024;

function imagemEhPadrao(
  url: string | null | undefined,
  arquivoPadrao: string
) {
  if (!url) {
    return true;
  }

  return url.endsWith(
    arquivoPadrao
  );
}

export default function LojaPage() {
  const {
    loja,
    carregando,
    salvarLoja,
  } = useStore();

  const logoInputRef =
    useRef<HTMLInputElement>(
      null
    );

  const bannerInputRef =
    useRef<HTMLInputElement>(
      null
    );

  const [
    nome,
    setNome,
  ] = useState("");

  const [
    descricao,
    setDescricao,
  ] = useState("");

  const [
    whatsapp,
    setWhatsapp,
  ] = useState("");

  const [
    chavePix,
    setChavePix,
  ] = useState("");

  const [
    chavePixTocada,
    setChavePixTocada,
  ] = useState(false);

  const [
    cidade,
    setCidade,
  ] = useState("");

  const [
    estado,
    setEstado,
  ] = useState("");

  const [
    logoArquivo,
    setLogoArquivo,
  ] =
    useState<File | null>(
      null
    );

  const [
    bannerArquivo,
    setBannerArquivo,
  ] =
    useState<File | null>(
      null
    );

  const [
    logoPreview,
    setLogoPreview,
  ] =
    useState<string | null>(
      null
    );

  const [
    bannerPreview,
    setBannerPreview,
  ] =
    useState<string | null>(
      null
    );

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

    setNome(
      loja.nome ===
        "Minha loja"
        ? ""
        : loja.nome
    );

    setDescricao(
      loja.descricao
    );

    setWhatsapp(
      loja.whatsapp
    );

    setChavePix(
      loja.chave_pix
    );

    setCidade(
      loja.cidade
    );

    setEstado(
      loja.estado
    );
  }, [
    loja,
  ]);

  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(
          logoPreview
        );
      }

      if (bannerPreview) {
        URL.revokeObjectURL(
          bannerPreview
        );
      }
    };
  }, [
    logoPreview,
    bannerPreview,
  ]);

  const resultadoChavePix =
    validarChavePix(
      chavePix
    );

  const chavePixPreenchida =
    chavePix.trim().length > 0;

  const chavePixValida =
    !chavePixPreenchida ||
    resultadoChavePix.valida;

  const validarImagem = (
    arquivo: File
  ) => {
    if (
      !arquivo.type.startsWith(
        "image/"
      )
    ) {
      alert(
        "Selecione um arquivo de imagem."
      );

      return false;
    }

    if (
      arquivo.size >
      TAMANHO_MAXIMO
    ) {
      alert(
        "A imagem deve ter no máximo 5 MB."
      );

      return false;
    }

    return true;
  };

  const selecionarLogo = (
    event:
      ChangeEvent<HTMLInputElement>
  ) => {
    const arquivo =
      event.target.files?.[0];

    if (
      !arquivo ||
      !validarImagem(arquivo)
    ) {
      event.target.value =
        "";

      return;
    }

    if (logoPreview) {
      URL.revokeObjectURL(
        logoPreview
      );
    }

    setLogoArquivo(
      arquivo
    );

    setLogoPreview(
      URL.createObjectURL(
        arquivo
      )
    );

    setSalvo(false);
  };

  const selecionarBanner = (
    event:
      ChangeEvent<HTMLInputElement>
  ) => {
    const arquivo =
      event.target.files?.[0];

    if (
      !arquivo ||
      !validarImagem(arquivo)
    ) {
      event.target.value =
        "";

      return;
    }

    if (bannerPreview) {
      URL.revokeObjectURL(
        bannerPreview
      );
    }

    setBannerArquivo(
      arquivo
    );

    setBannerPreview(
      URL.createObjectURL(
        arquivo
      )
    );

    setSalvo(false);
  };

  const uploadImagem =
    async (
      arquivo: File,
      prefixo: string
    ) => {
      const extensao =
        arquivo.name
          .split(".")
          .pop()
          ?.toLowerCase() ||
        "jpg";

      const nomeArquivo =
        `lojas/${loja?.id}/${prefixo}-${Date.now()}-${crypto.randomUUID()}.${extensao}`;

      const {
        error,
      } =
        await supabase.storage
          .from(
            "product-images"
          )
          .upload(
            nomeArquivo,
            arquivo,
            {
              cacheControl:
                "3600",

              upsert:
                false,
            }
          );

      if (error) {
        throw error;
      }

      const {
        data,
      } =
        supabase.storage
          .from(
            "product-images"
          )
          .getPublicUrl(
            nomeArquivo
          );

      return data.publicUrl;
    };

  const nomePreenchido =
    nome.trim().length >= 2;

  const descricaoPreenchida =
    descricao.trim().length >= 10;

  const contatoPreenchido =
    whatsapp
      .replace(/\D/g, "")
      .length >= 10;

  const localPreenchido =
    cidade.trim().length >= 2 &&
    estado.trim().length === 2;

  const logoConfigurada =
    Boolean(
      logoArquivo ||
      (
        loja?.logo &&
        !imagemEhPadrao(
          loja.logo,
          "/images/logo.png"
        )
      )
    );

  const bannerConfigurado =
    Boolean(
      bannerArquivo ||
      (
        loja?.banner &&
        !imagemEhPadrao(
          loja.banner,
          "/images/banner.png"
        )
      )
    );

  const itensConcluidos = [
    nomePreenchido &&
      descricaoPreenchida,

    logoConfigurada &&
      bannerConfigurado,

    contatoPreenchido &&
      chavePixValida,

    localPreenchido,
  ].filter(Boolean).length;

  const etapaCompleta =
    itensConcluidos === 4;

  const salvar =
    async () => {
      setChavePixTocada(
        true
      );

      if (!nomePreenchido) {
        alert(
          "Informe o nome da loja."
        );

        return;
      }

      if (
        !descricaoPreenchida
      ) {
        alert(
          "Escreva uma descrição com pelo menos 10 caracteres."
        );

        return;
      }

      if (
        !logoConfigurada
      ) {
        alert(
          "Adicione o logotipo da loja."
        );

        return;
      }

      if (
        !bannerConfigurado
      ) {
        alert(
          "Adicione uma imagem de capa."
        );

        return;
      }

      if (
        !contatoPreenchido
      ) {
        alert(
          "Informe um WhatsApp válido."
        );

        return;
      }

      if (
        !chavePixValida
      ) {
        alert(
          resultadoChavePix.mensagem
        );

        return;
      }

      if (
        !localPreenchido
      ) {
        alert(
          "Informe a cidade e a UF."
        );

        return;
      }

      try {
        setSalvando(true);
        setSalvo(false);

        let logoUrl =
          loja?.logo ?? "";

        let bannerUrl =
          loja?.banner ?? "";

        if (logoArquivo) {
          logoUrl =
            await uploadImagem(
              logoArquivo,
              "logo"
            );
        }

        if (bannerArquivo) {
          bannerUrl =
            await uploadImagem(
              bannerArquivo,
              "banner"
            );
        }

        await salvarLoja({
          nome:
            nome.trim(),

          descricao:
            descricao.trim(),

          whatsapp:
            whatsapp.trim(),

          chave_pix:
            resultadoChavePix
              .normalizada,

          cidade:
            cidade.trim(),

          estado:
            estado
              .trim()
              .toUpperCase(),

          logo:
            logoUrl,

          banner:
            bannerUrl,
        });

        setChavePix(
          resultadoChavePix
            .normalizada
        );

        setLogoArquivo(null);
        setBannerArquivo(null);

        setLogoPreview(null);
        setBannerPreview(null);

        setSalvo(true);
      } catch (error) {
        console.error(
          "Erro ao salvar loja:",
          error
        );

        alert(
          "Não foi possível salvar os dados da loja."
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
            className="mx-auto animate-spin text-sky-400"
            size={30}
          />

          <p className="mt-3 text-sm text-slate-400">
            Preparando sua loja...
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
            href="/admin"
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
              Monte sua loja
            </h1>
          </div>

          <div className="ml-auto rounded-full bg-sky-500/15 px-3 py-1.5 text-xs font-bold text-sky-300">
            1 de 4
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-md space-y-5 px-4 py-5">
        <section className="overflow-hidden rounded-[28px] border border-sky-300/20 bg-gradient-to-br from-sky-500/20 to-blue-600/10 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white">
              <Sparkles
                size={22}
              />
            </div>

            <div>
              <h2 className="font-black">
                Vamos configurar sua loja
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-300">
                Complete os itens abaixo. Você poderá alterar tudo novamente quando quiser.
              </p>
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all"
              style={{
                width:
                  `${itensConcluidos * 25}%`,
              }}
            />
          </div>

          <p className="mt-2 text-xs font-semibold text-sky-200">
            {itensConcluidos} de 4 itens concluídos
          </p>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-300">
              <Store
                size={20}
              />
            </div>

            <div>
              <h2 className="font-bold">
                Identidade
              </h2>

              <p className="text-xs text-slate-400">
                Como os clientes reconhecerão sua loja
              </p>
            </div>

            {nomePreenchido &&
            descricaoPreenchida ? (
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

          <div className="mt-5 space-y-4">
            <input
              value={nome}
              onChange={(event) => {
                setNome(
                  event.target.value
                );

                setSalvo(false);
              }}
              placeholder="Nome da loja"
              className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 outline-none focus:border-sky-400"
            />

            <textarea
              value={descricao}
              onChange={(event) => {
                setDescricao(
                  event.target.value
                );

                setSalvo(false);
              }}
              placeholder="Conte aos clientes o que sua loja vende."
              rows={4}
              maxLength={180}
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-4 outline-none focus:border-sky-400"
            />

            <p className="text-right text-xs text-slate-500">
              {descricao.length}/180
            </p>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
              <ImageIcon
                size={20}
              />
            </div>

            <div>
              <h2 className="font-bold">
                Imagens
              </h2>

              <p className="text-xs text-slate-400">
                Logotipo e capa da loja
              </p>
            </div>

            {logoConfigurada &&
            bannerConfigurado ? (
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

          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={
              selecionarLogo
            }
            className="hidden"
          />

          <input
            ref={bannerInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={
              selecionarBanner
            }
            className="hidden"
          />

          <div className="mt-5 space-y-4">
            <button
              type="button"
              onClick={() =>
                logoInputRef
                  .current
                  ?.click()
              }
              className="relative flex min-h-44 w-full overflow-hidden rounded-[24px] border-2 border-dashed border-sky-400/30 bg-sky-400/[0.06]"
            >
              {logoPreview ||
              (
                loja?.logo &&
                !imagemEhPadrao(
                  loja.logo,
                  "/images/logo.png"
                )
              ) ? (
                <Image
                  src={
                    logoPreview ||
                    loja?.logo ||
                    ""
                  }
                  alt="Logotipo da loja"
                  fill
                  className="object-contain p-4"
                  unoptimized={
                    Boolean(
                      logoPreview
                    )
                  }
                />
              ) : (
                <div className="m-auto flex flex-col items-center px-6 text-center">
                  <ImagePlus
                    size={30}
                    className="text-sky-400"
                  />

                  <strong className="mt-3">
                    Adicione seu logotipo
                  </strong>

                  <span className="mt-1 text-xs text-slate-400">
                    Recomendado: 500 × 500 pixels
                  </span>
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                bannerInputRef
                  .current
                  ?.click()
              }
              className="relative flex min-h-44 w-full overflow-hidden rounded-[24px] border-2 border-dashed border-violet-400/30 bg-violet-400/[0.06]"
            >
              {bannerPreview ||
              (
                loja?.banner &&
                !imagemEhPadrao(
                  loja.banner,
                  "/images/banner.png"
                )
              ) ? (
                <Image
                  src={
                    bannerPreview ||
                    loja?.banner ||
                    ""
                  }
                  alt="Capa da loja"
                  fill
                  className="object-cover"
                  unoptimized={
                    Boolean(
                      bannerPreview
                    )
                  }
                />
              ) : (
                <div className="m-auto flex flex-col items-center px-6 text-center">
                  <ImagePlus
                    size={30}
                    className="text-violet-400"
                  />

                  <strong className="mt-3">
                    Adicione uma imagem de capa
                  </strong>

                  <span className="mt-1 text-xs text-slate-400">
                    Recomendado: 1200 × 500 pixels
                  </span>
                </div>
              )}
            </button>

            <p className="text-center text-xs text-slate-500">
              JPG, PNG ou WEBP — máximo de 5 MB
            </p>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
              <MessageCircle
                size={20}
              />
            </div>

            <div>
              <h2 className="font-bold">
                Contato e Pix
              </h2>

              <p className="text-xs text-slate-400">
                Para receber pedidos e pagamentos
              </p>
            </div>

            {contatoPreenchido &&
            chavePixValida ? (
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

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-300">
                WhatsApp da loja
              </label>

              <input
                value={whatsapp}
                onChange={(event) => {
                  setWhatsapp(
                    event.target.value
                  );

                  setSalvo(false);
                }}
                placeholder="(22) 99999-9999"
                inputMode="tel"
                className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-300">
                Chave Pix da loja
              </label>

              <input
                value={chavePix}
                onChange={(event) => {
                  setChavePix(
                    event.target.value
                  );

                  setChavePixTocada(
                    true
                  );

                  setSalvo(false);
                }}
                onBlur={() =>
                  setChavePixTocada(
                    true
                  )
                }
                placeholder="CPF, CNPJ, e-mail, celular ou chave aleatória"
                aria-invalid={
                  chavePixTocada &&
                  !chavePixValida
                }
                className={`h-14 w-full rounded-2xl border bg-white/[0.07] px-4 outline-none ${
                  chavePixTocada &&
                  !chavePixValida
                    ? "border-red-400 focus:border-red-400"
                    : chavePixPreenchida &&
                        chavePixValida
                      ? "border-emerald-400/60 focus:border-emerald-400"
                      : "border-white/10 focus:border-emerald-400"
                }`}
              />

              {!chavePixPreenchida ? (
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Aceitamos CPF, CNPJ, e-mail, celular com DDD ou chave aleatória.
                </p>
              ) : (
                <div
                  className={`mt-2 flex items-start gap-2 rounded-xl p-3 ${
                    resultadoChavePix.valida
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-red-400/10 text-red-300"
                  }`}
                >
                  {resultadoChavePix.valida ? (
                    <Check
                      size={16}
                      className="mt-0.5 shrink-0"
                    />
                  ) : (
                    <Circle
                      size={16}
                      className="mt-0.5 shrink-0"
                    />
                  )}

                  <p className="text-xs font-medium leading-5">
                    {resultadoChavePix.mensagem}

                    {resultadoChavePix.valida &&
                      resultadoChavePix.tipo &&
                      ` Tipo identificado: ${resultadoChavePix.tipo}.`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
          <div className="flex items-center gap-3">
            <MapPin
              size={20}
              className="text-amber-300"
            />

            <div>
              <h2 className="font-bold">
                Localização
              </h2>

              <p className="text-xs text-slate-400">
                Cidade atendida
              </p>
            </div>

            {localPreenchido ? (
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

          <div className="mt-5 grid grid-cols-3 gap-3">
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
        </section>

        {salvo && (
          <div className="rounded-[24px] border border-emerald-400/25 bg-emerald-400/10 p-4">
            <p className="font-bold text-emerald-200">
              Primeira etapa concluída
            </p>

            <p className="mt-1 text-sm text-slate-300">
              Agora configure as opções de entrega e retirada.
            </p>

            <Link
              href="/admin/entrega"
              className="mt-4 flex h-14 items-center justify-between rounded-2xl bg-emerald-500 px-5 font-bold"
            >
              Configurar entrega

              <ArrowRight
                size={19}
              />
            </Link>
          </div>
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
            Complete os itens obrigatórios e corrija a chave Pix, se ela estiver preenchida.
          </p>
        )}
      </section>
    </main>
  );
}