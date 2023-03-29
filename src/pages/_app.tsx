import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ChakraProvider, Container } from "@chakra-ui/react";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  }, []);
  return (
    <ChakraProvider>
      <Container
        position="relative"
        maxWidth="100vw"
        width="100vw"
        height="calc(var(--vh, 1vh) * 100)"
        margin={0}
      >
        <Component {...pageProps} />
      </Container>
    </ChakraProvider>
  );
}
