"use client";

import Link from "next/link";

import {
  ArrowLeft,
  Copy,
  Download,
  ExternalLink,
  QrCode,
  Store,
} from "lucide-react";

import {
  QRCodeSVG,
} from "qrcode.react";

import {
  useRef,
  useState,
} from "react";

import {
  useStore,
} from "@/context/StoreContext";

export default function QrCodeLojaPage() {
  const {
    loja,
    carregando,
  } = useStore();

  const qrRef =
    useRef<HTMLDivElement>(
      null
    );

  const [
    copiado,
    setCopiado,
  ] = useState(false);

  const linkLoja =
    loja?.slug
      ? `https://lojas-ai.vercel.app/loja/${loja.slug}`
      : "";

  const copiarLink =
    async () => {
      if (!linkLoja) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          linkLoja
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
      } catch (
        error
      ) {
        console.error(
          "Erro ao copiar link:",
          error
        );

        alert(
          "Não foi possível copiar o link."
        );
      }
    };

  const baixarQrCode =
    () => {
      if (
        !qrRef.current ||
        !loja
      ) {
        return;
      }

      const svg =
        qrRef.current.querySelector(
          "svg"
        );

      if (!svg) {
        return;
      }

      const serializer =
        new XMLSerializer();

      const svgString =
        serializer.serializeToString(
          svg
        );

      const canvas =
        document.createElement(
          "canvas"
        );

      const tamanho =
        1200;

      canvas.width =
        tamanho;

      canvas.height =
        tamanho;

      const ctx =
        canvas.getContext(
          "2d"
        );

      if (!ctx) {
        return;
      }

      const imagem =
        new Image();

      const blob =
        new Blob(
          [
            svgString,
          ],
          {
            type:
              "image/svg+xml;charset=utf-8",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      imagem.onload =
        () => {
          ctx.fillStyle =
            "#ffffff";

          ctx.fillRect(
            0,
            0,
            tamanho,
            tamanho
          );

          ctx.drawImage(
            imagem,
            0,
            0,
            tamanho,
            tamanho
          );

          URL.revokeObjectURL(
            url
          );

          const link =
            document.createElement(
              "a"
            );

          link.download =
            `qrcode-${loja.slug}.png`;

          link.href =
            canvas.toDataURL(
              "image/png"
            );

          link.click();
        };

      imagem.src =
        url;
    };

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020b18] text-white">

        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-sky-300/20 border-t-sky-400" />

          <p className="mt-4 text-sm text-slate-400">
            Carregando QR Code...
          </p>

        </div>

      </main>
    );
  }

  if (
    !loja ||
    !linkLoja
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020b18] px-4 text-white">

        <div className="w-full max-w-sm rounded-[28px] border border-sky-300/15 bg-white/[0.06] p-7 text-center shadow-2xl backdrop-blur-2xl">

          <QrCode
            size={36}
            className="mx-auto text-sky-300"
          />

          <h1 className="mt-4 text-xl font-black">
            Loja não encontrada
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Não foi possível gerar o QR Code desta loja.
          </p>

        </div>

      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020b18] pb-12 text-white">

      {/* FUNDO */}

      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-sky-500/20 blur-[120px]" />

      <div className="pointer-events-none absolute -right-44 top-64 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />

      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-sky-300/10 bg-[#020b18]/80 backdrop-blur-2xl">

        <div className="mx-auto flex max-w-md items-center gap-4 px-4 py-4">

          <Link
            href="/admin"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/15 bg-white/[0.06] text-sky-200 backdrop-blur-xl transition hover:bg-sky-400/10 active:scale-95"
          >
            <ArrowLeft
              size={20}
            />
          </Link>

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
              Divulgação
            </p>

            <h1 className="mt-1 text-xl font-black">
              QR Code da loja
            </h1>

          </div>

        </div>

      </header>

      {/* CONTEÚDO */}

      <section className="relative z-10 mx-auto max-w-md space-y-4 px-4 py-5">

        {/* APRESENTAÇÃO */}

        <section className="rounded-[30px] border border-sky-300/15 bg-white/[0.055] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl">

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-300/25 bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-[0_10px_30px_rgba(14,165,233,0.30)]">

              <Store
                size={22}
              />

            </div>

            <div className="min-w-0">

              <p className="text-sm text-slate-400">
                Loja
              </p>

              <h2 className="truncate text-lg font-black">
                {loja.nome}
              </h2>

            </div>

          </div>

          <p className="mt-4 text-sm leading-6 text-slate-400">
            Seus clientes podem escanear este código para abrir diretamente a área de vendas da sua loja.
          </p>

        </section>

        {/* QR CODE */}

        <section className="rounded-[32px] border border-sky-300/15 bg-white/[0.055] p-5 text-center shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl">

          <div
            ref={
              qrRef
            }
            className="mx-auto flex w-fit rounded-[28px] bg-white p-4 shadow-[0_14px_40px_rgba(0,0,0,0.22)]"
          >

            <QRCodeSVG
              value={
                linkLoja
              }
              size={240}
              level="H"
              includeMargin
              bgColor="#ffffff"
              fgColor="#020b18"
            />

          </div>

          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-sky-300">
            Aponte a câmera
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            O cliente será direcionado diretamente para a loja.
          </p>

        </section>

        {/* LINK */}

        <section className="rounded-[28px] border border-sky-300/15 bg-white/[0.055] p-4 shadow-xl backdrop-blur-2xl">

          <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
            Link da loja
          </p>

          <div className="mt-3 rounded-[18px] border border-sky-300/10 bg-[#020b18]/50 p-4">

            <p className="break-all text-sm font-semibold text-sky-200">
              {linkLoja}
            </p>

          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">

            <button
              type="button"
              onClick={
                copiarLink
              }
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-sky-300/15 bg-white/[0.05] px-3 text-xs font-black text-sky-200 backdrop-blur-xl transition hover:bg-sky-400/10 active:scale-[0.98]"
            >

              <Copy
                size={16}
              />

              {copiado
                ? "Copiado"
                : "Copiar link"}

            </button>

            <a
              href={
                linkLoja
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-sky-300/15 bg-white/[0.05] px-3 text-xs font-black text-sky-200 backdrop-blur-xl transition hover:bg-sky-400/10 active:scale-[0.98]"
            >

              <ExternalLink
                size={16}
              />

              Abrir loja

            </a>

          </div>

        </section>

        {/* DOWNLOAD */}

        <button
          type="button"
          onClick={
            baixarQrCode
          }
          className="flex min-h-16 w-full items-center justify-center gap-3 rounded-[22px] border border-sky-300/30 bg-gradient-to-r from-sky-500 to-blue-600 px-5 font-black text-white shadow-[0_15px_45px_rgba(14,165,233,0.30)] transition hover:-translate-y-0.5 active:scale-[0.98]"
        >

          <Download
            size={20}
          />

          Baixar QR Code

        </button>

      </section>

    </main>
  );
}