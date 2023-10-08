import mdKatex from "@traptitech/markdown-it-katex";
import hljs from "highlight.js/lib/core";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import javascript from "highlight.js/lib/languages/javascript";
import java from "highlight.js/lib/languages/java";
import json from "highlight.js/lib/languages/json";
import kotlin from "highlight.js/lib/languages/kotlin";
import latex from "highlight.js/lib/languages/latex";
import less from "highlight.js/lib/languages/less";
import django from "highlight.js/lib/languages/django";
import markdown from "highlight.js/lib/languages/markdown";
import matlab from "highlight.js/lib/languages/matlab";
import php from "highlight.js/lib/languages/php";
import python from "highlight.js/lib/languages/python";
import nginx from "highlight.js/lib/languages/nginx";
import lua from "highlight.js/lib/languages/lua";
import ruby from "highlight.js/lib/languages/ruby";
import rust from "highlight.js/lib/languages/rust";
import scss from "highlight.js/lib/languages/scss";
import sql from "highlight.js/lib/languages/sql";
import stylus from "highlight.js/lib/languages/stylus";
import shell from "highlight.js/lib/languages/shell";
import swift from "highlight.js/lib/languages/swift";
import vim from "highlight.js/lib/languages/vim";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";
import "highlight.js/styles/xcode.css";
import MarkdownIt from "markdown-it";
import mila from "markdown-it-link-attributes";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Container,
  DrawerContent,
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
  Divider,
  AbsoluteCenter,
  IconButton,
  useColorMode,
  InputGroup,
  InputLeftElement,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@chakra-ui/react";
import { SettingsIcon, MoonIcon, SunIcon } from "@chakra-ui/icons";
import autosize from "autosize";
import DOMPurify from "dompurify";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { saveAs } from "file-saver";
import dayjs from "dayjs";

import ASSISTANTS from "@/configs/assistants";
import useCopyCode from "@/hooks/useCopyCode";
import { scrollToBottom } from "@/utils/util";
import SpeechRecognition from "@/components/Microphone";

import style from "./index.module.sass";

const md5 = require("blueimp-md5");

const DIETEXT = "Please wait a minute";

function highlightBlock(str: string, lang?: string) {
  return `<pre style="white-space: pre-wrap" class="code-block-wrapper ${style["code-block-wrapper"]}"><div class="${style["code-block-header"]}"><span class="${style["code-block-header__lang"]}">${lang}</span><span class="code-block-header__copy ${style["code-block-header__copy"]}">复制</span></div><code class="hljs code-block-body ${lang}">${str}</code></pre>`;
}

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("c", c);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("csharp", csharp);
hljs.registerLanguage("css", css);
hljs.registerLanguage("go", go);
hljs.registerLanguage("java", java);
hljs.registerLanguage("json", json);
hljs.registerLanguage("kotlin", kotlin);
hljs.registerLanguage("latex", latex);
hljs.registerLanguage("less", less);
hljs.registerLanguage("django", django);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("matlab", matlab);
hljs.registerLanguage("php", php);
hljs.registerLanguage("python", python);
hljs.registerLanguage("nginx", nginx);
hljs.registerLanguage("lua", lua);
hljs.registerLanguage("ruby", ruby);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("scss", scss);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("stylus", stylus);
hljs.registerLanguage("shell", shell);
hljs.registerLanguage("swift", swift);
hljs.registerLanguage("vim", vim);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("yaml", yaml);

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
  const [isCopiedList, setIsCopiedList] = useState<any[]>([]);
  const isFinishInputRef = useRef<boolean>(true);
  const inputRef = useRef<any>(null);
  const [isMobile, setIsMobile] = useState(true);
  const [isGPT4, setIsGPT4] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const { colorMode, toggleColorMode } = useColorMode();
  const cancelRef = useRef<any>();
  const {
    isOpen: isOpenDeleteRecord,
    onOpen: onOpenDeleteRecord,
    onClose: onCloseDeleteRecord,
  } = useDisclosure();
  const controllerRef = useRef<any>();

  const toast = useToast({
    position: "top",
    duration: 3000,
    containerStyle: {
      // color: "#333333",
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
    setIsCopiedList([]);
  }, []);

  useCopyCode(conversationList, toast);

  const changeInputValue = (e: any) => {
    setInputValue(e?.target?.value);
  };

  const ro = useMemo(
    () =>
      new ResizeObserver((entries) => {
        for (let entry of entries) {
          const cr = entry.contentRect;
          if (cr.width <= 684) {
            setIsMobile(true);
          } else {
            setIsMobile(false);
          }
        }
      }),
    []
  );

  useEffect(() => {
    // inputRef?.current?.focus();
    autosize(inputRef.current);
    ro.observe(document.body);

    return () => {
      autosize.destroy(inputRef.current);
      ro.unobserve(document.body);
    };
  }, [ro]);

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
  // Clipdrop API
  async function queryClipdropImageFromText(data: any) {
    const response = await fetch("https://clipdrop-api.co/text-to-image/v1", {
      headers: {
        "x-api-key":
          "43816edcf9adfdb93dd8f9438e1fe3045d7b29c8c6d5fd62b64c92853b6973e5ecb3d7dd5c58c18dd0f5969ab0da0895",
      },
      method: "POST",
      body: data,
    });

    const result = await response.arrayBuffer();
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
    if (isListening) {
      toast({
        description: "请先停止录音",
        duration: 3000,
        variant: "solid",
      });
      return;
    }
    if (!inputValue?.trim()?.length) {
      toast({
        description: "请先输入内容",
        duration: 3000,
        variant: "solid",
      });
      return;
    }
    inputRef?.current?.blur();
    setLoading(true);
    let newList: any[] = [];
    if (
      conversationList?.length > 0 &&
      conversationList?.filter(({ owner }: any) => owner !== "time")?.length %
        6 ===
        0
    ) {
      newList = [
        ...conversationList,
        {
          owner: "time",
          value: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        },
        {
          text: inputValue,
          owner: "me",
        },
      ];
    } else {
      newList = [
        ...conversationList,
        {
          text: inputValue,
          owner: "me",
        },
      ];
    }
    setConversationList([...newList]);
    scrollToBottom();
    localStorage.setItem("conversationList", JSON.stringify([...newList]));
    const question = inputValue;
    setInputValue("");

    if (currentRole?.type === "text-to-image") {
      const translatedQ = await translator({ q: question });
      // const inputs = translatedQ?.trans_result[0].dst + ", mdjrny-v4 style";
      const form = new FormData();
      form.append("prompt", translatedQ?.trans_result[0].dst);
      try {
        queryClipdropImageFromText(form).then(async (response) => {
          // Use image
          const image = new (Image as any)(256, 256);

          const arrayBufferView = new Uint8Array(response);
          const blob = new Blob([arrayBufferView], { type: "image/jpeg" });
          const url = await URL.createObjectURL(blob);
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
      if (newList[i]?.owner === "ai" && newList[i]?.id?.length) {
        id = newList[i]?.id || "";
        break;
      }
    }

    controllerRef.current = new AbortController();
    const signal = controllerRef.current.signal;
    let text = "",
      originText = "";

    let prevData;
    try {
      const response: any = await fetch("/chat", {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
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
      let decoder = new TextDecoder("utf-8");

      // infinite loop while the body is downloading
      while (true) {
        // done is true for the last chunk
        // value is Uint8Array of the chunk bytes
        const { done, value } = await reader.read();

        // let encodedString = String.fromCodePoint.apply(null, value);
        // let decodedString = decodeURIComponent(escape(encodedString)); //没有这一步中文会乱码
        let decodedString = decoder.decode(value);
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
            done: true,
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
              done: true,
              originText,
            },
          ])
        );
      }

      setLoading(false);
      inputRef?.current?.focus();
    }
  };

  const asideChildren = () => {
    return (
      <>
        <Box
          className={style.drawListWrap}
          height="calc(100% - 40px)"
          paddingBottom="20px"
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
                      const to = setTimeout(() => {
                        onClose();
                        to && clearTimeout(to);
                      }, 300);
                    }}
                  >
                    {childItem?.title}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </Box>
        <Box justifyContent="space-around" display="flex" height="40px">
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
              saveAs(blob, "对话记录.html");
            }}
          >
            导出
          </Button>

          <Button
            color="teal"
            onClick={() => {
              if (conversationList?.length > 0) {
                onOpenDeleteRecord();
              } else {
                toast({
                  description: "暂无记录",
                  duration: 3000,
                  variant: "solid",
                });
              }
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
      height="100%"
      margin={0}
      padding={0}
    >
      <AlertDialog
        leastDestructiveRef={cancelRef}
        isOpen={isOpenDeleteRecord}
        onClose={onCloseDeleteRecord}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              删除确认
            </AlertDialogHeader>

            <AlertDialogBody>确定要删除所有聊天记录吗？</AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onCloseDeleteRecord}>
                取消
              </Button>
              <Button
                colorScheme="red"
                onClick={() => {
                  localStorage.removeItem("conversationList");
                  setConversationList([]);
                  onCloseDeleteRecord();
                  toast({
                    description: "删除成功",
                    duration: 3000,
                    variant: "solid",
                  });
                }}
                ml={3}
              >
                确认
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      {!isMobile && (
        <aside
          style={{
            overflow: "hidden",
            borderColor: colorMode === "light" ? "#e6e7e9" : "#3f3f3f",
          }}
        >
          {asideChildren()}
        </aside>
      )}

      <Container
        className={style.contentWrap}
        maxWidth={isMobile ? "100%" : "calc(100vw - 240px)"}
        width={isMobile ? "100%" : "calc(100vw - 240px)"}
        height="100%"
        margin={0}
        padding={0}
      >
        <div className={style.drawerBtnWrap}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            {isMobile && (
              <Stack direction="row">
                <IconButton
                  aria-label="Setting"
                  icon={<SettingsIcon />}
                  color="teal"
                  size="sm"
                  variant="outline"
                  onClick={onOpen}
                />
                <IconButton
                  aria-label="theme"
                  icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
                  color="teal"
                  size="sm"
                  variant="outline"
                  onClick={toggleColorMode}
                  style={{ marginLeft: 14 }}
                />
              </Stack>
            )}
            <Stack direction="row">
              <Stack direction="row">
                <Badge variant="outline" colorScheme="teal">
                  {currentRole?.title}
                </Badge>
              </Stack>
              <Stack style={{ marginLeft: 14 }} direction="row">
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
            {!isMobile && (
              <IconButton
                aria-label="theme"
                icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
                color="teal"
                size="sm"
                variant="outline"
                onClick={toggleColorMode}
              />
            )}
          </Stack>
        </div>
        <Box
          bgGradient={
            colorMode === "light"
              ? "linear(to-r, pink.50, green.50)"
              : "linear(to-r, var(--chakra-colors-gray-800), var(--chakra-colors-gray-900))"
          }
          className={style.container}
        >
          <Drawer placement="right" onClose={onClose} isOpen={isOpen}>
            <DrawerContent>
              <DrawerBody padding={"14px"} className={style.drawerBodyWrap}>
                {asideChildren()}
              </DrawerBody>
            </DrawerContent>
          </Drawer>

          <div className={style.infoListWrap} id="infoListWrap">
            {conversationList?.length > 0 ? (
              conversationList?.map((info: any, index: any) =>
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
                    <Popover
                      trigger={isMobile ? "click" : "hover"}
                      placement={isMobile ? "top-start" : "right-start"}
                      closeDelay={300}
                    >
                      <PopoverTrigger>
                        <div
                          className={style.text}
                          style={
                            colorMode === "light"
                              ? { background: "#e5e9ec" }
                              : { background: "#2D3748" }
                          }
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
                            style={{ width: 70, height: 34, fontSize: 12 }}
                            colorScheme="teal"
                            variant="solid"
                            onClick={() => {
                              const arr: any[] = [...isCopiedList];
                              arr[index] = true;
                              setIsCopiedList([...arr]);
                              const to = setTimeout(() => {
                                const arr: any[] = [...isCopiedList];
                                arr[index] = false;
                                setIsCopiedList([...arr]);
                                to && clearTimeout(to);
                              }, 2000);
                            }}
                          >
                            {isCopiedList[index] ? "COPIED" : "COPY"}
                          </Button>
                        </CopyToClipboard>
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : info?.owner === "me" ? (
                  <div key={info?.id ?? 0 + index} className={style.meInfoWrap}>
                    <span className={style.avatar}>😁</span>
                    <Popover
                      trigger={isMobile ? "click" : "hover"}
                      placement={isMobile ? "top-start" : "left-end"}
                      closeDelay={300}
                    >
                      <PopoverTrigger>
                        <div className={style.myMessageWrap}>
                          <div
                            className={style.text}
                            style={
                              colorMode === "light"
                                ? { background: "#e5e9ec" }
                                : { background: "#2D3748" }
                            }
                          >
                            {info?.text}
                          </div>
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
                            style={{ width: 70, height: 34, fontSize: 12 }}
                            colorScheme="teal"
                            variant="solid"
                            onClick={() => {
                              const arr: any[] = [...isCopiedList];
                              arr[index] = true;
                              setIsCopiedList([...arr]);
                              const to = setTimeout(() => {
                                const arr: any[] = [...isCopiedList];
                                arr[index] = false;
                                setIsCopiedList([...arr]);
                                to && clearTimeout(to);
                              }, 2000);
                            }}
                          >
                            {isCopiedList[index] ? "COPIED" : "COPY"}
                          </Button>
                        </CopyToClipboard>
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : (
                  <Box key={info.value} position="relative" padding="10">
                    <Divider />
                    <AbsoluteCenter
                      px="4"
                      style={
                        colorMode === "light"
                          ? {
                              color: "#999",
                              fontSize: 12,
                              backgroundImage:
                                "linear-gradient(to right, var(--chakra-colors-pink-50), var(--chakra-colors-green-50)",
                            }
                          : {
                              color: "#999",
                              fontSize: 12,
                              backgroundImage:
                                "linear(to-r, var(--chakra-colors-gray-800), var(--chakra-colors-gray-900))",
                            }
                      }
                    >
                      {info.value}
                    </AbsoluteCenter>
                  </Box>
                )
              )
            ) : (
              <Box textAlign="center" margin={"50% auto"} color="#999999">
                有任何问题尽管问我～
              </Box>
            )}
          </div>
          {loading && (
            <div className={style.diyWrap}>
              <Button
                colorScheme="teal"
                variant="outline"
                style={{
                  position: "absolute",
                  right: 0,
                  height: 32,
                  fontSize: 12,
                  borderColor:
                    colorMode === "light"
                      ? "var(--chakra-colors-teal-500)"
                      : "rgb(44, 122, 123)",
                  color:
                    colorMode === "light"
                      ? "var(--chakra-colors-teal-500)"
                      : "rgb(44, 122, 123)",
                }}
                onClick={() => {
                  controllerRef.current?.abort();
                }}
              >
                停止
              </Button>
            </div>
          )}
          <div className={style.operateWrap}>
            <div className={style.inputWrap}>
              <SpeechRecognition
                setInputValue={setInputValue}
                setInterimTranscript={setInterimTranscript}
                isListening={isListening}
                setIsListening={setIsListening}
                zIndex={isListening ? 3 : 1}
              />
              <InputGroup>
                <Textarea
                  variant="outline"
                  marginRight="8px"
                  borderColor={
                    colorMode === "light"
                      ? "var(--chakra-colors-teal-500)"
                      : "rgb(44, 122, 123)"
                  }
                  zIndex={isListening ? 1 : 3}
                  focusBorderColor="teal.500"
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
                ></Textarea>
                <InputLeftElement
                  className={style.leftElementWrap}
                  width="100%"
                  style={{
                    padding: "9px 17px 9px 17px",
                    minHeight: "60px",
                    height: "60px",
                    overflowY: "auto",
                    textAlign: "left",
                    display: isListening ? "block" : "none",
                    lineHeight: "22px",
                  }}
                >
                  {interimTranscript}
                </InputLeftElement>
              </InputGroup>
              <Button
                colorScheme="teal"
                variant="outline"
                style={{
                  height: 60,
                  borderColor:
                    colorMode === "light"
                      ? "var(--chakra-colors-teal-500)"
                      : "rgb(44, 122, 123)",
                  color:
                    colorMode === "light"
                      ? "var(--chakra-colors-teal-500)"
                      : "rgb(44, 122, 123)",
                }}
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
