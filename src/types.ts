export interface Surah {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
  tempatTurun: "Mekah" | "Madinah" | string;
  arti: string;
  deskripsi: string;
  audioFull: Record<string, string>;
}

export interface Verse {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
  audio: Record<string, string>;
}

export interface SurahDetail extends Surah {
  ayat: Verse[];
  suratSebelumnya: {
    nomor: number;
    nama: string;
    namaLatin: string;
    jumlahAyat: number;
  } | false;
  suratSelanjutnya: {
    nomor: number;
    nama: string;
    namaLatin: string;
    jumlahAyat: number;
  } | false;
}

export interface Bookmark {
  surahNumber: number;
  surahName: string;
  verseNumber: number;
  addedAt: string;
}

export interface LastRead {
  surahNumber: number;
  surahName: string;
  verseNumber?: number;
  updatedAt: string;
}

export interface Qari {
  id: string;
  name: string;
  fullName: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}
