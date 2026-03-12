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
import { LayoutListIcon, LoaderIcon, UsersIcon, AlertTriangleIcon, ShieldAlertIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Vapi from "@vapi-ai/web";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizeable";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import EndCallButton from "./EndCallButton";
import CodeEditor from "./CodeEditor";
import { useUserRole } from "@/hooks/useUserRole";

// ── Types ─────────────────────────────────────────────────────────────────
interface ProctoringAlert {
  id: number;
  type: "TAB_SWITCH" | "FULLSCREEN_EXIT" | "LOOKING_AWAY" | "NO_FACE";
  message: string;
  time: string;
  severity: "warning" | "danger";
}

// ── Constants ──────────────────────────────────────────────────────────────
const EMOTION_EMOJI: Record<string, string> = {
  happy:     "😊",
  sad:       "😢",
  angry:     "😠",
  surprised: "😲",
  fearful:   "😨",
  disgusted: "🤢",
  neutral:   "😐",
};

const ALERT_COLORS: Record<ProctoringAlert["type"], string> = {
  TAB_SWITCH:      "bg-red-600",
  FULLSCREEN_EXIT: "bg-orange-600",
  LOOKING_AWAY:    "bg-yellow-600",
  NO_FACE:         "bg-red-800",
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const EMOTION_API = "http://localhost:5001";

let alertIdCounter = 0;

// ── Component ──────────────────────────────────────────────────────────────
function MeetingRoom() {
  const router = useRouter();
  const call   = useCall();
  const callId = call?.id;

  const { useCallCallingState, useParticipants, useLocalParticipant } = useCallStateHooks();
  const callingState     = useCallCallingState();
  const participants     = useParticipants();
  const localParticipant = useLocalParticipant();

  const remoteParticipants = useMemo(
    () => participants.filter((p) => p.sessionId !== localParticipant?.sessionId),
    [participants, localParticipant?.sessionId]
  );

  const [layout, setLayout]                           = useState<"grid" | "speaker">("speaker");
  const { isInterviewer, isLoading }                  = useUserRole();
  const [showParticipants, setShowParticipants]       = useState(false);
  const [isAIInterviewActive, setIsAIInterviewActive] = useState(false);
  const [participantEmotions, setParticipantEmotions] = useState<Record<string, string>>({});
  const [participantGaze, setParticipantGaze]         = useState<Record<string, string>>({});

  // Proctoring state
  const [proctoringAlerts, setProctoringAlerts]         = useState<ProctoringAlert[]>([]);
  const [tabSwitchCount, setTabSwitchCount]             = useState(0);
  const [lookingAwayCount, setLookingAwayCount]         = useState(0);
  const [showProctoringPanel, setShowProctoringPanel]   = useState(true);

  const intervalsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const timeoutsRef  = useRef<Record<string, NodeJS.Timeout>>({});
  const vapiRef      = useRef<Vapi | null>(null);

  // ── Add alert ────────────────────────────────────────────────────────────
  const addAlert = useCallback((
    type: ProctoringAlert["type"],
    message: string,
    severity: ProctoringAlert["severity"] = "warning"
  ) => {
    setProctoringAlerts((prev) => [{
      id: ++alertIdCounter,
      type,
      message,
      time: new Date().toLocaleTimeString(),
      severity,
    }, ...prev].slice(0, 50));
  }, []);

  // ── Send proctoring event to backend (CANDIDATE side) ────────────────────
  const sendProctoringEvent = useCallback(async (
    type: string,
    message: string
  ) => {
    if (!callId) return;
    try {
      await fetch(`${BACKEND_URL}/api/proctoring/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callId,
          candidateName: localParticipant?.name || "Candidate",
          type,
          message,
          time: new Date().toLocaleTimeString(),
        }),
      });
    } catch (err) {
      console.error("Proctoring send error:", err);
    }
  }, [callId, localParticipant]);

  // ── Tab switch — runs on CANDIDATE browser only ───────────────────────────
  useEffect(() => {
    if (isInterviewer) return; // ✅ only candidate
    if (callingState !== CallingState.JOINED) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        sendProctoringEvent("TAB_SWITCH", "Candidate switched tab or minimized window");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isInterviewer, callingState, sendProctoringEvent]);

  // ── Fullscreen — runs on CANDIDATE browser only ───────────────────────────
  useEffect(() => {
    if (isInterviewer) return; // ✅ only candidate
    if (callingState !== CallingState.JOINED) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        sendProctoringEvent("FULLSCREEN_EXIT", "Candidate exited fullscreen mode");
      }
    };

    document.documentElement.requestFullscreen().catch(() => {});
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [isInterviewer, callingState, sendProctoringEvent]);

  // ── Interviewer polls backend for candidate events every 3s ──────────────
  useEffect(() => {
    if (!isInterviewer || !callId) return;
    if (callingState !== CallingState.JOINED) return;

    const poll = setInterval(async () => {
      try {
        const res  = await fetch(`${BACKEND_URL}/api/proctoring/events/${callId}`);
        const data = await res.json();

        if (data.events && data.events.length > 0) {
          data.events.forEach((event: any) => {
            addAlert(
              event.type as ProctoringAlert["type"],
              event.message,
              event.type === "TAB_SWITCH" || event.type === "FULLSCREEN_EXIT" ? "danger" : "warning"
            );
            if (event.type === "TAB_SWITCH")   setTabSwitchCount((c) => c + 1);
            if (event.type === "LOOKING_AWAY") setLookingAwayCount((c) => c + 1);
          });

          // ✅ Clear after reading so no duplicates
          await fetch(`${BACKEND_URL}/api/proctoring/events/${callId}`, {
            method: "DELETE"
          });
        }
      } catch (err) {
        console.error("Proctoring poll error:", err);
      }
    }, 3000);

    return () => clearInterval(poll);
  }, [isInterviewer, callId, callingState, addAlert]);

  // ── Find video element ────────────────────────────────────────────────────
  const getVideoForParticipant = (sessionId: string): HTMLVideoElement | null => {
    const container = document.querySelector(`[data-session-id="${sessionId}"]`);
    if (container) {
      const video = container.querySelector("video") as HTMLVideoElement;
      if (video && video.videoWidth > 0) return video;
    }

    const allVideos = document.querySelectorAll("video");
    for (const v of allVideos) {
      const video = v as HTMLVideoElement;
      if (
        video.videoWidth > 0 &&
        video.videoHeight > 0 &&
        !video.classList.contains("str-video__video--mirror")
      ) return video;
    }
    return null;
  };

  // ── Capture blob ──────────────────────────────────────────────────────────
  const captureBlob = (video: HTMLVideoElement): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(resolve, "image/jpeg", 0.8);
    });
  };

  // ── Emotion detection (INTERVIEWER side — captures candidate video) ────────
  const captureAndDetect = useCallback(async (sessionId: string, name: string) => {
    if (!isInterviewer) return; // ✅ only interviewer runs this
    const video = getVideoForParticipant(sessionId);
    if (!video || video.readyState < 2 || video.videoWidth === 0) {
      console.log("❌ No video found for", name);
      return;
    }

    console.log("✅ Capturing emotion for", name, video.videoWidth, "x", video.videoHeight);

    const blob = await captureBlob(video);
    if (!blob) return;

    const formData = new FormData();
    formData.append("image", blob, "frame.jpg");

    try {
      const res  = await fetch(`${EMOTION_API}/detect-emotion`, { method: "POST", body: formData });
      const data = await res.json();

      console.log("Emotion response:", data);

      if (data?.emotions && Object.keys(data.emotions).length > 0) {
        const dominant = Object.keys(data.emotions).reduce((a, b) =>
          data.emotions[a] > data.emotions[b] ? a : b
        );
        setParticipantEmotions((prev) => ({ ...prev, [sessionId]: dominant }));
      }
    } catch (err) {
      console.error(`Emotion error for ${name}:`, err);
    }
  }, [isInterviewer]);

  // ── Gaze detection (INTERVIEWER side) ────────────────────────────────────
  const captureAndDetectGaze = useCallback(async (sessionId: string, name: string) => {
    if (!isInterviewer) return; // ✅ only interviewer runs this
    const video = getVideoForParticipant(sessionId);
    if (!video || video.readyState < 2 || video.videoWidth === 0) return;

    const blob = await captureBlob(video);
    if (!blob) return;

    const formData = new FormData();
    formData.append("image", blob, "frame.jpg");

    try {
      const res  = await fetch(`${EMOTION_API}/detect-gaze`, { method: "POST", body: formData });
      const data = await res.json();

      if (data?.gaze) {
        setParticipantGaze((prev) => ({ ...prev, [sessionId]: data.gaze }));

        if (data.looking_away && data.gaze !== "no_face") {
          setLookingAwayCount((c) => c + 1);
          addAlert("LOOKING_AWAY", `${name} is looking away (ratio: ${data.gaze_ratio})`, "warning");

          // ✅ Also send to backend so it's logged
          if (callId) {
            await fetch(`${BACKEND_URL}/api/proctoring/event`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                callId,
                candidateName: name,
                type: "LOOKING_AWAY",
                message: `${name} is looking away (ratio: ${data.gaze_ratio})`,
                time: new Date().toLocaleTimeString(),
              }),
            }).catch(() => {});
          }
        }

        if (data.gaze === "no_face") {
          addAlert("NO_FACE", `${name}'s face is not visible`, "danger");
        }
      }
    } catch (err) {
      console.error(`Gaze error for ${name}:`, err);
    }
  }, [isInterviewer, addAlert, callId]);

  // ── Start tracking participant ────────────────────────────────────────────
  const startTrackingParticipant = useCallback((sessionId: string, name: string) => {
    if (!isInterviewer) return; // ✅ only interviewer tracks
    if (intervalsRef.current[sessionId]) return;
    console.log(`Tracking started: ${name}`);

    const timeout = setTimeout(() => {
      captureAndDetect(sessionId, name);
      const emotionInterval = setInterval(() => captureAndDetect(sessionId, name), 4000);
      intervalsRef.current[sessionId] = emotionInterval;

      captureAndDetectGaze(sessionId, name);
      const gazeInterval = setInterval(() => captureAndDetectGaze(sessionId, name), 3000);
      intervalsRef.current[`${sessionId}_gaze`] = gazeInterval;
    }, 2000);

    timeoutsRef.current[sessionId] = timeout;
  }, [isInterviewer, captureAndDetect, captureAndDetectGaze]);

  // ── Stop tracking participant ─────────────────────────────────────────────
  const stopTrackingParticipant = useCallback((sessionId: string) => {
    clearTimeout(timeoutsRef.current[sessionId]);
    clearInterval(intervalsRef.current[sessionId]);
    clearInterval(intervalsRef.current[`${sessionId}_gaze`]);
    delete timeoutsRef.current[sessionId];
    delete intervalsRef.current[sessionId];
    delete intervalsRef.current[`${sessionId}_gaze`];
    setParticipantEmotions((prev) => { const n = { ...prev }; delete n[sessionId]; return n; });
    setParticipantGaze((prev)     => { const n = { ...prev }; delete n[sessionId]; return n; });
  }, []);

  // ── Auto pipeline ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (callingState !== CallingState.JOINED) return;

    const currentIds = new Set(remoteParticipants.map((p) => p.sessionId));

    remoteParticipants.forEach((p) => {
      if (!intervalsRef.current[p.sessionId]) {
        startTrackingParticipant(p.sessionId, p.name || "Unknown");
      }
    });

    Object.keys(intervalsRef.current).forEach((id) => {
      const baseId = id.replace("_gaze", "");
      if (!currentIds.has(baseId)) stopTrackingParticipant(baseId);
    });
  }, [remoteParticipants, callingState, startTrackingParticipant, stopTrackingParticipant]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      Object.values(intervalsRef.current).forEach(clearInterval);
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  // ── Vapi ──────────────────────────────────────────────────────────────────
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

      {/* ── Candidate mood badges — interviewer only ── */}
      {isInterviewer && (
        <div className="absolute top-4 left-4 z-50 flex flex-col gap-2">
          {remoteParticipants.length === 0 ? (
            <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
              Waiting for candidate...
            </div>
          ) : (
            remoteParticipants.map((p) => (
              <div key={p.sessionId} className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm flex flex-col gap-1">
                <span className="font-semibold">{p.name || "Unknown"}</span>

                <div className="flex items-center gap-1 text-xs">
                  <span>Mood:</span>
                  <span className="capitalize">
                    {EMOTION_EMOJI[participantEmotions[p.sessionId]] || "🔍"}{" "}
                    {participantEmotions[p.sessionId] || "Detecting..."}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs">
                  <span>Gaze:</span>
                  <span className={`capitalize font-medium ${
                    participantGaze[p.sessionId] === "away"    ? "text-red-400"   :
                    participantGaze[p.sessionId] === "center"  ? "text-green-400" : "text-gray-400"
                  }`}>
                    {participantGaze[p.sessionId] === "away"    ? "👀 Looking Away" :
                     participantGaze[p.sessionId] === "center"  ? "✅ Focused"      :
                     participantGaze[p.sessionId] === "no_face" ? "❌ No Face"      : "🔍 Detecting..."}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Proctoring panel — interviewer only ── */}
      {isInterviewer && (
        <div className="absolute top-4 right-4 z-50 w-80">
          <div
            className="bg-gray-900/90 text-white px-4 py-2 rounded-t-lg flex items-center justify-between cursor-pointer"
            onClick={() => setShowProctoringPanel(!showProctoringPanel)}
          >
            <div className="flex items-center gap-2">
              <ShieldAlertIcon className="size-4 text-yellow-400" />
              <span className="font-semibold text-sm">Proctoring Monitor</span>
            </div>
            <span className="text-xs text-gray-400">{showProctoringPanel ? "▲ hide" : "▼ show"}</span>
          </div>

          {showProctoringPanel && (
            <div className="bg-gray-900/90 text-white px-4 py-3 rounded-b-lg flex flex-col gap-3">
              <div className="flex gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-red-700/80 px-3 py-1 rounded text-xs">
                  <AlertTriangleIcon className="size-3" />
                  <span>Tab Switches: <strong>{tabSwitchCount}</strong></span>
                </div>
                <div className="flex items-center gap-1 bg-yellow-700/80 px-3 py-1 rounded text-xs">
                  <AlertTriangleIcon className="size-3" />
                  <span>Looking Away: <strong>{lookingAwayCount}</strong></span>
                </div>
                <div className="flex items-center gap-1 bg-blue-700/80 px-3 py-1 rounded text-xs">
                  <span>Total Alerts: <strong>{proctoringAlerts.length}</strong></span>
                </div>
              </div>

              <div className={`text-xs px-3 py-1 rounded font-semibold text-center ${
                tabSwitchCount + lookingAwayCount > 10 ? "bg-red-600" :
                tabSwitchCount + lookingAwayCount > 5  ? "bg-yellow-600" : "bg-green-700"
              }`}>
                Risk Level:{" "}
                {tabSwitchCount + lookingAwayCount > 10 ? "🔴 HIGH" :
                 tabSwitchCount + lookingAwayCount > 5  ? "🟡 MEDIUM" : "🟢 LOW"}
              </div>

              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                {proctoringAlerts.length === 0 ? (
                  <div className="text-xs text-gray-400 text-center py-2">No alerts yet</div>
                ) : (
                  proctoringAlerts.map((alert) => (
                    <div key={alert.id} className={`text-xs px-2 py-1 rounded flex items-start gap-2 ${ALERT_COLORS[alert.type]}/60`}>
                      <AlertTriangleIcon className="size-3 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-semibold">{alert.type.replace(/_/g, " ")}</div>
                        <div className="text-gray-200">{alert.message}</div>
                        <div className="text-gray-400">{alert.time}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {proctoringAlerts.length > 0 && (
                <button
                  onClick={() => setProctoringAlerts([])}
                  className="text-xs text-gray-400 hover:text-white text-center underline"
                >
                  Clear alerts
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Main layout ── */}
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

                  <Button variant="outline" size="icon" className="size-10"
                    onClick={() => setShowParticipants(!showParticipants)}>
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