import express from "express";
import path from "path";
import http from "http";
import https from "https";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware CORS complet pour Vercel et Android
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Range");
  res.header("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "WATCHNOW24 Server is online" });
});

app.post("/api/ai/chat", async (req, res) => {
  const { message, history } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return res.status(500).json({ error: "Gemini API key not configured" });
  }

  try {
    const contents = history ? history.map((h: any) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }]
    })) : [];

    contents.push({
      role: "user",
      parts: [{ text: `Context: You are the AI assistant for WatchNow24 IPTV. User says: ${message}` }]
    });

    const body = JSON.stringify({ contents });
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };

    const geminiReq = https.request(options, (geminiRes) => {
      let data = '';
      geminiRes.on('data', (chunk) => data += chunk);
      geminiRes.on('end', () => {
        try {
          const json = JSON.parse(data);
          const aiText = json.candidates?.[0]?.content?.parts?.[0]?.text || "Error processing AI response";
          res.json({ text: aiText });
        } catch (e) {
          res.status(500).json({ error: "Invalid AI response" });
        }
      });
    });
    geminiReq.write(body);
    geminiReq.end();
  } catch (err) {
    res.status(500).json({ error: "AI Service Error" });
  }
});

app.get("/api/iptv/proxy", (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) return res.status(400).json({ error: "Missing url" });

  try {
    const parsedUrl = new URL(targetUrl);
    const transport = parsedUrl.protocol === "https:" ? https : http;

    const options = {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "*/*"
      }
    };

    const proxyReq = transport.request(targetUrl, options, (proxyRes) => {
      res.status(proxyRes.statusCode || 200);
      res.set({
        "Content-Type": proxyRes.headers["content-type"] || "application/octet-stream",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
      });
      proxyRes.pipe(res);
    });

    proxyReq.on("error", (err) => res.status(500).json({ error: err.message }));
    proxyReq.end();
  } catch (err) {
    res.status(400).json({ error: "Invalid URL" });
  }
});

// Pour Vercel, on exporte l'app au lieu de faire app.listen
if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => console.log(`Server on ${PORT}`));
}

export default app;
