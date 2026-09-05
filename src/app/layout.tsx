import type {
  Metadata,
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

export const metadata: Metadata =
  {
    title:
      "Cardápio AI",

    description:
      "Pedidos online simples e rápidos",
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