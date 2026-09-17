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

import ThemeShell from "@/components/ThemeShell";

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
      "LOJAI",

    template:
      "%s | LOJAI",
  },

  description:
    "Sua loja online de forma simples. Produtos, carrinho, Pix e pedidos direto pelo WhatsApp.",

  manifest:
    "/manifest.webmanifest",

  applicationName:
    "LOJAI",

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
      "LOJAI",

    statusBarStyle:
      "black-translucent",
  },

  openGraph: {
    title:
      "LOJAI",

    description:
      "Sua loja online de forma simples. Produtos, carrinho, Pix e pedidos direto pelo WhatsApp.",

    url:
      "https://lojas-ai.vercel.app",

    siteName:
      "LOJAI",

    images: [
      {
        url:
          "/images/lojas-ai.png",

        width:
          1200,

        height:
          1200,

        alt:
          "LOJAI",
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
      "LOJAI",

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

  maximumScale:
    5,

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
      spellCheck={true}
      className={`${geistSans.variable} ${geistMono.variable} h-full w-full overflow-x-hidden antialiased`}
    >
      <body
        lang="pt-BR"
        spellCheck={true}
        autoCorrect="on"
        autoCapitalize="sentences"
        className="flex min-h-full w-full min-w-0 max-w-full flex-col overflow-x-hidden"
      >
        <AuthProvider>
          <StoreProvider>
            <ProductProvider>
              <CartProvider>
                <ThemeShell>
                  {children}
                </ThemeShell>
              </CartProvider>
            </ProductProvider>
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
