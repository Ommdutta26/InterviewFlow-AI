import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { MessageSquareIcon, StarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { format } from "date-fns";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { BASE_URL } from "@/constants";

function CommentDialog({ interviewId, currentUserId }: { interviewId: string; currentUserId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState("3");
  const [comments, setComments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        const [commentsRes, usersRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/comments/${interviewId}`),
          axios.get(`${BASE_URL}/api/users`),
        ]);
        setComments(commentsRes.data);
        setUsers(usersRes.data);
      } catch (error) {
        toast.error("Failed to load comments or users");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, interviewId]);

  const handleSubmit = async () => {
    if (!comment.trim()) return toast.error("Please enter comment");
    console.log("current",currentUserId)
    setSubmitting(true);
    try {
      const newComment = {
        interviewId,
        content: comment.trim(),
        rating: parseInt(rating),
        interviewerId: currentUserId,
      };

      await axios.post(`${BASE_URL}/api/comments`, newComment);
      toast.success("Comment submitted");
      setComment("");
      setRating("3");
      setIsOpen(false);
    } catch (err) {
      toast.error("Failed to submit comment");
    } finally {
      setSubmitting(false);
    }
  };

  const getInterviewerInfo = (id: string) => {
    const user = users.find((u) => u._id === id);
    return {
      name: user?.name || "Unknown",
      image: user?.image || "",
      initials: user?.name?.[0]?.toUpperCase() || "U",
    };
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((starValue) => (
        <StarIcon
          key={starValue}
          className={`h-4 w-4 ${starValue <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
        />
      ))}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full">
          <MessageSquareIcon className="h-4 w-4 mr-2" />
          Add Comment
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Interview Comment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {comments.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Previous Comments</h4>
                <Badge variant="outline">{comments.length} Comment{comments.length !== 1 ? "s" : ""}</Badge>
              </div>

              <ScrollArea className="h-[240px]">
                <div className="space-y-4">
                  {comments.map((comment, index) => {
                    const interviewer = getInterviewerInfo(comment.interviewerId);
                    return (
                      <div key={index} className="rounded-lg border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={interviewer.image} />
                              <AvatarFallback>{interviewer.initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{interviewer.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(comment.createdAt), "MMM d, yyyy • h:mm a")}
                              </p>
                            </div>
                          </div>
                          {renderStars(comment.rating)}
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.content}</p>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <Select value={rating} onValueChange={setRating}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <SelectItem key={value} value={value.toString()}>
                      <div className="flex items-center gap-2">{renderStars(value)}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Your Comment</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your detailed comment about the candidate..."
                className="h-32"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CommentDialog;
