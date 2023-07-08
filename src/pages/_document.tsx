import { Html, Head, Main, NextScript } from "next/document";
import { ColorModeScript } from "@chakra-ui/react";

import theme from "@/styles/theme";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="viewport" content="width=device-width,initial-scale=1.0" />
      </Head>

      <body>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />

        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
