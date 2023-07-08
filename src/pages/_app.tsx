import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";
import Nossr from "@/components/Nossr";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider>
      <div
        style={{
          position: "relative",
          maxWidth: "100vw",
          width: "100vw",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <Nossr>
          <Component {...pageProps} />
        </Nossr>
      </div>
    </ChakraProvider>
  );
}
