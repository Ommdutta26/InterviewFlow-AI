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
  MicIcon,
  MicOffIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
import Vapi from "@vapi-ai/web";

import { useUserRole } from "@/hooks/useUserRole";

// ✅ Initialize Vapi once
const vapi = new Vapi({
  apiKey: process.env.NEXT_PUBLIC_VAPI_AI_API_KEY!,
});

function MeetingRoom() {
  const router = useRouter();
  const call = useCall();
  const { isInterviewer, isLoading } = useUserRole();
  const [layout, setLayout] = useState<"grid" | "speaker">("speaker");
  const [showParticipants, setShowParticipants] = useState(false);
  const [isAIInterviewActive, setIsAIInterviewActive] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [isVoiceMode, setIsVoiceMode] = useState(true);

  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const VAPI_AGENT_ID = process.env.NEXT_PUBLIC_VAPI_AGENT_ID!;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  // ☝️ Avoid throwing error during hydration/rendering
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_VAPI_AI_API_KEY || !VAPI_AGENT_ID) {
      console.error("Missing Vapi environment variables.");
    }
  }, []);

  // Vapi voice-replace effect
  useEffect(() => {
    if (!isAIInterviewActive || !isVoiceMode) return;

    const startVapiCall = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/vapi/create-call`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: "user123", // Replace this with user ID if needed
          }),
        });

        const data = await res.json();
        console.log("Vapi Call Started:", data);
      } catch (error) {
        console.error("Error starting Vapi call:", error);
      }
    };

    startVapiCall();

    vapi.on("speech", (text: string) => setTranscript(text));
    vapi.on("response", (msg: string) => {
      setAiReply(msg);
      const audioStream = vapi.getAudioStream?.();
      if (audioStream) {
        const audioTrack = audioStream.getAudioTracks()[0];
        call?.publishAudioTrack(audioTrack, { name: "ai-voice" });
      }
    });
    vapi.on("error", console.error);

    return () => {
      vapi.stop();
    };
  }, [isAIInterviewActive, isVoiceMode, call]);

  const resetChat = () => {
    setTranscript("");
    setAiReply("");
    if (isVoiceMode && isAIInterviewActive) {
      vapi.start({ agentId: VAPI_AGENT_ID });
    }
  };

  const handleBackToNormal = () => {
    setIsAIInterviewActive(false);
    setTranscript("");
    setAiReply("");
    vapi.stop();
  };

  const toggleVoiceMode = () => {
    setIsVoiceMode((m) => !m);
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
      {isAIInterviewActive && (
        <div className="absolute inset-0 z-50 bg-black/95 p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">AI Interview Mode</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={toggleVoiceMode}>
                {isVoiceMode ? (
                  <>
                    <MicOffIcon className="mr-2 h-4 w-4" />
                    Manual Mode
                  </>
                ) : (
                  <>
                    <MicIcon className="mr-2 h-4 w-4" />
                    Voice Mode
                  </>
                )}
              </Button>

              <Button variant="outline" onClick={handleBackToNormal}>
                Back to Normal
              </Button>

              <Button variant="destructive" onClick={() => vapi.stop()}>
                Stop AI Voice
              </Button>
              <Button variant="outline" onClick={resetChat}>
                🔄 Reset Chat
              </Button>
            </div>
          </div>

          {!isVoiceMode && (
            <>
              <textarea
                className="w-full h-28 p-3 border border-gray-300 rounded-md text-sm"
                placeholder="Enter candidate response..."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
              />
              <Button
                className="w-fit"
                onClick={() => {
                  vapi.start({ agentId: VAPI_AGENT_ID, text: transcript });
                }}
              >
                Ask AI
              </Button>
            </>
          )}

          <div className="p-4 border rounded-md bg-muted max-h-[50vh] overflow-y-auto text-sm whitespace-pre-wrap">
            <strong>AI Response:</strong>
            <div className="mt-2">{aiReply || "Awaiting AI reply..."}</div>
            {isVoiceMode && (
              <div className="mt-4 text-xs text-gray-400">
                User said: {transcript}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN MEETING LAYOUT */}
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={35} minSize={25} maxSize={100} className="relative">
          <div className="absolute inset-0">
            {layout === "grid" ? <PaginatedGridLayout /> : <SpeakerLayout />}

            {showParticipants && (
              <div className="absolute right-0 top-0 h-full w-[300px] bg-background/95 z-40">
                <CallParticipantsList onClose={() => setShowParticipants(false)} />
              </div>
            )}
          </div>

          <div className="absolute bottom-4 left-0 right-0 z-30 px-4">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <CallControls onLeave={() => router.push("/")} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="size-10">
                    <LayoutListIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setLayout("grid")}>Grid View</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLayout("speaker")}>Speaker View</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="icon"
                className="size-10"
                onClick={() => setShowParticipants((s) => !s)}
              >
                <UsersIcon className="size-4" />
              </Button>
              <EndCallButton />

              {isInterviewer && !isAIInterviewActive && (
                <Button variant="default" size="sm" className="ml-2" onClick={() => setIsAIInterviewActive(true)}>
                  Switch to AI Interview
                </Button>
              )}
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
