import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { candidateName, questions, answers, jobDescription } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const qaPairs = questions.map((q: string, i: number) => 
      `Question ${i + 1}: ${q}\nAnswer ${i + 1}: ${answers[i]}`
    ).join("\n\n");

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
            content: `You are an expert AI hiring evaluator. You evaluate candidate responses with rigorous consistency. 

Scoring criteria (0-100):
- 90-100: Exceptional strategic thinking, specific actionable plans, evidence of real experience
- 75-89: Strong responses with good structure but may lack specificity
- 60-74: Adequate but generic, textbook-style answers
- 40-59: Weak responses, vague or off-topic
- 0-39: No meaningful content or completely wrong approach

You must evaluate consistently: the same quality of answer must always receive the same score range.

Focus on:
1. Specificity — does the candidate give concrete actions or vague platitudes?
2. Prioritization — do they show they can triage under pressure?
3. Strategic thinking — do they see second-order effects?
4. Communication — is the response structured and clear?
5. Domain awareness — do they understand the role's context?

You MUST use the score_candidate tool to return your evaluation.`
          },
          {
            role: "user",
            content: `Evaluate this candidate's responses for the following role:\n\nJob Description:\n${jobDescription}\n\nCandidate: ${candidateName}\n\n${qaPairs}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "score_candidate",
              description: "Return the candidate evaluation with scores and analysis",
              parameters: {
                type: "object",
                properties: {
                  overall_score: { type: "number", description: "Overall fit score 0-100" },
                  status: { type: "string", enum: ["Shortlisted", "Reviewing", "Rejected"] },
                  analysis: { type: "string", description: "Signal vs Noise analysis paragraph (3-5 sentences)" },
                  strengths: { type: "array", items: { type: "string" }, description: "2-4 key strengths" },
                  recommendation: { type: "string", description: "One sentence hiring recommendation" },
                  individual_scores: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        score: { type: "number" },
                        feedback: { type: "string" }
                      },
                      required: ["score", "feedback"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["overall_score", "status", "analysis", "strengths", "recommendation", "individual_scores"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "score_candidate" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
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
    console.error("score-candidate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
