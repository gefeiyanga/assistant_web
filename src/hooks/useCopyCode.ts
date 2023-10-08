import { useEffect } from "react";
import { useToast } from "@chakra-ui/react";

import { copyText } from "@/utils/util";

const useCopyCode = (conversationList: any[], toast: any) => {
  useEffect(() => {
    const cppyCallback = (codeBlock: any) => {
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
    };
    if (conversationList[conversationList?.length - 1]?.done) {
      const codeBlockWrapper = document.querySelectorAll(".code-block-wrapper");
      codeBlockWrapper.forEach((wrapper) => {
        const copyBtn: any = wrapper.querySelector(".code-block-header__copy");
        const codeBlock = wrapper.querySelector(".code-block-body");
        if (copyBtn && codeBlock && !copyBtn["listenClick"]) {
          copyBtn.addEventListener("click", () => cppyCallback(codeBlock));
          copyBtn["listenClick"] = true;
        }
      });
    }
    return () => {
      const codeBlockWrapper = document.querySelectorAll(".code-block-wrapper");
      codeBlockWrapper.forEach((wrapper) => {
        const copyBtn = wrapper.querySelector(".code-block-header__copy");
        const codeBlock = wrapper.querySelector(".code-block-body");
        if (copyBtn && codeBlock) {
          copyBtn.removeEventListener("click", () => cppyCallback(codeBlock));
        }
      });
    };
  }, [conversationList[conversationList?.length - 1]?.done]);
};

export default useCopyCode;
