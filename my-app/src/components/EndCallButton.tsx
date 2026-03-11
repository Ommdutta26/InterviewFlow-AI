import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import axios from "axios";
import toast from "react-hot-toast";
import { BASE_URL } from "@/constants";

function EndCallButton() {
  const call = useCall();
  const router = useRouter();
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterview = async () => {
      console.log("Call ID:", call?.id); // Debug log
      if (!call?.id) return;

      try {
        const res = await axios.get(`${BASE_URL}/api/interviews/stream/${call.id}`);
        setInterview(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load interview");
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [call?.id]);

  if (!call || loading || !interview) return null;

  const isMeetingOwner = localParticipant?.userId === call.state.createdBy?.id;
  if (!isMeetingOwner) return null;

  const endCall = async () => {
    try {
      await call.endCall();

      await axios.patch(`${BASE_URL}/api/interviews/${interview._id}/status`, {
        status: "completed",
      });

      router.push("/");
      toast.success("Meeting ended for everyone");
    } catch (error) {
      console.error(error);
      toast.error("Failed to end meeting");
    }
  };

  return (
    <Button variant="destructive" onClick={endCall}>
      End Meeting
    </Button>
  );
}
export default EndCallButton;
