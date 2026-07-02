import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const provider = new GoogleAuthProvider();

// Gmail scopes requested by the user
const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://mail.google.com/"
];

GMAIL_SCOPES.forEach((scope) => {
  provider.addScope(scope);
});

// Cache the access token in memory as instructed (never store in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // Auth exists but we lost the token (page refreshed). We need to sign in again to get the token.
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Gagal mendapatkan access token dari Google Auth.");
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Sign in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// GMAIL API HELPER FUNCTIONS

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  subject?: string;
  from?: string;
  date?: string;
  body?: string;
}

// Convert a base64url encoded string to standard string
function decodeBase64(str: string): string {
  try {
    const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    return decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch (e) {
    return "Error decoding content.";
  }
}

// Fetch the details of a specific message
export const getEmailDetail = async (messageId: string, token: string): Promise<GmailMessage | null> => {
  try {
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();

    const headers = data.payload?.headers || [];
    const subject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(No Subject)";
    const from = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown Sender";
    const dateHeader = headers.find((h: any) => h.name.toLowerCase() === "date")?.value || "";
    
    let dateStr = "";
    if (dateHeader) {
      try {
        dateStr = new Date(dateHeader).toLocaleString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        dateStr = dateHeader;
      }
    }

    // Attempt to extract the body
    let body = "";
    if (data.payload?.parts) {
      const textPart = data.payload.parts.find((p: any) => p.mimeType === "text/plain") ||
                        data.payload.parts.find((p: any) => p.mimeType === "text/html");
      if (textPart && textPart.body?.data) {
        body = decodeBase64(textPart.body.data);
      }
    } else if (data.payload?.body?.data) {
      body = decodeBase64(data.payload.body.data);
    }

    return {
      id: data.id,
      threadId: data.threadId,
      snippet: data.snippet || "",
      subject,
      from,
      date: dateStr,
      body: body || data.snippet || "",
    };
  } catch (error) {
    console.error(`Error fetching email ${messageId}:`, error);
    return null;
  }
};

// List user's latest emails with optional search query
export const listEmails = async (token: string, query?: string): Promise<GmailMessage[]> => {
  try {
    let url = "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=7";
    if (query) {
      url += `&q=${encodeURIComponent(query)}`;
    }
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error("Gmail list response error:", await res.text());
      return [];
    }
    const data = await res.json();
    if (!data.messages || data.messages.length === 0) {
      return [];
    }

    // Fetch detailed info for each email concurrently
    const detailedEmails = await Promise.all(
      data.messages.map((m: any) => getEmailDetail(m.id, token))
    );

    return detailedEmails.filter((m): m is GmailMessage => m !== null);
  } catch (error) {
    console.error("Error listing emails:", error);
    return [];
  }
};

// Send an email via Gmail API
export const sendGmailEmail = async (
  token: string,
  to: string,
  subject: string,
  bodyHtml: string
): Promise<boolean> => {
  try {
    // Gmail send API expects standard MIME-format email encoded in base64url
    const cleanSubject = `=?utf-8?B?${btoa(encodeURIComponent(subject).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))}?=`;
    
    const emailParts = [
      `To: ${to}`,
      "Content-Type: text/html; charset=utf-8",
      "MIME-Version: 1.0",
      `Subject: ${cleanSubject}`,
      "",
      bodyHtml,
    ];

    const emailStr = emailParts.join("\r\n");
    // Base64url encoding
    const base64UrlEmail = btoa(encodeURIComponent(emailStr).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw: base64UrlEmail,
      }),
    });

    if (!res.ok) {
      console.error("Gmail send error:", await res.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};
