import { useMutation } from "@tanstack/react-query";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { fetchPosVariantByBarcode } from "@/api/products-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductVariantOptionResponse } from "@/types/product";

type DetectorResult = { rawValue?: string };
type BarcodeDetectorLike = { detect: (source: CanvasImageSource) => Promise<DetectorResult[]> };
type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

function getBarcodeDetectorCtor(): BarcodeDetectorCtor | null {
  if (typeof window === "undefined") return null;
  const ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  return ctor ?? null;
}

export type BarcodeScannerInputProps = {
  storeId: number;
  disabled?: boolean;
  minBarcodeLength?: number;
  onFound: (row: ProductVariantOptionResponse) => void;
  onNotFound?: (message: string) => void;
};

export const BarcodeScannerInput = forwardRef<HTMLInputElement, BarcodeScannerInputProps>(
  function BarcodeScannerInput(
    { storeId, disabled, minBarcodeLength = 6, onFound, onNotFound },
    ref,
  ) {
    const inputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafRef = useRef<number | null>(null);
    const detectorRef = useRef<BarcodeDetectorLike | null>(null);
    const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
    const zxingControlsRef = useRef<{ stop: () => void } | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [manualCode, setManualCode] = useState("");
    const [lastSubmittedCode, setLastSubmittedCode] = useState("");
    const detectorCtor = getBarcodeDetectorCtor();
    const cameraSupported = Boolean(navigator.mediaDevices?.getUserMedia);

    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const m = useMutation({
      mutationFn: (barcode: string) => fetchPosVariantByBarcode({ storeId, barcode }),
      onSuccess: (row, code) => {
        onFound(row);
        setLastSubmittedCode(code);
      },
      onError: () => {
        onNotFound?.("Không tìm thấy sản phẩm theo barcode.");
      },
    });

    const stopCamera = () => {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (zxingControlsRef.current) {
        zxingControlsRef.current.stop();
        zxingControlsRef.current = null;
      }
      if (zxingReaderRef.current) {
        zxingReaderRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setCameraActive(false);
    };

    const triggerLookup = (raw: string) => {
      const code = raw.trim();
      if (!storeId || code.length < minBarcodeLength) return;
      if (m.isPending) return;
      if (code === lastSubmittedCode) return;
      m.mutate(code);
    };

    const scanFrame = async () => {
      const video = videoRef.current;
      const detector = detectorRef.current;
      if (!video || !detector || !cameraActive) return;

      try {
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          const result = await detector.detect(video);
          const first = result.find((r) => typeof r.rawValue === "string" && r.rawValue.trim().length > 0);
          if (first?.rawValue) {
            triggerLookup(first.rawValue);
          }
        }
      } catch {
        // Ignore per-frame detection errors and continue scanning.
      } finally {
        if (cameraActive) {
          rafRef.current = window.requestAnimationFrame(() => {
            void scanFrame();
          });
        }
      }
    };

    const startWithZxing = async () => {
      if (!videoRef.current) {
        throw new Error("Thiếu video element.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
        },
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const reader = new BrowserMultiFormatReader();
      zxingReaderRef.current = reader;
      const controls = await reader.decodeFromVideoElement(videoRef.current, (result, err) => {
        if (result) {
          triggerLookup(result.getText());
          return;
        }

        if (err && err.name !== "NotFoundException") {
          setCameraError("Camera đang hoạt động nhưng chưa đọc được mã vạch. Vui lòng giữ mã ổn định hơn.");
        }
      });
      zxingControlsRef.current = controls;
    };

    const startCamera = async () => {
      if (disabled || !storeId) return;
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Trình duyệt chưa hỗ trợ mở camera.");
        return;
      }

      try {
        setCameraError(null);
        if (detectorCtor) {
          detectorRef.current = new detectorCtor({
            formats: ["code_128", "ean_13", "ean_8", "upc_a", "upc_e", "qr_code"],
          });
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: { ideal: "environment" },
            },
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          }
        } else {
          await startWithZxing();
        }
        setCameraActive(true);
      } catch {
        stopCamera();
        setCameraError("Không thể mở camera. Vui lòng cấp quyền camera cho trình duyệt.");
      }
    };

    useEffect(() => {
      if (!cameraActive) return;
      rafRef.current = window.requestAnimationFrame(() => {
        void scanFrame();
      });
      return () => {
        if (rafRef.current != null) {
          window.cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      };
    }, [cameraActive, lastSubmittedCode, storeId]);

    useEffect(() => {
      if (disabled || storeId <= 0) {
        stopCamera();
      }
    }, [disabled, storeId]);

    useEffect(() => {
      return () => {
        stopCamera();
      };
    }, []);

    useEffect(() => {
      if (!m.isSuccess) return;
      const submitted = m.variables;
      if (typeof submitted === "string") {
        setLastSubmittedCode(submitted);
      }
    }, [m.isSuccess, m.variables]);

    const canStart = !disabled && storeId > 0 && !cameraActive && cameraSupported;
    const canStop = cameraActive;
    const canManualLookup = !disabled && storeId > 0 && manualCode.trim().length >= minBarcodeLength;
    const cameraStatusLabel = cameraActive ? "Camera đang bật" : "Camera đang tắt";

    return (
      <div className="space-y-2.5">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Input
            value={manualCode}
            disabled={disabled || storeId <= 0}
            inputMode="numeric"
            className="h-11 font-mono"
            placeholder={storeId > 0 ? "Nhập mã vạch thủ công" : "Vui lòng chọn cửa hàng trước"}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (!canManualLookup) return;
                triggerLookup(manualCode);
              }
            }}
          />
          <Button
            type="button"
            variant="default"
            className="h-11"
            disabled={!canManualLookup || m.isPending}
            onClick={() => triggerLookup(manualCode)}
          >
            Tìm sản phẩm
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" className="h-10" onClick={() => void startCamera()} disabled={!canStart}>
            Bật camera
          </Button>
          <Button type="button" variant="outline" className="h-10" onClick={stopCamera} disabled={!canStop}>
            Tắt camera
          </Button>
          <Badge variant={cameraActive ? "secondary" : "muted"}>{cameraStatusLabel}</Badge>
          <input ref={inputRef} className="sr-only" aria-hidden />
        </div>

        <div className="overflow-hidden rounded-md border bg-black/80">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={cameraActive ? "h-32 w-full object-cover md:h-36" : "h-14 w-full object-cover opacity-0"}
          />
        </div>

        {!cameraActive ? (
          <div className="grid h-9 place-items-center rounded-md border border-dashed text-xs text-muted-foreground">
            Camera đang tắt. Ưu tiên quét bằng máy quét mã vạch hoặc nhập thủ công.
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground">
          {cameraError
            ? cameraError
            : cameraActive
              ? "Đặt mã vạch vào khung quét để hệ thống tự nhận diện."
              : cameraSupported
                ? "Bấm Bật camera để bắt đầu quét mã vạch."
                : "Trình duyệt hiện tại không hỗ trợ truy cập camera."}
        </p>
      </div>
    );
  },
);
