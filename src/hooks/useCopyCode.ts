import { useEffect } from "react";
import { useToast } from "@chakra-ui/react";

import { copyText } from "@/utils/util";

const useCopyCode = (conversationList: any[]) => {
  const toast = useToast({
    position: "top",
    duration: 3000,
    variant: "subtle",
    containerStyle: {
      color: "#333333",
      fontWeight: 700,
    },
  });
  useEffect(() => {
    if (conversationList[conversationList?.length - 1]?.done) {
      const codeBlockWrapper = document.querySelectorAll(".code-block-wrapper");
      codeBlockWrapper.forEach((wrapper) => {
        const copyBtn = wrapper.querySelector(".code-block-header__copy");
        const codeBlock = wrapper.querySelector(".code-block-body");
        if (copyBtn && codeBlock) {
          console.log(copyBtn, codeBlock);
          copyBtn.addEventListener("click", () => {
            if (navigator.clipboard?.writeText) {
              navigator.clipboard.writeText(codeBlock.textContent ?? "");
              toast({
                description: "复制成功",
              });
            } else {
              copyText({ text: codeBlock.textContent ?? "", origin: true });
              toast({
                description: "复制成功",
              });
            }
          });
        }
      });
    }
  }, [conversationList[conversationList?.length - 1]?.done]);
};

export default useCopyCode;
