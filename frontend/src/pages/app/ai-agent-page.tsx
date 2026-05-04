import { FormEvent, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  Clock3,
  FileUp,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  RefreshCw,
  Send,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/auth-store";
import { cn } from "@/lib/utils";

type ChatRole = "user" | "assistant" | "system";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type AgentEvent = {
  type: string;
  data?: Record<string, unknown>;
};

type TrainingDocument = {
  id: string;
  filename: string;
  mime_type: string;
  size: number;
  file_type: string;
  status: string;
  chunk_count: number;
  content_length: number;
  created_at: string;
};

type ConversationSummary = {
  id: string;
  title?: string | null;
  created_at: string;
  updated_at?: string | null;
  is_archived: boolean;
};

type ConversationListResponse = {
  items: ConversationSummary[];
  total: number;
};

type ConversationMessageResponse = {
  id: string;
  role: ChatRole;
  content: string;
};

type ConversationDetailResponse = ConversationSummary & {
  messages: ConversationMessageResponse[];
};

type AgentModelsResponse = {
  default?: string;
  models?: string[];
  recommended_models?: string[];
  configured_models?: string[];
  unavailable_models?: string[];
};

const API_BASE = "/ai-agent/api/v1";

function createId() {
  return crypto.randomUUID();
}

function wsUrl() {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}${API_BASE}/ws/agent`;
}

function shortTitle(title?: string | null) {
  return title?.trim() || "Cuộc trò chuyện mới";
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const token = match[0];
    if (token.startsWith("`")) {
      nodes.push(
        <code key={`${match.index}-code`} className="rounded bg-muted px-1 py-0.5 text-[0.92em] text-foreground">
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      nodes.push(
        <strong key={`${match.index}-strong`} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>,
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function parseTable(lines: string[]) {
  if (lines.length < 2) return null;
  const separator = lines[1].trim();
  if (!/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(separator)) return null;
  const toCells = (line: string) =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());
  return { headers: toCells(lines[0]), rows: lines.slice(2).map(toCells) };
}

function AssistantMessage({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (line.trim().startsWith("```")) {
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push(
        <pre key={`code-${i}`} className="overflow-x-auto rounded-md border bg-muted/60 p-3 text-xs leading-5 text-foreground">
          <code>{codeLines.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    if (line.includes("|") && i + 1 < lines.length && lines[i + 1].includes("|")) {
      const tableLines: string[] = [];
      let j = i;
      while (j < lines.length && lines[j].includes("|") && lines[j].trim()) {
        tableLines.push(lines[j]);
        j += 1;
      }
      const table = parseTable(tableLines);
      if (table) {
        blocks.push(
          <div key={`table-${i}`} className="overflow-x-auto rounded-md border">
            <table className="min-w-full border-collapse text-left text-xs">
              <thead className="bg-muted/70 text-muted-foreground">
                <tr>
                  {table.headers.map((header, index) => (
                    <th key={`${header}-${index}`} className="border-b px-3 py-2 font-medium">
                      {renderInline(header)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="odd:bg-background even:bg-muted/20">
                    {row.map((cell, cellIndex) => (
                      <td key={`${rowIndex}-${cellIndex}`} className="border-b px-3 py-2 align-top">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
        i = j;
        continue;
      }
    }

    if (/^#{1,3}\s+/.test(line)) {
      const level = line.match(/^#+/)?.[0].length || 1;
      const text = line.replace(/^#{1,3}\s+/, "");
      blocks.push(
        <div key={`heading-${i}`} className={cn("font-semibold text-foreground", level === 1 ? "text-base" : "text-sm")}>
          {renderInline(text)}
        </div>,
      );
      i += 1;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ul key={`ul-${i}`} className="space-y-1 pl-4">
          {items.map((item, index) => (
            <li key={index} className="list-disc pl-1">
              {renderInline(item)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ol key={`ol-${i}`} className="space-y-1 pl-4">
          {items.map((item, index) => (
            <li key={index} className="list-decimal pl-1">
              {renderInline(item)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    const paragraph: string[] = [line.trim()];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{1,3}\s+/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !lines[i].trim().startsWith("```") &&
      !(lines[i].includes("|") && i + 1 < lines.length && lines[i + 1].includes("|"))
    ) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push(
      <p key={`p-${i}`} className="leading-6">
        {renderInline(paragraph.join(" "))}
      </p>,
    );
  }

  return <div className="space-y-3">{blocks}</div>;
}

export function AiAgentPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const me = useAuthStore((s) => s.me);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [recommendedModels, setRecommendedModels] = useState<string[]>([]);
  const [configuredModels, setConfiguredModels] = useState<string[]>([]);
  const [unavailableModels, setUnavailableModels] = useState<string[]>([]);
  const [model, setModel] = useState("");
  const [online, setOnline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [trainingDocs, setTrainingDocs] = useState<TrainingDocument[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const conversationIdRef = useRef<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const activeAssistantIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/agent/models`)
      .then((res) => res.json())
      .then((data: AgentModelsResponse) => {
        const available = data.models?.length ? data.models : data.default ? [data.default] : [];
        const recommended = data.recommended_models || [];
        const configured = data.configured_models || [];
        const unavailable = data.unavailable_models || [];
        setModels(available);
        setRecommendedModels(recommended);
        setConfiguredModels(configured);
        setUnavailableModels(unavailable);
        setModel(data.default || available[0] || "");
      })
      .catch(() => setNotice("Không tải được danh sách model."));
  }, []);

  const authHeaders = useCallback(() => {
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  }, [accessToken]);

  const loadConversations = useCallback(async () => {
    if (!accessToken) return;
    const res = await fetch(`${API_BASE}/conversations?limit=50`, {
      headers: authHeaders(),
    });
    if (!res.ok) return;
    const data = (await res.json()) as ConversationListResponse;
    setConversations(data.items || []);
  }, [accessToken, authHeaders]);

  useEffect(() => {
    if (!accessToken) return;
    fetch(`${API_BASE}/files/training`, {
      headers: authHeaders(),
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: TrainingDocument[]) => setTrainingDocs(data))
      .catch(() => undefined);
  }, [accessToken, authHeaders]);

  useEffect(() => {
    loadConversations().catch(() => undefined);
  }, [loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    connect();
    return () => socketRef.current?.close();
  }, [accessToken]);

  function appendMessage(role: ChatRole, content: string) {
    const id = createId();
    setMessages((items) => [...items, { id, role, content }]);
    return id;
  }

  function updateMessage(id: string, updater: (content: string) => string) {
    setMessages((items) =>
      items.map((item) => (item.id === id ? { ...item, content: updater(item.content) } : item)),
    );
  }

  async function loadConversation(conversationId: string) {
    if (!accessToken) return;
    setLoadingConversation(true);
    setNotice("");
    try {
      const res = await fetch(`${API_BASE}/conversations/${conversationId}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Không tải được lịch sử.");
      const data = (await res.json()) as ConversationDetailResponse;
      conversationIdRef.current = data.id;
      activeAssistantIdRef.current = null;
      setSelectedConversationId(data.id);
      setMessages(
        (data.messages || []).map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
        })),
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không tải được lịch sử.");
    } finally {
      setLoadingConversation(false);
    }
  }

  function startNewConversation() {
    conversationIdRef.current = null;
    activeAssistantIdRef.current = null;
    setSelectedConversationId(null);
    setMessages([]);
    setInput("");
    setNotice("");
  }

  function connect() {
    socketRef.current?.close();
    setOnline(false);
    setBusy(false);
    activeAssistantIdRef.current = null;

    if (!accessToken) {
      setNotice("Phiên đăng nhập không hợp lệ.");
      return;
    }

    const socket = new WebSocket(wsUrl(), ["chat", `access_token.${accessToken}`]);
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      setOnline(true);
      setNotice("");
    });

    socket.addEventListener("close", (event) => {
      setOnline(false);
      setBusy(false);
      if (event.code === 4001) {
        setNotice("Không xác thực được phiên đăng nhập.");
      }
    });

    socket.addEventListener("error", () => {
      setOnline(false);
      setBusy(false);
      setNotice("Không kết nối được AI Agent.");
    });

    socket.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data) as AgentEvent;
      handleAgentEvent(payload);
    });
  }

  function handleAgentEvent(event: AgentEvent) {
    const data = event.data || {};
    if (event.type === "conversation_created" && typeof data.conversation_id === "string") {
      conversationIdRef.current = data.conversation_id;
      setSelectedConversationId(data.conversation_id);
      return;
    }
    if (event.type === "model_request_start") {
      activeAssistantIdRef.current = appendMessage("assistant", "");
      return;
    }
    if (event.type === "text_delta") {
      const content = typeof data.content === "string" ? data.content : "";
      const id = activeAssistantIdRef.current || appendMessage("assistant", "");
      activeAssistantIdRef.current = id;
      updateMessage(id, (text) => text + content);
      return;
    }
    if (event.type === "tool_call") {
      return;
    }
    if (event.type === "final_result") {
      const output = typeof data.output === "string" ? data.output : "";
      const id = activeAssistantIdRef.current || appendMessage("assistant", "");
      activeAssistantIdRef.current = id;
      updateMessage(id, (text) => (text.trim() ? text : output));
      return;
    }
    if (event.type === "error") {
      appendMessage("system", typeof data.message === "string" ? data.message : "AI Agent gặp lỗi.");
      setBusy(false);
      return;
    }
    if (event.type === "complete") {
      activeAssistantIdRef.current = null;
      setBusy(false);
      if (typeof data.conversation_id === "string") {
        conversationIdRef.current = data.conversation_id;
        setSelectedConversationId(data.conversation_id);
      }
      loadConversations().catch(() => undefined);
    }
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    const socket = socketRef.current;
    if (!text || !socket || socket.readyState !== WebSocket.OPEN) return;

    appendMessage("user", text);
    setInput("");
    setBusy(true);
    socket.send(
      JSON.stringify({
        message: text,
        conversation_id: conversationIdRef.current,
        model,
      }),
    );
  }

  async function uploadTrainingFiles(files: FileList | null) {
    if (!files?.length || !accessToken) return;
    setUploading(true);
    setNotice("");

    const uploaded: TrainingDocument[] = [];
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${API_BASE}/files/training`, {
          method: "POST",
          headers: authHeaders(),
          body: formData,
        });
        if (!res.ok) {
          const error = (await res.json().catch(() => null)) as { detail?: string } | null;
          throw new Error(error?.detail || `Không training được file ${file.name}.`);
        }
        uploaded.push((await res.json()) as TrainingDocument);
      }
      setTrainingDocs((items) => [...uploaded, ...items]);
      appendMessage("system", `Đã training ${uploaded.length} file.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Upload training file thất bại.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function formatConversationTime(value?: string | null) {
    if (!value) return "";
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  }

  return (
    <div className="grid h-full min-h-0 overflow-hidden bg-background lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="hidden min-h-0 border-r bg-muted/20 lg:flex lg:flex-col">
        <div className="flex h-12 shrink-0 items-center justify-between border-b px-3">
          <div className="flex min-w-0 items-center gap-2">
            <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm font-semibold">Lịch sử</span>
          </div>
          <Button type="button" variant="outline" size="icon" className="h-8 w-8" title="Chat mới" onClick={startNewConversation}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          {conversations.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Chưa có lịch sử</div>
          ) : null}
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => loadConversation(conversation.id)}
                className={cn(
                  "group w-full rounded-md border px-3 py-2 text-left transition hover:bg-background",
                  selectedConversationId === conversation.id ? "border-primary bg-background" : "border-transparent",
                )}
              >
                <span className="block truncate text-sm font-medium text-foreground">{shortTitle(conversation.title)}</span>
                <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock3 className="h-3 w-3" />
                  {formatConversationTime(conversation.updated_at || conversation.created_at)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full", online ? "bg-emerald-500" : "bg-muted-foreground")} />
            <span className="truncate text-sm font-semibold">{me?.fullName || me?.username || "AI Agent"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" className="h-9 w-9 lg:hidden" title="Chat mới" onClick={startNewConversation}>
              <Plus className="h-4 w-4" />
            </Button>
            <select
              value={model}
              onChange={(event) => setModel(event.target.value)}
              className="h-9 max-w-[220px] rounded-md border bg-background px-2 text-sm"
              title="Model"
            >
              {recommendedModels.length > 0 ? (
                <optgroup label="Tự động dùng được">
                  {recommendedModels.map((name) => (
                    <option key={name} value={name}>
                      ✓ {name}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {configuredModels.length > 0 ? (
                <optgroup label="Có API key">
                  {configuredModels.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {unavailableModels.length > 0 ? (
                <optgroup label="Chưa cấu hình key">
                  {unavailableModels.map((name) => (
                    <option key={name} value={name} disabled>
                      {name}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {!recommendedModels.length && !configuredModels.length && !unavailableModels.length
                ? models.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))
                : null}
            </select>
            <Button type="button" variant="outline" size="icon" className="h-9 w-9" title="Kết nối lại" onClick={connect}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="border-b bg-background px-3 py-2 lg:hidden">
          <div className="flex gap-2 overflow-x-auto">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => loadConversation(conversation.id)}
                className={cn(
                  "max-w-[220px] shrink-0 truncate rounded-md border px-3 py-1.5 text-xs",
                  selectedConversationId === conversation.id ? "border-primary bg-primary/10" : "border-input",
                )}
              >
                {shortTitle(conversation.title)}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-muted/20 px-4 py-5">
          <div className="flex w-full flex-col gap-4">
            {loadingConversation ? <div className="text-center text-xs text-muted-foreground">Đang tải...</div> : null}
            {messages.length === 0 ? (
              <div className="flex h-[360px] items-center justify-center text-muted-foreground">
                <Bot className="h-8 w-8" />
              </div>
            ) : null}
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-2",
                  message.role === "user" ? "justify-end" : "justify-start",
                  message.role === "system" && "justify-center",
                )}
              >
                {message.role === "assistant" ? (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                ) : null}
                <div
                  className={cn(
                    "max-w-[min(860px,82%)] rounded-md border px-3 py-2 text-sm leading-6 shadow-sm",
                    message.role !== "assistant" && "whitespace-pre-wrap",
                    message.role === "user" && "border-primary bg-primary text-primary-foreground",
                    message.role === "assistant" && "bg-background px-4 py-3",
                    message.role === "system" && "border-transparent bg-transparent px-0 py-0 text-xs text-muted-foreground shadow-none",
                  )}
                >
                  {message.content ? (
                    message.role === "assistant" ? (
                      <AssistantMessage content={message.content} />
                    ) : (
                      message.content
                    )
                  ) : (
                    <MoreHorizontal className="h-4 w-4 animate-pulse" />
                  )}
                </div>
                {message.role === "user" ? (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <UserRound className="h-4 w-4" />
                  </div>
                ) : null}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <form onSubmit={sendMessage} className="shrink-0 border-t bg-background p-3">
          {notice ? <p className="mb-2 text-xs text-destructive">{notice}</p> : null}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept=".txt,.md,.csv,.json,.pdf,.docx,text/plain,text/markdown,text/csv,application/json,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => uploadTrainingFiles(event.target.files)}
          />
          <div className="flex items-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0"
              title={`${trainingDocs.length} file training`}
              disabled={uploading || !accessToken}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? <FileUp className="h-4 w-4 animate-pulse" /> : <Paperclip className="h-4 w-4" />}
            </Button>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              rows={1}
              className="max-h-32 min-h-11 flex-1 resize-none rounded-md border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Nhập câu hỏi..."
            />
            <Button type="submit" size="icon" className="h-11 w-11" disabled={!online || busy || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
