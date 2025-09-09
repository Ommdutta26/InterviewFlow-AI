"use client";

import ActionCard from "@/components/ActionCard";
import { QUICK_ACTIONS } from "@/constants";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MeetingModal from "@/components/MeetingModal";
import LoaderUI from "@/components/LoaderUI";
import { Loader2Icon } from "lucide-react";
import MeetingCard from "@/components/MeetingCard";
import axios from "axios";
import { useUser } from "@clerk/nextjs";
import { BASE_URL } from "@/constants";

const useUserRole = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInterviewer, setIsInterviewer] = useState(false);
  const [isCandidate, setIsCandidate] = useState(false);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;

    const fetchRole = async () => {
      try {
        const res = await axios.post(`${BASE_URL}/api/users/sync`, {
          name: user.fullName,
          email: user.primaryEmailAddress?.emailAddress,
          clerkId: user.id,
          image: user.imageUrl,
        });
        const role = res.data.role;
        setIsInterviewer(role === "interviewer");
        setIsCandidate(role === "candidate");
      } catch (err) {
        console.error("Error fetching role", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();
  }, [isLoaded, user]);

  return { isInterviewer, isCandidate, isLoading };
};

export default function Home() {
  const { user } = useUser();
  const router = useRouter();
  const { isInterviewer, isCandidate, isLoading } = useUserRole();
  const [interviews, setInterviews] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"start" | "join">();

  useEffect(() => {
    if (!isCandidate) return;
    const fetchInterviews = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/interviews/my/${user?.id}`);
        setInterviews(res.data);
      } catch (error) {
        console.error("Error fetching interviews", error);
      }
    };

    fetchInterviews();
  }, [isCandidate]);

  const handleQuickAction = (title: string) => {
    switch (title) {
      case "New Call":
        setModalType("start");
        setShowModal(true);
        break;
      case "Join Interview":
        setModalType("join");
        setShowModal(true);
        break;
      default:
        router.push(`/${title.toLowerCase()}`);
    }
  };

  if (isLoading) return <LoaderUI />;

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* background glow effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/3 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-teal-400/20 rounded-full blur-2xl animate-pulse delay-300" />
      </div>

      <div className="container max-w-7xl mx-auto p-6">
        {/* Welcome */}
        <div className="rounded-2xl backdrop-blur-md bg-white/5 p-10 border border-white/10 shadow-2xl mb-14 animate-fadeIn">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Welcome back, {user?.firstName || "Guest"} 👋
          </h1>
          <p className="text-lg text-gray-300 mt-4">
            {isInterviewer
              ? "Manage your interviews, schedule calls, and review candidates."
              : "Check your upcoming interviews and join seamlessly."}
          </p>
        </div>

        {/* Dashboard */}
        {isInterviewer ? (
          <>
            <h2 className="text-2xl font-semibold mb-6">Quick Actions</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {QUICK_ACTIONS.map((action) => (
                <div
                  key={action.title}
                  className="transition duration-300 transform hover:-translate-y-1 hover:shadow-xl"
                >
                  <ActionCard
                    action={action}
                    onClick={() => handleQuickAction(action.title)}
                  />
                </div>
              ))}
            </div>
            <MeetingModal
              isOpen={showModal}
              onClose={() => setShowModal(false)}
              title={modalType === "join" ? "Join Meeting" : "Start Meeting"}
              isJoinMeeting={modalType === "join"}
            />
          </>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {QUICK_ACTIONS.filter(
                (action) => action.title === "Join Interview"
              ).map((action) => (
                <div
                  key={action.title}
                  className="transition duration-300 transform hover:-translate-y-1 hover:shadow-xl"
                >
                  <ActionCard
                    action={action}
                    onClick={() => handleQuickAction(action.title)}
                  />
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-semibold mt-12 mb-3">Your Interviews</h2>
            <p className="text-gray-400 mb-6">
              View and join your scheduled interviews below.
            </p>

            <div>
              {interviews === undefined ? (
                <div className="flex justify-center py-12">
                  <Loader2Icon className="h-10 w-10 animate-spin text-gray-400" />
                </div>
              ) : interviews.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {interviews.map((interview) => (
                    <div
                      key={interview._id}
                      className="transition duration-300 transform hover:-translate-y-1 hover:shadow-xl"
                    >
                      <MeetingCard interview={interview} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400 text-lg">
                  🚀 You have no scheduled interviews yet.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

