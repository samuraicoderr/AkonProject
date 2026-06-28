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
    const { messages, context } = await request.json();

    let systemContent = `You are AkonProject AI, a friendly and knowledgeable agricultural assistant. You help farmers make informed decisions about their crops.

Your expertise includes:
- Crop selection and rotation strategies
- Soil management and fertilization
- Pest and disease management
- Climate adaptation techniques
- Sustainable farming practices
- Market trends and crop economics

Be concise, practical, and encouraging. Use simple language that farmers can easily understand. When relevant, provide specific numbers and actionable steps.`;

    if (context?.features) {
      systemContent += `\n\nCurrent soil/climate conditions being analyzed:
- Nitrogen: ${context.features.N} kg/ha
- Phosphorus: ${context.features.P} kg/ha
- Potassium: ${context.features.K} kg/ha
- Temperature: ${context.features.temperature}°C
- Humidity: ${context.features.humidity}%
- pH: ${context.features.ph}
- Rainfall: ${context.features.rainfall}mm/year`;
    }

    if (context?.recommendation) {
      systemContent += `\n\nML model recommendation: ${context.recommendation.recommended_crop} (${(context.recommendation.confidence * 100).toFixed(1)}% confidence)`;
    }

    const client = getClient();
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemContent },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 800,
      stream: false,
    });

    const message = completion.choices[0]?.message?.content || "I apologize, I couldn't generate a response. Please try again.";

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to get AI response" },
      { status: 500 }
    );
  }
}
