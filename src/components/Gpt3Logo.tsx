import React from "react";
import Image from "next/image";

import GptBaseLogo from "public/icons/ai.png";
import { Box } from "@chakra-ui/react";

export default function Gpt3Logo() {
  return (
    <Box position="relative" width="30px" height="30px">
      <Image
        src={GptBaseLogo}
        width={22}
        height={22}
        alt="gpt-base-logo"
      ></Image>
      <svg
        style={{ position: "absolute", right: "-2px", bottom: " -2px" }}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="none"
        // class="icon-sm transition-colors text-brand-green"
        width="16"
        height="16"
      >
        <path
          d="M9.586 1.526A.6.6 0 0 0 8.553 1l-6.8 7.6a.6.6 0 0 0 .447 1h5.258l-1.044 4.874A.6.6 0 0 0 7.447 15l6.8-7.6a.6.6 0 0 0-.447-1H8.542l1.044-4.874Z"
          fill="rgb(25, 195, 125)"
        ></path>
      </svg>
    </Box>
  );
}
