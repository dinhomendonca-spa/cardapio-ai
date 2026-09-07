"use client";

import Image from "next/image";

import {
  ArrowLeft,
  Boxes,
  ImagePlus,
  Loader2,
  Save,
} from "lucide-react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  ChangeEvent,
  useRef,
  useState,
} from "react";

import {
  useProducts,
} from "@/context/ProductContext";

import {
  supabase,
} from "@/lib/supabase";

export default function NovoProdutoPage() {
  const router =
    useRouter();

  const {
    adicionarProduto,
  } = useProducts();

  const inputImagemRef =
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
    categoria,
    setCategoria,
  ] = useState("");

  const [
    preco,
    setPreco,
  ] = useState("");

  const [
    estoque,
    setEstoque,
  ] = useState("");

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
    salvando,
    setSalvando,
  ] =
    useState(false);

  const selecionarImagem = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const imagem =
      event.target.files?.[0];

    if (!imagem) {
      return;
    }

    setArquivo(
      imagem
    );

    setPreview(
      URL.createObjectURL(
        imagem
      )
    );
  };

  const abrirSeletorImagem =
    () => {
      inputImagemRef.current?.click();
    };

  const fazerUploadImagem =
    async () => {
      if (!arquivo) {
        return "/images/logo.png";
      }

      const extensao =
        arquivo.name
          .split(".")
          .pop();

      const nomeArquivo =
        `${Date.now()}-${crypto.randomUUID()}.${extensao}`;

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
        Number(estoque);

      if (!nome.trim()) {
        alert(
          "Preencha o nome do produto."
        );

        return;
      }

      if (!categoria.trim()) {
        alert(
          "Preencha a categoria do produto."
        );

        return;
      }

      if (
        !precoNumerico ||
        precoNumerico <= 0
      ) {
        alert(
          "Informe um preço válido."
        );

        return;
      }

      if (
        estoque.trim() === "" ||
        Number.isNaN(
          estoqueNumerico
        ) ||
        estoqueNumerico < 0 ||
        !Number.isInteger(
          estoqueNumerico
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

        const imagemUrl =
          await fazerUploadImagem();

        await adicionarProduto({
          nome:
            nome.trim(),

          descricao:
            descricao.trim(),

          categoria:
            categoria.trim(),

          preco:
            precoNumerico,

          estoque:
            estoqueNumerico,

          estoque_controlado:
            true,

          imagem:
            imagemUrl,

          ativo:
            true,
        });

        router.push(
          "/admin/produtos"
        );
      } catch (
        error
      ) {
        console.error(
          "Erro ao salvar produto:",
          error
        );

        alert(
          "Não foi possível salvar o produto."
        );
      } finally {
        setSalvando(
          false
        );
      }
    };

  return (
    <main className="min-h-screen bg-zinc-100 pb-10 text-zinc-950">

      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-md items-center gap-4 px-4 py-4">

          <Link
            href="/admin/produtos"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100"
          >
            <ArrowLeft
              size={20}
            />
          </Link>

          <div>

            <p className="text-xs text-zinc-500">
              Produtos
            </p>

            <h1 className="text-lg font-bold">
              Novo produto
            </h1>

          </div>

        </div>

      </header>

      <section className="mx-auto max-w-md space-y-5 px-4 py-5">

        <section className="rounded-3xl bg-white p-5 shadow-sm">

          <h2 className="font-bold">
            Foto do produto
          </h2>

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
            className="relative mt-4 flex min-h-44 w-full overflow-hidden rounded-3xl border-2 border-dashed border-zinc-200"
          >

            {preview ? (
              <Image
                src={
                  preview
                }
                alt="Pré-visualização"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex w-full flex-col items-center justify-center text-zinc-500">

                <ImagePlus
                  size={28}
                />

                <span className="mt-2 text-sm font-semibold">
                  Adicionar imagem
                </span>

              </div>
            )}

          </button>

          {preview && (
            <p className="mt-3 text-center text-xs text-zinc-500">
              Toque na imagem para trocar
            </p>
          )}

        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">

          <h2 className="font-bold">
            Informações
          </h2>

          <div className="mt-4 space-y-3">

            <div>
              <label
                htmlFor="nome"
                className="mb-2 block text-sm font-semibold"
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
                placeholder="Ex: Cabo USB-C"
                className="w-full rounded-2xl bg-zinc-100 px-4 py-4 outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="descricao"
                className="mb-2 block text-sm font-semibold"
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
                placeholder="Descrição do produto"
                rows={4}
                className="w-full resize-none rounded-2xl bg-zinc-100 px-4 py-4 outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="categoria"
                className="mb-2 block text-sm font-semibold"
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
                placeholder="Ex: Capinhas, Cabos, Fones..."
                className="w-full rounded-2xl bg-zinc-100 px-4 py-4 outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="preco"
                className="mb-2 block text-sm font-semibold"
              >
                Preço
              </label>

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
                placeholder="Ex: 49,90"
                inputMode="decimal"
                className="w-full rounded-2xl bg-zinc-100 px-4 py-4 outline-none"
              />
            </div>

          </div>

        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">

          <div className="flex items-start gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100">
              <Boxes
                size={20}
              />
            </div>

            <div>

              <h2 className="font-bold">
                Estoque
              </h2>

              <p className="mt-1 text-sm leading-5 text-zinc-500">
                Informe quantas unidades deste produto estão disponíveis.
              </p>

            </div>

          </div>

          <div className="mt-4">

            <label
              htmlFor="estoque"
              className="mb-2 block text-sm font-semibold"
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
              placeholder="Ex: 20"
              min="0"
              step="1"
              inputMode="numeric"
              className="w-full rounded-2xl bg-zinc-100 px-4 py-4 outline-none"
            />

            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Use 0 quando o produto estiver sem estoque.
            </p>

          </div>

        </section>

        <button
          type="button"
          onClick={
            salvarProduto
          }
          disabled={
            salvando
          }
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
              <Save
                size={19}
              />

              Salvar produto
            </>
          )}

        </button>

      </section>

    </main>
  );
}