"use client";
import { useEffect,useState} from "react";
import LoaderUI from "@/components/LoaderUI";
import {getCandidateInfo,groupInterviews} from "@/lib/utils";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {INTERVIEW_CATEGORY} from "@/constants";
import {Badge} from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  XCircleIcon,
} from "lucide-react";
import { format } from "date-fns";
import CommentDialog from "@/components/CommentDialog";
import toast from "react-hot-toast";
import { useUser } from "@clerk/nextjs";

type User = {
  id: string;
  clerkId: string;
  name: string;
  image: string;
  role: "candidate" | "interviewer";
};

type Interview = {
  _id: string;
  title: string;
  candidateId: string;
  status: string;
  startTime: string;
  passStatus?: "pass"|"fail"|"pending";
};

function DashboardPage() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [interviews, setInterviews] = useState<Interview[] | null>(null);
  const [role, setRole] = useState<"candidate" | "interviewer" | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const currentUser = user?.id;

  const fetchUsersAndInterviews = async () => {
    try {
      const [usersRes, interviewsRes] = await Promise.all([
        fetch("http://localhost:5000/api/users"),
        fetch("http://localhost:5000/api/interviews"),
      ]);

      const usersData: User[] = await usersRes.json();
      const interviewsData: Interview[] = await interviewsRes.json();

      const currentUserInDb = usersData.find(
        (u) => u.clerkId === currentUser
      );

      if (!currentUserInDb) {
        toast.error("User not found in database.");
        return;
      }

      setRole(currentUserInDb.role);
      setUsers(usersData);
      setInterviews(interviewsData);
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndInterviews();
  }, []);

  

  const markPassStatus = async (
    interviewId: string,
    passStatus: "pass" | "fail"
  ) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/interviews/pass-status/${interviewId}`,
        {
          method: "PATCH",
          headers: {"Content-Type": "application/json" },
          body: JSON.stringify({ passStatus }),
        }
      );

      if (!res.ok) throw new Error("Pass/Fail update failed");

      toast.success(`Interview marked as ${passStatus}`);
      fetchUsersAndInterviews();
    } catch (error) {
      toast.error("Failed to mark interview as pass/fail");
    }
  };

  if (loading || !interviews || !users || !role) return <LoaderUI />;
  const visibleInterviews =
    role === "candidate"
      ? interviews.filter((i) => i.candidateId === currentUser)
      : interviews;
  const groupedInterviews = groupInterviews(visibleInterviews);
  return (
    <div className="container mx-auto py-10">
      {role === "interviewer" && (
        <div className="flex items-center mb-8">
          <Link href="/schedule">
            <Button>Schedule New Interview</Button>
          </Link>
        </div>
      )}
      <div className="space-y-8">
        {INTERVIEW_CATEGORY.map(
          (category) =>
            groupedInterviews[category.id]?.length > 0 && (
              <section key={category.id}>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl font-semibold">{category.title}</h2>
                  <Badge variant={category.variant}>
                    {groupedInterviews[category.id].length}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedInterviews[category.id].map((interview) => {
                    const candidateInfo = getCandidateInfo(
                      users,
                      interview.candidateId
                    );
                    const startTime = new Date(interview.startTime);
                    return (
                      <Card
                        key={interview._id}
                        className="hover:shadow-md transition-all"
                      >
                        <CardHeader className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={candidateInfo.image} />
                              <AvatarFallback>
                                {candidateInfo.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-base">
                                {candidateInfo.name}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {interview.title}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4" />
                              {format(startTime, "MMM dd")}
                            </div>
                            <div className="flex items-center gap-1">
                              <ClockIcon className="h-4 w-4" />
                              {format(startTime, "hh:mm a")}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0 flex flex-col gap-3">
                          {role === "interviewer" &&
                            interview.status === "completed" &&
                            interview.passStatus === "pending" && (
                              <div className="flex gap-2 w-full">
                                <Button
                                  className="flex-1"
                                  onClick={() =>
                                    markPassStatus(interview._id, "pass")
                                  }
                                >
                                  <CheckCircle2Icon className="h-4 w-4 mr-2" />
                                  Pass
                                </Button>
                                <Button
                                  variant="destructive"
                                  className="flex-1"
                                  onClick={() =>
                                    markPassStatus(interview._id, "fail")
                                  }
                                >
                                  <XCircleIcon className="h-4 w-4 mr-2" />
                                  Fail
                                </Button>
                              </div>
                            )}
                          <CommentDialog
                            interviewId={interview._id}
                            currentUserId={currentUser}
                          />
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
