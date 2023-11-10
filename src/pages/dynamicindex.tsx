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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  ListItem,
  List,
  Text,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Select,
  Link,
  FormHelperText,
  Slider,
  SliderTrack,
  SliderThumb,
} from "@chakra-ui/react";
import {
  SettingsIcon,
  MoonIcon,
  SunIcon,
  ChatIcon,
  DeleteIcon,
  ArrowForwardIcon,
  AddIcon,
} from "@chakra-ui/icons";
import { AiOutlineStar, AiFillStar } from "react-icons/ai";
import { FcDeleteRow } from "react-icons/fc";
import { useForm } from "react-hook-form";

import autosize from "autosize";
import DOMPurify from "dompurify";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";

import PROMPT from "@/configs/prompts.json";
import useCopyCode from "@/hooks/useCopyCode";
import { scrollToBottom } from "@/utils/util";
import InitLanguages from "@/utils/initLanguages";
import SpeechRecognition from "@/components/Microphone";
import OperationDialog from "@/components/OperationDialog";
import {
  Stores,
  Chat,
  Conversation,
  Prompt,
  addData,
  deleteData,
  getStoreData,
  initDB,
  getData,
  updateData,
  deleteStore,
  ModelConfig,
} from "../../lib/db";

import style from "./index.module.sass";

const DIETEXT = "Please wait a minute";

const Models = [
  {
    value: "gpt-3.5-turbo",
  },
  {
    value: "gpt-4-1106-vision-preview",
  },
];

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
  const [interimTranscript, setInterimTranscript] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const { colorMode, toggleColorMode } = useColorMode();

  const [model, setModel] = useState("gpt-3.5-turbo");
  const [systemMessage, setSystemMessage] = useState("你是一个生成式AI助手");
  const [temperature, setTemperature] = useState(0.7);
  const [presence_penalty, setPresence_penalty] = useState(0);
  const [frequency_penalty, setFrequency_penalty] = useState(0);
  const [top_p, setTop_p] = useState(1);

  const ifNeedScroll = useRef<boolean>(true);

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
  // Prompt配置项
  const {
    isOpen: isOpenPromptConfigModal,
    onOpen: onOpenPromptConfigModal,
    onClose: onClosePromptConfigModal,
  } = useDisclosure();
  // prompt收藏
  const [collectPromptList, setCollectPromptList] = useState<Prompt[]>([]);
  // 搜索prompt
  const [searchInputValue, setSearchInputValue] = useState("");
  // 自定义添加Prompt弹窗配置
  const {
    isOpen: isOpenBespokePromptConfigModal,
    onOpen: onOpenBespokePromptConfigModal,
    onClose: onCloseBespokePromptConfigModal,
  } = useDisclosure();
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();
  // Gpt参数设置弹窗配置
  const {
    isOpen: isOpenGptConfigModal,
    onOpen: onOpenGptConfigModal,
    onClose: onCloseGptConfigModal,
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

  useEffect(() => {
    initDBFn();
    setIsCopiedList([]);
    const infoListWrap = document.querySelector("#infoListWrap") as HTMLElement;
    function onScroll(e: any) {
      if (
        e.target.scrollTop + e.target.clientHeight >=
        e.target.scrollHeight - 1
      ) {
        if (!ifNeedScroll.current) {
          ifNeedScroll.current = true;
        }
      } else {
        if (ifNeedScroll.current) {
          ifNeedScroll.current = false;
        }
      }
    }
    infoListWrap.addEventListener("scroll", onScroll);

    return () => infoListWrap.removeEventListener("scroll", onScroll);
  }, []);

  const initDBFn = () => {
    initDB().then(async () => {
      const chatList = await getStoreData<Chat>(Stores.ChatList);
      const promptList = await getStoreData<Prompt>(Stores.PromptList);
      const modelConfig: any = await getData(
        Stores.ModelConfig,
        "modelConfigId"
      );
      if (modelConfig) {
        setModel(
          modelConfig?.model?.search("gpt-4") > -1
            ? "gpt-4-1106-vision-preview"
            : modelConfig?.model
        );
        setSystemMessage(modelConfig?.systemMessage);
        setTemperature(modelConfig?.temperature);
        setPresence_penalty(modelConfig?.presence_penalty);
        setFrequency_penalty(modelConfig?.frequency_penalty);
        setTop_p(modelConfig?.top_p);
      }
      setChatList(
        chatList?.sort((a: Chat, b: Chat) => {
          if (dayjs(a.date) < dayjs(b.date)) {
            return -1;
          } else {
            return 1;
          }
        })
      );
      setCollectPromptList(promptList);
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
      const to = setTimeout(() => {
        setConversationList([]);
        to && clearTimeout(to);
      }, 200);
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
          question: "帮我生成对话标题，直接输出标题，不需要冒号",
          id,
          systemMessage:
            "你将尝试总结新对话的标题(请不要出现【对话标题：】这种标识)，以使其更清晰和集中。你会分析对话中的关键信息和问题，并利用这些信息生成一个简洁而准确的标题。这将有助于确保对话参与者更容易理解话题并找到他们感兴趣的信息",
          model: "gpt-3.5-turbo",
          temperature: 0.2,
          presence_penalty: -1,
          frequency_penalty: 0,
          top_p: 0.2,
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
    scrollToBottom(true);
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
          systemMessage,
          model,
          temperature,
          presence_penalty,
          frequency_penalty,
          top_p,
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
          scrollToBottom(ifNeedScroll.current);
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
            scrollToBottom(true);
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
            scrollToBottom(true);
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
        scrollToBottom(true);
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
        scrollToBottom(true);
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
  function debounce(fn: any, delay = 200) {
    let timer: any;

    return (...args: any[]) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        fn(...args);
      }, delay);
    };
  }

  const handleInputChange = debounce((e: any) => {
    setSearchInputValue(e.target.value);
  });

  async function onSubmit(values: any) {
    const newPrompt = {
      id: uuidv4(),
      ...values,
    };
    setCollectPromptList([...collectPromptList, newPrompt]);
    await addData(Stores.PromptList, newPrompt);
    toast({
      description: "添加成功",
      duration: 3000,
      variant: "solid",
    });
    onCloseBespokePromptConfigModal();
    reset();
  }

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
            controllerRef.current?.abort();
            setCurrentChat("");
            inputRef?.current?.focus();
            if (isMobile) {
              onClose();
            }
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
                borderRadius="6px"
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
                  width={
                    currentChat === item?.id
                      ? "calc(100% - 36px)"
                      : "calc(100% - 20px)"
                  }
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

      {/* 自定义添加prompt */}
      <OperationDialog
        isOpenDeleteRecord={isOpenBespokePromptConfigModal}
        onCloseDeleteRecord={() => {
          onCloseBespokePromptConfigModal();
        }}
        title="添加自定义Prompt"
        detail={
          <Box>
            <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
              <FormControl
                isInvalid={Boolean(errors.act || errors.prompt)}
                isRequired
              >
                <FormLabel htmlFor="act">Prompt名称</FormLabel>
                <Box marginBottom="20px">
                  <Input
                    id="act"
                    placeholder="请输入Prompt名称"
                    {...register("act", {
                      required: "请输入",
                      maxLength: { value: 20, message: "不要超过20字" },
                    })}
                  />
                  <FormErrorMessage>
                    {errors?.act && errors?.act?.message?.toString()}
                  </FormErrorMessage>
                </Box>

                <Box marginBottom="20px">
                  <FormLabel htmlFor="detail">Prompt内容</FormLabel>
                  <Input
                    id="prompt"
                    placeholder="请输入Prompt内容"
                    {...register("prompt", {
                      required: "请输入",
                      maxLength: { value: 300, message: "不要超过300字" },
                    })}
                  />
                  <FormErrorMessage>
                    {errors?.prompt && errors?.prompt?.message?.toString()}
                  </FormErrorMessage>
                </Box>
              </FormControl>

              <Button
                mt={4}
                colorScheme="teal"
                isLoading={isSubmitting}
                type="submit"
              >
                Submit
              </Button>
            </form>
          </Box>
        }
        footer={false}
      />

      {/* Prompt配置弹窗 */}
      <OperationDialog
        isOpenDeleteRecord={isOpenPromptConfigModal}
        onCloseDeleteRecord={() => {
          onClosePromptConfigModal();
        }}
        title="指挥我"
        detail={
          <Box>
            <Box width="100%" textAlign="center" marginBottom="12px">
              <Button
                onClick={onOpenBespokePromptConfigModal}
                leftIcon={<AddIcon />}
                colorScheme="teal"
              >
                添加自定义Prompt
              </Button>
            </Box>
            <Input
              placeholder="请输入关键词搜索"
              marginBottom="12px"
              onChange={handleInputChange}
            />
            <Tabs isFitted variant="soft-rounded" colorScheme="green">
              <TabList>
                <Tab fontSize="lg">收藏</Tab>
                <Tab fontSize="lg">默认</Tab>
              </TabList>
              <TabPanels>
                <TabPanel padding="12px 0px">
                  <List spacing={3}>
                    {collectPromptList?.length > 0 ? (
                      (searchInputValue?.length
                        ? collectPromptList?.filter(
                            (prompt: any) =>
                              prompt?.act?.search(searchInputValue?.trim()) > -1
                          )
                        : collectPromptList
                      )?.map((prompt: any) => {
                        return (
                          <ListItem
                            key={prompt?.id}
                            border="1px solid #eaeaea"
                            borderRadius={6}
                            padding="10px"
                          >
                            <Text fontSize="md">{prompt?.act}</Text>
                            <Box
                              margin="0px 0px 6px 0px"
                              fontSize="12px"
                              overflow="hidden"
                              textOverflow="ellipsis"
                              width="100%"
                              style={{
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                display: "-webkit-box",
                              }}
                            >
                              {prompt?.prompt}
                            </Box>
                            <Stack direction="row" spacing={4}>
                              <Button
                                size="xs"
                                leftIcon={<FcDeleteRow />}
                                aria-label="collect"
                                onClick={async () => {
                                  if (
                                    collectPromptList?.find(
                                      (item: Prompt) => item?.id === prompt?.id
                                    )
                                  ) {
                                    let index = 0;
                                    for (
                                      let i = 0;
                                      i < collectPromptList?.length;
                                      i++
                                    ) {
                                      if (
                                        collectPromptList[i]?.id === prompt?.id
                                      ) {
                                        index = i;
                                        break;
                                      }
                                    }
                                    console.log(index);
                                    let newCollectPromptList = [
                                      ...collectPromptList,
                                    ];
                                    newCollectPromptList.splice(index, 1);
                                    setCollectPromptList(newCollectPromptList);
                                    await deleteData(
                                      Stores.PromptList,
                                      prompt?.id
                                    );
                                  }
                                }}
                              >
                                移除
                              </Button>
                              <Button
                                size="xs"
                                leftIcon={<ArrowForwardIcon />}
                                aria-label="collect"
                                onClick={() => {
                                  onClosePromptConfigModal();
                                  setSearchInputValue("");
                                  setInputValue(prompt?.prompt);
                                }}
                              >
                                使用
                              </Button>
                            </Stack>
                          </ListItem>
                        );
                      })
                    ) : (
                      <Box padding="20px" textAlign="center">
                        不妨先收藏几个Prompt~
                      </Box>
                    )}
                  </List>
                </TabPanel>
                <TabPanel padding="12px 0px">
                  <List spacing={3}>
                    {(searchInputValue?.length
                      ? PROMPT?.filter(
                          (prompt: any) =>
                            prompt?.act?.search(searchInputValue?.trim()) > -1
                        )
                      : PROMPT
                    )?.map((prompt) => {
                      return (
                        <ListItem
                          key={prompt?.id}
                          border="1px solid #eaeaea"
                          borderRadius={6}
                          padding="10px"
                        >
                          <Text fontSize="md">{prompt?.act}</Text>
                          <Box
                            margin="0px 0px 6px 0px"
                            fontSize="12px"
                            overflow="hidden"
                            textOverflow="ellipsis"
                            width="100%"
                            style={{
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              display: "-webkit-box",
                            }}
                          >
                            {prompt?.prompt}
                          </Box>
                          <Stack direction="row" spacing={4}>
                            <Button
                              size="xs"
                              leftIcon={
                                collectPromptList?.find(
                                  (item: Prompt) => item?.id === prompt?.id
                                ) ? (
                                  <AiFillStar />
                                ) : (
                                  <AiOutlineStar />
                                )
                              }
                              isDisabled={
                                !!collectPromptList?.find(
                                  (item: Prompt) => item?.id === prompt?.id
                                )
                              }
                              aria-label="collect"
                              onClick={async () => {
                                if (
                                  !collectPromptList?.find(
                                    (item: Prompt) => item?.id === prompt?.id
                                  )
                                ) {
                                  setCollectPromptList([
                                    ...collectPromptList,
                                    prompt,
                                  ]);
                                  await addData(Stores.PromptList, prompt);
                                }
                              }}
                            >
                              {collectPromptList?.find(
                                (item: Prompt) => item?.id === prompt?.id
                              )
                                ? "已收藏"
                                : "收藏"}
                            </Button>
                            <Button
                              size="xs"
                              leftIcon={<ArrowForwardIcon />}
                              aria-label="collect"
                              onClick={() => {
                                onClosePromptConfigModal();
                                setSearchInputValue("");
                                setInputValue(prompt?.prompt);
                              }}
                            >
                              使用
                            </Button>
                          </Stack>
                        </ListItem>
                      );
                    })}
                  </List>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        }
        footer={false}
      />
      {/* Gpt配置弹窗 */}
      <OperationDialog
        isOpenDeleteRecord={isOpenGptConfigModal}
        onCloseDeleteRecord={async () => {
          onCloseGptConfigModal();
          const modelConfig: any = await getData(
            Stores.ModelConfig,
            "modelConfigId"
          );

          if (modelConfig) {
            setModel(modelConfig?.model);
            setSystemMessage(modelConfig?.systemMessage);
            setTemperature(modelConfig?.temperature);
            setPresence_penalty(modelConfig?.presence_penalty);
            setFrequency_penalty(modelConfig?.frequency_penalty);
            setTop_p(modelConfig?.top_p);
          } else {
            setModel("gpt-3.5-turbo");
            setSystemMessage("你是一个生成式AI助手");
            setTemperature(0.7);
            setPresence_penalty(0);
            setFrequency_penalty(0);
            setTop_p(1);
          }
        }}
        title="让我更聪明"
        detail={
          <FormControl>
            <Box marginBottom="18px">
              <FormLabel>模型</FormLabel>
              <Select
                onChange={(e: any) => {
                  setModel(e?.target?.value);
                }}
                value={model}
              >
                {Models?.map((model) => {
                  return (
                    <option key={model?.value} value={model?.value}>
                      {model?.value}
                    </option>
                  );
                })}
              </Select>
            </Box>
            <Box marginBottom="18px">
              <FormLabel>
                初始系统指令
                <Button
                  colorScheme="teal"
                  variant="link"
                  fontSize="12px"
                  onClick={() => setSystemMessage("你是一个生成式AI助手")}
                  color="teal.500"
                >
                  重置为默认值
                </Button>
              </FormLabel>
              <Textarea
                onChange={(e: any) => setSystemMessage(e?.target?.value)}
                value={systemMessage}
              />
            </Box>
            <Box marginBottom="18px">
              <FormLabel>
                temperature
                <Text display="inline-block" textAlign="center" width="38px">
                  {temperature}
                </Text>
                <Button
                  colorScheme="teal"
                  variant="link"
                  fontSize="12px"
                  onClick={() => setTemperature(0.7)}
                  color="teal.500"
                >
                  重置为默认值
                </Button>
              </FormLabel>
              <FormHelperText marginBottom="4px">
                0.8等较高值会使输出更加随机，而0.2等较低值则会使输出更加集中和确定。
              </FormHelperText>
              <Slider
                value={temperature}
                onChange={(e: any) => {
                  setTemperature(e);
                }}
                min={0.0}
                max={2.0}
                step={0.1}
              >
                <SliderTrack></SliderTrack>
                <SliderThumb bgColor="teal.500" />
              </Slider>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                fontSize="12px"
              >
                <Text>精确</Text>
                <Text>中性</Text>
                <Text>创意</Text>
              </Box>
            </Box>
            <Box marginBottom="18px">
              <FormLabel>
                presence_penalty
                <Text display="inline-block" textAlign="center" width="40px">
                  {presence_penalty}
                </Text>
                <Button
                  colorScheme="teal"
                  variant="link"
                  fontSize="12px"
                  onClick={() => setPresence_penalty(0)}
                  color="teal.500"
                >
                  重置为默认值
                </Button>
              </FormLabel>
              <FormHelperText marginBottom="4px">
                根据新标记是否出现在文本中对其进行惩罚，从而增加模型谈论新话题的可能性。
              </FormHelperText>
              <Slider
                value={presence_penalty}
                onChange={(e: any) => {
                  setPresence_penalty(e);
                }}
                min={0}
                max={2.0}
                step={0.1}
              >
                <SliderTrack></SliderTrack>
                <SliderThumb bgColor="teal.500" />
              </Slider>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                fontSize="12px"
              >
                <Text>平衡</Text>
                <Text>思维开放</Text>
              </Box>
            </Box>
            <Box marginBottom="18px">
              <FormLabel>
                frequency_penalty
                <Text display="inline-block" textAlign="center" width="40px">
                  {frequency_penalty}
                </Text>
                <Button
                  colorScheme="teal"
                  variant="link"
                  fontSize="12px"
                  onClick={() => setFrequency_penalty(0)}
                  color="teal.500"
                >
                  重置为默认值
                </Button>
              </FormLabel>
              <FormHelperText marginBottom="4px">
                根据新标记在文本中的现有频率对其进行惩罚，从而降低模型逐字重复同一行的可能性。
              </FormHelperText>
              <Slider
                value={frequency_penalty}
                onChange={(e: any) => {
                  setFrequency_penalty(e);
                }}
                min={0}
                max={2.0}
                step={0.1}
              >
                <SliderTrack></SliderTrack>
                <SliderThumb bgColor="teal.500" />
              </Slider>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                fontSize="12px"
              >
                <Text>平衡</Text>
                <Text>减少重复</Text>
              </Box>
            </Box>
            <Box marginBottom="18px">
              <FormLabel>
                top_p
                <Text display="inline-block" textAlign="center" width="40px">
                  {top_p}
                </Text>
                <Button
                  colorScheme="teal"
                  variant="link"
                  fontSize="12px"
                  onClick={() => setTop_p(1)}
                  color="teal.500"
                >
                  重置为默认值
                </Button>
              </FormLabel>
              <FormHelperText marginBottom="4px">
                temperature采样的另一种方法top_p采样，即模型考虑概率质量为top_p的标记的结果。因此，0.1意味着只考虑概率最高的10%的文字。
              </FormHelperText>
              <Slider
                value={top_p}
                onChange={(e: any) => {
                  setTop_p(e);
                }}
                min={0}
                max={1.0}
                step={0.1}
              >
                <SliderTrack></SliderTrack>
                <SliderThumb bgColor="teal.500" />
              </Slider>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                fontSize="12px"
              >
                <Text>精确</Text>
                <Text>创意</Text>
              </Box>
            </Box>
          </FormControl>
        }
        confirm={async () => {
          onCloseGptConfigModal();
          const modelConfig: any = await getData(
            Stores.ModelConfig,
            "modelConfigId"
          );
          if (modelConfig) {
            await updateData(Stores.ModelConfig, "modelConfigId", {
              model,
              systemMessage,
              temperature,
              presence_penalty,
              frequency_penalty,
              top_p,
            });
          } else {
            await addData(Stores.ModelConfig, {
              id: "modelConfigId",
              model,
              systemMessage,
              temperature,
              presence_penalty,
              frequency_penalty,
              top_p,
            });
          }
        }}
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
                <Badge
                  variant="outline"
                  colorScheme="teal"
                  cursor="pointer"
                  onClick={() => onOpenPromptConfigModal()}
                >
                  指挥我
                </Badge>
              </Stack>
              <Stack style={{ marginLeft: 14 }} direction="row">
                <Badge
                  variant="outline"
                  colorScheme="teal"
                  cursor="pointer"
                  maxWidth="110px"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                  onClick={() => {
                    onOpenGptConfigModal();
                  }}
                >
                  {model}
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
