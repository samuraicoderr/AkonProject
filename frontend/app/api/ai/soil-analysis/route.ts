import { NextResponse } from "next/server";
import OpenAI from "openai";

function getClient() {
  const apiKey = process.env.GROQ_API_KEY;
  const baseURL = process.env.OPEN_API_BASE_URL;

  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY environment variable");
  }

  return new OpenAI({ apiKey, baseURL });
}

export async function POST(request: Request) {
  try {
    const { features } = await request.json();

    const systemPrompt = `You are a soil science expert. Analyze soil conditions and provide actionable recommendations.

Always respond with valid JSON in this exact format:
{
  "overallHealth": "excellent" | "good" | "moderate" | "poor",
  "nutrientBalance": "Assessment of NPK balance",
  "phAssessment": "Analysis of soil pH",
  "recommendations": ["recommendation1", "recommendation2", "recommendation3", "recommendation4"]
}`;

    const userPrompt = `Analyze these soil and climate conditions:
- Nitrogen (N): ${features.N} kg/ha (optimal: 20-140 kg/ha)
- Phosphorus (P): ${features.P} kg/ha (optimal: 5-145 kg/ha)
- Potassium (K): ${features.K} kg/ha (optimal: 5-205 kg/ha)
- Temperature: ${features.temperature}°C
- Humidity: ${features.humidity}%
- Soil pH: ${features.ph} (neutral: 6.5-7.5)
- Rainfall: ${features.rainfall}mm/year

Provide a comprehensive soil analysis. Respond ONLY with the JSON object, no other text.`;

    const client = getClient();
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 600,
    });

    const content = completion.choices[0]?.message?.content || "";
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid AI response format");
    }

    const analysis = JSON.parse(jsonMatch[0]);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Soil analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze soil" },
      { status: 500 }
    );
  }
}
