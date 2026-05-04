"use client";

{%- if cookiecutter.use_jwt %}
import { useState, useCallback, useMemo } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { RatingValue, type UserRating } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RatingButtonsProps {
  messageId: string;
  conversationId: string;
  currentRating: UserRating;
  ratingCount?: { likes: number; dislikes: number };
  onRatingChange?: (data: { rating: UserRating; rating_count: { likes: number; dislikes: number } }) => void;
  isAssistant: boolean;
}

export function RatingButtons({
  messageId,
  conversationId,
  currentRating,
  ratingCount,
  onRatingChange,
  isAssistant,
}: RatingButtonsProps) {
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [pendingRating, setPendingRating] = useState<RatingValue>(RatingValue.DISLIKE);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const calculateNewCounts = useMemo(() =>
    (oldRating: UserRating, newRating: UserRating): { likes: number; dislikes: number } => {
      const likes = ratingCount?.likes ?? 0;
      const dislikes = ratingCount?.dislikes ?? 0;

      let newLikes = likes;
      let newDislikes = dislikes;
      if (oldRating === RatingValue.LIKE) newLikes -= 1;
      if (oldRating === RatingValue.DISLIKE) newDislikes -= 1;

      if (newRating === RatingValue.LIKE) newLikes += 1;
      if (newRating === RatingValue.DISLIKE) newDislikes += 1;

      return { likes: Math.max(0, newLikes), dislikes: Math.max(0, newDislikes) };
    },
    [ratingCount]
  );

  // submitRating must be declared before handleRate since handleRate uses it
  const submitRating = useCallback(
    async (rating: RatingValue, commentText: string | null) => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/conversations/${conversationId}/messages/${messageId}/rate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              rating,
              comment: commentText,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: "Unknown error" }));
          throw new Error(error.message || "Failed to submit rating");
        }

        const newCounts = calculateNewCounts(currentRating, rating);
        onRatingChange?.({ rating, rating_count: newCounts });
        toast.success("Thanks for your feedback!");
        setShowCommentDialog(false);
        setComment("");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to submit rating");
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, messageId, currentRating, calculateNewCounts, onRatingChange]
  );

  const handleRate = useCallback(
    async (rating: RatingValue) => {
      // Defensive check: ensure conversationId exists
      if (!conversationId || conversationId === "") {
        toast.error("Please save the conversation first before rating");
        return;
      }

      if (currentRating === rating) {
        setIsLoading(true);
        try {
          const response = await fetch(
            `/api/conversations/${conversationId}/messages/${messageId}/rate`,
            {
              method: "DELETE",
              credentials: "include",
            }
          );

          if (!response.ok) {
            const error = await response.json().catch(() => ({ message: "Unknown error" }));
            throw new Error(error.message || "Failed to remove rating");
          }

          const newCounts = calculateNewCounts(currentRating, null);
          onRatingChange?.({ rating: null, rating_count: newCounts });
          toast.success("Rating removed");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to remove rating");
        } finally {
          setIsLoading(false);
        }
      } else {
        setPendingRating(rating);
        if (rating === RatingValue.DISLIKE) {
          setShowCommentDialog(true);
        } else {
          submitRating(rating, null);
        }
      }
    },
    [conversationId, messageId, currentRating, calculateNewCounts, onRatingChange, submitRating]
  );

  const handleCloseDialog = useCallback(() => {
    setShowCommentDialog(false);
    setComment("");
  }, []);

  if (!isAssistant) return null;

  // Disable rating if conversationId is not set (e.g., new conversation not yet saved)
  const isMissingConversationId = !conversationId || conversationId === "";

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleRate(RatingValue.LIKE)}
          disabled={isLoading || isMissingConversationId}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            "hover:bg-muted/80",
            "opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
            currentRating === RatingValue.LIKE &&
              "bg-green-500/30 text-green-600 dark:text-green-400",
            isMissingConversationId && "opacity-50 cursor-not-allowed"
          )}
          title={isMissingConversationId ? "Save conversation first to rate" : "Helpful"}
        >
          <ThumbsUp className="h-4 w-4" />
          {ratingCount && ratingCount.likes > 0 && (
            <span className="ml-1 text-xs">{ratingCount.likes}</span>
          )}
        </button>

        <button
          onClick={() => handleRate(RatingValue.DISLIKE)}
          disabled={isLoading || isMissingConversationId}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            "hover:bg-muted/80",
            "opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
            currentRating === RatingValue.DISLIKE &&
              "bg-red-500/30 text-red-600 dark:text-red-400",
            isMissingConversationId && "opacity-50 cursor-not-allowed"
          )}
          title={isMissingConversationId ? "Save conversation first to rate" : "Not helpful"}
        >
          <ThumbsDown className="h-4 w-4" />
          {ratingCount && ratingCount.dislikes > 0 && (
            <span className="ml-1 text-xs">{ratingCount.dislikes}</span>
          )}
        </button>
      </div>

      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What went wrong?</DialogTitle>
            <DialogDescription>
              Help us improve by optionally letting us know what wasn&apos;t helpful.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Describe the issue... (optional)"
            className="w-full min-h-[100px] p-2 rounded-md border bg-background"
            maxLength={2000}
            autoFocus
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {comment.length} / 2000
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleCloseDialog}
                disabled={isLoading}
                className="px-4 py-2 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Cancel
              </button>
              <button
                onClick={() => submitRating(pendingRating, null)}
                disabled={isLoading}
                className="px-4 py-2 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Submit without comment
              </button>
              <button
                onClick={() => submitRating(pendingRating, comment.trim() || null)}
                disabled={isLoading}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Submit with comment
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
{%- else %}
// Rating component placeholder - JWT not enabled
export function RatingButtons() {
  return null;
}
{%- endif %}
