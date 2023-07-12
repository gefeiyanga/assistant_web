import React, { useState } from "react";
import { IconButton, useToast } from "@chakra-ui/react";
import { Icon } from "@chakra-ui/react";
import { AiOutlineAudio, AiOutlineAudioMuted } from "react-icons/ai";

const SpeechRecognition = ({
  setInputValue,
  setInterimTranscript,
  isListening,
  setIsListening,
}: any) => {
  const [recognition, setRecognition] = useState<any>(null);

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

    recognitionInstance.start();
    setRecognition(recognitionInstance);
    setIsListening(true);
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
            <Icon as={AiOutlineAudioMuted} />
          ) : (
            <Icon as={AiOutlineAudio} />
          )
        }
        height="60px"
        width="60px"
        marginRight="8px"
        color="teal"
        size="lg"
        variant="outline"
        onClick={toggleListening}
      ></IconButton>
    </div>
  );
};

export default SpeechRecognition;
