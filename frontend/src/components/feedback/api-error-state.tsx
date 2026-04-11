import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatApiError } from "@/lib/api-errors";
import { AlertTriangle } from "lucide-react";

type Props = {
  error: unknown;
  title?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ApiErrorState({ error, title = "Không tải được dữ liệu", onRetry, retryLabel = "Thử lại" }: Props) {
  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{formatApiError(error)}</CardDescription>
          </div>
        </div>
      </CardHeader>
      {onRetry ? (
        <CardFooter>
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
