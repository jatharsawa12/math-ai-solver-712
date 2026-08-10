export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { question, classLevel } = req.body || {};

    if (!question || !question.trim()) {
      return res.status(400).json({ error: "Please provide a math question." });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OpenAI API key is not configured." });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5.1",
        reasoning: {
          effort: "high"
        },
        instructions: `
You are Math AI, an expert mathematics tutor for students from Class 7 to Class 12.

Solve mathematics questions accurately and show clear step-by-step working.

Topics can include:
arithmetic, fractions, percentages, ratio, proportion, algebra,
linear equations, quadratic equations, polynomials, factorisation,
geometry, coordinate geometry, mensuration, trigonometry,
sequences and series, functions, statistics, probability,
matrices, determinants, limits, differentiation, integration,
vectors, 3D geometry, differential equations and linear programming.

For word problems:
1. Identify the given information.
2. Identify what must be found.
3. Choose the correct formula or method.
4. Solve step by step.
5. Give the final answer clearly.

Check calculations and algebra before giving the final answer.

Never invent information that is not in the question.

Student class: ${classLevel || "7-12"}
        `,
        input: question.trim()
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "OpenAI request failed."
      });
    }

    const text = (data.output || [])
      .filter(item => item.type === "message")
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n");

    return res.status(200).json({
      answer: text || "No answer was returned."
    });

  } catch (error) {
    return res.status(500).json({
      error: "Server error. Please try again."
    });
  }
}
