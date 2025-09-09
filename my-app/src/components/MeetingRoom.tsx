"use client";

import {
  CallControls,
  CallingState,
  CallParticipantsList,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
  useCall,
} from "@stream-io/video-react-sdk";
import {
  LayoutListIcon,
  LoaderIcon,
  UsersIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Vapi from "@vapi-ai/web";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./ui/resizeable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import EndCallButton from "./EndCallButton";
import CodeEditor from "./CodeEditor";
import { useUserRole } from "@/hooks/useUserRole";

function MeetingRoom() {
  const router = useRouter();
  const call = useCall();
  const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_AI_API_KEY || "");

  const [layout, setLayout] = useState<"grid" | "speaker">("speaker");
  const { isInterviewer, isLoading } = useUserRole();
  const [showParticipants, setShowParticipants] = useState(false);
  const [isAIInterviewActive, setIsAIInterviewActive] = useState(false);

  const questions = [
    "What is your experience with web development?",
    "Can you explain the difference between HTML, CSS, and JavaScript?",
    "How do you ensure your code is maintainable and scalable?",
    "What are some common performance optimization techniques in web development?",
    "How do you handle cross-browser compatibility issues?",
    "Can you describe a challenging bug you encountered and how you resolved it?",
    "What is your approach to testing and debugging web applications?",
  ];

  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  useEffect(() => {
    if (isAIInterviewActive) {
      startCall();
    }
  }, [isAIInterviewActive]);

  const startCall = () => {
    const questionList = questions.join(", ");
    const assistantOptions = {
      name: "AI Assistant",
      firstMessage:
        "Hi! I’m your AI interviewer. I am going to take your interview today for the web developer role please keep your camera and mic on throught out your call. Hope you are ready. Can we start?",
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "en-US",
      },
      voice: {
        provider: "playht",
        voiceId: "jennifer",
      },
      model: {
        provider: "openai",
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an AI voice assistant conducting interviews.
                      Your job is to ask candidates provided interview questions and evaluate their responses.
                      Begin with a friendly greeting and then proceed with the interview questions.
                      Ask one question at a time and wait for the candidate's response before asking the next question.
                      Keep the questions clear and concise.
                      Below are the interview questions: ${questionList}
                      If candidate struggles to answer, provide hints or rephrase the question.
                      If candidate provides a good answer, acknowledge it and move to the next question.
                      If candidate provides a bad answer, provide constructive feedback and ask the next question.
                      After 5-7 questions, conclude the interview with a friendly closing statement.`,
          },
        ],
      },
    };

    vapi.start(assistantOptions);
  };

  const stopAI = () => {
    vapi.stop();
    setIsAIInterviewActive(false);
  };

  if (isLoading || callingState !== CallingState.JOINED) {
    return (
      <div className="h-96 flex items-center justify-center">
        <LoaderIcon className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem-1px)] relative">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={35} minSize={25} maxSize={100} className="relative">
          <div className="absolute inset-0">
            {layout === "grid" ? <PaginatedGridLayout /> : <SpeakerLayout />}
            {showParticipants && (
              <div className="absolute right-0 top-0 h-full w-[300px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40">
                <CallParticipantsList onClose={() => setShowParticipants(false)} />
              </div>
            )}
          </div>

          <div className="absolute bottom-4 left-0 right-0 z-30">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 flex-wrap justify-center px-4">
                <CallControls onLeave={() => router.push("/")} />

                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="size-10">
                        <LayoutListIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setLayout("grid")}>
                        Grid View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLayout("speaker")}>
                        Speaker View
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant="outline"
                    size="icon"
                    className="size-10"
                    onClick={() => setShowParticipants(!showParticipants)}
                  >
                    <UsersIcon className="size-4" />
                  </Button>

                  <EndCallButton />

                  {isInterviewer && !isAIInterviewActive && (
                    <Button variant="default" size="sm" onClick={() => setIsAIInterviewActive(true)}>
                      Start AI Interview
                    </Button>
                  )}

                  {isInterviewer && isAIInterviewActive && (
                    <>
                      <Button variant="destructive" size="sm" onClick={stopAI}>
                        Stop AI
                      </Button>
                      <Button variant="outline" size="sm" onClick={stopAI}>
                        Back to Normal
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={65} minSize={25}>
          <CodeEditor />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export default MeetingRoom;
