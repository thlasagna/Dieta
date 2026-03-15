import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are a proactive nutrition coach. Based on the user's recent meals and symptoms, suggest 3 specific foods they should eat. Be specific (e.g. 'salmon fillet' not just 'fish'). Return ONLY JSON, no markdown:
{
  "suggestions": [
    {
      "food": "string",
      "reason": "string",
      "vitaminsItProvides": ["string"],
      "xpReward": number,
      "category": "vegetable"|"protein"|"fruit"|"grain"|"dairy"
    }
  ]
}`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { recentMeals, symptoms, freeformNotes } = body;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const userMessage = `Recent meals: ${JSON.stringify(recentMeals || [])}. Current symptoms: ${(symptoms || []).join(", ")}. ${freeformNotes ? `Additional notes: ${freeformNotes}` : ""} Goal: optimize nutrition and address symptoms.`;

    const result = await model.generateContent(userMessage);
    const response = result.response;
    const text = response.text();

    if (!text) {
      return NextResponse.json(
        { error: "Invalid response from Gemini" },
        { status: 500 }
      );
    }

    const raw = text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(raw);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Suggest error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Suggestion failed" },
      { status: 500 }
    );
  }
}
