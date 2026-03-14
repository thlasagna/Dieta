import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are a nutrition analysis assistant. Analyze the food in the image or description. Return ONLY a JSON object with this exact shape, no markdown, no explanation:
{
  "foods": ["string"],
  "estimatedCalories": number,
  "macros": { "protein": number, "carbs": number, "fat": number, "fiber": number },
  "vitamins": { "a": "low"|"medium"|"high", "c": "low"|"medium"|"high", "d": "low"|"medium"|"high", "b12": "low"|"medium"|"high", "iron": "low"|"medium"|"high", "calcium": "low"|"medium"|"high", "omega3": "low"|"medium"|"high", "zinc": "low"|"medium"|"high" },
  "portionNote": "string",
  "healthScore": number,
  "analysis": [{ "text": "string", "type": "good"|"neutral"|"bad" }]
}
For vitamins use "low", "medium", or "high". healthScore is 1-10. portionNote is a short plain-English note about portion uncertainty.

For "analysis": Write a short paragraph (2-4 sentences) in simple language explaining what's good, neutral, and potentially bad about this meal. Break it into segments: use type "good" for beneficial aspects (e.g. protein, fiber, vitamins), "neutral" for context/connectors, and "bad" for concerns (e.g. high sodium, saturated fat, lack of veggies). Each segment is one phrase or clause. Example: [{"text":"This meal offers ","type":"neutral"},{"text":"solid protein for muscle repair","type":"good"},{"text":". ","type":"neutral"},{"text":"It's high in saturated fat","type":"bad"},{"text":", so enjoy in moderation.","type":"neutral"}]`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { imageBase64, textDescription } = body;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    let result;

    if (imageBase64) {
      const mimeType = imageBase64.startsWith("data:")
        ? imageBase64.split(";")[0].replace("data:", "")
        : "image/jpeg";
      const base64Data = imageBase64.includes(",")
        ? imageBase64.split(",")[1]
        : imageBase64;

      result = await model.generateContent([
        {
          inlineData: {
            mimeType: mimeType as "image/jpeg" | "image/png" | "image/webp",
            data: base64Data,
          },
        },
        { text: "Analyze the food in this image and return the JSON." },
      ]);
    } else if (textDescription?.trim()) {
      result = await model.generateContent(
        `Analyze this food description and return the JSON: "${textDescription}"`
      );
    } else {
      return NextResponse.json(
        { error: "Either imageBase64 or textDescription required" },
        { status: 400 }
      );
    }

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
    console.error("Analyze food error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
