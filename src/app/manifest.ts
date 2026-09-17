import type {
  MetadataRoute,
} from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LOJAI",
    short_name: "LOJAI",

    description:
      "Loja online, pedidos, produtos e gestão em um só lugar.",

    start_url: "/login",

    display: "standalone",

    background_color:
      "#020b18",

    theme_color:
      "#0ea5e9",

    orientation:
      "portrait",

    icons: [
      {
        src:
          "/images/lojas-ai.png",

        sizes:
          "512x512",

        type:
          "image/png",
      },
    ],
  };
}
