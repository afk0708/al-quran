import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser middleware
app.use(express.json());

// In-memory caching for Quran API
let cachedSurahList: any = null;
let cachedSurahListTime = 0;
const cachedSurahDetails = new Map<number, { data: any; time: number }>();

const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours caching

// Helper to fetch surah list with caching
async function getSurahList() {
  const now = Date.now();
  if (cachedSurahList && now - cachedSurahListTime < CACHE_TTL) {
    return cachedSurahList;
  }

  try {
    const response = await fetch("https://equran.id/api/v2/surat");
    if (!response.ok) {
      throw new Error(`Failed to fetch surah list: ${response.statusText}`);
    }
    const json = await response.json();
    if (json && json.code === 200) {
      cachedSurahList = json.data;
      cachedSurahListTime = now;
      return cachedSurahList;
    }
    throw new Error("Invalid response format from equran.id");
  } catch (err: any) {
    console.error("Error fetching surah list, using backup or failing:", err.message);
    if (cachedSurahList) {
      return cachedSurahList; // Fallback to stale cache
    }
    throw err;
  }
}

// Helper to fetch single surah detail with caching
async function getSurahDetail(nomor: number) {
  const now = Date.now();
  const cached = cachedSurahDetails.get(nomor);
  if (cached && now - cached.time < CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await fetch(`https://equran.id/api/v2/surat/${nomor}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch surah ${nomor}: ${response.statusText}`);
    }
    const json = await response.json();
    if (json && json.code === 200) {
      cachedSurahDetails.set(nomor, { data: json.data, time: now });
      return json.data;
    }
    throw new Error(`Invalid response format for surah ${nomor}`);
  } catch (err: any) {
    console.error(`Error fetching surah ${nomor}:`, err.message);
    if (cached) {
      return cached.data; // Fallback to stale cache
    }
    throw err;
  }
}

// Lazy load Gemini AI
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API Routes

// 1. Get List of all 114 Surahs
app.get("/api/quran/surat", async (req, res) => {
  try {
    const data = await getSurahList();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Gagal mengambil daftar surat" });
  }
});

// 2. Get Single Surah detail (including all verses)
app.get("/api/quran/surat/:nomor", async (req, res) => {
  try {
    const nomor = parseInt(req.params.nomor);
    if (isNaN(nomor) || nomor < 1 || nomor > 114) {
      return res.status(400).json({ success: false, error: "Nomor surat tidak valid" });
    }
    const data = await getSurahDetail(nomor);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || `Gagal mengambil surat ${req.params.nomor}` });
  }
});

// 3. AI Tafsir & Guidance Chat Assistant
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, history, context } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: "Pesan tidak boleh kosong" });
    }

    const ai = getGeminiClient();

    let contextPrompt = "";
    if (context) {
      contextPrompt = `
Konteks Al-Qur'an saat ini yang sedang dibaca oleh user:
- Surat: ${context.surahName} (Surat ke-${context.surahNumber})
- Ayat Ke: ${context.verseNumber}
- Teks Arab: ${context.arabic}
- Terjemahan: ${context.translation}
`;
    }

    const systemInstruction = `
Anda adalah "Ustadz AI" atau "Asisten Al-Qur'an Digital", seorang ahli tafsir Al-Qur'an dan konsultan spiritual Islami yang ramah, bijaksana, hangat, dan berpengetahuan luas.
Tugas utama Anda adalah:
1. Membantu pengguna memahami isi Al-Qur'an dengan bahasa Indonesia yang santun, indah, mudah dipahami, dan menyentuh hati.
2. Jika pengguna menanyakan tafsir atau penjelasan ayat tertentu (baik dari konteks yang dikirimkan maupun yang ditanyakan), jelaskan asbabun nuzul (jika ada), tafsir ringkas (berdasarkan tafsir muktabar seperti Tafsir Jalalain atau Kemenag RI), serta hikmah atau pelajaran praktis untuk kehidupan sehari-hari.
3. Jika pengguna sedang bersedih, cemas, atau mencari ketenangan bimbingan hidup, berikan nasihat rohani yang sejuk dan rekomendasikan ayat-ayat Al-Qur'an yang relevan untuk menenangkan hati mereka. Sebutkan nama surat dan nomor ayatnya dengan jelas.
4. Selalu gunakan sapaan yang hangat seperti "Sahabat Al-Qur'an" atau sapaan santun lainnya.
5. Format jawaban Anda menggunakan Markdown yang rapi dengan heading, bullet points, dan kutipan tebal agar sangat nyaman dibaca.

${contextPrompt}
`;

    // Format chat contents
    const contents: any[] = [];
    
    // Add history
    if (history && Array.isArray(history)) {
      for (const h of history) {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.content }],
        });
      }
    }

    // Add current message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "Mohon maaf, saya belum bisa memproses jawaban saat ini.";
    res.json({ success: true, reply });
  } catch (err: any) {
    console.error("Gemini API Error:", err.message);
    res.status(500).json({ 
      success: false, 
      error: err.message || "Gagal menghubungi asisten AI Al-Qur'an. Pastikan kunci API Gemini sudah disematkan di menu Secrets." 
    });
  }
});

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
