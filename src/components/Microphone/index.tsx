import React, { useState } from "react";
import { IconButton, useToast } from "@chakra-ui/react";
import { Icon, useColorMode } from "@chakra-ui/react";
import { BiSolidMicrophoneAlt, BiStopCircle } from "react-icons/bi";

const SpeechRecognition = ({
  setInputValue,
  setInterimTranscript,
  isListening,
  setIsListening,
}: any) => {
  const [recognition, setRecognition] = useState<any>(null);
  const { colorMode, toggleColorMode } = useColorMode();

  const toast = useToast({
    position: "top",
    duration: 3000,
    containerStyle: {
      // color: "#333333",
      fontWeight: 700,
    },
  });

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      console.error("Your browser does not support the Web Speech API");
      return;
    }

    const recognitionInstance = new (window as any).webkitSpeechRecognition();

    let final_transcript = "";

    recognitionInstance.interimResults = true;
    recognitionInstance.continuous = true;

    recognitionInstance.onstart = function () {
      toast({
        description: "正在收音～",
        duration: 3000,
        variant: "solid",
      });
      setIsListening(true);
      setInputValue("");
    };

    recognitionInstance.onresult = (event: any) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptionPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final_transcript += transcriptionPiece;
        } else {
          interimTranscript += transcriptionPiece;
        }
      }

      setInputValue(final_transcript);
      setInterimTranscript(interimTranscript);
    };
    recognitionInstance.onerror = function (event: any) {
      if (event.error === "no-speech") {
        toast({
          description: "没有检测到麦克风～",
          duration: 3000,
          variant: "solid",
        });
      } else if (event.error === "audio-capture") {
        console.log("Audio capture permission denied");
        toast({
          description: "没有录音权限，请开启～",
          duration: 3000,
          variant: "solid",
        });
        // 在这里处理用户拒绝录音权限的情况
      } else if (event.error === "not-allowed") {
        console.log("Speech recognition not allowed by the user");
        toast({
          description: "您已拒绝了录音权限，请刷新页面重新授权～",
          duration: 3000,
          variant: "solid",
        });
      }
    };

    recognitionInstance.start();
    setRecognition(recognitionInstance);
  };

  const stopListening = () => {
    if (recognition) {
      toast({
        description: "结束收音～",
        duration: 3000,
        variant: "solid",
      });
      recognition.stop();
      setRecognition(null);
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div>
      <IconButton
        aria-label="microphone"
        icon={
          isListening ? (
            <Icon as={BiStopCircle} fontSize={22} />
          ) : (
            <Icon as={BiSolidMicrophoneAlt} fontSize={22} />
          )
        }
        height="60px"
        width="60px"
        marginRight="8px"
        color="teal"
        size="lg"
        variant="outline"
        style={{
          borderColor:
            colorMode === "light"
              ? "var(--chakra-colors-teal-500)"
              : "rgb(44, 122, 123)",
        }}
        onClick={toggleListening}
      ></IconButton>
    </div>
  );
};

export default SpeechRecognition;
