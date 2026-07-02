import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles, X, User, Bot, HelpCircle, AlertCircle, RefreshCw } from "lucide-react";
import { ChatMessage, Verse } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  activeContext: {
    surahNumber: number;
    surahName: string;
    verseNumber: number;
    verse: Verse;
  } | null;
  onClearContext: () => void;
}

// Simple custom Markdown renderer to avoid installing extra heavy libraries
// Parses headers, bold text, bullet points, and paragraphs safely
function renderCustomMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, index) => {
    // Trim line for matching
    const trimmed = line.trim();

    // Check for headers
    if (trimmed.startsWith("### ")) {
      return (
        <h4 key={index} className="text-sm font-semibold text-emerald-800 dark:text-emerald-400 mt-3 mb-1 font-display">
          {parseBold(trimmed.substring(4))}
        </h4>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h3 key={index} className="text-base font-bold text-emerald-800 dark:text-emerald-400 mt-4 mb-2 font-display border-b border-emerald-100 dark:border-emerald-950 pb-1">
          {parseBold(trimmed.substring(3))}
        </h3>
      );
    }
    if (trimmed.startsWith("# ")) {
      return (
        <h2 key={index} className="text-lg font-bold text-emerald-900 dark:text-emerald-300 mt-4 mb-2 font-display">
          {parseBold(trimmed.substring(2))}
        </h2>
      );
    }

    // Check for bullet points
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      return (
        <ul key={index} className="list-disc pl-5 my-1 text-slate-700 dark:text-slate-300 text-sm">
          <li>{parseBold(trimmed.substring(2))}</li>
        </ul>
      );
    }

    // Numbered list
    const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
    if (numMatch) {
      return (
        <ol key={index} className="list-decimal pl-5 my-1 text-slate-700 dark:text-slate-300 text-sm" start={parseInt(numMatch[1])}>
          <li>{parseBold(numMatch[2])}</li>
        </ol>
      );
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      return (
        <blockquote key={index} className="border-l-4 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 pl-3 py-1 my-2 text-slate-600 dark:text-slate-400 text-sm italic rounded-r">
          {parseBold(trimmed.substring(2))}
        </blockquote>
      );
    }

    // Empty line
    if (trimmed === "") {
      return <div key={index} className="h-2" />;
    }

    // Default paragraph
    return (
      <p key={index} className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-2">
        {parseBold(line)}
      </p>
    );
  });
}

// Parse **bold** in text
function parseBold(text: string): React.ReactNode[] {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, index) => {
    // Odd indexes are inside **
    if (index % 2 === 1) {
      return <strong key={index} className="font-semibold text-slate-900 dark:text-slate-100">{part}</strong>;
    }
    return part;
  });
}

export default function AIAssistant({ isOpen, onClose, activeContext, onClearContext }: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with a welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "model",
          content: `Assalamu'alaikum Warahmatullahi Wabarakatuh! Selamat datang di **Asisten Al-Qur'an Digital**.

Saya adalah ustadz virtual Anda yang siap membantu menelusuri hikmah Al-Qur'an. Anda bisa bertanya tentang:
1. **Tafsir & Penjelasan Ayat**: Klik tombol "Tanya Ustadz" pada ayat mana saja, atau sebutkan ayatnya di sini.
2. **Bimbingan Hidup & Ketenangan**: Misalnya, *"Bagaimana cara melatih kesabaran dalam Al-Qur'an?"* atau *"Kirimkan ayat penenang hati di saat cemas."*
3. **Pencarian Topik**: Misalnya, *"Ayat tentang kewajiban berbakti kepada orang tua."*

Apa yang ingin Sahabat diskusikan hari ini?`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [messages.length]);

  // Handle auto-triggering when activeContext changes
  useEffect(() => {
    if (activeContext) {
      // Add context message
      const prompt = `Jelaskan tafsir, asbabun nuzul, dan pelajaran praktis dari Surat **${activeContext.surahName}** (Surat ke-${activeContext.surahNumber}) Ayat **${activeContext.verseNumber}**:\n\n*${activeContext.verse.teksArab}*\n\nArtinya: "${activeContext.verse.teksIndonesia}"`;
      
      // We auto-send this prompt on behalf of user
      handleSendMessage(prompt, true);
    }
  }, [activeContext]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string, isAutoContext = false) => {
    const promptText = textToSend || inputValue;
    if (!promptText.trim()) return;

    if (!textToSend) {
      setInputValue("");
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Prepare chat history in server format
      const historyToSend = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      // Set up current context if any
      const contextToSend = activeContext
        ? {
            surahNumber: activeContext.surahNumber,
            surahName: activeContext.surahName,
            verseNumber: activeContext.verseNumber,
            arabic: activeContext.verse.teksArab,
            translation: activeContext.verse.teksIndonesia,
          }
        : null;

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: promptText,
          history: historyToSend,
          context: contextToSend,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Gagal menghubungi asisten AI.");
      }

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        content: resData.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan koneksi.");
    } finally {
      setIsLoading(false);
      if (isAutoContext) {
        onClearContext(); // Clear context trigger after processing so it can be re-triggered
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus seluruh riwayat obrolan?")) {
      setMessages([]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop on Mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900 z-40 lg:hidden"
            id="ai-backdrop"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[480px] md:w-[540px] bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800"
            id="ai-drawer"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-800 text-white rounded-tl-xl sm:rounded-none">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-emerald-700/60 rounded-lg text-emerald-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold font-display tracking-tight text-sm">Tanya Ustadz</h3>
                  <p className="text-xs text-emerald-200 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block mr-1.5 animate-pulse"></span>
                    Online (متصل) • Didukung Techo (مدعوم بـ Techo)
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={clearChat}
                  title="Hapus Obrolan"
                  className="p-1.5 hover:bg-emerald-700 rounded text-emerald-200 hover:text-white transition"
                  id="btn-clear-chat"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-emerald-700 rounded text-emerald-100 hover:text-white transition"
                  id="btn-close-ai"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Active Context Banner if any */}
            {activeContext && (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/60 p-3 flex items-start justify-between text-xs">
                <div className="flex items-start space-x-2 text-emerald-800 dark:text-emerald-300">
                  <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <span className="font-semibold">Menanyakan tentang:</span> QS. {activeContext.surahName}: {activeContext.verseNumber}
                    <p className="text-slate-500 dark:text-slate-400 line-clamp-1 italic mt-0.5">
                      "{activeContext.verse.teksIndonesia}"
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClearContext}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  id="btn-clear-context"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/30">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"}`}>
                      {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div className={`p-3.5 rounded-2xl shadow-sm ${msg.role === "user" ? "bg-emerald-700 text-white rounded-tr-none" : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none"}`}>
                      <div className="prose prose-sm dark:prose-invert">
                        {msg.role === "user" ? (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        ) : (
                          renderCustomMarkdown(msg.content)
                        )}
                      </div>
                      <div className={`text-[10px] mt-1 text-right ${msg.role === "user" ? "text-emerald-200" : "text-slate-400 dark:text-slate-500"}`}>
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl rounded-tl-none shadow-sm text-slate-500 flex items-center space-x-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Ustadz sedang menelaah tafsir...</span>
                      <div className="flex space-x-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 p-3 rounded-xl flex items-start space-x-2 text-rose-800 dark:text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Gagal memuat jawaban:</span> {error}
                    <button
                      onClick={() => handleSendMessage(messages[messages.length - 1]?.content)}
                      className="block mt-1 font-semibold text-rose-700 hover:underline dark:text-rose-300"
                      id="btn-retry-ai"
                    >
                      Coba Lagi
                    </button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestion Prompts */}
            {messages.length <= 1 && !isLoading && (
              <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-2 flex items-center">
                  <HelpCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Contoh pertanyaan populer:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleSendMessage("Bagaimana cara menghadapi cobaan berat menurut Al-Qur'an?")}
                    className="text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 px-2.5 py-1.5 rounded-full text-left border border-slate-200/50 dark:border-slate-700 transition"
                  >
                    💡 Cara hadapi cobaan berat
                  </button>
                  <button
                    onClick={() => handleSendMessage("Sebutkan ayat-ayat penenang hati di kala cemas atau sedih.")}
                    className="text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 px-2.5 py-1.5 rounded-full text-left border border-slate-200/50 dark:border-slate-700 transition"
                  >
                    📖 Ayat penenang hati
                  </button>
                  <button
                    onClick={() => handleSendMessage("Tafsir QS. Al-Baqarah ayat 255 (Ayat Kursi)")}
                    className="text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 px-2.5 py-1.5 rounded-full text-left border border-slate-200/50 dark:border-slate-700 transition"
                  >
                    📝 Tafsir Ayat Kursi
                  </button>
                </div>
              </div>
            )}

            {/* Input Form */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 rounded-b-xl sm:rounded-none">
              <div className="relative flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-1.5 border border-slate-200/50 dark:border-slate-700">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ketik pertanyaan atau minta tafsir..."
                  rows={1}
                  className="flex-1 bg-transparent resize-none border-0 focus:ring-0 focus:outline-none text-slate-800 dark:text-slate-100 text-sm max-h-24 pr-10"
                  disabled={isLoading}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !inputValue.trim()}
                  className={`absolute right-2 p-1.5 rounded-lg text-white transition ${isLoading || !inputValue.trim() ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-400" : "bg-emerald-700 hover:bg-emerald-800"}`}
                  id="btn-send-message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-2">
                Asisten memberikan saran edukasi tafsir Al-Qur'an. Rujuklah ke Ulama/Tafsir resmi untuk bimbingan utama.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
