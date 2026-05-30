import express from "express";
import path from "path";
import dns from "dns";
import { createServer as createViteServer } from "vite";
import http from "http";
import https from "https";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware CORS manuel pour autoriser l'APK Android et le Web
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Range");
  res.header("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges");

  // Répondre immédiatement aux requêtes de pré-vérification (OPTIONS)
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Route de santé pour vérifier si le serveur répond
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "WATCHNOW24 Server is online" });
});

// API route for Gemini AI Assistant
app.post("/api/ai/chat", async (req, res) => {
  const { message, history } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return res.status(500).json({ error: "Gemini API key not configured on server" });
  }

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // Prepare the contents for Gemini
    const contents = history ? history.map((h: any) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }]
    })) : [];

    contents.push({
      role: "user",
      parts: [{ text: `Context: You are the AI assistant for WatchNow24, a premium IPTV app. Provide helpful, concise responses about IPTV, streaming, and content discovery. User says: ${message}` }]
    });

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents })
    });

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble thinking right now. Please try again.";

    res.json({ text: aiText });
  } catch (err: any) {
    console.error("Gemini API Error:", err.message);
    res.status(500).json({ error: "Failed to communicate with AI service" });
  }
});

// API route to proxy external M3U or JSON requests to bypass CORS
app.get("/api/iptv/proxy", async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ error: "Missing 'url' query parameter" });
  }

  try {
    const parsedUrl = new URL(targetUrl);
    const isHttps = parsedUrl.protocol === "https:";
    const transport = isHttps ? https : http;

    const options: any = {
      method: "GET",
      headers: {
        "User-Agent": "VLC/3.0.16 LibVLC/3.0.16", // Many IPTV providers block standard browser UA
        "Accept": "*/*",
      }
    };

    if (req.headers.range) {
      options.headers["Range"] = req.headers.range;
    }

    const proxyReq = transport.request(parsedUrl, options, (proxyRes) => {
      // Forward headers (except security ones that block iframe inclusion)
      const headersToForward: any = {
        "Content-Type": proxyRes.headers["content-type"] || "application/octet-stream",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
      };

      if (proxyRes.headers["content-length"]) headersToForward["Content-Length"] = proxyRes.headers["content-length"];
      if (proxyRes.headers["content-range"]) headersToForward["Content-Range"] = proxyRes.headers["content-range"];
      if (proxyRes.headers["accept-ranges"]) headersToForward["Accept-Ranges"] = proxyRes.headers["accept-ranges"];

      res.status(proxyRes.statusCode || 200);
      res.set(headersToForward);
      proxyRes.pipe(res);
    });

    proxyReq.on("error", (err) => {
      console.error("IPTV Proxy req error:", err.message);
      res.status(500).json({ error: "Failed to connect to playlist source", details: err.message });
    });

    // Set short timeout to avoid hanging
    proxyReq.setTimeout(12000, () => {
      proxyReq.destroy();
      res.status(504).json({ error: "Gateway Timeout: Playlist server is unresponsive" });
    });

    proxyReq.end();
  } catch (err: any) {
    res.status(400).json({ error: "Invalid URL provided", details: err.message });
  }
});

// Speedtest interactive download stream
// Delivers exactly 10MB of structured garbage data in chunks, allowing real bandwidth calculation
app.get("/api/speedtest/download", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "application/octet-stream",
    "Content-Length": "10485760", // 10 MB
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  });

  const chunkSize = 65536; // 64KB
  const buffer = Buffer.alloc(chunkSize, "W");
  let bytesWritten = 0;
  const totalSize = 10485760;

  function writeChunk() {
    while (bytesWritten < totalSize) {
      bytesWritten += chunkSize;
      const isBufferSlim = res.write(buffer);
      if (!isBufferSlim) {
        // Wait for drain event
        return;
      }
    }
    res.end();
  }

  res.on("drain", () => {
    writeChunk();
  });

  writeChunk();
});

// Dynamic EPG feed provider (XMLTV simulation with realistic live timeline)
app.get("/api/iptv/epg", (req, res) => {
  const now = new Date();
  const generateEPGProgram = (channelId: string, hoursOffset: number, durationHours: number) => {
    const start = new Date(now.getTime() + hoursOffset * 60 * 60 * 1000);
    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

    const formatTime = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + " +0000";

    const titles: Record<string, string[]> = {
      default: ["Global News Live", "World Sports Update", "Hollywood Blockbuster", "Documentary Discovery", "Tech Tomorrow", "Music Non-Stop"],
      news: ["Morning Edition", "Global Briefing", "Business Hour", "Breaking Headlines", "World News Tonight", "Analysis & Debate"],
      movies: ["Interstellar (2014)", "The Dark Knight", "Inception", "Cinema Classics", "Midnight Thriller", "Indie Showcase"],
      sports: ["Live Match Highlight", "World Cup Moments", "Speed Chase Racing", "Extreme Sports Arena", "Football Tonight", "Superbike Weekly"],
      series: ["Breaking Bad S01E03", "Succession S02E05", "The Crown S03E01", "Friends Replay", "Game of Thrones", "True Detective S01E01"]
    };

    const category = channelId.includes("news") ? "news" : channelId.includes("movie") ? "movies" : channelId.includes("sport") ? "sports" : channelId.includes("series") ? "series" : "default";
    const availableTitles = titles[category] || titles.default;
    const index = Math.abs(channelId.charCodeAt(0) + hoursOffset) % availableTitles.length;
    const title = availableTitles[index];

    return `
  <programme start="${formatTime(start)}" stop="${formatTime(end)}" channel="${channelId}">
    <title lang="en">${title}</title>
    <desc lang="en">An award-winning presentation of ${title}, direct to your WATCHNOW24 IPTV guide player. High definition audio and video experience.</desc>
    <category lang="en">${category.toUpperCase()}</category>
  </programme>`;
  };

  const channelIds = ["news_hq", "movies_gold", "sports_pro", "series_premium", "nature_wild", "nasa_space"];
  let programsXml = "";

  for (const channelId of channelIds) {
    // Generate programs for previous -4 hours, current, and future +12 hours
    programsXml += generateEPGProgram(channelId, -4, 2);
    programsXml += generateEPGProgram(channelId, -2, 2);
    programsXml += generateEPGProgram(channelId, 0, 2); // Current
    programsXml += generateEPGProgram(channelId, 2, 3);
    programsXml += generateEPGProgram(channelId, 5, 2);
    programsXml += generateEPGProgram(channelId, 7, 4);
    programsXml += generateEPGProgram(channelId, 11, 4);
  }

  const completeXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE tv SYSTEM "xmltv.dtd">
<tv generator-info-name="WATCHNOW24-EPG-Engine">
  ${channelIds.map(id => `<channel id="${id}"><display-name>${id.toUpperCase().replace("_", " ")}</display-name></channel>`).join("\n  ")}
  ${programsXml}
</tv>`;

  res.set("Content-Type", "application/xml");
  res.send(completeXml);
});

// Setup Vite Dev Server / Prod Serving
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
    console.log(`WATCHNOW24 Server booting in full-stack mode`);
    console.log(`Port: ${PORT}`);
  });
}

startServer();
