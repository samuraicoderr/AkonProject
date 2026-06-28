import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: process.env.OPEN_API_BASE_URL,
});

export async function POST(request: Request) {
  try {
    const { recommendation, features } = await request.json();

    const systemPrompt = `You are an expert agricultural advisor with deep knowledge of farming practices, crop science, and sustainable agriculture. Provide actionable, practical advice for farmers.

Always respond with valid JSON in this exact format:
{
  "summary": "A brief 2-3 sentence summary of why this crop is ideal",
  "plantingTips": ["tip1", "tip2", "tip3", "tip4"],
  "expectedYield": "Expected yield information with approximate numbers",
  "seasonalAdvice": "Best time to plant and harvest considerations",
  "riskFactors": ["risk1", "risk2", "risk3"],
  "marketInsights": "Current market demand and pricing trends"
}`;

    const userPrompt = `Based on these soil and climate conditions:
- Nitrogen (N): ${features.N} kg/ha
- Phosphorus (P): ${features.P} kg/ha
- Potassium (K): ${features.K} kg/ha
- Temperature: ${features.temperature}°C
- Humidity: ${features.humidity}%
- Soil pH: ${features.ph}
- Rainfall: ${features.rainfall}mm/year

The ML model recommends: ${recommendation.recommended_crop} (${(recommendation.confidence * 100).toFixed(1)}% confidence)

Top alternatives: ${recommendation.top_recommendations
      .slice(1, 4)
      .map((r: { crop: string; probability: number }) => `${r.crop} (${(r.probability * 100).toFixed(1)}%)`)
      .join(", ")}

Provide detailed farming insights for the recommended crop (${recommendation.recommended_crop}). Respond ONLY with the JSON object, no other text.`;

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content || "";
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid AI response format");
    }

    const insights = JSON.parse(jsonMatch[0]);
    return NextResponse.json(insights);
  } catch (error) {
    console.error("Crop insights error:", error);
    return NextResponse.json(
      { error: "Failed to generate crop insights" },
      { status: 500 }
    );
  }
}
