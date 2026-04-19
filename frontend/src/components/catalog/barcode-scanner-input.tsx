import { useMutation } from "@tanstack/react-query";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { fetchPosVariantByBarcode } from "@/api/products-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductVariantOptionResponse } from "@/types/product";

function playSuccessBeep() {
  if (typeof window === "undefined") return;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(1174.7, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(987.8, ctx.currentTime + 0.24);

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.26);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.28);

    window.setTimeout(() => {
      void ctx.close();
    }, 360);
  } catch {
    // Silent fallback when browser/audio policy blocks sound playback.
  }
}

export type BarcodeScannerInputProps = {
  storeId: number;
  disabled?: boolean;
  minBarcodeLength?: number;
  compact?: boolean;
  onFound: (row: ProductVariantOptionResponse) => void;
  onNotFound?: (message: string) => void;
};

export const BarcodeScannerInput = forwardRef<HTMLInputElement, BarcodeScannerInputProps>(
  function BarcodeScannerInput(
    { storeId, disabled, minBarcodeLength = 6, compact = false, onFound, onNotFound },
    ref,
  ) {
    const inputRef = useRef<HTMLInputElement>(null);
    const lastScanRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
    const [manualCode, setManualCode] = useState("");

    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const m = useMutation({
      mutationFn: (barcode: string) => fetchPosVariantByBarcode({ storeId, barcode }),
      onSuccess: (row) => {
        playSuccessBeep();
        onFound(row);
        setManualCode("");
        inputRef.current?.focus();
      },
      onError: () => {
        onNotFound?.("Không tìm thấy sản phẩm theo barcode.");
        inputRef.current?.focus();
      },
    });

    const triggerLookup = (raw: string) => {
      const code = raw.trim();
      if (!storeId || code.length < minBarcodeLength) return;
      if (m.isPending) return;

      const now = Date.now();
      // Prevent accidental double-submit from scanner's Enter key burst.
      if (lastScanRef.current.code === code && now - lastScanRef.current.at < 120) {
        return;
      }

      lastScanRef.current = { code, at: now };
      m.mutate(code);
    };

    useEffect(() => {
      if (disabled || storeId <= 0) return;
      inputRef.current?.focus();
    }, [disabled, storeId]);

    const canManualLookup = !disabled && storeId > 0 && manualCode.trim().length >= minBarcodeLength;

    return (
      <div className={compact ? "space-y-1" : "space-y-2"}>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <Input
            ref={inputRef}
            autoFocus
            value={manualCode}
            disabled={disabled || storeId <= 0}
            inputMode="numeric"
            className={compact ? "h-9 font-mono" : "h-10 font-mono"}
            placeholder={storeId > 0 ? "Đưa mã vào máy bắn barcode hoặc nhập tay" : "Chọn cửa hàng trước"}
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
            variant="outline"
            className={compact ? "h-9" : "h-10"}
            disabled={!canManualLookup || m.isPending}
            onClick={() => triggerLookup(manualCode)}
          >
            Tìm mã
          </Button>
        </div>

        {!compact ? (
          <p className="text-xs text-muted-foreground">
            Máy bắn barcode hoạt động như bàn phím. Bắn mã và Enter để tự thêm vào giỏ hàng.
          </p>
        ) : null}
      </div>
    );
  },
);
