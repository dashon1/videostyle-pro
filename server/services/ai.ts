import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface AutoCutResult {
  fillerWords: { start: number; end: number; word: string }[];
  silences: { start: number; end: number; duration: number }[];
  totalFillerTime: number;
  totalSilenceTime: number;
}

export interface SceneResult {
  scenes: { start: number; end: number; title: string; description: string }[];
  chapters: { timestamp: number; title: string }[];
}

export interface BRollResult {
  suggestions: { timestamp: number; query: string; reason: string; confidence: number }[];
}

export interface ThumbnailResult {
  suggestions: { timestamp: number; description: string; score: number }[];
  textOverlays: string[];
}

export interface ContentAnalysisResult {
  topics: string[];
  sentiment: string;
  keyPhrases: string[];
  summary: string;
}

export async function analyzeForAutoCut(transcript: string): Promise<AutoCutResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "system",
        content: `You are a video editing assistant that analyzes transcripts to identify filler words and unnatural pauses. Return a JSON object with:
- fillerWords: array of {start, end, word} for words like "um", "uh", "like", "you know", etc.
- silences: array of {start, end, duration} for long pauses (estimated from transcript timing)
- totalFillerTime: estimated total time of filler words in seconds
- totalSilenceTime: estimated total silence time in seconds`
      },
      {
        role: "user",
        content: `Analyze this transcript for filler words and pauses:\n\n${transcript}`
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 2048,
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content);
}

export async function detectScenes(transcript: string): Promise<SceneResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "system",
        content: `You are a video editing assistant that analyzes transcripts to identify scene/topic changes. Return a JSON object with:
- scenes: array of {start, end, title, description} for each distinct scene or topic
- chapters: array of {timestamp, title} suitable for YouTube chapters`
      },
      {
        role: "user",
        content: `Analyze this transcript to detect scene changes and suggest chapter markers:\n\n${transcript}`
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 2048,
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content);
}

export async function suggestBRoll(transcript: string): Promise<BRollResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "system",
        content: `You are a video editing assistant that suggests B-roll footage based on video content. Return a JSON object with:
- suggestions: array of {timestamp, query, reason, confidence} where:
  - timestamp: when the B-roll should appear (in seconds from start)
  - query: search query for stock footage
  - reason: why this B-roll would enhance the video
  - confidence: 0-1 score of how well the B-roll would fit`
      },
      {
        role: "user",
        content: `Suggest B-roll footage for this video transcript:\n\n${transcript}`
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 2048,
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content);
}

export async function generateThumbnailSuggestions(transcript: string, videoTitle: string): Promise<ThumbnailResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "system",
        content: `You are a video editing assistant that suggests optimal thumbnail moments and designs. Return a JSON object with:
- suggestions: array of {timestamp, description, score} for best thumbnail moments
- textOverlays: array of suggested text overlays for the thumbnail`
      },
      {
        role: "user",
        content: `Suggest thumbnail ideas for this video:\nTitle: ${videoTitle}\n\nTranscript:\n${transcript}`
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 1024,
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content);
}

export async function analyzeContent(transcript: string): Promise<ContentAnalysisResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "system",
        content: `You are a content analysis assistant. Analyze the transcript and return a JSON object with:
- topics: array of main topics discussed
- sentiment: overall sentiment (positive, negative, neutral, mixed)
- keyPhrases: important phrases for SEO/searchability
- summary: brief 2-3 sentence summary`
      },
      {
        role: "user",
        content: `Analyze this video transcript:\n\n${transcript}`
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 1024,
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content);
}

export async function matchMusicToContent(transcript: string, mood?: string): Promise<{
  genres: string[];
  tempo: string;
  energy: string;
  keywords: string[];
}> {
  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "system",
        content: `You are a music selection assistant for video editing. Based on the content, suggest appropriate background music characteristics. Return a JSON object with:
- genres: array of suitable music genres
- tempo: suggested tempo (slow, medium, fast)
- energy: energy level (calm, moderate, high)
- keywords: search keywords for royalty-free music`
      },
      {
        role: "user",
        content: `Suggest background music for this video${mood ? ` (desired mood: ${mood})` : ""}:\n\n${transcript}`
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 512,
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content);
}

export async function transcribeAudio(audioBuffer: Buffer, format: "wav" | "mp3" = "wav"): Promise<string> {
  const { toFile } = await import("openai");
  const file = await toFile(audioBuffer, `audio.${format}`);
  const response = await openai.audio.transcriptions.create({
    file,
    model: "gpt-4o-mini-transcribe",
  });
  return response.text;
}

export { openai };
