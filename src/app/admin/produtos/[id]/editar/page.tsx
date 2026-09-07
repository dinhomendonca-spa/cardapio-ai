"use client";

import Image from "next/image";

import {
  ArrowLeft,
  Boxes,
  ImagePlus,
  Loader2,
  Pencil,
  Save,
} from "lucide-react";

import Link from "next/link";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  supabase,
} from "@/lib/supabase";

type Produto = {
  id: number;
  nome: string;
  descricao: string;
  categoria: string;
  preco: number;
  estoque: number;
  estoque_controlado: boolean;
  imagem: string;
  ativo: boolean;
};

export default function EditarProdutoPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const id =
    Number(
      params.id
    );

  const inputImagemRef =
    useRef<HTMLInputElement>(
      null
    );

  const [
    produto,
    setProduto,
  ] =
    useState<Produto | null>(
      null
    );

  const [
    nome,
    setNome,
  ] =
    useState("");

  const [
    descricao,
    setDescricao,
  ] =
    useState("");

  const [
    categoria,
    setCategoria,
  ] =
    useState("");

  const [
    preco,
    setPreco,
  ] =
    useState("");

  const [
    estoque,
    setEstoque,
  ] =
    useState("");

  const [
    estoqueControlado,
    setEstoqueControlado,
  ] =
    useState(
      true
    );

  const [
    imagemAtual,
    setImagemAtual,
  ] =
    useState("");

  const [
    arquivo,
    setArquivo,
  ] =
    useState<File | null>(
      null
    );

  const [
    preview,
    setPreview,
  ] =
    useState<string | null>(
      null
    );

  const [
    carregando,
    setCarregando,
  ] =
    useState(
      true
    );

  const [
    salvando,
    setSalvando,
  ] =
    useState(
      false
    );

  /*
   * ======================================
   * CARREGAR PRODUTO
   * ======================================
   */

  useEffect(() => {
    const carregarProduto =
      async () => {
        try {
          setCarregando(
            true
          );

          const {
            data,
            error,
          } =
            await supabase
              .from(
                "produtos"
              )
              .select(
                "*"
              )
              .eq(
                "id",
                id
              )
              .single();

          if (
            error ||
            !data
          ) {
            throw (
              error ||
              new Error(
                "Produto não encontrado."
              )
            );
          }

          const produtoCarregado: Produto =
            {
              id:
                Number(
                  data.id
                ),

              nome:
                data.nome ??
                "",

              descricao:
                data.descricao ??
                "",

              categoria:
                data.categoria ??
                "",

              preco:
                Number(
                  data.preco ??
                    0
                ),

              estoque:
                Number(
                  data.estoque ??
                    0
                ),

              estoque_controlado:
                data.estoque_controlado ??
                true,

              imagem:
                data.imagem ??
                "/images/logo.png",

              ativo:
                data.ativo ??
                true,
            };

          setProduto(
            produtoCarregado
          );

          setNome(
            produtoCarregado.nome
          );

          setDescricao(
            produtoCarregado.descricao
          );

          setCategoria(
            produtoCarregado.categoria
          );

          setPreco(
            String(
              produtoCarregado.preco
            ).replace(
              ".",
              ","
            )
          );

          setEstoque(
            String(
              produtoCarregado.estoque
            )
          );

          setEstoqueControlado(
            produtoCarregado.estoque_controlado
          );

          setImagemAtual(
            produtoCarregado.imagem
          );
        } catch (
          error
        ) {
          console.error(
            "Erro ao carregar produto:",
            error
          );

          alert(
            "Produto não encontrado."
          );

          router.push(
            "/admin/produtos"
          );
        } finally {
          setCarregando(
            false
          );
        }
      };

    if (
      Number.isInteger(
        id
      ) &&
      id > 0
    ) {
      carregarProduto();
    } else {
      alert(
        "Produto inválido."
      );

      router.push(
        "/admin/produtos"
      );
    }
  }, [
    id,
    router,
  ]);

  /*
   * ======================================
   * SELECIONAR NOVA IMAGEM
   * ======================================
   */

  const selecionarImagem = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const imagem =
      event.target.files?.[0];

    if (!imagem) {
      return;
    }

    if (
      !imagem.type.startsWith(
        "image/"
      )
    ) {
      alert(
        "Selecione um arquivo de imagem."
      );

      event.target.value =
        "";

      return;
    }

    const tamanhoMaximoArquivo =
      15 *
      1024 *
      1024;

    if (
      imagem.size >
      tamanhoMaximoArquivo
    ) {
      alert(
        "A imagem deve ter no máximo 15 MB."
      );

      event.target.value =
        "";

      return;
    }

    if (
      preview
    ) {
      URL.revokeObjectURL(
        preview
      );
    }

    const novaPreview =
      URL.createObjectURL(
        imagem
      );

    setArquivo(
      imagem
    );

    setPreview(
      novaPreview
    );
  };

  /*
   * ======================================
   * LIMPAR PREVIEW
   * ======================================
   */

  useEffect(() => {
    return () => {
      if (
        preview
      ) {
        URL.revokeObjectURL(
          preview
        );
      }
    };
  }, [
    preview,
  ]);

  /*
   * ======================================
   * ABRIR SELETOR
   * ======================================
   */

  const abrirSeletorImagem =
    () => {
      inputImagemRef.current?.click();
    };

  /*
   * ======================================
   * OTIMIZAR IMAGEM
   * ======================================
   *
   * - máximo 1200 px
   * - mantém proporção
   * - converte para WebP
   * - qualidade 82%
   * ======================================
   */

  const otimizarImagem =
    async (
      arquivoOriginal: File
    ): Promise<File> => {
      const tamanhoMaximo =
        1200;

      const qualidade =
        0.82;

      const urlOriginal =
        URL.createObjectURL(
          arquivoOriginal
        );

      try {
        const imagem =
          await new Promise<HTMLImageElement>(
            (
              resolve,
              reject
            ) => {
              const img =
                new window.Image();

              img.onload =
                () => {
                  resolve(
                    img
                  );
                };

              img.onerror =
                () => {
                  reject(
                    new Error(
                      "Não foi possível processar esta imagem."
                    )
                  );
                };

              img.src =
                urlOriginal;
            }
          );

        let largura =
          imagem.naturalWidth;

        let altura =
          imagem.naturalHeight;

        if (
          largura <= 0 ||
          altura <= 0
        ) {
          throw new Error(
            "Dimensões da imagem inválidas."
          );
        }

        if (
          largura >
            tamanhoMaximo ||
          altura >
            tamanhoMaximo
        ) {
          const proporcao =
            Math.min(
              tamanhoMaximo /
                largura,

              tamanhoMaximo /
                altura
            );

          largura =
            Math.round(
              largura *
                proporcao
            );

          altura =
            Math.round(
              altura *
                proporcao
            );
        }

        const canvas =
          document.createElement(
            "canvas"
          );

        canvas.width =
          largura;

        canvas.height =
          altura;

        const contexto =
          canvas.getContext(
            "2d"
          );

        if (
          !contexto
        ) {
          throw new Error(
            "Não foi possível preparar a imagem."
          );
        }

        contexto.fillStyle =
          "#ffffff";

        contexto.fillRect(
          0,
          0,
          largura,
          altura
        );

        contexto.imageSmoothingEnabled =
          true;

        contexto.imageSmoothingQuality =
          "high";

        contexto.drawImage(
          imagem,
          0,
          0,
          largura,
          altura
        );

        const blob =
          await new Promise<Blob>(
            (
              resolve,
              reject
            ) => {
              canvas.toBlob(
                (
                  resultado
                ) => {
                  if (
                    !resultado
                  ) {
                    reject(
                      new Error(
                        "Não foi possível comprimir a imagem."
                      )
                    );

                    return;
                  }

                  resolve(
                    resultado
                  );
                },

                "image/webp",

                qualidade
              );
            }
          );

        const nomeSemExtensao =
          arquivoOriginal.name
            .replace(
              /\.[^/.]+$/,
              ""
            )
            .replace(
              /[^a-zA-Z0-9-_]/g,
              "-"
            );

        return new File(
          [
            blob,
          ],

          `${nomeSemExtensao || "produto"}.webp`,

          {
            type:
              "image/webp",

            lastModified:
              Date.now(),
          }
        );
      } finally {
        URL.revokeObjectURL(
          urlOriginal
        );
      }
    };

  /*
   * ======================================
   * FAZER UPLOAD DA NOVA IMAGEM
   * ======================================
   */

  const fazerUploadNovaImagem =
    async () => {
      if (
        !arquivo
      ) {
        return imagemAtual;
      }

      const imagemOtimizada =
        await otimizarImagem(
          arquivo
        );

      const nomeArquivo =
        `${Date.now()}-${crypto.randomUUID()}.webp`;

      const {
        error,
      } =
        await supabase.storage
          .from(
            "product-images"
          )
          .upload(
            nomeArquivo,
            imagemOtimizada,
            {
              cacheControl:
                "31536000",

              upsert:
                false,

              contentType:
                "image/webp",
            }
          );

      if (
        error
      ) {
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

  /*
   * ======================================
   * SALVAR PRODUTO
   * ======================================
   */

  const salvarProduto =
    async () => {
      const precoNumerico =
        Number(
          preco.replace(
            ",",
            "."
          )
        );

      const estoqueNumerico =
        Number(
          estoque
        );

      if (
        !nome.trim()
      ) {
        alert(
          "Preencha o nome do produto."
        );

        return;
      }

      if (
        !categoria.trim()
      ) {
        alert(
          "Preencha a categoria do produto."
        );

        return;
      }

      if (
        Number.isNaN(
          precoNumerico
        ) ||
        precoNumerico <= 0
      ) {
        alert(
          "Informe um preço válido."
        );

        return;
      }

      if (
        estoqueControlado &&
        (
          estoque.trim() ===
            "" ||
          Number.isNaN(
            estoqueNumerico
          ) ||
          !Number.isInteger(
            estoqueNumerico
          ) ||
          estoqueNumerico <
            0
        )
      ) {
        alert(
          "Informe uma quantidade de estoque válida."
        );

        return;
      }

      try {
        setSalvando(
          true
        );

        /*
         * Se nenhuma nova imagem foi
         * selecionada, mantém a atual.
         *
         * Se houver nova imagem,
         * otimiza e envia em WebP.
         */

        const imagemUrl =
          await fazerUploadNovaImagem();

        const {
          error,
        } =
          await supabase
            .from(
              "produtos"
            )
            .update({
              nome:
                nome.trim(),

              descricao:
                descricao.trim(),

              categoria:
                categoria.trim(),

              preco:
                precoNumerico,

              estoque:
                estoqueControlado
                  ? estoqueNumerico
                  : 0,

              estoque_controlado:
                estoqueControlado,

              imagem:
                imagemUrl,
            })
            .eq(
              "id",
              id
            );

        if (
          error
        ) {
          throw error;
        }

        router.push(
          "/admin/produtos"
        );

        router.refresh();
      } catch (
        error
      ) {
        console.error(
          "Erro ao editar produto:",
          error
        );

        alert(
          "Não foi possível editar o produto."
        );
      } finally {
        setSalvando(
          false
        );
      }
    };

  /*
   * ======================================
   * CARREGAMENTO
   * ======================================
   */

  if (
    carregando ||
    !produto
  ) {
    return (
      <main
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-[#020b18]
          text-white
        "
      >
        <div className="text-center">

          <Loader2
            className="
              mx-auto
              animate-spin
              text-sky-400
            "
            size={32}
          />

          <p
            className="
              mt-4
              text-sm
              text-slate-400
            "
          >
            Carregando produto...
          </p>

        </div>
      </main>
    );
  }

  return (
    <main
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-[#020b18]
        pb-12
        text-white
      "
    >

      {/* FUNDO DECORATIVO */}

      <div
        className="
          pointer-events-none
          absolute
          -left-40
          -top-40
          h-96
          w-96
          rounded-full
          bg-sky-500/20
          blur-[120px]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -right-44
          top-72
          h-96
          w-96
          rounded-full
          bg-blue-600/20
          blur-[120px]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          bottom-0
          left-1/2
          h-80
          w-80
          -translate-x-1/2
          rounded-full
          bg-cyan-400/10
          blur-[110px]
        "
      />

      {/* HEADER */}

      <header
        className="
          sticky
          top-0
          z-40
          border-b
          border-sky-300/10
          bg-[#020b18]/80
          backdrop-blur-2xl
        "
      >

        <div
          className="
            mx-auto
            flex
            max-w-md
            items-center
            gap-4
            px-4
            py-4
          "
        >

          <Link
            href="/admin/produtos"
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-2xl
              border
              border-sky-300/15
              bg-white/[0.06]
              text-sky-200
              shadow-[0_10px_30px_rgba(0,0,0,0.25)]
              backdrop-blur-xl
              transition
              hover:border-sky-300/30
              hover:bg-sky-400/10
              active:scale-95
            "
          >
            <ArrowLeft
              size={20}
            />
          </Link>

          <div>

            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-[0.18em]
                text-sky-300
              "
            >
              Produtos
            </p>

            <h1
              className="
                mt-1
                text-xl
                font-black
                text-white
              "
            >
              Editar produto
            </h1>

          </div>

        </div>

      </header>

      {/* CONTEÚDO */}

      <section
        className="
          relative
          z-10
          mx-auto
          max-w-md
          space-y-4
          px-4
          py-5
        "
      >

        {/* APRESENTAÇÃO */}

        <section
          className="
            rounded-[28px]
            border
            border-sky-300/15
            bg-gradient-to-br
            from-sky-400/10
            to-blue-600/5
            p-5
            shadow-[0_20px_60px_rgba(0,0,0,0.28)]
            backdrop-blur-2xl
          "
        >

          <div
            className="
              flex
              items-center
              gap-4
            "
          >

            <div
              className="
                flex
                h-12
                w-12
                shrink-0
                items-center
                justify-center
                rounded-2xl
                border
                border-sky-300/25
                bg-gradient-to-br
                from-sky-400
                to-blue-600
                text-white
                shadow-[0_10px_30px_rgba(14,165,233,0.30)]
              "
            >
              <Pencil
                size={22}
              />
            </div>

            <div
              className="
                min-w-0
                flex-1
              "
            >

              <h2
                className="
                  truncate
                  font-black
                  text-white
                "
              >
                {produto.nome}
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  text-slate-400
                "
              >
                Atualize as informações do produto.
              </p>

            </div>

          </div>

        </section>

        {/* FOTO */}

        <section
          className="
            rounded-[30px]
            border
            border-sky-300/15
            bg-white/[0.055]
            p-5
            shadow-[0_20px_60px_rgba(0,0,0,0.25)]
            backdrop-blur-2xl
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-2xl
                border
                border-sky-300/15
                bg-sky-400/10
                text-sky-300
              "
            >
              <ImagePlus
                size={19}
              />
            </div>

            <div>

              <h2
                className="
                  font-bold
                  text-white
                "
              >
                Foto do produto
              </h2>

              <p
                className="
                  mt-0.5
                  text-xs
                  text-slate-400
                "
              >
                Toque na imagem para trocar
              </p>

            </div>

          </div>

          <input
            ref={
              inputImagemRef
            }
            type="file"
            accept="image/*"
            onChange={
              selecionarImagem
            }
            className="hidden"
          />

          <button
            type="button"
            onClick={
              abrirSeletorImagem
            }
            className="
              group
              relative
              mt-4
              flex
              min-h-52
              w-full
              overflow-hidden
              rounded-[26px]
              border
              border-sky-300/20
              bg-white/[0.04]
              shadow-[0_14px_40px_rgba(0,0,0,0.20)]
              backdrop-blur-xl
            "
          >

            <Image
              src={
                preview ||
                imagemAtual
              }
              alt={
                nome ||
                "Produto"
              }
              fill
              className="object-cover"
              unoptimized={
                Boolean(
                  preview
                )
              }
            />

            <div
              className="
                absolute
                inset-0
                flex
                items-end
                justify-center
                bg-gradient-to-t
                from-[#020b18]/90
                via-transparent
                to-transparent
                p-4
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                  rounded-2xl
                  border
                  border-white/10
                  bg-[#020b18]/65
                  px-4
                  py-2.5
                  text-xs
                  font-bold
                  text-white
                  backdrop-blur-xl
                "
              >
                <ImagePlus
                  size={16}
                />

                Trocar imagem
              </div>

            </div>

          </button>

          {arquivo && (
            <div
              className="
                mt-3
                rounded-2xl
                border
                border-emerald-300/10
                bg-emerald-400/[0.06]
                p-3
              "
            >
              <p
                className="
                  text-xs
                  leading-5
                  text-emerald-300
                "
              >
                ✓ A nova foto será redimensionada e comprimida automaticamente.
              </p>
            </div>
          )}

        </section>

        {/* INFORMAÇÕES */}

        <section
          className="
            rounded-[30px]
            border
            border-sky-300/15
            bg-white/[0.055]
            p-5
            shadow-[0_20px_60px_rgba(0,0,0,0.25)]
            backdrop-blur-2xl
          "
        >

          <h2
            className="
              font-black
              text-white
            "
          >
            Informações
          </h2>

          <p
            className="
              mt-1
              text-sm
              text-slate-400
            "
          >
            Dados exibidos para o cliente.
          </p>

          <div
            className="
              mt-5
              space-y-4
            "
          >

            <div>

              <label
                htmlFor="nome"
                className="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-slate-200
                "
              >
                Nome do produto
              </label>

              <input
                id="nome"
                value={
                  nome
                }
                onChange={(
                  e
                ) =>
                  setNome(
                    e.target.value
                  )
                }
                placeholder="Nome do produto"
                className="
                  w-full
                  rounded-2xl
                  border
                  border-sky-300/10
                  bg-white/[0.06]
                  px-4
                  py-4
                  text-white
                  outline-none
                  backdrop-blur-xl
                  transition
                  placeholder:text-slate-500
                  focus:border-sky-300/40
                  focus:bg-sky-400/[0.07]
                  focus:ring-4
                  focus:ring-sky-400/5
                "
              />

            </div>

            <div>

              <label
                htmlFor="descricao"
                className="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-slate-200
                "
              >
                Descrição
              </label>

              <textarea
                id="descricao"
                value={
                  descricao
                }
                onChange={(
                  e
                ) =>
                  setDescricao(
                    e.target.value
                  )
                }
                placeholder="Descrição"
                rows={4}
                className="
                  w-full
                  resize-none
                  rounded-2xl
                  border
                  border-sky-300/10
                  bg-white/[0.06]
                  px-4
                  py-4
                  text-white
                  outline-none
                  backdrop-blur-xl
                  transition
                  placeholder:text-slate-500
                  focus:border-sky-300/40
                  focus:bg-sky-400/[0.07]
                  focus:ring-4
                  focus:ring-sky-400/5
                "
              />

            </div>

            <div>

              <label
                htmlFor="categoria"
                className="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-slate-200
                "
              >
                Categoria
              </label>

              <input
                id="categoria"
                value={
                  categoria
                }
                onChange={(
                  e
                ) =>
                  setCategoria(
                    e.target.value
                  )
                }
                placeholder="Ex: Cabos, Capinhas, Fones..."
                className="
                  w-full
                  rounded-2xl
                  border
                  border-sky-300/10
                  bg-white/[0.06]
                  px-4
                  py-4
                  text-white
                  outline-none
                  backdrop-blur-xl
                  transition
                  placeholder:text-slate-500
                  focus:border-sky-300/40
                  focus:bg-sky-400/[0.07]
                  focus:ring-4
                  focus:ring-sky-400/5
                "
              />

            </div>

            <div>

              <label
                htmlFor="preco"
                className="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-slate-200
                "
              >
                Preço
              </label>

              <div className="relative">

                <span
                  className="
                    pointer-events-none
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    text-sm
                    font-bold
                    text-sky-300
                  "
                >
                  R$
                </span>

                <input
                  id="preco"
                  value={
                    preco
                  }
                  onChange={(
                    e
                  ) =>
                    setPreco(
                      e.target.value
                    )
                  }
                  placeholder="49,90"
                  inputMode="decimal"
                  className="
                    w-full
                    rounded-2xl
                    border
                    border-sky-300/10
                    bg-white/[0.06]
                    py-4
                    pl-12
                    pr-4
                    text-white
                    outline-none
                    backdrop-blur-xl
                    transition
                    placeholder:text-slate-500
                    focus:border-sky-300/40
                    focus:bg-sky-400/[0.07]
                    focus:ring-4
                    focus:ring-sky-400/5
                  "
                />

              </div>

            </div>

          </div>

        </section>

        {/* ESTOQUE */}

        <section
          className="
            rounded-[30px]
            border
            border-sky-300/15
            bg-white/[0.055]
            p-5
            shadow-[0_20px_60px_rgba(0,0,0,0.25)]
            backdrop-blur-2xl
          "
        >

          <div
            className="
              flex
              items-start
              gap-3
            "
          >

            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-2xl
                border
                border-sky-300/20
                bg-sky-400/10
                text-sky-300
              "
            >
              <Boxes
                size={20}
              />
            </div>

            <div>

              <h2
                className="
                  font-black
                  text-white
                "
              >
                Controle de estoque
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  leading-5
                  text-slate-400
                "
              >
                Controle a quantidade disponível deste produto.
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              setEstoqueControlado(
                !estoqueControlado
              )
            }
            className="
              mt-5
              flex
              w-full
              items-center
              justify-between
              gap-4
              rounded-[22px]
              border
              border-sky-300/10
              bg-white/[0.05]
              p-4
              text-left
              backdrop-blur-xl
              transition
              hover:border-sky-300/25
              hover:bg-sky-400/[0.06]
            "
          >

            <div>

              <p
                className="
                  text-sm
                  font-bold
                  text-white
                "
              >
                Controlar estoque
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  leading-5
                  text-slate-400
                "
              >
                Limita as vendas conforme a quantidade disponível.
              </p>

            </div>

            <div
              className={`
                relative
                h-7
                w-12
                shrink-0
                rounded-full
                border
                transition
                ${
                  estoqueControlado
                    ? "border-sky-300/40 bg-gradient-to-r from-sky-400 to-blue-600 shadow-[0_0_20px_rgba(56,189,248,0.25)]"
                    : "border-white/10 bg-white/10"
                }
              `}
            >

              <div
                className={`
                  absolute
                  top-1
                  h-5
                  w-5
                  rounded-full
                  bg-white
                  shadow-md
                  transition-all
                  ${
                    estoqueControlado
                      ? "left-6"
                      : "left-1"
                  }
                `}
              />

            </div>

          </button>

          {estoqueControlado ? (
            <div className="mt-4">

              <label
                htmlFor="estoque"
                className="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-slate-200
                "
              >
                Quantidade disponível
              </label>

              <input
                id="estoque"
                type="number"
                value={
                  estoque
                }
                onChange={(
                  e
                ) =>
                  setEstoque(
                    e.target.value
                  )
                }
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="Ex: 20"
                className="
                  w-full
                  rounded-2xl
                  border
                  border-sky-300/10
                  bg-white/[0.06]
                  px-4
                  py-4
                  text-lg
                  font-bold
                  text-white
                  outline-none
                  backdrop-blur-xl
                  transition
                  placeholder:text-slate-500
                  focus:border-sky-300/40
                  focus:bg-sky-400/[0.07]
                  focus:ring-4
                  focus:ring-sky-400/5
                "
              />

              <div
                className="
                  mt-3
                  flex
                  gap-2
                  rounded-2xl
                  border
                  border-sky-300/10
                  bg-sky-400/[0.06]
                  p-3
                "
              >

                <Boxes
                  size={15}
                  className="
                    mt-0.5
                    shrink-0
                    text-sky-300
                  "
                />

                <p
                  className="
                    text-xs
                    leading-5
                    text-slate-400
                  "
                >
                  Quando chegar a 0, o produto será exibido como esgotado.
                </p>

              </div>

            </div>
          ) : (
            <div
              className="
                mt-4
                rounded-[22px]
                border
                border-amber-300/15
                bg-amber-400/[0.07]
                p-4
                backdrop-blur-xl
              "
            >

              <p
                className="
                  text-sm
                  font-bold
                  text-amber-300
                "
              >
                Estoque não controlado
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  leading-5
                  text-amber-100/60
                "
              >
                O produto poderá ser vendido sem limite de quantidade.
              </p>

            </div>
          )}

        </section>

        {/* SALVAR */}

        <button
          type="button"
          onClick={
            salvarProduto
          }
          disabled={
            salvando
          }
          className="
            flex
            min-h-16
            w-full
            items-center
            justify-center
            gap-3
            rounded-[22px]
            border
            border-sky-300/30
            bg-gradient-to-r
            from-sky-500
            to-blue-600
            px-5
            font-black
            text-white
            shadow-[0_15px_45px_rgba(14,165,233,0.30)]
            transition
            duration-200
            hover:-translate-y-0.5
            hover:shadow-[0_18px_55px_rgba(14,165,233,0.40)]
            active:scale-[0.98]
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >

          {salvando ? (
            <>
              <Loader2
                size={20}
                className="animate-spin"
              />

              {arquivo
                ? "Otimizando e salvando..."
                : "Salvando..."}
            </>
          ) : (
            <>
              <Save
                size={20}
              />

              Salvar alterações
            </>
          )}

        </button>

      </section>

    </main>
  );
}