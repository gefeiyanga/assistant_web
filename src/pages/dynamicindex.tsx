import hljs from "highlight.js/lib/core";
import MarkdownIt from "markdown-it";
import mdKatex from "@traptitech/markdown-it-katex";
import "highlight.js/styles/xcode.css";
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
} from "@chakra-ui/react";
import {
  SettingsIcon,
  MoonIcon,
  SunIcon,
  ChatIcon,
  DeleteIcon,
} from "@chakra-ui/icons";
import autosize from "autosize";
import DOMPurify from "dompurify";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";

import ASSISTANTS from "@/configs/assistants";
import useCopyCode from "@/hooks/useCopyCode";
import { scrollToBottom } from "@/utils/util";
import InitLanguages from "@/utils/initLanguages";
import SpeechRecognition from "@/components/Microphone";
import OperationDialog from "@/components/OperationDialog";
import {
  Stores,
  Chat,
  Conversation,
  addData,
  deleteData,
  getStoreData,
  initDB,
  getData,
  updateData,
  deleteStore,
} from "../../lib/db";

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
InitLanguages();
export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatList, setChatList] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<string>("");
  const [conversationList, setConversationList] = useState<Conversation[]>([]);
  const [isCopiedList, setIsCopiedList] = useState<any[]>([]);
  const isFinishInputRef = useRef<boolean>(true);
  const inputRef = useRef<any>(null);
  const [isMobile, setIsMobile] = useState(true);
  const [isGPT4, setIsGPT4] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const { colorMode, toggleColorMode } = useColorMode();
  // 删除单个对话的配置项
  const delCurrentChatRef = useRef<any>();
  const {
    isOpen: isOpenDeleteCurrentChat,
    onOpen: onOpenDeleteCurrentChat,
    onClose: onCloseDeleteCurrentChat,
  } = useDisclosure();
  // 删除所有对话的配置项
  const delAllRef = useRef<any>();
  const {
    isOpen: isOpenDeleteAllRecord,
    onOpen: onOpenDeleteAllRecord,
    onClose: onCloseDeleteAllRecord,
  } = useDisclosure();

  // http signal controller
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
    initDBFn();
    setIsCopiedList([]);
  }, []);

  const initDBFn = () => {
    initDB().then(async () => {
      const chatList = await getStoreData<Chat>(Stores.ChatList);
      setChatList(
        chatList?.sort((a: Chat, b: Chat) => {
          if (dayjs(a.date) < dayjs(b.date)) {
            return -1;
          } else {
            return 1;
          }
        })
      );
    });
  };

  useCopyCode(conversationList, toast);

  useEffect(() => {
    if (currentChat) {
      // get conversationList on this chat
      getStoreData(Stores.ConversationList).then((conversationList: any[]) => {
        setConversationList(
          conversationList
            ?.filter((item: Conversation) => item?.chatId === currentChat)
            ?.sort((a: Conversation, b: Conversation) => {
              if (dayjs(a.date) < dayjs(b.date)) {
                return -1;
              } else {
                return 1;
              }
            })
        );
      });
    } else {
      setConversationList([]);
    }
  }, [currentChat]);

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

  const summarize = async (
    chatList: Chat[],
    id: string,
    chatId: string,
    date: number
  ) => {
    addData(Stores.ChatList, {
      id: chatId,
      title: "新对话",
      date,
    });
    setChatList([...chatList, { id: chatId, title: "新对话", date }]);
    setCurrentChat(chatId);

    let originText = "";
    try {
      const response: any = await fetch("/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
        },
        body: JSON.stringify({
          question: `你将尝试总结新对话的标题(请不要出现【对话标题：】这种标识)，以使其更清晰和集中。你会分析对话中的关键信息和问题，并利用这些信息生成一个简洁而准确的标题。这将有助于确保对话参与者更容易理解话题并找到他们感兴趣的信息`,
          id,
          systemMessage: currentRole?.systemMessage,
          model: "",
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

          if (data?.text) {
            originText = data?.text;
          }
          setChatList([...chatList, { id: chatId, title: originText, date }]);
          updateData(Stores.ChatList, chatId, { title: originText });
        } catch (error) {
          if (!originText?.trim()?.length) {
            setChatList([...chatList, { id: chatId, title: "新对话", date }]);
            updateData(Stores.ChatList, chatId, { title: "新对话" });
          } else {
            setChatList([...chatList, { id: chatId, title: originText, date }]);
            updateData(Stores.ChatList, chatId, { title: originText });
          }
        }

        if (done) {
          break;
        }
      }
    } catch (error) {
      console.log(error);

      if (!originText?.trim()?.length) {
        setChatList([...chatList, { id: chatId, title: "新对话", date }]);
        updateData(Stores.ChatList, chatId, { title: "新对话" });
      } else {
        setChatList([...chatList, { id: chatId, title: originText, date }]);
        updateData(Stores.ChatList, chatId, { title: originText });
      }
    }
  };

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
    let newList: Conversation[] = [];
    const chatId = conversationList?.length
      ? conversationList[0].chatId
      : uuidv4();
    if (
      conversationList?.length > 0 &&
      conversationList?.filter(({ owner }: any) => owner !== "time")?.length %
        6 ===
        0
    ) {
      newList = [
        ...conversationList,
        {
          id: uuidv4(),
          chatId,
          text: "",
          originText: "",
          owner: "time",
          date: dayjs().valueOf(),
          done: true,
        },
        {
          id: uuidv4(),
          chatId,
          text: inputValue,
          originText: inputValue,
          owner: "me",
          date: dayjs().valueOf(),
          done: true,
        },
      ];
    } else {
      newList = [
        ...conversationList,
        {
          id: uuidv4(),
          chatId,
          text: inputValue,
          originText: inputValue,
          owner: "me",
          date: dayjs().valueOf(),
          done: true,
        },
      ];
    }
    setConversationList([...newList]);
    scrollToBottom();
    // localStorage.setItem("conversationList", JSON.stringify([...newList]));
    await addData(Stores.ConversationList, {
      id: uuidv4(),
      chatId,
      text: inputValue,
      originText: inputValue,
      owner: "me",
      done: true,
      date: dayjs().valueOf(),
    });
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
              id: uuidv4(),
              chatId,
              text: img,
              originText: img,
              owner: "ai",
              date: dayjs().valueOf(),
              done: true,
            },
          ]);
          scrollToBottom(256);
          // localStorage.setItem(
          //   "conversationList",
          //   JSON.stringify([
          //     ...newList,
          //     {
          //       owner: "ai",
          //       text: img,
          //     },
          //   ])
          // );
          await addData(Stores.ChatList, {
            id: uuidv4(),
            chatId,
            text: img,
            originText: img,
            owner: "ai",
            date: dayjs().valueOf(),
            done: true,
          });
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
    const date = dayjs().valueOf();
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
              id: data?.id,
              chatId,
              owner: "ai",
              text,
              originText,
              date,
              done,
            },
          ]);
          scrollToBottom();
          // localStorage.setItem(
          //   "conversationList",
          //   JSON.stringify([
          //     ...newList,
          //     {
          //       id: data?.id,
          //       chatId: "",
          //       owner: "ai",
          //       text,
          //       done,
          //       originText,
          //     },
          //   ])
          // );
          if (await getData(Stores.ConversationList, data?.id)) {
            await updateData(Stores.ConversationList, data?.id, {
              id: data?.id,
              chatId,
              owner: "ai",
              text,
              originText,
              done,
            });
          } else {
            await addData(Stores.ConversationList, {
              id: data?.id,
              chatId,
              owner: "ai",
              text,
              originText,
              date,
              done,
            });
          }
        } catch (error) {
          if (!text?.trim()?.length) {
            setConversationList([
              ...newList,
              {
                id: uuidv4(),
                chatId,
                owner: "ai",
                text: DIETEXT,
                originText: DIETEXT,
                date,
                done: true,
              },
            ]);
            scrollToBottom();
            // localStorage.setItem(
            //   "conversationList",
            //   JSON.stringify([
            //     ...newList,
            //     {
            //       owner: "ai",
            //       text: DIETEXT,
            //     },
            //   ])
            // );
            await addData(Stores.ConversationList, {
              id: uuidv4(),
              chatId,
              owner: "ai",
              text: DIETEXT,
              originText: DIETEXT,
              date,
              done: true,
            });
          } else {
            setConversationList([
              ...newList,
              {
                id: prevData?.id,
                chatId,
                owner: "ai",
                text,
                originText,
                date,
                done,
              },
            ]);
            scrollToBottom();
            // localStorage.setItem(
            //   "conversationList",
            //   JSON.stringify([
            //     ...newList,
            //     {
            //       ...prevData,
            //       owner: "ai",
            //       text,
            //       done,
            //       originText,
            //     },
            //   ])
            // );
            await updateData(Stores.ConversationList, prevData?.id, {
              id: prevData?.id,
              chatId,
              owner: "ai",
              text,
              done,
              originText,
            });
          }
        }

        if (done) {
          if (!(await getData(Stores.ChatList, chatId))) {
            summarize(chatList, prevData?.id, chatId, date);
          }
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
            id: uuidv4(),
            chatId,
            owner: "ai",
            text: DIETEXT,
            originText: DIETEXT,
            done: true,
            date,
          },
        ]);
        scrollToBottom();
        // localStorage.setItem(
        //   "conversationList",
        //   JSON.stringify([
        //     ...newList,
        //     {
        //       owner: "ai",
        //       text: DIETEXT,
        //     },
        //   ])
        // );
        await addData(Stores.ConversationList, {
          id: uuidv4(),
          chatId,
          owner: "ai",
          text: DIETEXT,
          originText: DIETEXT,
          done: true,
          date,
        });
      } else {
        setConversationList([
          ...newList,
          {
            id: prevData?.id,
            chatId,
            owner: "ai",
            text,
            done: true,
            originText,
            date,
          },
        ]);
        scrollToBottom();
        // localStorage.setItem(
        //   "conversationList",
        //   JSON.stringify([
        //     ...newList,
        //     {
        //       ...prevData,
        //       owner: "ai",
        //       text,
        //       done: true,
        //       originText,
        //     },
        //   ])
        // );
        await updateData(Stores.ConversationList, prevData?.id, {
          id: prevData?.id,
          chatId,
          owner: "ai",
          text,
          done: true,
          originText,
        });
      }

      setLoading(false);
      inputRef?.current?.focus();
    }
  };

  const asideChildren = () => {
    return (
      <Box
        className={style.drawListWrap}
        height="100%"
        paddingBottom="10px"
        overflow="hidden"
      >
        <Button
          color="teal"
          style={{
            height: 44,
            width: "100%",
            marginBottom: 10,
          }}
          onClick={() => {
            setCurrentChat("");
            inputRef?.current?.focus();
          }}
        >
          开启新对话
        </Button>
        <Box
          className={style.drawListWrap}
          height="calc(100% - 44px - 40px)"
          paddingBottom="10px"
          overflow="auto"
        >
          {chatList.map((item: Chat, index: number) => {
            return (
              <Box
                background={
                  currentChat === item?.id
                    ? colorMode === "light"
                      ? "#f0f0f0"
                      : "#353535"
                    : "transparent"
                }
                borderRadius="4px"
                display="flex"
                cursor="pointer"
                padding="10px"
                _hover={{
                  background: colorMode === "light" ? "#f0f0f0" : "#353535",
                }}
                marginBottom={index === chatList?.length - 1 ? "0px" : "2px"}
                className={style.singleChat}
                onClick={() => setCurrentChat(item?.id)}
                key={item?.id}
              >
                <Box>
                  <ChatIcon />
                </Box>
                <Box
                  width={200}
                  padding="0px 4px"
                  overflow="hidden"
                  whiteSpace="nowrap"
                  textOverflow="ellipsis"
                >
                  {item?.title}
                </Box>
                <Box
                  display={currentChat === item?.id ? "inline-block" : "none"}
                  lineHeight="22px"
                >
                  {
                    <IconButton
                      onClick={() => {
                        onOpenDeleteCurrentChat();
                      }}
                      height="20px"
                      minWidth="24px"
                      aria-label="DeleteChat"
                      _hover={{
                        color: colorMode === "light" ? "#777" : "#fff",
                      }}
                      icon={<DeleteIcon lineHeight="20px" />}
                    />
                  }
                </Box>
              </Box>
            );
          })}
          {/* {ASSISTANTS?.map((item: any, index: number) => (
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
          ))} */}
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
              if (chatList?.length > 0) {
                onOpenDeleteAllRecord();
              } else {
                toast({
                  description: "暂无对话",
                  duration: 3000,
                  variant: "solid",
                });
              }
            }}
          >
            清除所有对话
          </Button>
        </Box>
      </Box>
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
      {/* 删除当前弹窗 */}
      <OperationDialog
        destructiveRef={delCurrentChatRef}
        isOpenDeleteRecord={isOpenDeleteCurrentChat}
        onCloseDeleteRecord={onCloseDeleteCurrentChat}
        confirm={async () => {
          const conversationList: Conversation[] = await getStoreData(
            Stores.ConversationList
          );

          for (let i = 0; i < conversationList?.length; i++) {
            let conversation: Conversation = conversationList[i];
            if (conversation?.chatId === currentChat) {
              await deleteData(Stores.ConversationList, conversation?.id);
            }
          }
          await deleteData(Stores.ChatList, currentChat);
          setCurrentChat("");
          onCloseDeleteCurrentChat();
          initDBFn();
          toast({
            description: "删除成功",
            duration: 3000,
            variant: "solid",
          });
        }}
        title="确认删除"
        detail="确定要删除当前对话吗？"
      />
      {/* 删除所有对话弹窗 */}
      <OperationDialog
        destructiveRef={delAllRef}
        isOpenDeleteRecord={isOpenDeleteAllRecord}
        onCloseDeleteRecord={onCloseDeleteAllRecord}
        confirm={() => {
          deleteStore(Stores.ConversationList);
          deleteStore(Stores.ChatList);
          setCurrentChat("");
          onCloseDeleteAllRecord();
          initDBFn();
          toast({
            description: "删除成功",
            duration: 3000,
            variant: "solid",
          });
        }}
        title="确认删除"
        detail="确定要删除所有对话吗？"
      />
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
                  <div key={info?.id} className={style.aiInfoWrap}>
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
                  <div key={info?.id} className={style.meInfoWrap}>
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
                  <Box key={info.date} position="relative" padding="10">
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
                      {dayjs(info.date).format("YYYY-MM-DD HH:mm:ss")}
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
