import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing food image with Gemini...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a nutrition expert specialized in Indian cuisine. Analyze food images and provide accurate nutritional information. 
            
Estimate the serving size based on visual cues like plate size, bowl fullness, utensil scale, and food density.

Return your response as a JSON object with these fields:
- name: the name of the dish
- calories: total calories (number)
- protein: grams of protein (number)
- carbs: grams of carbohydrates (number)
- fat: grams of fat (number)
- fiber: grams of fiber (number)
- serving_size: estimated portion size as a number (e.g., 1.0 for standard, 1.5 for one and half portions)
- serving_unit: unit of measurement (e.g., "cups", "plates", "bowls", "servings")
- confidence: estimation confidence level - "high", "medium", or "low"

Be as accurate as possible. Return ONLY the JSON object, no other text.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "What food is in this image and what are its nutritional values?",
              },
              {
                type: "image_url",
                image_url: {
                  url: image,
                },
              },
            ],
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to analyze image");
    }

    const data = await response.json();
    console.log("AI Response:", JSON.stringify(data, null, 2));

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    let nutritionData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        nutritionData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not extract JSON from response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse nutrition data from AI response");
    }

    console.log("Parsed nutrition data:", nutritionData);

    return new Response(JSON.stringify(nutritionData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-food function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
