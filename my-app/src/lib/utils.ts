import { clsx, type ClassValue } from "clsx";
import { addHours, intervalToDuration, isAfter, isBefore, isWithinInterval } from "date-fns";
import { twMerge } from "tailwind-merge";

// Utility to merge Tailwind class names conditionally
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Replace Convex Interview type with your MongoDB interface
export interface Interview {
  _id: string;
  startTime: Date;
  endTime: Date;
  status: "pending" | "failed" | "succeeded" | "completed";
  candidateId: string;
  interviewerId: string;
}

export interface User {
  _id: string;
  clerkId: string;
  name: string;
  image: string;
}

// Group interviews by status
export const groupInterviews = (interviews: Interview[]) => {
  if (!interviews) return {};
  const now = new Date();

  return interviews.reduce((acc: Record<string, ExtendedInterview[]>, interview) => {
    const startTime = new Date(interview.startTime);

    if (isAfter(startTime, now)) {
      acc.upcoming = [...(acc.upcoming || []), interview];
    } else {
      acc.completed = [...(acc.completed || []), interview];

      if (interview.passStatus === "pass") {
        acc.succeeded = [...(acc.succeeded || []), interview];
      } else if (interview.passStatus === "fail") {
        acc.failed = [...(acc.failed || []), interview];
      }
    }

    return acc;
  }, {});
};



// Fetch candidate info
export const getCandidateInfo = (users: User[], candidateId: string) => {
  const candidate = users?.find((user) => user.clerkId === candidateId);
  return {
    name: candidate?.name || "Unknown Candidate",
    image: candidate?.image || "",
    initials:
      candidate?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("") || "UC",
  };
};

// Fetch interviewer info
export const getInterviewerInfo = (users: User[], interviewerId: string) => {
  const interviewer = users?.find((user) => user.clerkId === interviewerId);
  return {
    name: interviewer?.name || "Unknown Interviewer",
    image: interviewer?.image || "",
    initials:
      interviewer?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("") || "UI",
  };
};

// Calculate recording duration
export const calculateRecordingDuration = (startTime: string | Date, endTime: string | Date) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const duration = intervalToDuration({ start, end });

  if (duration.hours && duration.hours > 0) {
    return `${duration.hours}:${String(duration.minutes).padStart(2, "0")}:${String(
      duration.seconds
    ).padStart(2, "0")}`;
  }

  if (duration.minutes && duration.minutes > 0) {
    return `${duration.minutes}:${String(duration.seconds).padStart(2, "0")}`;
  }

  return `${duration.seconds} seconds`;
};

// Get meeting status
export const getMeetingStatus = (interview: Interview) => {
  const now = new Date();
  const interviewStartTime = new Date(interview.startTime);
  const endTime = addHours(interviewStartTime, 1);

  if (
    interview.status === "completed" ||
    interview.status === "failed" ||
    interview.status === "succeeded"
  )
    return "completed";

  if (isWithinInterval(now, { start: interviewStartTime, end: endTime })) return "live";

  if (isBefore(now, interviewStartTime)) return "upcoming";

  return "completed";
};
