import type {
  Metadata,
  Viewport,
} from "next";

import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import "./globals.css";

import {
  AuthProvider,
} from "@/context/AuthContext";

import {
  CartProvider,
} from "@/context/CartContext";

import {
  ProductProvider,
} from "@/context/ProductContext";

import {
  StoreProvider,
} from "@/context/StoreContext";

const geistSans =
  Geist({
    variable:
      "--font-geist-sans",

    subsets: [
      "latin",
    ],
  });

const geistMono =
  Geist_Mono({
    variable:
      "--font-geist-mono",

    subsets: [
      "latin",
    ],
  });

export const metadata: Metadata = {
  metadataBase:
    new URL(
      "https://lojas-ai.vercel.app"
    ),

  title: {
    default:
      "Lojas AI",

    template:
      "%s | Lojas AI",
  },

  description:
    "Sua loja online de forma simples. Produtos, carrinho, Pix e pedidos direto pelo WhatsApp.",

  manifest:
    "/manifest.webmanifest",

  applicationName:
    "Lojas AI",

  icons: {
    icon:
      "/images/lojas-ai.png",

    shortcut:
      "/images/lojas-ai.png",

    apple:
      "/images/lojas-ai.png",
  },

  appleWebApp: {
    capable:
      true,

    title:
      "Lojas AI",

    statusBarStyle:
      "black-translucent",
  },

  openGraph: {
    title:
      "Lojas AI",

    description:
      "Sua loja online de forma simples. Produtos, carrinho, Pix e pedidos direto pelo WhatsApp.",

    url:
      "https://lojas-ai.vercel.app",

    siteName:
      "Lojas AI",

    images: [
      {
        url:
          "/images/lojas-ai.png",

        width:
          1200,

        height:
          1200,

        alt:
          "Lojas AI",
      },
    ],

    locale:
      "pt_BR",

    type:
      "website",
  },

  twitter: {
    card:
      "summary_large_image",

    title:
      "Lojas AI",

    description:
      "Sua loja online de forma simples.",

    images: [
      "/images/lojas-ai.png",
    ],
  },
};

export const viewport: Viewport = {
  themeColor:
    "#0ea5e9",

  width:
    "device-width",

  initialScale:
    1,

  viewportFit:
    "cover",
};

export default function RootLayout({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">

        <AuthProvider>

          <StoreProvider>

            <ProductProvider>

              <CartProvider>

                {children}

              </CartProvider>

            </ProductProvider>

          </StoreProvider>

        </AuthProvider>

      </body>
    </html>
  );
}