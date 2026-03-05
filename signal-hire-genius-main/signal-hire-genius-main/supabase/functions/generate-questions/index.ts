import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { jobDescription } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert hiring assessment designer. Your job is to analyze job descriptions and:
1. Parse the JD to extract: role title, seniority level, key skills, domain, and core responsibilities.
2. Generate exactly 5 scenario-based judgment questions that test real-world decision-making, NOT textbook knowledge.

Each question should:
- Present a realistic, high-pressure workplace scenario relevant to the role
- Require the candidate to demonstrate strategic thinking, prioritization, and leadership
- Be specific enough that generic answers would be obviously weak
- Test judgment, not recall

You MUST respond using the suggest_assessment tool.`
          },
          {
            role: "user",
            content: `Analyze this job description and generate a complete assessment:\n\n${jobDescription}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_assessment",
              description: "Return parsed JD data and generated assessment questions",
              parameters: {
                type: "object",
                properties: {
                  parsed: {
                    type: "object",
                    properties: {
                      role: { type: "string" },
                      seniority: { type: "string" },
                      skills: { type: "array", items: { type: "string" } },
                      domain: { type: "string" },
                      responsibilities: { type: "array", items: { type: "string" } }
                    },
                    required: ["role", "seniority", "skills", "domain", "responsibilities"],
                    additionalProperties: false
                  },
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string" },
                        type: { type: "string", enum: ["scenario", "behavioral", "strategic"] }
                      },
                      required: ["text", "type"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["parsed", "questions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_assessment" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-questions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
