"use client";

import {
  type ReactNode,
} from "react";

import {
  usePathname,
} from "next/navigation";

import {
  useStore,
} from "@/context/StoreContext";

export default function ThemeShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { loja } = useStore();

  const areaAdmin =
    pathname.startsWith(
      "/admin"
    );

  const areaDaLoja =
    pathname.startsWith(
      "/loja/"
    ) ||
    pathname.startsWith(
      "/pedido/"
    ) ||
    pathname.startsWith(
      "/pagamento"
    ) ||
    pathname.startsWith(
      "/checkout"
    );

  const tema = areaAdmin
    ? loja?.tema_admin ??
      "azul-escuro"
    : areaDaLoja
      ? loja?.tema_loja ??
        "azul-ceu"
      : "azul-escuro";

  const temaClaro =
    areaDaLoja;

  return (
    <div
      data-app-theme={tema}
      data-theme-contrast={
        temaClaro
          ? "claro"
          : "escuro"
      }
      data-theme-area={
        areaAdmin
          ? "admin"
          : areaDaLoja
            ? "loja"
            : "publico"
      }
      className="theme-shell w-full min-w-0 max-w-full overflow-x-hidden"
    >
      {children}
    </div>
  );
}
