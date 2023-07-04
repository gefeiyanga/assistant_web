import mdKatex from "@traptitech/markdown-it-katex";
import hljs from "highlight.js";
import "highlight.js/styles/xcode.css";
import MarkdownIt from "markdown-it";
import mila from "markdown-it-link-attributes";
import NextImage from "next/image";
import { useEffect, useRef, useState } from "react";

import {
  Container,
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
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@chakra-ui/react";
import autosize from "autosize";
import DOMPurify from "dompurify";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { saveAs } from "file-saver";

import AI_AVATAR from "public/icons/ai.png";
import ASSISTANTS from "@/configs/assistants";
import useCopyCode from "@/hooks/useCopyCode";
import { scrollToBottom } from "@/utils/util";

import style from "./index.module.sass";

const md5 = require("blueimp-md5");

const DIETEXT = "Please wait a minute";

function highlightBlock(str: string, lang?: string) {
  return `<pre style="white-space: pre-wrap" class="code-block-wrapper ${style["code-block-wrapper"]}"><div class="${style["code-block-header"]}"><span class="${style["code-block-header__lang"]}">${lang}</span><span class="code-block-header__copy ${style["code-block-header__copy"]}">复制</span></div><code class="hljs code-block-body ${lang}">${str}</code></pre>`;
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
    // return hljs.highlightAuto(code).value;
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
  const [isMobile, setIsMobile] = useState(false);
  const [isGPT4, setIsGPT4] = useState(false);
  const toast = useToast({
    position: "top",
    duration: 3000,
    variant: "subtle",
    containerStyle: {
      color: "#333333",
      fontWeight: 700,
    },
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentRole, setCurrentRole] = useState<any>(
    ASSISTANTS[0]["roleList"][0]
  );

  useEffect(() => {
    setConversationList(
      JSON.parse(localStorage.getItem("conversationList") || "[]")
    );
  }, []);

  useCopyCode(conversationList);

  const changeInputValue = (e: any) => {
    setInputValue(e?.target?.value);
  };

  useEffect(() => {
    inputRef?.current?.focus();
    autosize(inputRef.current);
    ro.observe(document.body);

    return () => {
      autosize.destroy(inputRef.current);
      ro.unobserve(document.body);
    };
  }, []);

  const ro = new ResizeObserver((entries) => {
    for (let entry of entries) {
      const cr = entry.contentRect;
      if (cr.width <= 684) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    }
  });

  async function queryImageFromText(data: any) {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/prompthero/openjourney",
      {
        headers: {
          Authorization: "Bearer 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",
        },
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    const result = await response.blob();
    return result;
  }

  async function translator(data: any) {
    let formBody = new URLSearchParams();
    formBody.append("q", data?.q);
    formBody.append("salt", "variousdid");
    formBody.append("from", "auto");
    formBody.append("to", "en");
    formBody.append("appid", "20230331001622946");
    formBody.append(
      "sign",
      md5("20230331001622946" + data?.q + "variousdid" + "hAJX6N850CHRDRwm8PsW")
    );

    const response = await fetch("/translate", {
      method: "POST",
      body: formBody,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const result = await response.json();
    return result;
  }

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
    scrollToBottom();
    localStorage.setItem("conversationList", JSON.stringify([...newList]));
    const question = inputValue;
    setInputValue("");

    if (currentRole?.type === "text-to-image") {
      const translatedQ = await translator({ q: question });
      const inputs = translatedQ?.trans_result[0].dst + ", mdjrny-v4 style";
      try {
        queryImageFromText({ inputs }).then(async (response) => {
          // Use image
          const image = new (Image as any)(256, 256);
          const url = await URL.createObjectURL(response);
          image["src"] = url;
          const img = `<img src=${url} width=256 height=256 />`;
          setConversationList([
            ...newList,
            {
              owner: "ai",
              text: img,
            },
          ]);
          scrollToBottom(256);
          localStorage.setItem(
            "conversationList",
            JSON.stringify([
              ...newList,
              {
                owner: "ai",
                text: img,
              },
            ])
          );
          inputRef?.current?.focus();
          setLoading(false);
        });
      } catch (error) {
        setLoading(false);
        inputRef?.current?.focus();
      }
      return;
    }

    let id = "";
    for (let i = newList?.length - 1; i >= 0; i--) {
      if (newList[i]?.owner === "ai") {
        id = newList[i]?.id || "";
        break;
      }
    }

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
          model: isGPT4 ? "gpt4" : "",
        }),
      });

      // instead of response.json() and other methods
      const reader = response.body.getReader();
      let text = "",
        originText = "";

      let prevData;

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
          prevData = JSON.parse(chunk);

          if (data?.text) {
            originText = data?.text;
            text = mdi.render(data?.text);
          }

          setConversationList([
            ...newList,
            {
              ...data,
              owner: "ai",
              text,
              done,
              originText,
            },
          ]);
          scrollToBottom();
          localStorage.setItem(
            "conversationList",
            JSON.stringify([
              ...newList,
              {
                ...data,
                owner: "ai",
                text,
                done,
                originText,
              },
            ])
          );
        } catch (error) {
          if (!text?.trim()?.length) {
            setConversationList([
              ...newList,
              {
                owner: "ai",
                text: DIETEXT,
              },
            ]);
            scrollToBottom();
            localStorage.setItem(
              "conversationList",
              JSON.stringify([
                ...newList,
                {
                  owner: "ai",
                  text: DIETEXT,
                },
              ])
            );
          } else {
            setConversationList([
              ...newList,
              {
                ...prevData,
                owner: "ai",
                text,
                done,
                originText,
              },
            ]);
            scrollToBottom();
            localStorage.setItem(
              "conversationList",
              JSON.stringify([
                ...newList,
                {
                  ...prevData,
                  owner: "ai",
                  text,
                  done,
                  originText,
                },
              ])
            );
          }
        }

        if (done) {
          break;
        }
      }
      setLoading(false);
      inputRef?.current?.focus();
    } catch (error) {
      console.log(error);

      setConversationList([
        ...newList,
        {
          owner: "ai",
          text: DIETEXT,
        },
      ]);
      scrollToBottom();
      localStorage.setItem(
        "conversationList",
        JSON.stringify([
          ...newList,
          {
            owner: "ai",
            text: DIETEXT,
          },
        ])
      );

      setLoading(false);
      inputRef?.current?.focus();
    }
  };

  const asideChildren = (padding: number) => {
    return (
      <>
        <Box
          height={
            padding ? `calc(100vh - 60px - ${padding}px)` : "calc(100vh - 60px)"
          }
          overflow="auto"
        >
          {ASSISTANTS?.map((item: any, index: number) => (
            <div className={style.singleItem} key={index}>
              <Box
                color="teal"
                as="span"
                flex="1"
                textAlign="left"
                padding="0px 10px"
              >
                {item?.title}
              </Box>
              {item?.roleList?.map((childItem: any, childIndex: number) => (
                <div
                  className={
                    currentRole === childItem
                      ? `${style.childItem}`
                      : `${style.notActive}`
                  }
                  key={childIndex}
                >
                  <div
                    onClick={() => {
                      setCurrentRole(childItem);
                      onClose();
                    }}
                  >
                    {childItem?.title}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </Box>
        <Box justifyContent="space-around" display="flex" height="60px">
          <Button
            color="teal"
            onClick={() => {
              const blob = new Blob(
                // @ts-ignore
                [document.querySelector("#infoListWrap")?.innerHTML],
                {
                  type: "text/plain;charset=utf-8",
                }
              );
              saveAs(blob, "Hello World.html");
            }}
          >
            导出
          </Button>

          <Button
            color="teal"
            onClick={() => {
              localStorage.removeItem("conversationList");
              setConversationList([]);
            }}
          >
            清除聊天记录
          </Button>
        </Box>
      </>
    );
  };

  return (
    <Container
      className={style.containerWrap}
      position="relative"
      maxWidth="100vw"
      width="100vw"
      height="calc(var(--vh, 1vh) * 100)"
      margin={0}
      padding={0}
    >
      {!isMobile && (
        <aside style={{ overflow: "hidden" }}>{asideChildren(0)}</aside>
      )}

      <Container
        className={style.contentWrap}
        maxWidth={isMobile ? "100%" : "calc(100vw - 240px)"}
        width={isMobile ? "100%" : "calc(100vw - 240px)"}
        height="calc(var(--vh, 1vh) * 100)"
        margin={0}
        padding={0}
      >
        <div className={style.drawerBtnWrap}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack direction="column">
              <Stack direction="row">
                <Stack direction="row">
                  <Badge variant="outline" colorScheme="teal">
                    {currentRole?.title}
                  </Badge>
                </Stack>
                <Stack direction="row">
                  <Badge
                    variant="outline"
                    colorScheme="teal"
                    cursor={"pointer"}
                    onClick={() => {
                      setIsGPT4(!isGPT4);
                    }}
                  >
                    {isGPT4 ? "GPT4" : "GPT3"}
                  </Badge>
                </Stack>
              </Stack>
              {isMobile && (
                <Stack direction="row">
                  <Button color="teal" variant="link" onClick={onOpen}>
                    切换助手
                  </Button>
                </Stack>
              )}
            </Stack>
          </Stack>
        </div>
        <Box
          bgGradient="linear(to-r, pink.50, green.50)"
          className={style.container}
        >
          <Drawer placement="right" onClose={onClose} isOpen={isOpen}>
            <DrawerContent>
              <DrawerBody className={style.drawerBodyWrap}>
                {asideChildren(8 * 2)}
              </DrawerBody>
            </DrawerContent>
          </Drawer>

          <div className={style.infoListWrap} id="infoListWrap">
            {conversationList?.map((info: any, index: any) =>
              info?.owner === "ai" ? (
                <div key={info?.id ?? 0 + index} className={style.aiInfoWrap}>
                  {/* <NextImage
                    className={style.avatar}
                    src={AI_AVATAR}
                    width={34}
                    height={34}
                    alt=""
                  /> */}
                  <span className={style.avatar}>🤖️</span>
                  <Popover trigger="hover" placement="right-end">
                    <PopoverTrigger>
                      <div
                        className={style.text}
                        dangerouslySetInnerHTML={{
                          // __html: info?.text,
                          __html: DOMPurify.sanitize(info?.text, {
                            ALLOW_UNKNOWN_PROTOCOLS: true,
                          }),
                        }}
                      ></div>
                    </PopoverTrigger>
                    <PopoverContent
                      style={{
                        background: "transparent",
                        border: "0px",
                        boxShadow: "0px 0px 0px",
                      }}
                    >
                      <CopyToClipboard text={info?.originText}>
                        <Button
                          style={{ width: 50, height: 34 }}
                          colorScheme="teal"
                          variant="solid"
                        >
                          复制
                        </Button>
                      </CopyToClipboard>
                    </PopoverContent>
                  </Popover>
                </div>
              ) : (
                <div key={info?.id ?? 0 + index} className={style.meInfoWrap}>
                  <span className={style.avatar}>😁</span>
                  <Popover trigger="hover" placement="left-end">
                    <PopoverTrigger>
                      <div className={style.myMessageWrap}>
                        <div className={style.text}>{info?.text}</div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent
                      style={{
                        background: "transparent",
                        border: "0px",
                        boxShadow: "0px 0px 0px",
                        width: "auto",
                      }}
                    >
                      <CopyToClipboard text={info?.text}>
                        <Button
                          style={{ width: 50, height: 34 }}
                          colorScheme="teal"
                          variant="solid"
                        >
                          复制
                        </Button>
                      </CopyToClipboard>
                    </PopoverContent>
                  </Popover>
                </div>
              )
            )}
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
      </Container>
    </Container>
  );
}
