// "use client";

// import {
//   CallControls,
//   CallingState,
//   CallParticipantsList,
//   PaginatedGridLayout,
//   SpeakerLayout,
//   useCallStateHooks,
//   useCall,
// } from "@stream-io/video-react-sdk";
// import {
//   LayoutListIcon,
//   LoaderIcon,
//   UsersIcon,
// } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { useState, useEffect, useRef } from "react";
// import Vapi from "@vapi-ai/web";
// import {
//   ResizableHandle,
//   ResizablePanel,
//   ResizablePanelGroup,
// } from "./ui/resizeable";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "./ui/dropdown-menu";
// import { Button } from "./ui/button";
// import EndCallButton from "./EndCallButton";
// import CodeEditor from "./CodeEditor";
// import { useUserRole } from "@/hooks/useUserRole";

// function MeetingRoom() {
//   const router = useRouter();
//   const call = useCall();

//   const [layout, setLayout] = useState<"grid" | "speaker">("speaker");
//   const videoRef = useRef<HTMLVideoElement | null>(null);
//   const { isInterviewer, isLoading } = useUserRole();
//   const [showParticipants, setShowParticipants] = useState(false);
//   const [emotion, setEmotion] = useState<string>("Detecting...");
//   const [isAIInterviewActive, setIsAIInterviewActive] = useState(false);

//   useEffect(() => {
//   if (!isAIInterviewActive) return;

//   const interval = setInterval(() => {
//     captureFrame();
//   }, 4000); // every 4 seconds

//   return () => clearInterval(interval);
// }, [isAIInterviewActive]);




//   // ✅ Use ref so Vapi instance persists across re-renders
//   const vapiRef = useRef<Vapi | null>(null);

//   const { useCallCallingState } = useCallStateHooks();
//   const callingState = useCallCallingState();

//   // ✅ Initialize Vapi once on mount
//   useEffect(() => {
//     const apiKey = process.env.NEXT_PUBLIC_VAPI_AI_API_KEY;

//     if (!apiKey) {
//       console.error("Vapi API key is missing! Check NEXT_PUBLIC_VAPI_AI_API_KEY in .env");
//       return;
//     }

//     vapiRef.current = new Vapi(apiKey);

//     // ✅ Listen for errors and call-end events
//     vapiRef.current.on("error", (e) => {
//       console.error("Vapi error:", e);
//     });

//     vapiRef.current.on("call-end", () => {
//       setIsAIInterviewActive(false);
//     });

//     // ✅ Cleanup on unmount
//     return () => {
//       vapiRef.current?.stop();
//     };
//   }, []);


//   const captureFrame = async () => {
//   // ✅ Get the actual visible video from Stream.io SDK
//   const videoElement = document.querySelector(
//     ".str-video__participant-view--local video"
//   ) as HTMLVideoElement;

//   if (!videoElement) {
//     console.log("No video element found");
//     return;
//   }

//   if (videoElement.readyState < 2) return;
//   if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) return;

//   const canvas = document.createElement("canvas");
//   canvas.width = videoElement.videoWidth;
//   canvas.height = videoElement.videoHeight;

//   const ctx = canvas.getContext("2d");
//   if (!ctx) return;
//   ctx.drawImage(videoElement, 0, 0);

//   canvas.toBlob(async (blob) => {
//     if (!blob) return;

//     const formData = new FormData();
//     formData.append("image", blob, "frame.jpg");

//     try {
//       const res = await fetch("http://localhost:5001/detect-emotion", {
//         method: "POST",
//         body: formData,
//       });
//       const data = await res.json();

//       if (data?.emotions && Object.keys(data.emotions).length > 0) {
//         const dominantEmotion = Object.keys(data.emotions).reduce((a, b) =>
//           data.emotions[a] > data.emotions[b] ? a : b
//         );
//         setEmotion(dominantEmotion);
//       } else {
//         setEmotion("No face detected");
//       }
//     } catch (error) {
//       console.error("Emotion detection error:", error);
//     }
//   }, "image/jpeg", 0.8);
// };

//   const startCall = () => {
//     const agentId = process.env.NEXT_PUBLIC_VAPI_AGENT_ID;

//     if (!agentId) {
//       console.error("Vapi Agent ID is missing! Check NEXT_PUBLIC_VAPI_AGENT_ID in .env");
//       return;
//     }

//     if (!vapiRef.current) {
//       console.error("Vapi is not initialized yet.");
//       return;
//     }

//     // ✅ Use the pre-configured agent from Vapi dashboard
//     vapiRef.current.start(agentId);
//   };

//   const stopAI = () => {
//     vapiRef.current?.stop();
//     setIsAIInterviewActive(false);
//   };

//   // ✅ Start call when AI interview is activated
//   useEffect(() => {
//     if (isAIInterviewActive) {
//       startCall();
//     }
//   }, [isAIInterviewActive]);

//   if (isLoading || callingState !== CallingState.JOINED) {
//     return (
//       <div className="h-96 flex items-center justify-center">
//         <LoaderIcon className="size-6 animate-spin" />
//       </div>
//     );
//   }

//   return (
//     <div className="h-[calc(100vh-4rem-1px)] relative">
//         <video
//   ref={videoRef}
//   autoPlay
//   muted
//   playsInline
//   style={{ 
//     position: "absolute",
//     width: "1px", 
//     height: "1px", 
//     opacity: 0,        // ✅ invisible but still renders
//     pointerEvents: "none"
//   }}
// />

//     <div className="absolute top-4 left-4 z-50 bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
//       Mood: {emotion}
//     </div>
//       <ResizablePanelGroup direction="horizontal">
//         <ResizablePanel defaultSize={35} minSize={25} maxSize={100} className="relative">
//           <div className="absolute inset-0">
//             {layout === "grid" ? <PaginatedGridLayout /> : <SpeakerLayout />}
//             {showParticipants && (
//               <div className="absolute right-0 top-0 h-full w-[300px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40">
//                 <CallParticipantsList onClose={() => setShowParticipants(false)} />
//               </div>
//             )}
//           </div>

//           <div className="absolute bottom-4 left-0 right-0 z-30">
//             <div className="flex flex-col items-center gap-4">
//               <div className="flex items-center gap-2 flex-wrap justify-center px-4">
//                 <CallControls onLeave={() => router.push("/")} />

//                 <div className="flex items-center gap-2">
//                   <DropdownMenu>
//                     <DropdownMenuTrigger asChild>
//                       <Button variant="outline" size="icon" className="size-10">
//                         <LayoutListIcon className="size-4" />
//                       </Button>
//                     </DropdownMenuTrigger>
//                     <DropdownMenuContent>
//                       <DropdownMenuItem onClick={() => setLayout("grid")}>
//                         Grid View
//                       </DropdownMenuItem>
//                       <DropdownMenuItem onClick={() => setLayout("speaker")}>
//                         Speaker View
//                       </DropdownMenuItem>
//                     </DropdownMenuContent>
//                   </DropdownMenu>

//                   <Button
//                     variant="outline"
//                     size="icon"
//                     className="size-10"
//                     onClick={() => setShowParticipants(!showParticipants)}
//                   >
//                     <UsersIcon className="size-4" />
//                   </Button>

//                   <EndCallButton />

//                   {isInterviewer && !isAIInterviewActive && (
//                     <Button
//                       variant="default"
//                       size="sm"
//                       onClick={() => setIsAIInterviewActive(true)}
//                     >
//                       Start AI Interview
//                     </Button>
//                   )}

//                   {isInterviewer && isAIInterviewActive && (
//                     <>
//                       <Button variant="destructive" size="sm" onClick={stopAI}>
//                         Stop AI
//                       </Button>
//                       <Button variant="outline" size="sm" onClick={stopAI}>
//                         Back to Normal
//                       </Button>
//                     </>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </ResizablePanel>

//         <ResizableHandle withHandle />

//         <ResizablePanel defaultSize={65} minSize={25}>
//           <CodeEditor />
//         </ResizablePanel>
//       </ResizablePanelGroup>
//     </div>
//   );
// }

// export default MeetingRoom;
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
import { LayoutListIcon, LoaderIcon, UsersIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import Vapi from "@vapi-ai/web";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizeable";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import EndCallButton from "./EndCallButton";
import CodeEditor from "./CodeEditor";
import { useUserRole } from "@/hooks/useUserRole";

const EMOTION_EMOJI: Record<string, string> = {
  happy: "😊",
  sad: "😢",
  angry: "😠",
  surprised: "😲",
  fearful: "😨",
  disgusted: "🤢",
  neutral: "😐",
};

function MeetingRoom() {
  const router = useRouter();
  const call = useCall();

  // ✅ All hooks from useCallStateHooks
  const { useCallCallingState, useParticipants, useLocalParticipant } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participants = useParticipants();
  const localParticipant = useLocalParticipant();

  // ✅ Only track remote participants (not yourself)
  const remoteParticipants = participants.filter(
    (p) => p.sessionId !== localParticipant?.sessionId
  );

  const [layout, setLayout] = useState<"grid" | "speaker">("speaker");
  const { isInterviewer, isLoading } = useUserRole();
  const [showParticipants, setShowParticipants] = useState(false);
  const [isAIInterviewActive, setIsAIInterviewActive] = useState(false);
  const [participantEmotions, setParticipantEmotions] = useState<Record<string, string>>({});
  const intervalsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const vapiRef = useRef<Vapi | null>(null);

  // ✅ Find video element for a participant
  const getVideoForParticipant = (sessionId: string): HTMLVideoElement | null => {
    // Try data-session-id first
    const container = document.querySelector(`[data-session-id="${sessionId}"]`);
    if (container) {
      const video = container.querySelector("video") as HTMLVideoElement;
      if (video && video.videoWidth > 0) return video;
    }

    // Fallback: get non-mirrored video (remote participant)
    const allVideos = document.querySelectorAll("video");
    for (const v of allVideos) {
      const video = v as HTMLVideoElement;
      if (
        video.videoWidth > 0 &&
        video.videoHeight > 0 &&
        !video.classList.contains("str-video__video--mirror")
      ) {
        return video;
      }
    }

    return null;
  };

  // ✅ Capture frame and detect emotion
  const captureAndDetect = useCallback(async (sessionId: string, name: string) => {
    const videoElement = getVideoForParticipant(sessionId);
    if (!videoElement || videoElement.readyState < 2) return;
    if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoElement, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const formData = new FormData();
      formData.append("image", blob, "frame.jpg");

      try {
        const res = await fetch("http://localhost:5001/detect-emotion", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (data?.emotions && Object.keys(data.emotions).length > 0) {
          const dominantEmotion = Object.keys(data.emotions).reduce((a, b) =>
            data.emotions[a] > data.emotions[b] ? a : b
          );
          setParticipantEmotions((prev) => ({ ...prev, [sessionId]: dominantEmotion }));
        }
      } catch (error) {
        console.error(`Emotion detection error for ${name}:`, error);
      }
    }, "image/jpeg", 0.8);
  }, []);

  // ✅ Start tracking a participant
  const startTrackingParticipant = useCallback((sessionId: string, name: string) => {
    if (intervalsRef.current[sessionId]) return;
    console.log(`Started tracking: ${name}`);

    setTimeout(() => {
      captureAndDetect(sessionId, name);
      const interval = setInterval(() => captureAndDetect(sessionId, name), 4000);
      intervalsRef.current[sessionId] = interval;
    }, 2000);
  }, [captureAndDetect]);

  // ✅ Stop tracking a participant
  const stopTrackingParticipant = useCallback((sessionId: string) => {
    if (intervalsRef.current[sessionId]) {
      clearInterval(intervalsRef.current[sessionId]);
      delete intervalsRef.current[sessionId];
    }
    setParticipantEmotions((prev) => {
      const next = { ...prev };
      delete next[sessionId];
      return next;
    });
  }, []);

  // ✅ Auto pipeline — fires when anyone joins or leaves
  useEffect(() => {
    if (callingState !== CallingState.JOINED) return;

    const currentIds = new Set(remoteParticipants.map((p) => p.sessionId));

    remoteParticipants.forEach((p) => {
      if (!intervalsRef.current[p.sessionId]) {
        startTrackingParticipant(p.sessionId, p.name || "Unknown");
      }
    });

    Object.keys(intervalsRef.current).forEach((sessionId) => {
      if (!currentIds.has(sessionId)) {
        stopTrackingParticipant(sessionId);
      }
    });
  }, [remoteParticipants, callingState]);

  // ✅ Cleanup all intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(intervalsRef.current).forEach(clearInterval);
    };
  }, []);

  // ✅ Vapi init
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_VAPI_AI_API_KEY;
    if (!apiKey) return;

    vapiRef.current = new Vapi(apiKey);
    vapiRef.current.on("error", (e) => console.error("Vapi error:", e));
    vapiRef.current.on("call-end", () => setIsAIInterviewActive(false));

    return () => { vapiRef.current?.stop(); };
  }, []);

  const startCall = () => {
    const agentId = process.env.NEXT_PUBLIC_VAPI_AGENT_ID;
    if (!agentId || !vapiRef.current) return;
    vapiRef.current.start(agentId);
  };

  const stopAI = () => {
    vapiRef.current?.stop();
    setIsAIInterviewActive(false);
  };

  useEffect(() => {
    if (isAIInterviewActive) startCall();
  }, [isAIInterviewActive]);

  if (isLoading || callingState !== CallingState.JOINED) {
    return (
      <div className="h-96 flex items-center justify-center">
        <LoaderIcon className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem-1px)] relative">

      {/* ✅ Shows mood ONLY for remote participants (candidates) */}
      <div className="absolute top-4 left-4 z-50 flex flex-col gap-2">
        {remoteParticipants.length === 0 ? (
          <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
            Waiting for candidate...
          </div>
        ) : (
          remoteParticipants.map((p) => (
            <div
              key={p.sessionId}
              className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              <span className="font-medium">{p.name || "Unknown"}:</span>
              <span className="capitalize">
                {EMOTION_EMOJI[participantEmotions[p.sessionId]] || "🔍"}{" "}
                {participantEmotions[p.sessionId] || "Detecting..."}
              </span>
            </div>
          ))
        )}
      </div>

      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={35} minSize={25} maxSize={100} className="relative">
          <div className="absolute inset-0">
            {layout === "grid" ? <PaginatedGridLayout /> : <SpeakerLayout />}
            {showParticipants && (
              <div className="absolute right-0 top-0 h-full w-[300px] bg-background/95 backdrop-blur z-40">
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
                      <DropdownMenuItem onClick={() => setLayout("grid")}>Grid View</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLayout("speaker")}>Speaker View</DropdownMenuItem>
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
                      <Button variant="destructive" size="sm" onClick={stopAI}>Stop AI</Button>
                      <Button variant="outline" size="sm" onClick={stopAI}>Back to Normal</Button>
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