import { ChevronDown } from "lucide-react";
import { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type LocalOption = {
  id: number;
  label: string;
};

export type LocalOptionComboboxProps = {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: LocalOption[];
  placeholder?: string;
  disabled?: boolean;
  noResultsText?: string;
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function byLabelMatch(option: LocalOption, query: string): boolean {
  const q = normalizeText(query);
  if (!q) return true;
  return normalizeText(option.label).includes(q);
}

export const LocalOptionCombobox = forwardRef<HTMLInputElement, LocalOptionComboboxProps>(
  function LocalOptionCombobox(
    {
      value = "",
      onChange,
      onBlur = () => {},
      options,
      placeholder = "Chọn...",
      disabled,
      noResultsText = "Không có kết quả phù hợp.",
    },
    ref,
  ) {
    const listId = useId();
    const containerRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");

    const selected = useMemo(
      () => options.find((opt) => String(opt.id) === String(value)),
      [options, value],
    );

    const filtered = useMemo(() => {
      if (text.trim() === "") {
        return options.slice(0, 80);
      }
      return options.filter((opt) => byLabelMatch(opt, text)).slice(0, 80);
    }, [options, text]);

    useEffect(() => {
      if (open) return;
      if (selected) {
        setText(selected.label);
        return;
      }
      if (!value) {
        setText("");
      }
    }, [open, selected, value]);

    useEffect(() => {
      function onDocMouseDown(e: MouseEvent) {
        if (!containerRef.current?.contains(e.target as Node)) {
          setOpen(false);
        }
      }
      document.addEventListener("mousedown", onDocMouseDown);
      return () => document.removeEventListener("mousedown", onDocMouseDown);
    }, []);

    function pick(opt: LocalOption): void {
      onChange(String(opt.id));
      setText(opt.label);
      setOpen(false);
    }

    function commitTypedValue(): void {
      const raw = text.trim();
      if (raw === "") {
        onChange("");
        setText("");
        return;
      }

      const exact = options.find((opt) => normalizeText(opt.label) === normalizeText(raw));
      if (exact) {
        onChange(String(exact.id));
        setText(exact.label);
        return;
      }

      if (selected) {
        setText(selected.label);
      } else {
        onChange("");
        setText("");
      }
    }

    const showList = open && !disabled;

    return (
      <div ref={containerRef} className="relative">
        <Input
          ref={ref}
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          value={text}
          disabled={disabled}
          placeholder={placeholder}
          className="pr-9"
          onChange={(e) => {
            const next = e.target.value;
            setText(next);
            setOpen(true);
            if (value) {
              onChange("");
            }
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            commitTypedValue();
            onBlur();
          }}
        />

        <button
          type="button"
          tabIndex={-1}
          aria-label="Mở danh sách"
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen((v) => !v)}
        >
          <ChevronDown className="h-4 w-4" aria-hidden />
        </button>

        {showList ? (
          <div
            id={listId}
            role="listbox"
            className={cn(
              "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md",
            )}
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">{noResultsText}</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="option"
                  className="flex w-full cursor-pointer select-none px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(opt)}
                >
                  <span className="break-all">{opt.label}</span>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
    );
  },
);
