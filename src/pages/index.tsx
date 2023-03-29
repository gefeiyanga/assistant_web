import mdKatex from "@traptitech/markdown-it-katex";
import hljs from "highlight.js";
import "highlight.js/styles/xcode.css";
import MarkdownIt from "markdown-it";
import mila from "markdown-it-link-attributes";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Drawer,
  Box,
  useToast,
  useDisclosure,
  Textarea,
  Button,
  Stack,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from "@chakra-ui/react";
import autosize from "autosize";

import AI_AVATAR from "public/icons/ai.png";
import ASSISTANTS from "@/configs/assistants";

import style from "./index.module.sass";

const DIETEXT = "Please wait a minute";

function highlightBlock(str: string, lang?: string) {
  return `<pre style="white-space: pre-wrap" class="code-block-wrapper"><code class="hljs code-block-body ${lang}">${str}</code></pre>`;
}

const mdi = new MarkdownIt({
  linkify: true,
  highlight(code, language) {
    const validLang = !!(language && hljs.getLanguage(language));
    if (validLang) {
      const lang = language ?? "";
      return highlightBlock(
        hljs.highlight(code, { language: lang }).value,
        lang
      );
    }
    return highlightBlock(hljs.highlightAuto(code).value, "");
  },
});
mdi.use(mila, { attrs: { target: "_blank", rel: "noopener" } });
mdi.use(mdKatex, {
  blockClass: "katexmath-block rounded-md p-[10px]",
  errorColor: " #cc0000",
});
export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationList, setConversationList] = useState<any[]>([]);
  const isFinishInputRef = useRef<boolean>(true);
  const inputRef = useRef<any>(null);
  const toast = useToast({
    position: "top",
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentRole, setCurrentRole] = useState<any>(
    ASSISTANTS[0]["roleList"][0]
  );

  const changeInputValue = (e: any) => {
    setInputValue(e?.target?.value);
  };

  useEffect(() => {
    inputRef?.current?.focus();
    autosize(inputRef.current);
    return () => {
      autosize.destroy(inputRef.current);
    };
  }, []);

  const send = async () => {
    if (loading) {
      return;
    }
    if (!inputValue?.trim()?.length) {
      toast({
        description: "请先输入内容",
        duration: 3000,
        variant: "subtle",
      });

      return;
    }
    inputRef?.current?.blur();
    setLoading(true);
    const newList = [
      ...conversationList,
      {
        text: inputValue,
        owner: "me",
      },
    ];
    setConversationList([...newList]);

    let id = "";
    for (let i = newList?.length - 1; i >= 0; i--) {
      if (newList[i]?.owner === "ai") {
        id = newList[i]?.id || "";
        break;
      }
    }
    const question = inputValue;
    setInputValue("");

    document
      .querySelector("#last")
      ?.scrollIntoView({ behavior: "smooth", block: "end" });
    try {
      const response: any = await fetch("/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          id,
          systemMessage: currentRole?.systemMessage,
          // model: "gpt4",
        }),
      });

      // instead of response.json() and other methods
      const reader = response.body.getReader();
      let text = "";

      // infinite loop while the body is downloading
      while (true) {
        // done is true for the last chunk
        // value is Uint8Array of the chunk bytes
        const { done, value } = await reader.read();

        let encodedString = String.fromCodePoint.apply(null, value);
        let decodedString = decodeURIComponent(escape(encodedString)); //没有这一步中文会乱码

        // Always process the final line
        const lastIndex = decodedString.lastIndexOf(
          "\n",
          decodedString.length - 2
        );
        let chunk = decodedString;
        if (lastIndex !== -1) {
          chunk = decodedString.substring(lastIndex);
        }
        try {
          const data = JSON.parse(chunk);

          if (data?.text) {
            text = mdi.render(data?.text);
          }

          setConversationList([
            ...newList,
            {
              ...data,
              owner: "ai",
              text,
            },
          ]);
        } catch (error) {
          if (!text?.trim()?.length) {
            document.querySelector("#last")?.scrollIntoView();
            setConversationList([
              ...newList,
              {
                owner: "ai",
                text: DIETEXT,
              },
            ]);
          }
        }

        if (done) {
          break;
        }
        document
          .querySelector("#last")
          ?.scrollIntoView({ behavior: "smooth", block: "end" });
      }
      setLoading(false);
      inputRef?.current?.focus();
    } catch (error) {
      document.querySelector("#last")?.scrollIntoView();
      setConversationList([
        ...newList,
        {
          owner: "ai",
          text: DIETEXT,
        },
      ]);

      setLoading(false);
      inputRef?.current?.focus();
    }
  };

  return (
    <>
      <div className={style.drawerBtnWrap}>
        <Stack direction="row">
          <Badge colorScheme="red" variant="subtle">
            {currentRole?.title}
          </Badge>
        </Stack>
        <Stack direction="row">
          <Button color="teal" variant="link" onClick={onOpen}>
            切换助手
          </Button>
        </Stack>
      </div>
      <Box
        bgGradient="linear(to-r, pink.50, green.50)"
        className={style.container}
      >
        <Drawer placement="right" onClose={onClose} isOpen={isOpen}>
          <DrawerContent>
            <DrawerHeader>助手分类</DrawerHeader>
            <DrawerBody>
              <Accordion allowToggle>
                {ASSISTANTS?.map((item: any, index: number) => (
                  <AccordionItem key={index}>
                    <h2>
                      <AccordionButton>
                        <Box as="span" flex="1" textAlign="left">
                          {item?.title}
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    {item?.roleList?.map(
                      (childItem: any, childIndex: number) => (
                        <AccordionPanel padding={0} key={childIndex} pb={4}>
                          <Button
                            onClick={() => {
                              setCurrentRole(childItem);
                              onClose();
                            }}
                            colorScheme="teal"
                            variant="ghost"
                          >
                            {childItem?.title}
                          </Button>
                        </AccordionPanel>
                      )
                    )}
                  </AccordionItem>
                ))}
              </Accordion>
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        <div className={style.infoListWrap} id="infoListWrap">
          {conversationList?.map((info: any, index) =>
            info?.owner === "ai" ? (
              <div key={info?.id ?? 0 + index} className={style.aiInfoWrap}>
                <Image
                  className={style.avatar}
                  src={AI_AVATAR}
                  width={34}
                  height={34}
                  alt=""
                />
                <div
                  className={style.text}
                  dangerouslySetInnerHTML={{ __html: info?.text }}
                ></div>
              </div>
            ) : (
              <div key={info?.id ?? 0 + index} className={style.meInfoWrap}>
                <span className={style.avatar}>😁</span>
                <div className={style.myMessageWrap}>
                  <div className={style.text}>{info?.text}</div>
                  {info?.reference && (
                    <div className={style.reference}>
                      ChatGPT: {info?.reference?.text}
                    </div>
                  )}
                </div>
              </div>
            )
          )}
          <div id="last" style={{ height: 90 }}></div>
        </div>
        <div className={style.operateWrap}>
          <div className={style.inputWrap}>
            <Textarea
              variant="outline"
              marginRight="8px"
              ref={inputRef}
              value={inputValue}
              onChange={changeInputValue}
              autoComplete="off"
              onCompositionStart={(e: any) => {
                isFinishInputRef.current = false;
              }}
              overflow="auto"
              maxHeight="60px"
              minHeight="60px"
              onCompositionEnd={(e: any) => {
                isFinishInputRef.current = true;
              }}
              onKeyDown={(e: any) => {
                if (
                  isFinishInputRef.current &&
                  !e.shiftKey &&
                  e.key?.toLowerCase() === "enter"
                ) {
                  e?.preventDefault();
                  send();
                }
              }}
            />
            <Button
              colorScheme="teal"
              variant="solid"
              style={{ height: 60 }}
              isLoading={loading}
              onClick={send}
            >
              发送
            </Button>
          </div>
        </div>
      </Box>
    </>
  );
}
