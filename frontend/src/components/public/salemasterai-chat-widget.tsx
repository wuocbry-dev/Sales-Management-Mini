/**
 * SaleMaster AI — Floating chat widget cho trang chủ công khai.
 * Hoàn toàn độc lập: không dùng auth, không gọi backend nội bộ.
 * Gọi trực tiếp Gemini API qua VITE_GEMINI_API_KEY.
 */
import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, ChevronDown, Loader2, Send, Sparkles, X } from "lucide-react";

// ─── Kiểu dữ liệu ────────────────────────────────────────────────────────────

type Role = "user" | "assistant";

type Message = {
  id: string;
  role: Role;
  text: string;
};

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Bạn là SaleMaster AI — trợ lý tư vấn của nền tảng SaleMaster VN.
Nhiệm vụ duy nhất của bạn: trả lời các câu hỏi về SaleMaster VN, sản phẩm, tính năng, cách dùng, lợi ích và các vấn đề liên quan đến quản lý bán lẻ.

Thông tin về SaleMaster VN:
- Nền tảng quản lý bán lẻ hiện đại, phù hợp doanh nghiệp đa cửa hàng và chuỗi bán lẻ.
- Tính năng cốt lõi: quản lý đa cửa hàng & chi nhánh, hàng hóa & tồn kho (nhiều biến thể), bán hàng & đơn hàng (POS), trả hàng, chuyển kho, kiểm kê, báo cáo doanh thu, phân quyền chi tiết theo vai trò.
- Hỗ trợ các loại hình: bán lẻ thời trang, hàng tiêu dùng, tạp hóa, đại lý & phân phối nhỏ.
- Có SaleMaster AI tích hợp bên trong: phân tích dữ liệu bán hàng, hỏi đáp về vận hành, nghiên cứu thị trường và so sánh đối thủ.
- Giao diện chuyên nghiệp, tối ưu cho máy tính và máy tính bảng tại quầy.
- Bảo mật phân quyền: từ trụ sở → chi nhánh → cửa hàng → kho.
- Đăng ký dùng thử miễn phí tại trang chủ.

Quy tắc:
- Luôn trả lời bằng tiếng Việt, ngắn gọn, thân thiện, chuyên nghiệp.
- Nếu câu hỏi ngoài phạm vi SaleMaster, nhẹ nhàng hướng người dùng về các tính năng hoặc lợi ích của SaleMaster.
- Không bịa thông tin giá cả hoặc cam kết kỹ thuật cụ thể ngoài những gì đã mô tả.
- Khuyến khích người dùng đăng ký dùng thử khi phù hợp.`;

// ─── Hằng số ──────────────────────────────────────────────────────────────────

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const QUICK_QUESTIONS = [
  "SaleMaster có những tính năng gì?",
  "Phù hợp loại hình kinh doanh nào?",
  "Làm sao để bắt đầu dùng thử?",
  "Hệ thống phân quyền hoạt động như thế nào?",
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

async function callGemini(history: Message[], userText: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    return "Chức năng chat chưa được cấu hình API key. Vui lòng liên hệ admin.";
  }

  // Build Gemini contents array (alternating user/model)
  const contents = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.text }],
  }));
  contents.push({ role: "user", parts: [{ text: userText }] });

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
  };

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    console.error("Gemini error:", err);
    return "Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.";
  }

  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return text.trim() || "Tôi chưa có câu trả lời cho câu hỏi này.";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SaleMasterAIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Greeting khi mở lần đầu
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: uid(),
          role: "assistant",
          text: "Xin chào! Tôi là **SaleMaster AI** 👋\n\nTôi có thể giúp bạn tìm hiểu về nền tảng quản lý bán lẻ SaleMaster VN. Bạn muốn biết điều gì?",
        },
      ]);
    }
    if (open) setShowBadge(false);
  }, [open, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: uid(), role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const reply = await callGemini(messages, trimmed);
      setMessages((prev) => [...prev, { id: uid(), role: "assistant", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", text: "Xin lỗi, tôi gặp lỗi. Vui lòng thử lại." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  function renderText(text: string) {
    // Đơn giản: bold **text**, xuống dòng
    return text.split(/\n/).map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={j}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
      return (
        <span key={i}>
          {parts}
          {i < text.split(/\n/).length - 1 && <br />}
        </span>
      );
    });
  }

  return (
    <>
      {/* ── Panel chat ── */}
      {open && (
        <div
          className="fixed bottom-24 right-4 z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:right-6"
          style={{ width: "min(380px, calc(100vw - 2rem))", height: "min(540px, calc(100vh - 8rem))" }}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-b bg-gradient-to-r from-primary to-primary/80 px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold leading-none">SaleMaster AI</p>
                <p className="mt-0.5 text-xs opacity-80">Trợ lý tư vấn SaleMaster VN</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 opacity-80 transition hover:bg-white/20 hover:opacity-100"
              aria-label="Đóng chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
            <div className="flex flex-col gap-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "rounded-tr-sm bg-primary text-primary-foreground"
                        : "rounded-tl-sm border bg-background text-foreground"
                    }`}
                  >
                    {renderText(msg.text)}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-2">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border bg-background px-3 py-2.5 shadow-sm">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60 [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60 [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60 [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              {/* Quick questions — chỉ hiện khi chỉ có greeting */}
              {messages.length === 1 && messages[0].role === "assistant" && !loading && (
                <div className="flex flex-col gap-1.5 pl-9">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void send(q)}
                      className="w-full rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-left text-xs text-primary transition hover:bg-primary/10"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="shrink-0 border-t bg-background px-3 py-2.5"
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                rows={1}
                placeholder="Nhập câu hỏi về SaleMaster..."
                disabled={loading}
                className="max-h-24 min-h-9 flex-1 resize-none rounded-xl border bg-muted/30 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow transition hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-40"
                aria-label="Gửi"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
              SaleMaster AI · Chỉ tư vấn về SaleMaster VN
            </p>
          </form>
        </div>
      )}

      {/* ── FAB button ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Đóng SaleMaster AI" : "Mở SaleMaster AI"}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-200 hover:scale-105 hover:bg-primary/90 hover:shadow-xl active:scale-95 sm:right-6"
      >
        {open ? (
          <ChevronDown className="h-6 w-6" />
        ) : (
          <Sparkles className="h-6 w-6" />
        )}

        {/* Badge thông báo */}
        {showBadge && !open && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white shadow">
            AI
          </span>
        )}
      </button>

      {/* ── Tooltip khi chưa mở ── */}
      {!open && showBadge && (
        <div className="fixed bottom-20 right-4 z-50 animate-bounce sm:right-6">
          <div className="rounded-xl border bg-background px-3 py-1.5 text-xs font-medium shadow-md">
            💬 Hỏi về SaleMaster
            <div className="absolute -bottom-1.5 right-4 h-3 w-3 rotate-45 border-b border-r bg-background" />
          </div>
        </div>
      )}
    </>
  );
}
