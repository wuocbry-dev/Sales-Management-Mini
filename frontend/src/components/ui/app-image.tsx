import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type AppImageProps = {
  src?: string | null;
  alt: string;
  containerClassName?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  fallback?: ReactNode;
  loading?: "eager" | "lazy";
  withFrame?: boolean;
};

export function AppImage({
  src,
  alt,
  containerClassName,
  imageClassName,
  fallbackClassName,
  fallback,
  loading = "lazy",
  withFrame = true,
}: AppImageProps) {
  const normalizedSrc = typeof src === "string" && src.trim() !== "" ? src : null;
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setLoadError(false);
  }, [normalizedSrc]);

  const showImage = Boolean(normalizedSrc && !loadError);

  return (
    <div
      className={cn(
        withFrame ? "relative overflow-hidden rounded-md border bg-muted" : "relative h-full w-full overflow-hidden",
        containerClassName,
      )}
    >
      {showImage ? (
        <img
          src={normalizedSrc!}
          alt={alt}
          loading={loading}
          decoding="async"
          draggable={false}
          className={cn("h-full w-full bg-white object-contain object-center p-1", imageClassName)}
          onError={() => setLoadError(true)}
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center text-center text-[10px] font-medium text-muted-foreground",
            fallbackClassName,
          )}
        >
          {fallback ?? "No image"}
        </div>
      )}
    </div>
  );
}