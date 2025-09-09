import { useEffect, useState } from "react";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";

const useGetCallById = (id: string | string[]) => {
  const [call, setCall] = useState<Call>();
  const [isCallLoading, setIsCallLoading] = useState(true);

  const client = useStreamVideoClient();

  useEffect(() => {
    if (!client || !id) return;

    const fetchCall = async () => {
      try {
        const { calls } = await client.queryCalls({
          filter_conditions: { id: typeof id === "string" ? id : id[0] }, // support both single and array input
        });

        if (calls.length > 0) {
          setCall(calls[0]);
        } else {
          setCall(undefined);
        }
      } catch (error) {
        console.error("Error fetching call:", error);
        setCall(undefined);
      } finally {
        setIsCallLoading(false);
      }
    };

    fetchCall();
  }, [client, id]);

  return { call, isCallLoading };
};

export default useGetCallById;
