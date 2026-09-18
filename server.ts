import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy init Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Gemini Assistant endpoint for smart campus recommendations
app.post("/api/gemini/advisor", async (req, res) => {
  try {
    const { prompt, context } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getGemini();
    if (!ai) {
      // Graceful fallback advice if API key is not configured in environment
      return res.json({
        response: `[Automated Campus Scheduling Engine]: ${generateHeuristicResponse(prompt, context)}`,
        source: "heuristic-fallback",
      });
    }

    const systemInstruction = `You are the AI Campus Resource Optimization Expert for a university. 
You advise campus administrators on allocating classrooms, computer labs, science facilities, faculty, and equipment.
You analyze capacity limits, equipment sufficiency, timetable clashes, faculty workload, and room utilization efficiency.
Always provide practical, direct, concise, and professional recommendations with clear reasoning.
Format your answer with concise bullet points, bold highlights, and direct solutions.`;

    const modelResponse = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Context Information:
${JSON.stringify(context || {}, null, 2)}

User Question/Request:
${prompt}`,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    return res.json({
      response: modelResponse.text || "No recommendation generated.",
      source: "gemini-3.8-flash",
    });
  } catch (error: any) {
    console.error("Gemini advisor error:", error);
    return res.status(500).json({
      error: "Failed to generate AI advice",
      details: error?.message || "Unknown error",
    });
  }
});

function generateHeuristicResponse(prompt: string, context: any): string {
  const query = (prompt || "").toLowerCase();
  if (query.includes("data structures") || query.includes("65") || query.includes("capacity")) {
    return "Recommendation for Data Structures (65 students):\n- Detected Capacity Mismatch: Current Lab 204 accommodates 60 students (shortfall of 5 seats & computers).\n- Recommended Reallocation: Move to Lab 301 (Capacity 75, 75 High-Speed PCs, available on Monday 10:45 AM).\n- Alternative: Lab 105 Systems Computing Center (Capacity 80, 80 PCs).\n- Preserves all surrounding lecture schedules with 0 cascade conflicts.";
  }
  if (query.includes("faculty") || query.includes("absence") || query.includes("leave")) {
    return "Faculty Absence Protocol:\n- Check department cross-specializations.\n- Allocate available faculty with matching domain expertise and less than 18 weekly contact hours.\n- If no substitute is active in that slot, trigger asynchronous lab session or switch slot with Friday tutorial.";
  }
  return `Campus Optimization Strategy:\n- Maintain standard room buffers (5-10% excess capacity for comfortable student seating).\n- Prioritize specialized computer labs and chemistry labs only for activities strictly requiring installed apparatus.\n- Group recurring lectures into adjacent wings to minimize inter-building transit time.`;
}

// Start Server and mount Vite / Static files
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
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
