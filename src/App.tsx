import React, { useState, useEffect } from "react";
import { 
  Book, 
  Search, 
  Bookmark, 
  History, 
  Moon, 
  Sun, 
  ChevronRight, 
  ArrowLeft, 
  Sparkles, 
  Copy, 
  Share2, 
  BookmarkCheck, 
  BookmarkPlus, 
  Menu, 
  X, 
  Settings, 
  Type as FontIcon, 
  Check, 
  Maximize2, 
  Clock, 
  AlertCircle,
  HelpCircle,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Mail,
  Send,
  Inbox,
  RefreshCw,
  LogOut,
  FileText,
  CheckCircle,
  ChevronDown,
  User
} from "lucide-react";
import { Surah, SurahDetail, Verse, Bookmark as BookmarkType, LastRead } from "./types";
import AIAssistant from "./components/AIAssistant";
import { motion, AnimatePresence } from "motion/react";
import { 
  googleSignIn, 
  logout, 
  initAuth, 
  listEmails, 
  sendGmailEmail, 
  GmailMessage 
} from "./lib/firebase";
import { User as FirebaseUser } from "firebase/auth";

// Popular Surahs quick access
const POPULAR_SURAHS = [
  { nomor: 18, namaLatin: "Al-Kahfi", arti: "Goa" },
  { nomor: 36, namaLatin: "Yasin", arti: "Ya Sin" },
  { nomor: 55, namaLatin: "Ar-Rahman", arti: "Maha Pemurah" },
  { nomor: 56, namaLatin: "Al-Waqi'ah", arti: "Hari Kiamat" },
  { nomor: 67, namaLatin: "Al-Mulk", arti: "Kerajaan" }
];

// Helper to get elegant, calm, diverse card backgrounds from a unified palette
const getSurahCardBg = (num: number) => {
  const presets = [
    // 0: Soft Mint / Sage Green (calm & serene)
    {
      card: "bg-emerald-50/45 hover:bg-emerald-50/75 border-emerald-100/50 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20 dark:border-emerald-900/30 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 shadow-emerald-950/5",
      num: "bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/30 dark:border-emerald-800/40",
      badge: "bg-emerald-100/60 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400",
      arabic: "text-emerald-800 dark:text-emerald-400"
    },
    // 1: Serene Teal / Calm Water
    {
      card: "bg-teal-50/45 hover:bg-teal-50/75 border-teal-100/50 dark:bg-teal-950/10 dark:hover:bg-teal-950/20 dark:border-teal-900/30 hover:border-teal-500/30 dark:hover:border-teal-500/30 shadow-teal-950/5",
      num: "bg-teal-100/70 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 border border-teal-200/30 dark:border-teal-800/40",
      badge: "bg-teal-100/60 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400",
      arabic: "text-teal-800 dark:text-teal-400"
    },
    // 2: Soft Sand / Rose Gold / Bronze
    {
      card: "bg-amber-50/30 hover:bg-amber-50/65 border-amber-100/40 dark:bg-amber-950/5 dark:hover:bg-amber-950/15 dark:border-amber-950/30 hover:border-amber-500/30 dark:hover:border-amber-500/30 shadow-amber-950/5",
      num: "bg-amber-100/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-350 border border-amber-200/30 dark:border-amber-900/30",
      badge: "bg-amber-100/50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400",
      arabic: "text-amber-800 dark:text-amber-400"
    },
    // 3: Calm Slate / Neutral Linen
    {
      card: "bg-stone-50/55 hover:bg-stone-100/75 border-stone-200/60 dark:bg-slate-900/40 dark:hover:bg-slate-900/65 dark:border-slate-800/60 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 shadow-slate-950/5",
      num: "bg-stone-150/85 dark:bg-slate-800/80 text-stone-700 dark:text-slate-300 border border-stone-250 dark:border-slate-700",
      badge: "bg-stone-150/70 dark:bg-slate-800 text-stone-600 dark:text-slate-400",
      arabic: "text-emerald-850 dark:text-emerald-400"
    },
    // 4: Celestial Blue / Quiet Sky
    {
      card: "bg-sky-50/45 hover:bg-sky-50/75 border-sky-100/50 dark:bg-sky-950/10 dark:hover:bg-sky-950/20 dark:border-sky-900/30 hover:border-sky-500/30 dark:hover:border-sky-500/30 shadow-sky-950/5",
      num: "bg-sky-100/70 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300 border border-sky-200/30 dark:border-sky-800/40",
      badge: "bg-sky-100/60 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400",
      arabic: "text-sky-800 dark:text-sky-400"
    },
    // 5: Gentle Indigo-Lavender / Dusk
    {
      card: "bg-indigo-50/35 hover:bg-indigo-50/65 border-indigo-100/40 dark:bg-indigo-950/5 dark:hover:bg-indigo-950/15 dark:border-indigo-900/20 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 shadow-indigo-950/5",
      num: "bg-indigo-100/50 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200/20 dark:border-indigo-850",
      badge: "bg-indigo-100/50 dark:bg-indigo-950/55 text-indigo-700 dark:text-indigo-400",
      arabic: "text-indigo-800 dark:text-indigo-450"
    }
  ];
  return presets[num % presets.length];
};

export default function App() {
  // Navigation & View States
  const [view, setView] = useState<"home" | "surah" | "bookmark" | "search">("home");
  const [activeSurahNumber, setActiveSurahNumber] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  // Data States
  const [surahList, setSurahList] = useState<Surah[]>([]);
  const [activeSurah, setActiveSurah] = useState<SurahDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingSurah, setLoadingSurah] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [surahError, setSurahError] = useState<string | null>(null);

  // Settings & Customization
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [fontSizeArabic, setFontSizeArabic] = useState<"lg" | "xl" | "2xl" | "3xl">("2xl");
  const [fontSizeTranslation, setFontSizeTranslation] = useState<"sm" | "base" | "lg">("base");
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Personalization States
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>(() => {
    const saved = localStorage.getItem("quran_bookmarks");
    return saved ? JSON.parse(saved) : [];
  });
  const [lastRead, setLastRead] = useState<LastRead | null>(() => {
    const saved = localStorage.getItem("quran_last_read");
    return saved ? JSON.parse(saved) : null;
  });

  // Track click history & reading frequency per Surah
  const [clickHistory, setClickHistory] = useState<Record<number, {
    surahNumber: number;
    surahName: string;
    count: number;
    lastClicked: string;
    jumlahAyat: number;
    tempatTurun: string;
    namaArab: string;
  }>>(() => {
    const saved = localStorage.getItem("quran_click_history");
    if (saved) return JSON.parse(saved);
    
    // Initial default demo data to make the table look gorgeous instantly
    const demo = {
      1: {
        surahNumber: 1,
        surahName: "Al-Fatihah",
        count: 5,
        lastClicked: new Date(Date.now() - 1000 * 60 * 15).toLocaleString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        jumlahAyat: 7,
        tempatTurun: "Mekah",
        namaArab: "الفatحة"
      },
      36: {
        surahNumber: 36,
        surahName: "Yasin",
        count: 12,
        lastClicked: new Date(Date.now() - 1000 * 60 * 60 * 2).toLocaleString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        jumlahAyat: 83,
        tempatTurun: "Mekah",
        namaArab: "يس"
      },
      67: {
        surahNumber: 67,
        surahName: "Al-Mulk",
        count: 3,
        lastClicked: new Date(Date.now() - 1000 * 60 * 60 * 24).toLocaleString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        jumlahAyat: 30,
        tempatTurun: "Mekah",
        namaArab: "الملك"
      }
    };
    localStorage.setItem("quran_click_history", JSON.stringify(demo));
    return demo;
  });

  const [historySortBy, setHistorySortBy] = useState<"recent" | "frequency">("frequency");

  const trackSurahClick = (nomor: number) => {
    setClickHistory((prev) => {
      const surah = surahList.find((s) => s.nomor === nomor) || 
                    POPULAR_SURAHS.find((s) => s.nomor === nomor);
      
      const surahName = surah ? surah.namaLatin : `Surat ke-${nomor}`;
      const jumlahAyat = (surah && "jumlahAyat" in surah) ? (surah as any).jumlahAyat : 0;
      const tempatTurun = (surah && "tempatTurun" in surah) ? (surah as any).tempatTurun : "";
      const namaArab = surah ? surah.nama : "";

      const existing = prev[nomor] || {
        surahNumber: nomor,
        surahName: surahName,
        count: 0,
        jumlahAyat: jumlahAyat,
        tempatTurun: tempatTurun,
        namaArab: namaArab,
      };

      const updated = {
        ...prev,
        [nomor]: {
          ...existing,
          count: existing.count + 1,
          lastClicked: new Date().toLocaleString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      };

      localStorage.setItem("quran_click_history", JSON.stringify(updated));
      return updated;
    });
  };

  // AI Assistant Drawer States
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiContext, setAIContext] = useState<{
    surahNumber: number;
    surahName: string;
    verseNumber: number;
    verse: Verse;
  } | null>(null);

  // Success Notification / Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto Scroll Engine (Lyric Style)
  const [isAutoScrollPlay, setIsAutoScrollPlay] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState<number>(24); // speed in characters per second
  const [activeScrollVerse, setActiveScrollVerse] = useState<number | null>(null);
  const [verseProgress, setVerseProgress] = useState(0);

  // Gmail & Firebase Auth States
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [gmailEmails, setGmailEmails] = useState<GmailMessage[]>([]);
  const [gmailSearchQuery, setGmailSearchQuery] = useState("");
  const [isGmailLoading, setIsGmailLoading] = useState(false);
  const [isGmailDashboardOpen, setIsGmailDashboardOpen] = useState(false);
  
  // Gmail Share Verse Modal
  const [isGmailShareOpen, setIsGmailShareOpen] = useState(false);
  const [shareVerseTarget, setShareVerseTarget] = useState<{ verse: Verse; surahName: string; surahNumber: number } | null>(null);
  
  // Gmail Share History Modal
  const [isGmailShareHistoryOpen, setIsGmailShareHistoryOpen] = useState(false);

  // Compose Email States
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Load Gmail Inbox
  const loadGmailInbox = async (token: string, query?: string) => {
    setIsGmailLoading(true);
    try {
      const list = await listEmails(token, query);
      setGmailEmails(list);
    } catch (err) {
      console.error("Error loading Gmail messages:", err);
      triggerToast("Gagal memuat pesan Gmail.");
    } finally {
      setIsGmailLoading(false);
    }
  };

  // Google Sign In handler
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        triggerToast(`Ahlan wa sahlan, ${res.user.displayName}! Gmail terhubung.`);
        loadGmailInbox(res.accessToken);
      }
    } catch (err) {
      console.error("Google login failed:", err);
      triggerToast("Gagal menghubungkan akun Google.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout handler
  const handleGoogleLogout = async () => {
    if (confirm("Apakah Sahabat ingin memutuskan hubungan akun Google & Gmail?")) {
      try {
        await logout();
        setUser(null);
        setAccessToken(null);
        setGmailEmails([]);
        setIsGmailDashboardOpen(false);
        setIsGmailShareOpen(false);
        setIsGmailShareHistoryOpen(false);
        setShowUserDropdown(false);
        triggerToast("Akun Google berhasil diputuskan.");
      } catch (err) {
        console.error("Logout error:", err);
      }
    }
  };

  // Open Gmail share modal for a verse
  const handleOpenGmailShare = (verse: Verse) => {
    if (!activeSurah) return;
    
    setShareVerseTarget({
      verse,
      surahName: activeSurah.namaLatin,
      surahNumber: activeSurah.nomor,
    });

    setEmailSubject(`Kutipan Al-Qur'an: QS. ${activeSurah.namaLatin} [${activeSurah.nomor}:${verse.nomorAyat}]`);
    setEmailBody(`
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="background-color: #ecfdf5; color: #047857; font-size: 11px; font-weight: bold; padding: 6px 14px; border-radius: 9999px; text-transform: uppercase;">Tadarus Al-Qur'an Digital</span>
          <h2 style="color: #065f46; font-family: Georgia, serif; margin-top: 12px; margin-bottom: 4px; font-size: 22px;">QS. ${activeSurah.namaLatin} Ayat ${verse.nomorAyat}</h2>
          <p style="color: #6b7280; font-size: 12px; margin: 0;">Arti Surat: ${activeSurah.arti}</p>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;"/>
        
        <div style="direction: rtl; font-size: 28px; line-height: 2.0; text-align: right; font-family: 'Amiri', 'Traditional Arabic', Georgia, serif; margin-bottom: 20px; color: #0f172a; padding: 15px 0;">
          ${verse.teksArab}
        </div>
        
        <div style="font-style: italic; color: #4b5563; font-size: 14px; margin-bottom: 12px; line-height: 1.6; padding: 12px; border-left: 3px solid #10b981; background-color: #f9fafb;">
          <strong>Transliterasi:</strong><br/>
          ${verse.teksLatin}
        </div>
        
        <div style="color: #1f2937; font-size: 14px; line-height: 1.6; margin-bottom: 25px; background-color: #f0fdf4; padding: 12px; border-radius: 8px;">
          <strong>Terjemahan Bahasa Indonesia:</strong><br/>
          "${verse.teksIndonesia}"
        </div>
        
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;"/>
        
        <div style="text-align: center; font-size: 11px; color: #9ca3af; line-height: 1.5;">
          Semoga ayat ini membawa keberkahan dan ketenangan hati bagi kita semua. Amin.<br/>
          <span style="font-size: 10px; color: #d1d5db; margin-top: 8px; display: block;">Dikirim melalui integrasi resmi Al-Qur'an Digital & Gmail API</span>
        </div>
      </div>
    `);

    // Default recipient is empty to let user input
    setEmailTo("");
    setIsGmailShareOpen(true);
  };

  // Open Gmail share modal for tadarus progress history
  const handleOpenGmailShareHistory = () => {
    setEmailSubject("Laporan Riwayat Tadarus Al-Qur'an Digital Saya");
    
    const sortedHistory = (Object.values(clickHistory) as Array<{
      surahNumber: number;
      surahName: string;
      count: number;
      lastClicked: string;
      jumlahAyat: number;
      tempatTurun: string;
      namaArab: string;
    }>).sort((a, b) => b.count - a.count);

    let tableRows = "";
    sortedHistory.forEach((item, index) => {
      tableRows += `
        <tr style="border-b: 1px solid #f1f5f9;">
          <td style="padding: 12px 8px; font-weight: bold; color: #1e293b;">${index + 1}. QS. ${item.surahName} (${item.namaArab || ""})</td>
          <td style="padding: 12px 8px; text-align: center; font-weight: bold; color: #047857; background-color: #ecfdf5; border-radius: 6px;">${item.count} kali</td>
          <td style="padding: 12px 8px; color: #475569; font-size: 12px; font-family: monospace;">${item.lastClicked}</td>
        </tr>
      `;
    });

    setEmailBody(`
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <div style="text-align: center; margin-bottom: 25px;">
          <span style="background-color: #ecfdf5; color: #047857; font-size: 11px; font-weight: bold; padding: 6px 14px; border-radius: 9999px; text-transform: uppercase;">Laporan Istiqomah Tadarus</span>
          <h2 style="color: #065f46; font-family: Georgia, serif; margin-top: 12px; margin-bottom: 4px; font-size: 22px;">Riwayat Tadarus Al-Qur'an Digital</h2>
          <p style="color: #6b7280; font-size: 12px; margin: 0;">Dicatat secara berkala untuk memantau konsistensi ibadah</p>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;"/>
        
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; margin-bottom: 25px;">
          <thead>
            <tr style="border-b: 2px solid #e2e8f0; color: #475569; font-weight: bold; text-transform: uppercase; font-size: 11px;">
              <th style="padding: 8px;">Surat Al-Qur'an</th>
              <th style="padding: 8px; text-align: center;">Frekuensi Dibaca</th>
              <th style="padding: 8px;">Tadarus Terakhir</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || `<tr><td colspan="3" style="text-align: center; padding: 20px; color: #94a3b8; font-style: italic;">Belum ada riwayat tadarus tercatat.</td></tr>`}
          </tbody>
        </table>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 15px; margin-bottom: 25px;">
          <h4 style="color: #166534; margin: 0 0 5px 0; font-size: 14px;">🌟 Motivasi Tadarus Hari Ini</h4>
          <p style="color: #14532d; font-size: 12px; margin: 0; line-height: 1.5;">
            "Sebaik-baik kalian adalah orang yang belajar Al-Qur'an dan mengajarkannya." (HR. Bukhari)
          </p>
        </div>

        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;"/>
        
        <div style="text-align: center; font-size: 11px; color: #9ca3af; line-height: 1.5;">
          Semoga Allah melipatgandakan pahala tadarus kita dan menjadikannya syafaat kelak. Amin.<br/>
          <span style="font-size: 10px; color: #d1d5db; margin-top: 8px; display: block;">Dikirim melalui integrasi resmi Al-Qur'an Digital & Gmail API</span>
        </div>
      </div>
    `);

    setEmailTo("");
    setIsGmailShareHistoryOpen(true);
  };

  // Action function to send email via Gmail
  const handleSendGmailMessage = async () => {
    if (!accessToken) {
      triggerToast("Mohon hubungkan akun Google Sahabat terlebih dahulu.");
      return;
    }
    if (!emailTo) {
      triggerToast("Silakan masukkan email penerima.");
      return;
    }

    setIsSendingEmail(true);
    try {
      const success = await sendGmailEmail(accessToken, emailTo, emailSubject, emailBody);
      if (success) {
        triggerToast("Alhamdulillah! Email berhasil dikirim.");
        setIsGmailShareOpen(false);
        setIsGmailShareHistoryOpen(false);
      } else {
        triggerToast("Gagal mengirim email. Silakan coba lagi.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Terjadi kesalahan saat mengirim email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Initialize Auth State on load
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        loadGmailInbox(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Monitor auto scroll and advance verses
  useEffect(() => {
    if (!isAutoScrollPlay || !activeSurah || activeScrollVerse === null) return;

    const currentVerse = activeSurah.ayat.find(v => v.nomorAyat === activeScrollVerse);
    if (!currentVerse) return;

    // Calculate duration based on characters of Arabic, translation, and optional transliteration
    const charLength = currentVerse.teksArab.length + 
                       (showTransliteration ? currentVerse.teksLatin.length : 0) + 
                       currentVerse.teksIndonesia.length;

    // Base seconds calculated dynamically: longer verse = more time, speed factor adjusts this
    // Clamp between 5s minimum and 85s maximum so short/long verses are readable
    const totalSeconds = Math.max(5, Math.min(85, Math.ceil(charLength / autoScrollSpeed)));

    let elapsedMs = 0;
    const intervalMs = 100; // updates progress 10 times a second for beautiful fluid UI
    const totalMs = totalSeconds * 1000;

    // Scroll active verse into view smoothly centering it
    const element = document.getElementById(`verse-container-${activeScrollVerse}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    const timer = setInterval(() => {
      elapsedMs += intervalMs;
      const pct = Math.min(100, (elapsedMs / totalMs) * 100);
      setVerseProgress(pct);

      if (elapsedMs >= totalMs) {
        clearInterval(timer);
        // Find next verse index
        const currentIndex = activeSurah.ayat.findIndex(v => v.nomorAyat === activeScrollVerse);
        if (currentIndex < activeSurah.ayat.length - 1) {
          const nextVerse = activeSurah.ayat[currentIndex + 1].nomorAyat;
          setActiveScrollVerse(nextVerse);
          setVerseProgress(0);
        } else {
          // Finished entire Surah
          setIsAutoScrollPlay(false);
          setActiveScrollVerse(null);
          setVerseProgress(0);
          triggerToast("Alhamdulillah, khatam membaca surat ini.");
        }
      }
    }, intervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [isAutoScrollPlay, activeScrollVerse, autoScrollSpeed, activeSurah, showTransliteration]);

  // Fetch all surahs on load
  useEffect(() => {
    fetchSurahList();
  }, []);

  // Set dark mode HTML class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // Persist bookmarks
  useEffect(() => {
    localStorage.setItem("quran_bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Show Toast Helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleSearchChange = (query: string) => {
    setSearchFilter(query);
    if (query && view !== "home") {
      setView("home");
    }
  };

  const fetchSurahList = async () => {
    setLoadingList(true);
    setListError(null);
    try {
      // Check local storage cache first
      const cached = localStorage.getItem("quran_surah_list_cache");
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // If cache is less than 3 days old, use it
        if (Date.now() - timestamp < 1000 * 60 * 60 * 24 * 3) {
          setSurahList(data);
          setLoadingList(false);
          return;
        }
      }

      const response = await fetch("/api/quran/surat");
      const resData = await response.json();
      if (resData.success && Array.isArray(resData.data)) {
        setSurahList(resData.data);
        // Save to cache
        localStorage.setItem("quran_surah_list_cache", JSON.stringify({
          data: resData.data,
          timestamp: Date.now()
        }));
      } else {
        throw new Error(resData.error || "Gagal memproses daftar surat");
      }
    } catch (err: any) {
      console.error(err);
      setListError("Koneksi gagal atau server bermasalah. Silakan coba kembali beberapa saat lagi.");
    } finally {
      setLoadingList(false);
    }
  };

  const fetchSurahDetail = async (nomor: number, scrollTargetVerse?: number) => {
    setLoadingSurah(true);
    setSurahError(null);
    try {
      // Check local storage cache first
      const cacheKey = `quran_surah_cache_${nomor}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Use if less than 3 days old
        if (Date.now() - timestamp < 1000 * 60 * 60 * 24 * 3) {
          setActiveSurah(data);
          setLoadingSurah(false);
          // Set last read surah metadata
          updateLastRead(data.nomor, data.namaLatin, scrollTargetVerse);
          if (scrollTargetVerse) {
            setTimeout(() => scrollToVerse(scrollTargetVerse), 150);
          }
          return;
        }
      }

      const response = await fetch(`/api/quran/surat/${nomor}`);
      const resData = await response.json();
      if (resData.success && resData.data) {
        setActiveSurah(resData.data);
        updateLastRead(resData.data.nomor, resData.data.namaLatin, scrollTargetVerse);
        // Save to cache
        localStorage.setItem(cacheKey, JSON.stringify({
          data: resData.data,
          timestamp: Date.now()
        }));

        if (scrollTargetVerse) {
          setTimeout(() => scrollToVerse(scrollTargetVerse), 250);
        }
      } else {
        throw new Error(resData.error || `Gagal mengambil surat ke-${nomor}`);
      }
    } catch (err: any) {
      console.error(err);
      setSurahError(`Gagal memuat Surat. Periksa jaringan Anda dan tekan tombol muat ulang.`);
    } finally {
      setLoadingSurah(false);
    }
  };

  const updateLastRead = (surahNum: number, surahName: string, verseNum?: number) => {
    const info: LastRead = {
      surahNumber: surahNum,
      surahName: surahName,
      verseNumber: verseNum,
      updatedAt: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
    };
    setLastRead(info);
    localStorage.setItem("quran_last_read", JSON.stringify(info));
  };

  const scrollToVerse = (verseNum: number) => {
    const el = document.getElementById(`verse-container-${verseNum}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Add brief highlight effect
      el.classList.add("bg-emerald-55/60", "dark:bg-emerald-950/40");
      setTimeout(() => {
        el.classList.remove("bg-emerald-55/60", "dark:bg-emerald-950/40");
      }, 2000);
    }
  };

  // Bookmark functions
  const handleToggleBookmark = (verseNum: number) => {
    if (!activeSurah) return;

    const isExist = bookmarks.some(
      (b) => b.surahNumber === activeSurah.nomor && b.verseNumber === verseNum
    );

    if (isExist) {
      setBookmarks((prev) =>
        prev.filter((b) => !(b.surahNumber === activeSurah.nomor && b.verseNumber === verseNum))
      );
      triggerToast("Ayat dihapus dari bookmark.");
    } else {
      const newB: BookmarkType = {
        surahNumber: activeSurah.nomor,
        surahName: activeSurah.namaLatin,
        verseNumber: verseNum,
        addedAt: new Date().toLocaleDateString("id-ID")
      };
      setBookmarks((prev) => [newB, ...prev]);
      triggerToast("Ayat berhasil disimpan ke bookmark!");
    }
  };

  const isVerseBookmarked = (verseNum: number) => {
    if (!activeSurah) return false;
    return bookmarks.some((b) => b.surahNumber === activeSurah.nomor && b.verseNumber === verseNum);
  };

  // Copy Verse Function
  const handleCopyVerse = (verse: Verse) => {
    if (!activeSurah) return;
    const shareText = `QS. ${activeSurah.namaLatin} [${activeSurah.nomor}]: ${verse.nomorAyat}\n\n${verse.teksArab}\n\n${showTransliteration ? `(${verse.teksLatin})\n\n` : ""}"${verse.teksIndonesia}"\n\n--- Dibagikan dari Al-Qur'an Digital & Tafsir Lengkap`;
    
    navigator.clipboard.writeText(shareText);
    triggerToast("Teks ayat dan terjemahan disalin!");
  };

  // Share via system if available, else copy link
  const handleShareVerse = async (verse: Verse) => {
    if (!activeSurah) return;
    const shareText = `QS. ${activeSurah.namaLatin} [${activeSurah.nomor}]: ${verse.nomorAyat} - ${verse.teksIndonesia}`;
    const shareUrl = `${window.location.origin}/surah/${activeSurah.nomor}/${verse.nomorAyat}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `QS. ${activeSurah.namaLatin} [${activeSurah.nomor}]: ${verse.nomorAyat}`,
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(`${shareText}\n\nBaca lengkap: ${shareUrl}`);
      triggerToast("Tautan ayat disalin ke papan klip!");
    }
  };

  // Trigger Ustadz AI on specific verse
  const handleAskAI = (verse: Verse) => {
    if (!activeSurah) return;
    setAIContext({
      surahNumber: activeSurah.nomor,
      surahName: activeSurah.namaLatin,
      verseNumber: verse.nomorAyat,
      verse: verse
    });
    setIsAIOpen(true);
  };

  // View Surah Detail
  const handleSelectSurah = (nomor: number, targetVerse?: number) => {
    setActiveSurahNumber(nomor);
    fetchSurahDetail(nomor, targetVerse);
    setView("surah");
    window.scrollTo({ top: 0, behavior: "smooth" });
    trackSurahClick(nomor);
    
    // Reset Auto Scroll states for the new Surah
    setActiveScrollVerse(targetVerse || 1);
    setVerseProgress(0);
    setIsAutoScrollPlay(false);
  };

  // Filtering for homepage list
  const filteredSurahs = surahList.filter((s) => {
    const q = searchFilter.toLowerCase();
    return (
      s.namaLatin.toLowerCase().includes(q) ||
      s.arti.toLowerCase().includes(q) ||
      s.nomor.toString() === q
    );
  });

  return (
    <div className="min-h-screen pb-28 bg-gradient-to-tr from-slate-100 via-emerald-50/10 to-slate-100 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/30 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* Dynamic Notification Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-slate-900/90 dark:bg-slate-800/95 text-white text-xs py-2.5 px-5 rounded-full shadow-lg z-50 flex items-center space-x-2"
            id="toast-notification"
          >
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header NavBar */}
      <header className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 z-30 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo / Brand */}
          <button
            onClick={() => {
              setView("home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center space-x-2.5 hover:opacity-90 group text-left shrink-0"
            id="btn-brand-logo"
          >
            <div className="w-9 h-9 bg-emerald-700 dark:bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md transform group-hover:scale-105 transition-all">
              <Book className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-display tracking-tight text-slate-900 dark:text-white leading-tight">Al-Qur'an Digital</h1>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">القرآن الكريم • Lengkap & Terjemahan</p>
            </div>
          </button>

          {/* Search bar in header */}
          <div className="relative flex-1 max-w-sm mx-6 hidden md:block">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari surat (contoh: Yasin)..."
              className="w-full bg-slate-100 dark:bg-slate-800/60 border border-transparent dark:border-slate-800 rounded-full py-1.5 pl-10 pr-8 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30 dark:focus:ring-emerald-500/20 dark:focus:bg-slate-850 transition-all text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
              id="header-search-input"
            />
            {searchFilter && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-250"
                id="btn-header-clear-search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Nav Controls */}
          <div className="flex items-center space-x-2">
            {/* Ask AI Trigger */}
            <button
              onClick={() => setIsAIOpen(true)}
              className="p-2 text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border border-emerald-100/50 dark:border-emerald-900/50"
              title="Tanya Ustadz"
              id="btn-nav-ai"
            >
              <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span className="hidden sm:inline">Tanya Ustadz</span>
            </button>

            {/* Bookmark list page */}
            <button
              onClick={() => setView("bookmark")}
              className={`p-2 rounded-xl border transition ${view === "bookmark" ? "bg-slate-100 border-slate-200 text-emerald-700 dark:bg-slate-800 dark:border-slate-700 dark:text-emerald-400" : "text-slate-500 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
              title="Bookmark Saya"
              id="btn-nav-bookmarks"
            >
              <Bookmark className="w-5 h-5" />
            </button>

            {/* Quick Settings Trigger */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl border border-transparent transition"
              title="Pengaturan Tampilan"
              id="btn-nav-settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Dark Mode toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl border border-transparent transition"
              title={isDarkMode ? "Mode Terang" : "Mode Gelap"}
              id="btn-nav-dark-mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Google / Gmail Integration Button/Dropdown */}
            <div className="relative">
              {user ? (
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center space-x-1.5 p-1.5 pr-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-100 dark:border-slate-750 transition text-xs font-semibold"
                    id="btn-user-profile-menu"
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || "User"}
                        className="w-6 h-6 rounded-lg object-cover shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-[10px] uppercase font-bold shrink-0">
                        {user.displayName?.charAt(0) || "U"}
                      </div>
                    )}
                    <span className="hidden md:inline max-w-[90px] truncate">
                      {user.displayName?.split(" ")[0]}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showUserDropdown ? "rotate-180" : ""}`} />
                  </button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {showUserDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowUserDropdown(false)} 
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 text-xs"
                        >
                          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                            <p className="font-bold text-slate-850 dark:text-white truncate">
                              {user.displayName}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                              {user.email}
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              setIsGmailDashboardOpen(true);
                              setShowUserDropdown(false);
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-slate-600 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition text-left"
                            id="btn-open-gmail-dash"
                          >
                            <Inbox className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span className="font-medium">Kotak Masuk Gmail</span>
                          </button>

                          <button
                            onClick={handleGoogleLogout}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition text-left"
                            id="btn-google-logout"
                          >
                            <LogOut className="w-4 h-4 shrink-0" />
                            <span className="font-medium">Putuskan Hubungan</span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="p-2 text-slate-600 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-100 dark:border-slate-750 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
                  title="Hubungkan dengan Gmail"
                  id="btn-connect-gmail"
                >
                  {isLoggingIn ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                  ) : (
                    <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                  )}
                  <span className="hidden sm:inline">Hubungkan Gmail</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 mt-6">
        
        {/* VIEW 1: HOMEPAGE */}
        {view === "home" && (
          <div className="space-y-8">
            
            {/* Bento Grid Main Content */}
            <div className="grid grid-cols-12 gap-4">
              
              {/* Card 1: Last Read (Hero Card) */}
              <div className="col-span-12 lg:col-span-8 bg-slate-950 border border-emerald-500/20 rounded-3xl p-6 md:p-8 flex flex-col justify-between relative overflow-hidden shadow-xl shadow-emerald-950/10 group min-h-[300px]">
                <img 
                  src="/src/assets/images/kaaba_sky_bg_1782881121738.jpg" 
                  alt="Ka'bah Suci" 
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-90 group-hover:scale-[1.03] transition-all duration-700 pointer-events-none"
                />
                {/* Elegant gradient overlay for premium depth and text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-emerald-950/20 pointer-events-none"></div>
                <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="z-10">
                  <span className="bg-emerald-500/20 text-emerald-400 dark:text-emerald-300 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-500/30">
                    Terakhir Dibaca
                  </span>
                  {lastRead ? (
                    <>
                      <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mt-4 mb-2 tracking-tight">
                        {lastRead.surahName}
                      </h2>
                      <p className="text-slate-300 text-sm md:text-base italic">
                        Surat ke-{lastRead.surahNumber} • {lastRead.verseNumber ? `Ayat ${lastRead.verseNumber}` : "Seluruh Surat"}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-2">Dibuka pada: {lastRead.updatedAt}</p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mt-4 mb-2 tracking-tight">
                        Al-Fatihah
                      </h2>
                      <p className="text-slate-300 text-sm md:text-base italic">
                        Surat ke-1 • Pembukaan
                      </p>
                      <p className="text-[10px] text-slate-500 mt-2">Mulai tadarus pertama Sahabat hari ini</p>
                    </>
                  )}
                </div>
                <div className="z-10 flex flex-wrap gap-3 mt-6">
                  <button
                    onClick={() => handleSelectSurah(lastRead ? lastRead.surahNumber : 1, lastRead?.verseNumber)}
                    className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-400 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
                  >
                    <span>Lanjutkan Membaca</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleSelectSurah(lastRead ? lastRead.surahNumber : 1)}
                    className="bg-white/5 border border-white/10 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-white/10 transition-all cursor-pointer"
                  >
                    Detail Surat
                  </button>
                </div>
              </div>

              {/* Card 2: Quick Access Card */}
              <div className="col-span-12 lg:col-span-4 bg-slate-100/40 dark:bg-slate-800/20 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Akses Cepat</h3>
                  <div className="space-y-3">
                    {[36, 67, 56].map((num) => {
                      const preset = getSurahCardBg(num);
                      const surahData = num === 36 ? { name: "Ya-Sin", verses: "83 Ayat", arabic: "يس" } :
                                        num === 67 ? { name: "Al-Mulk", verses: "30 Ayat", arabic: "الملك" } :
                                                     { name: "Al-Waqi'ah", verses: "96 Ayat", arabic: "الواقعة" };
                      return (
                        <div
                          key={num}
                          onClick={() => handleSelectSurah(num)}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border hover:-translate-y-0.5 transition-all cursor-pointer group ${preset.card}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${preset.num}`}>
                              {num}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 dark:text-white text-sm">{surahData.name}</div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500">{surahData.verses}</div>
                            </div>
                          </div>
                          <div className={`text-xl font-serif font-bold opacity-80 group-hover:opacity-100 transition-opacity ${preset.arabic}`}>
                            {surahData.arabic}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Card 4: Detailed Click & Reading History Table */}
              <div className="col-span-12 lg:col-span-8 bg-slate-100/30 dark:bg-slate-900/15 border border-slate-200/40 dark:border-slate-800/70 rounded-3xl p-6 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <History className="w-4 h-4 text-emerald-500" />
                        Riwayat & Frekuensi Tadarus
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                        Menelisik surat yang sering dibaca & mengoptimalkan riwayat klik tadarus Sahabat
                      </p>
                    </div>

                    {/* Controls & Reset */}
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <div className="flex bg-slate-200/70 dark:bg-slate-800/70 p-0.5 rounded-lg text-[11px]">
                        <button
                          onClick={() => setHistorySortBy("frequency")}
                          className={`px-2.5 py-1 rounded-md transition ${historySortBy === "frequency" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
                        >
                          Paling Sering
                        </button>
                        <button
                          onClick={() => setHistorySortBy("recent")}
                          className={`px-2.5 py-1 rounded-md transition ${historySortBy === "recent" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
                        >
                          Terbaru
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          if (!user) {
                            handleGoogleLogin().then(() => {
                              handleOpenGmailShareHistory();
                            });
                          } else {
                            handleOpenGmailShareHistory();
                          }
                        }}
                        className="p-1.5 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors flex items-center gap-1 text-[11px] font-bold"
                        title="Kirim Laporan via Gmail"
                        id="btn-gmail-history-report"
                      >
                        <Mail className="w-4 h-4" />
                        <span className="hidden sm:inline">Kirim Laporan</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm("Apakah Sahabat ingin menghapus semua riwayat tadarus?")) {
                            setClickHistory({});
                            localStorage.removeItem("quran_click_history");
                            triggerToast("Riwayat tadarus berhasil dibersihkan.");
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-450 transition-colors"
                        title="Reset Riwayat"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Table Display */}
                  <div className="overflow-x-auto -mx-6 sm:mx-0">
                    <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                      <thead>
                        <tr className="border-b border-slate-200/50 dark:border-slate-800/60 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                          <th className="pb-2.5 px-3">Surat</th>
                          <th className="pb-2.5 px-3 text-center">Dibaca</th>
                          <th className="pb-2.5 px-3">Terakhir Diklik</th>
                          <th className="pb-2.5 px-3 text-center">Optimasi Riwayat</th>
                          <th className="pb-2.5 px-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/50 dark:divide-slate-850/30">
                        {Object.keys(clickHistory).length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                              Belum ada riwayat klik surat. Silakan klik surat di daftar di bawah untuk mulai mencatat.
                            </td>
                          </tr>
                        ) : (
                          (Object.values(clickHistory) as Array<{
                            surahNumber: number;
                            surahName: string;
                            count: number;
                            lastClicked: string;
                            jumlahAyat: number;
                            tempatTurun: string;
                            namaArab: string;
                          }>)
                            .sort((a, b) => {
                              if (historySortBy === "recent") {
                                return b.lastClicked.localeCompare(a.lastClicked);
                              }
                              return b.count - a.count;
                            })
                            .slice(0, 5) // Show top 5 for neatness
                            .map((item) => {
                              // Dynamic status calculation
                              let badgeColor = "bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-400";
                              let statusText = "Baru";
                              if (item.count >= 10) {
                                badgeColor = "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/20";
                                statusText = "Sangat Istiqomah";
                              } else if (item.count >= 5) {
                                badgeColor = "bg-teal-500/15 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300 border border-teal-500/20";
                                statusText = "Sering Diulang";
                              } else if (item.count >= 2) {
                                badgeColor = "bg-indigo-500/15 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-500/10";
                                statusText = "Perlu Istiqomah";
                              }

                              return (
                                <tr 
                                  key={item.surahNumber}
                                  className="group hover:bg-slate-100/30 dark:hover:bg-slate-800/10 transition-colors"
                                >
                                  {/* Surat Name with Number and Arabic info */}
                                  <td className="py-3 px-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-md bg-slate-200/50 dark:bg-slate-800/75 text-slate-700 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center font-display">
                                        {item.surahNumber}
                                      </div>
                                      <div>
                                        <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                          {item.surahName}
                                          {item.namaArab && (
                                            <span className="arabic-text text-emerald-600 dark:text-emerald-400 text-xs font-semibold select-none">
                                              {item.namaArab}
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                          {item.jumlahAyat} Ayat • {item.tempatTurun}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Clicks count */}
                                  <td className="py-3 px-3 text-center">
                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded-full">
                                      {item.count}x
                                    </span>
                                  </td>

                                  {/* Last clicked timestamp */}
                                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                                    {item.lastClicked}
                                  </td>

                                  {/* Optimization level badge */}
                                  <td className="py-3 px-3 text-center">
                                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium inline-block ${badgeColor}`}>
                                      {statusText}
                                    </span>
                                  </td>

                                  {/* Quick read action button */}
                                  <td className="py-3 px-3 text-right">
                                    <button
                                      onClick={() => handleSelectSurah(item.surahNumber)}
                                      className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-0.5"
                                    >
                                      Baca
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Personalized recommendation text */}
                <div className="mt-4 pt-3 border-t border-slate-200/40 dark:border-slate-800/60 flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 italic">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                  <span>
                    {Object.keys(clickHistory).length > 0 ? (
                      `Rekomendasi Tadarus: Surat ${(Object.values(clickHistory) as Array<{ surahName: string; count: number }>).sort((a,b) => b.count - a.count)[0]?.surahName} paling sering dibaca. Cobalah melengkapi tadarus surat lainnya untuk menyempurnakan khatam.`
                    ) : (
                      "Silakan mulai membaca Al-Qur'an untuk melihat analisis konsistensi tadarus Sahabat."
                    )}
                  </span>
                </div>
              </div>

              {/* Card 5: Bookmark & Share Card */}
              <div className="col-span-12 lg:col-span-4 bg-slate-100/30 dark:bg-slate-900/15 border border-slate-200/40 dark:border-slate-800/70 rounded-3xl p-6 flex flex-col justify-between shadow-sm">
                <div>
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Bookmark Terbaru</h3>
                  <div className="space-y-3 min-h-[120px]">
                    {bookmarks.length === 0 ? (
                      <div className="text-xs text-slate-400 dark:text-slate-500 italic py-3">
                        Belum ada ayat yang dibookmark. Klik ikon bendera di samping ayat untuk menyimpannya di sini.
                      </div>
                    ) : (
                      bookmarks.slice(0, 3).map((b, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => handleSelectSurah(b.surahNumber, b.verseNumber)} 
                          className="flex items-center gap-2.5 p-1.5 hover:bg-white dark:hover:bg-slate-800/40 rounded-xl cursor-pointer group transition-all"
                        >
                          <div className="w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-125 transition"></div>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">QS. {b.surahName} • Ayat {b.verseNumber}</span>
                          <span className="text-[9px] ml-auto text-slate-400 dark:text-slate-500 uppercase">{b.addedAt}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setView("bookmark")}
                  className="mt-4 w-full py-2.5 rounded-xl border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/10 transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Lihat Semua Bookmark</span>
                </button>
              </div>

            </div>

            {/* List of 114 Surahs */}
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 mt-8">
                <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center space-x-2.5">
                  <span className="w-1.5 h-6 bg-emerald-600 dark:bg-emerald-500 rounded-full"></span>
                  <span>Daftar Surat Al-Qur'an</span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 py-0.5 px-2.5 rounded-full font-mono font-bold">114 Surah</span>
                </h3>

                {/* Instant search input */}
                <div className="flex items-center bg-white dark:bg-slate-900 rounded-full py-1.5 px-3.5 shadow-sm border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-emerald-500/30 transition-all max-w-md w-full">
                  <div className="text-slate-400 shrink-0">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Cari nama surat (contoh: 'Yasin', 'Al-Kahfi')..."
                    className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none text-slate-800 dark:text-slate-100 text-xs py-1 px-2.5 placeholder-slate-400 dark:placeholder-slate-500"
                    id="search-filter-input"
                  />
                  {searchFilter && (
                    <button
                      onClick={() => handleSearchChange("")}
                      className="p-1 hover:bg-slate-150 dark:hover:bg-slate-800 rounded-full text-slate-400"
                      id="btn-clear-search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Loader List */}
              {loadingList && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="border border-slate-100 dark:border-slate-850 p-4 rounded-2xl flex items-center justify-between space-x-3 bg-white dark:bg-slate-900 animate-pulse">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
                        <div className="space-y-2">
                          <div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded" />
                          <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
                        </div>
                      </div>
                      <div className="h-5 w-12 bg-slate-100 dark:bg-slate-800 rounded" />
                    </div>
                  ))}
                </div>
              )}

              {/* Error Loading Surah List */}
              {listError && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 p-6 rounded-2xl text-center">
                  <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-rose-800 dark:text-rose-400">{listError}</p>
                  <button
                    onClick={fetchSurahList}
                    className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition"
                    id="btn-retry-list"
                  >
                    Muat Ulang
                  </button>
                </div>
              )}

              {/* Empty Search State */}
              {!loadingList && !listError && filteredSurahs.length === 0 && (
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-8 rounded-2xl text-center max-w-md mx-auto">
                  <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Surat Tidak Ditemukan</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Maaf, tidak ada surat yang sesuai dengan kata pencarian "{searchFilter}". Pastikan ejaan atau nomor sudah benar.
                  </p>
                  <button
                    onClick={() => setSearchFilter("")}
                    className="mt-3 text-xs text-emerald-700 hover:underline dark:text-emerald-400 font-semibold"
                    id="btn-reset-search"
                  >
                    Setel Ulang Pencarian
                  </button>
                </div>
              )}

              {/* Render Surah Grid */}
              {!loadingList && !listError && filteredSurahs.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSurahs.map((s) => {
                    const preset = getSurahCardBg(s.nomor);
                    return (
                      <button
                        key={s.nomor}
                        onClick={() => handleSelectSurah(s.nomor)}
                        className={`text-left border p-4 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition duration-300 flex items-center justify-between ${preset.card}`}
                        id={`surah-card-${s.nomor}`}
                      >
                        <div className="flex items-center space-x-3.5 min-w-0">
                          {/* Number design as octahedron star */}
                          <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm font-display ${preset.num}`}>
                            {s.nomor}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm text-slate-950 dark:text-white truncate font-display">
                              {s.namaLatin}
                            </h4>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                              {s.arti} • {s.jumlahAyat} Ayat
                            </p>
                          </div>
                        </div>

                        {/* Arabic Writing block */}
                        <div className="text-right">
                          <span className={`arabic-text text-lg font-bold block ${preset.arabic}`}>
                            {s.nama}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider ${preset.badge}`}>
                            {s.tempatTurun}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* VIEW 2: SURAH DETAIL PAGE */}
        {view === "surah" && (
          <div className="space-y-6">
            
            {/* Navigation back and header banner */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <button
                onClick={() => {
                  setView("home");
                  setActiveSurah(null);
                }}
                className="flex items-center space-x-1.5 text-xs text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400 py-1.5 px-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 transition w-fit"
                id="btn-back-home"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Daftar Surat</span>
              </button>

              {/* Prev / Next Surah selectors if detail loaded */}
              {activeSurah && (
                <div className="flex items-center space-x-2">
                  {activeSurah.suratSebelumnya && (
                    <button
                      onClick={() => handleSelectSurah(activeSurah.suratSebelumnya ? activeSurah.suratSebelumnya.nomor : 1)}
                      className="text-[11px] bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-slate-600 dark:text-slate-300 py-1.5 px-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-700 transition"
                      id="btn-prev-surah"
                    >
                      ← QS. {activeSurah.suratSebelumnya.namaLatin}
                    </button>
                  )}
                  {activeSurah.suratSelanjutnya && (
                    <button
                      onClick={() => handleSelectSurah(activeSurah.suratSelanjutnya ? activeSurah.suratSelanjutnya.nomor : 1)}
                      className="text-[11px] bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-slate-600 dark:text-slate-300 py-1.5 px-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-700 transition"
                      id="btn-next-surah"
                    >
                      QS. {activeSurah.suratSelanjutnya.namaLatin} →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Loading detailed surah banner */}
            {loadingSurah && (
              <div className="space-y-6">
                <div className="h-44 w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl animate-pulse flex flex-col justify-center items-center">
                  <div className="h-6 w-48 bg-slate-100 dark:bg-slate-800 rounded mb-2" />
                  <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>

                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-5 rounded-2xl animate-pulse space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800" />
                        <div className="w-32 h-4 bg-slate-100 dark:bg-slate-800 rounded" />
                      </div>
                      <div className="h-10 w-full bg-slate-100 dark:bg-slate-800 rounded" />
                      <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error loading surah detail */}
            {surahError && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 p-6 rounded-2xl text-center max-w-lg mx-auto">
                <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-rose-800 dark:text-rose-400">{surahError}</p>
                <button
                  onClick={() => activeSurahNumber && fetchSurahDetail(activeSurahNumber)}
                  className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition"
                  id="btn-retry-surah"
                >
                  Muat Ulang
                </button>
              </div>
            )}

            {/* Render Surah Details & Verses */}
            {activeSurah && !loadingSurah && !surahError && (
              <div className="space-y-6">
                
                {/* Surah Header Card */}
                <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 md:p-8 text-white shadow-lg text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transform translate-x-12 -translate-y-12">
                    <Book className="w-56 h-56" />
                  </div>

                  <span className="inline-block bg-white/10 text-emerald-200 text-[10px] font-bold tracking-widest px-3 py-1 rounded-full mb-2 border border-white/5 uppercase">
                    QS. Surat Ke-{activeSurah.nomor} • {activeSurah.tempatTurun}
                  </span>
                  
                  <h2 className="text-3xl font-extrabold font-display leading-tight">{activeSurah.namaLatin}</h2>
                  <p className="text-emerald-100 text-sm mt-1">"{activeSurah.arti}" • {activeSurah.jumlahAyat} Ayat</p>
                  
                  <span className="arabic-text text-3xl font-bold text-emerald-200 block mt-3 select-none">
                    {activeSurah.nama}
                  </span>

                  {/* HTML formatted description from API */}
                  <div 
                    className="mt-4 text-[11px] text-emerald-100/80 max-w-xl mx-auto border-t border-white/10 pt-3 text-justify leading-relaxed line-clamp-3 hover:line-clamp-none transition-all duration-300 cursor-pointer"
                    title="Klik untuk lihat deskripsi lengkap"
                    dangerouslySetInnerHTML={{ __html: activeSurah.deskripsi }}
                  />
                </div>

                {/* Bismillah banner (exclude Al-Fatihah & At-Taubah, usually handled on the API side) */}
                {activeSurah.nomor !== 1 && activeSurah.nomor !== 9 && (
                  <div className="text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
                    <p className="arabic-text text-2xl font-bold text-slate-900 dark:text-emerald-400 font-display">
                      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Dengan nama Allah Yang Maha Pengasih, Maha Penyayang
                    </p>
                  </div>
                )}

                {/* Verse Cards container */}
                <div className="space-y-4">
                  {activeSurah.ayat.map((verse) => {
                    const isBookmarked = isVerseBookmarked(verse.nomorAyat);

                    return (
                      <div
                        key={verse.nomorAyat}
                        id={`verse-container-${verse.nomorAyat}`}
                        onClick={() => {
                          setActiveScrollVerse(verse.nomorAyat);
                          setVerseProgress(0);
                        }}
                        className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm transition duration-300 scroll-mt-24 relative overflow-hidden cursor-pointer ${activeScrollVerse === verse.nomorAyat ? "ring-2 ring-emerald-500/70 border-emerald-500/30 bg-emerald-50/15 dark:bg-emerald-950/10 shadow-md" : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-750"}`}
                      >
                        {/* Smooth auto-scroll progress indicator at the top of the currently active verse */}
                        {activeScrollVerse === verse.nomorAyat && isAutoScrollPlay && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800/60">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-100 ease-linear"
                              style={{ width: `${verseProgress}%` }}
                            />
                          </div>
                        )}
                        {/* Verse Card Header Controls */}
                        <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3 mb-4">
                          <div className="flex items-center space-x-2">
                            {/* Octagon verse indicator */}
                            <span className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center font-display">
                              {verse.nomorAyat}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                              QS. {activeSurah.namaLatin} : {verse.nomorAyat}
                            </span>
                          </div>

                          {/* Quick Actions Panel */}
                          <div className="flex items-center space-x-1">
                            {/* Ask AI Trigger */}
                            <button
                              onClick={() => handleAskAI(verse)}
                              className="p-1.5 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-950/30 dark:text-emerald-400 rounded-lg transition text-slate-400 flex items-center space-x-1"
                              title="Tanya Tafsir Ustadz"
                              id={`btn-ask-ai-verse-${verse.nomorAyat}`}
                            >
                              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="text-[10px] font-semibold hidden md:inline">Tanya Tafsir</span>
                            </button>

                            {/* Bookmark */}
                            <button
                              onClick={() => handleToggleBookmark(verse.nomorAyat)}
                              className={`p-1.5 rounded-lg transition ${isBookmarked ? "text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/20" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600"}`}
                              title={isBookmarked ? "Hapus dari Bookmark" : "Simpan ke Bookmark"}
                              id={`btn-bookmark-verse-${verse.nomorAyat}`}
                            >
                              {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                            </button>

                            {/* Copy Text */}
                            <button
                              onClick={() => handleCopyVerse(verse)}
                              className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 rounded-lg transition"
                              title="Salin Ayat & Terjemahan"
                              id={`btn-copy-verse-${verse.nomorAyat}`}
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            {/* Share */}
                            <button
                              onClick={() => handleShareVerse(verse)}
                              className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 rounded-lg transition"
                              title="Bagikan Tautan Ayat"
                              id={`btn-share-verse-${verse.nomorAyat}`}
                            >
                              <Share2 className="w-4 h-4" />
                            </button>

                            {/* Kirim via Gmail */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!user) {
                                  handleGoogleLogin().then(() => {
                                    handleOpenGmailShare(verse);
                                  });
                                } else {
                                  handleOpenGmailShare(verse);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 rounded-lg transition"
                              title="Kirim Ayat via Gmail"
                              id={`btn-gmail-verse-${verse.nomorAyat}`}
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Arabic verse text display with custom size settings */}
                        <div className="text-right py-4 select-none">
                          <p 
                            className={`arabic-text font-semibold text-slate-950 dark:text-white font-display tracking-wide`}
                            style={{ 
                              fontSize: fontSizeArabic === "lg" ? "1.65rem" : 
                                        fontSizeArabic === "xl" ? "2rem" : 
                                        fontSizeArabic === "2xl" ? "2.4rem" : "3.15rem",
                              lineHeight: 2.3
                            }}
                          >
                            {verse.teksArab}
                          </p>
                        </div>

                        {/* Transliteration and Translation block */}
                        <div className="space-y-3 mt-4">
                          {showTransliteration && (
                            <p className="text-[13px] text-emerald-600 dark:text-emerald-300 font-medium italic leading-relaxed pl-3 border-l-2 border-emerald-500/50 dark:border-emerald-400">
                              {verse.teksLatin}
                            </p>
                          )}
                          <p 
                            className="text-slate-900 dark:text-white leading-relaxed text-justify tracking-wide"
                            style={{ 
                              fontSize: fontSizeTranslation === "sm" ? "0.925rem" : 
                                        fontSizeTranslation === "base" ? "1.05rem" : "1.2rem"
                            }}
                          >
                            {verse.teksIndonesia}
                          </p>
                        </div>

                      </div>
                    );
                  })}
                </div>

                {/* Footer Navigation within Surah */}
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm mt-8">
                  {activeSurah.suratSebelumnya ? (
                    <button
                      onClick={() => handleSelectSurah(activeSurah.suratSebelumnya ? activeSurah.suratSebelumnya.nomor : 1)}
                      className="text-xs text-slate-600 dark:text-slate-300 hover:text-emerald-700 font-semibold py-2 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      id="btn-footer-prev-surah"
                    >
                      ← QS. {activeSurah.suratSebelumnya.namaLatin}
                    </button>
                  ) : <div />}

                  <button
                    onClick={() => {
                      setView("home");
                      setActiveSurah(null);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="text-xs text-emerald-700 hover:underline font-semibold"
                    id="btn-footer-home"
                  >
                    Daftar Surat
                  </button>

                  {activeSurah.suratSelanjutnya ? (
                    <button
                      onClick={() => handleSelectSurah(activeSurah.suratSelanjutnya ? activeSurah.suratSelanjutnya.nomor : 1)}
                      className="text-xs text-slate-600 dark:text-slate-300 hover:text-emerald-700 font-semibold py-2 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      id="btn-footer-next-surah"
                    >
                      QS. {activeSurah.suratSelanjutnya.namaLatin} →
                    </button>
                  ) : <div />}
                </div>

              </div>
            )}

          </div>
        )}

        {/* VIEW 3: BOOKMARKS PAGE */}
        {view === "bookmark" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setView("home")}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 mr-1"
                  id="btn-bookmark-back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <Bookmark className="w-5 h-5 text-emerald-700 dark:text-emerald-400 fill-current" />
                  <span>Bookmark Saya</span>
                </h2>
              </div>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full font-mono font-semibold">
                {bookmarks.length} Ayat Tersimpan
              </span>
            </div>

            {bookmarks.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-8 rounded-3xl text-center max-w-md mx-auto">
                <Bookmark className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-300 font-display">Belum ada Bookmark</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                  Sahabat belum menambahkan ayat apa pun ke bookmark. Tekan tombol ikon bendera bookmark di samping ayat saat membaca untuk menyimpannya di sini.
                </p>
                <button
                  onClick={() => setView("home")}
                  className="mt-4 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition shadow"
                  id="btn-bookmark-browse"
                >
                  Mulai Membaca
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bookmarks.map((b, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider block">
                        QS. {b.surahName}
                      </span>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white font-display mt-0.5">
                        QS. {b.surahName} : Ayat {b.verseNumber}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Disimpan pada: {b.addedAt}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleSelectSurah(b.surahNumber, b.verseNumber)}
                        className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 text-xs font-semibold rounded-xl flex items-center space-x-1 transition"
                        title="Buka Ayat"
                        id={`btn-open-bookmark-${i}`}
                      >
                        <ChevronRight className="w-4 h-4" />
                        <span>Buka</span>
                      </button>

                      <button
                        onClick={() => {
                          setBookmarks((prev) =>
                            prev.filter((item) => !(item.surahNumber === b.surahNumber && item.verseNumber === b.verseNumber))
                          );
                          triggerToast("Bookmark dihapus.");
                        }}
                        className="p-2 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800 text-slate-400 rounded-xl transition"
                        title="Hapus Bookmark"
                        id={`btn-remove-bookmark-${i}`}
                      >
                        <X className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Info / Meta */}
        <footer className="mt-12 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-widest font-semibold border-t border-slate-200/50 dark:border-slate-800/40 pt-6">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <span>© 2026 Al-Qur'an Digital</span>
            <span>equran.id API</span>
            <span>LPMQ Misbah Font System</span>
            <span>V 2.2.0-Stable</span>
          </div>
          <div className="flex gap-4">
            <span className="text-emerald-600 dark:text-emerald-500">Status: Terkoneksi</span>
            <span>Cloud Sync: Aktif</span>
          </div>
        </footer>

      </main>

      {/* Auto Scroll Floating Controls (Lyrics-Style Player) */}
      {view === "surah" && activeSurah && (
        <div 
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-5 duration-300"
          id="autoscroll-control-panel"
        >
          <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 rounded-full shadow-lg px-4 py-2 flex items-center space-x-3.5 transition-all duration-300 hover:bg-white/95 dark:hover:bg-slate-955/95">
            {/* Status Indicator Dot */}
            <div className="flex items-center space-x-1.5 shrink-0 pl-1">
              <span className="relative flex h-2 w-2">
                {isAutoScrollPlay && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isAutoScrollPlay ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`}></span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold tracking-tight">
                Ayat {activeScrollVerse || 1}
              </span>
            </div>

            <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800" />

            {/* Controls Group */}
            <div className="flex items-center space-x-2.5">
              {/* Prev Verse */}
              <button
                onClick={() => {
                  if (activeScrollVerse && activeScrollVerse > 1) {
                    setActiveScrollVerse(activeScrollVerse - 1);
                    setVerseProgress(0);
                  }
                }}
                disabled={!activeScrollVerse || activeScrollVerse <= 1}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent transition active:scale-95 cursor-pointer"
                title="Ayat Sebelumnya"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>

              {/* Play/Pause */}
              <button
                onClick={() => {
                  if (activeScrollVerse === null) {
                    setActiveScrollVerse(1);
                  }
                  setIsAutoScrollPlay(!isAutoScrollPlay);
                }}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-white shadow transition-all duration-200 transform active:scale-90 cursor-pointer ${isAutoScrollPlay ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                title={isAutoScrollPlay ? "Jeda Gulir" : "Mulai Gulir"}
              >
                {isAutoScrollPlay ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                )}
              </button>

              {/* Next Verse */}
              <button
                onClick={() => {
                  if (activeScrollVerse && activeSurah && activeScrollVerse < activeSurah.ayat.length) {
                    setActiveScrollVerse(activeScrollVerse + 1);
                    setVerseProgress(0);
                  }
                }}
                disabled={!activeScrollVerse || !activeSurah || activeScrollVerse >= activeSurah.ayat.length}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent transition active:scale-95 cursor-pointer"
                title="Ayat Selanjutnya"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>
            </div>

            <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800" />

            {/* Cycle Speed Button */}
            <button
              onClick={() => {
                const speeds = [
                  { label: "1.0x", val: 11 },
                  { label: "1.5x", val: 20 },
                  { label: "2.0x", val: 28 },
                  { label: "2.5x", val: 42 }
                ];
                const currentIndex = speeds.findIndex(s => s.val === autoScrollSpeed);
                const nextIndex = (currentIndex + 1) % speeds.length;
                setAutoScrollSpeed(speeds[nextIndex].val);
                triggerToast(`Kecepatan Gulir: ${speeds[nextIndex].label}`);
              }}
              className="px-2.5 py-1 rounded-full bg-slate-150 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-350 transition active:scale-95 cursor-pointer"
              title="Klik untuk mengubah kecepatan gulir"
            >
              {autoScrollSpeed === 11 ? "1.0x" : autoScrollSpeed === 20 ? "1.5x" : autoScrollSpeed === 28 ? "2.0x" : "2.5x"}
            </button>
          </div>
        </div>
      )}

      {/* Gemini AI Floating Assistant Panel */}
      <AIAssistant
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        activeContext={aiContext}
        onClearContext={() => setAIContext(null)}
      />

      {/* Global Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-slate-100 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              id="btn-close-settings-modal"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white flex items-center mb-4">
              <Settings className="w-5 h-5 text-emerald-700 mr-2" />
              <span>Pengaturan Tampilan</span>
            </h3>

            <div className="space-y-4 text-sm">
              {/* Transliteration option */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="font-semibold block text-slate-800 dark:text-slate-200">Teks Latin (Transliterasi)</span>
                  <span className="text-xs text-slate-400">Tampilkan teks latin di bawah huruf Arab</span>
                </div>
                <input
                  type="checkbox"
                  checked={showTransliteration}
                  onChange={(e) => setShowTransliteration(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-700 accent-emerald-700 cursor-pointer"
                  id="settings-toggle-transliteration"
                />
              </div>

              {/* Arabic Font Size options */}
              <div className="space-y-1.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <label className="font-semibold block text-slate-800 dark:text-slate-200">Ukuran Huruf Arab</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["lg", "xl", "2xl", "3xl"] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setFontSizeArabic(size)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition uppercase ${fontSizeArabic === size ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500/50" : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"}`}
                      id={`btn-font-arabic-${size}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Translation Font Size options */}
              <div className="space-y-1.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <label className="font-semibold block text-slate-800 dark:text-slate-200">Ukuran Terjemahan</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["sm", "base", "lg"] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setFontSizeTranslation(size)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition uppercase ${fontSizeTranslation === size ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500/50" : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"}`}
                      id={`btn-font-translation-${size}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="mt-6 w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow transition"
              id="btn-settings-close"
            >
              Simpan Pengaturan
            </button>
          </div>
        </div>
      )}

      {/* Floating Sparkle Assistant Launcher */}
      {!isAIOpen && (
        <button
          onClick={() => setIsAIOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 group z-30"
          id="btn-floating-ai"
        >
          <Sparkles className="w-5.5 h-5.5 group-hover:rotate-12 transition duration-300" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-28 group-hover:ml-2 font-semibold text-xs transition-all duration-300 ease-out whitespace-nowrap hidden md:inline">
            Tanya Ustadz
          </span>
        </button>
      )}

      {/* Gmail Inbox side drawer */}
      <AnimatePresence>
        {isGmailDashboardOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950 z-45"
              onClick={() => setIsGmailDashboardOpen(false)}
            />

            {/* Slide-over Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[480px] md:w-[540px] bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800"
              id="gmail-inbox-drawer"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-800 text-white rounded-tl-xl sm:rounded-none">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-emerald-700/60 rounded-lg text-emerald-300 animate-pulse">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold font-display tracking-tight text-sm">Kotak Masuk Gmail</h3>
                    <p className="text-xs text-emerald-200 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block mr-1.5 animate-pulse"></span>
                      Terhubung resmi • {user?.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => accessToken && loadGmailInbox(accessToken, gmailSearchQuery)}
                    title="Segarkan Kotak Masuk"
                    className="p-1.5 hover:bg-emerald-700 rounded text-emerald-200 hover:text-white transition"
                    id="btn-refresh-gmail"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsGmailDashboardOpen(false)}
                    className="p-1.5 hover:bg-emerald-700 rounded text-emerald-100 hover:text-white transition"
                    id="btn-close-gmail-drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Search Inbox bar */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/20">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (accessToken) loadGmailInbox(accessToken, gmailSearchQuery);
                  }}
                  className="relative flex items-center"
                >
                  <input
                    type="text"
                    placeholder="Cari pesan di kotak masuk..."
                    value={gmailSearchQuery}
                    onChange={(e) => setGmailSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl py-2 pl-3 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/25 text-slate-800 dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 p-1.5 text-slate-400 hover:text-emerald-600 transition"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Inbox list container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 dark:bg-slate-950/15">
                {isGmailLoading ? (
                  // Skeleton list
                  Array.from({ length: 5 }).map((_, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 p-4 rounded-xl space-y-2 animate-pulse">
                      <div className="flex justify-between items-center">
                        <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800 rounded" />
                        <div className="h-2 w-12 bg-slate-100 dark:bg-slate-800 rounded" />
                      </div>
                      <div className="h-4 w-44 bg-slate-100 dark:bg-slate-800 rounded" />
                      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded" />
                    </div>
                  ))
                ) : gmailEmails.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 dark:text-slate-500">
                    <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-750 mx-auto mb-3" />
                    <p className="text-xs">Kotak masuk kosong atau tidak ada hasil pencarian.</p>
                  </div>
                ) : (
                  gmailEmails.map((msg) => (
                    <div
                      key={msg.id}
                      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 p-4 rounded-2xl shadow-sm hover:border-emerald-500/20 dark:hover:border-emerald-500/25 transition duration-200 group relative"
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 max-w-[70%] truncate">
                          {msg.fromName || msg.fromEmail}
                        </span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                          {msg.date}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1 mb-1">
                        {msg.subject || "(Tanpa Subjek)"}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {msg.snippet}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Gmail Share Verse Modal overlay */}
      <AnimatePresence>
        {isGmailShareOpen && shareVerseTarget && (
          <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg border border-slate-100 dark:border-slate-800 shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <button
                onClick={() => setIsGmailShareOpen(false)}
                className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                id="btn-close-gmail-share-verse"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center mb-4">
                <Mail className="w-5 h-5 text-emerald-700 mr-2" />
                <span>Kirim Ayat via Gmail</span>
              </h3>

              <div className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Email Penerima
                  </label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="contoh: sahabat@email.com"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/25 text-slate-800 dark:text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Subjek Email
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/25 text-slate-800 dark:text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Pratinjau Ayat
                  </label>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800 font-serif text-right space-y-2 max-h-[160px] overflow-y-auto">
                    <p className="arabic-text text-lg text-emerald-700 dark:text-emerald-400">{shareVerseTarget.verse.teksArab}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans italic text-left">"{shareVerseTarget.verse.teksIndonesia}"</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 mt-6">
                <button
                  onClick={() => setIsGmailShareOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 text-xs font-semibold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleSendGmailMessage}
                  disabled={isSendingEmail || !emailTo}
                  className="w-1/2 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow transition flex items-center justify-center space-x-1.5"
                >
                  {isSendingEmail ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Kirim Sekarang</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Gmail Share History Modal overlay */}
      <AnimatePresence>
        {isGmailShareHistoryOpen && (
          <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg border border-slate-100 dark:border-slate-800 shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <button
                onClick={() => setIsGmailShareHistoryOpen(false)}
                className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                id="btn-close-gmail-share-history"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center mb-4">
                <Mail className="w-5 h-5 text-emerald-700 mr-2" />
                <span>Kirim Laporan Tadarus via Gmail</span>
              </h3>

              <div className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Email Penerima Laporan
                  </label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="contoh: ustadz@email.com atau email sendiri"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/25 text-slate-800 dark:text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Subjek Laporan
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/25 text-slate-800 dark:text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Pratinjau Ringkasan Riwayat
                  </label>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5 max-h-[160px] overflow-y-auto text-[11px]">
                    {Object.values(clickHistory).length === 0 ? (
                      <p className="italic text-slate-400">Belum ada data riwayat tadarus.</p>
                    ) : (
                      (Object.values(clickHistory) as any[])
                        .sort((a, b) => b.count - a.count)
                        .map((item) => (
                          <div key={item.surahNumber} className="flex justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">QS. {item.surahName}</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{item.count} kali dibaca</span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 mt-6">
                <button
                  onClick={() => setIsGmailShareHistoryOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 text-xs font-semibold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleSendGmailMessage}
                  disabled={isSendingEmail || !emailTo}
                  className="w-1/2 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow transition flex items-center justify-center space-x-1.5"
                >
                  {isSendingEmail ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Kirim Sekarang</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
