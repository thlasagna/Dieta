import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are an expert fitness and workout planning assistant. Based on the user's fitness goals, create a detailed, personalized workout plan. You will also receive the user's profile information including age, fitness level, injuries, and preferences. Use this information to tailor the workout plan appropriately.

Return ONLY a JSON object with this exact shape, no markdown, no explanation:
{
  "title": "string - descriptive title of the plan",
  "duration": "string - e.g., '8 weeks', '12 week program'",
  "goal": "string - the main fitness goal",
  "schedule": [
    {
      "day": "string - Monday, Tuesday, etc.",
      "exercises": [
        {
          "name": "string - exercise name",
          "sets": number,
          "reps": number,
          "weight": "string - optional, e.g., '185 lbs'",
          "duration": "string - optional, e.g., '30 seconds', '5 minutes'"
        }
      ],
      "notes": "string - optional rest day notes or additional instructions"
    }
  ],
  "tips": ["string - training tips and advice"]
}

Create a realistic, progressive workout plan that matches the user's described goals and available time. Include:
- schedule should have one entry per day of the week (7 days total)
- For rest days, include an empty exercises array and explain rest day benefits in "notes"
- Include diverse exercises appropriate for the goal
- Provide 3-5 practical tips
- Make it achievable and safe for the user's fitness level
- Avoid exercises that conflict with reported injuries or restrictions
- Account for available equipment and facilities
- Consider fitness level and years of training experience when setting intensity
- Respect all health conditions, medications, and allergies provided

IMPORTANT: Always prioritize user safety. Avoid recommending exercises that:
- Target injured or problematic body areas
- Exceed the user's fitness level
- Require equipment they don't have access to
- Are explicitly restricted`;

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
    const { goal, userProfile } = body;

    if (!goal || typeof goal !== "string") {
      return NextResponse.json(
        { error: "Goal description is required" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    // Build the prompt with profile context if available
    let fullPrompt = goal;
    if (userProfile) {
      fullPrompt = `User Profile:\n${userProfile}\n\nWorkout Goal Request:\n${goal}`;
    }

    const result = await model.generateContent(fullPrompt);
    const responseText = result.response.text();

    // Parse the JSON response
    let plan;
    try {
      plan = JSON.parse(responseText);
    } catch (parseError) {
      // If direct parse fails, try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        plan = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse workout plan from AI response");
      }
    }

    return NextResponse.json({ plan }, { status: 200 });
  } catch (error) {
    console.error("Workout generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate workout plan";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
