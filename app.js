const $ = id => document.getElementById(id);

function fmt(n) {
  if (!Number.isFinite(n)) return "undefined";
  if (Math.abs(n - Math.round(n)) < 1e-10) return String(Math.round(n));
  return String(Number(n.toFixed(10)));
}

function clean(s) {
  return s
    .replace(/[−–]/g, "-")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .trim();
}

/* =========================
   OFFLINE SOLVER
   ========================= */

function arithmetic(s) {
  if (!/^[0-9+\-*/().%\s^√]+$/.test(s)) return null;

  try {
    s = s
      .replace(/√\s*(\d+(?:\.\d+)?)/g, "Math.sqrt($1)")
      .replace(/(\d+(?:\.\d+)?)%/g, "($1/100)")
      .replace(/\^/g, "**");

    const v = Function('"use strict";return (' + s + ')')();

    return Number.isFinite(v)
      ? `Step 1: Calculate the expression.\n\nAnswer: ${fmt(v)}`
      : null;
  } catch {
    return null;
  }
}

function linear(s) {
  const m = s.match(
    /(?:solve[:\s]*)?([+-]?\s*[\d.]*\.?\d*)\s*x\s*([+-]\s*[\d.]+)?\s*=\s*([+-]?\s*[\d.]+)/i
  );

  if (!m) return null;

  let a = parseFloat((m[1] || "1").replace(/\s/g, ""));

  if (m[1] === "-" || m[1] === "+") {
    a = m[1] === "-" ? -1 : 1;
  }

  let b = parseFloat(
    (m[2] || "0").replace(/\s/g, "")
  ) || 0;

  const c = parseFloat(m[3].replace(/\s/g, ""));

  if (a === 0) return null;

  const x = (c - b) / a;

  return `Step 1: Identify the equation.

${fmt(a)}x ${b >= 0 ? "+ " : "- "}${fmt(Math.abs(b))} = ${fmt(c)}

Step 2: Move the constant to the other side.

${fmt(a)}x = ${fmt(c - b)}

Step 3: Divide both sides by ${fmt(a)}.

x = ${fmt(c - b)} ÷ ${fmt(a)}

Answer: x = ${fmt(x)}`;
}

function quadratic(s) {
  const m = s.match(
    /([+-]?\s*[\d.]+)?\s*x\^2\s*([+-]\s*[\d.]+)?\s*x\s*([+-]\s*[\d.]+)?\s*=\s*0/i
  );

  if (!m) return null;

  const a = m[1]
    ? parseFloat(m[1].replace(/\s/g, ""))
    : 1;

  const b = m[2]
    ? parseFloat(m[2].replace(/\s/g, ""))
    : 0;

  const c = m[3]
    ? parseFloat(m[3].replace(/\s/g, ""))
    : 0;

  if (a === 0) return null;

  const D = b * b - 4 * a * c;

  if (D < 0) {
    return `Step 1: Identify:

a = ${fmt(a)}
b = ${fmt(b)}
c = ${fmt(c)}

Step 2: Calculate the discriminant.

D = b² − 4ac
D = ${fmt(D)}

Since D < 0, there are no real roots.

Answer: No real solutions.`;
  }

  const r1 = (-b + Math.sqrt(D)) / (2 * a);
  const r2 = (-b - Math.sqrt(D)) / (2 * a);

  return `Step 1: Identify:

a = ${fmt(a)}
b = ${fmt(b)}
c = ${fmt(c)}

Step 2: Calculate the discriminant.

D = b² − 4ac
D = ${fmt(D)}

Step 3: Use the quadratic formula.

x = (−b ± √D) / 2a

Step 4: Calculate the roots.

Answer:
x = ${fmt(r1)}
or
x = ${fmt(r2)}`;
}

function simultaneousEquations(s) {
  const equations = s.match(
    /([+-]?\s*\d*\.?\d*)\s*x\s*([+-]\s*\d*\.?\d*)\s*y\s*=\s*([+-]?\s*\d*\.?\d*)/gi
  );

  if (!equations || equations.length < 2) return null;

  function parse(eq) {
    const m = eq.match(
      /([+-]?\s*\d*\.?\d*)\s*x\s*([+-]\s*\d*\.?\d*)\s*y\s*=\s*([+-]?\s*\d*\.?\d*)/i
    );

    if (!m) return null;

    let a = m[1].replace(/\s/g, "");
    let b = m[2].replace(/\s/g, "");

    if (a === "" || a === "+") a = 1;
    if (a === "-") a = -1;

    if (b === "" || b === "+") b = 1;
    if (b === "-") b = -1;

    return {
      a: Number(a),
      b: Number(b),
      c: Number(m[3].replace(/\s/g, ""))
    };
  }

  const e1 = parse(equations[0]);
  const e2 = parse(equations[1]);

  if (!e1 || !e2) return null;

  const determinant = e1.a * e2.b - e2.a * e1.b;

  if (determinant === 0) {
    return "The two equations do not have one unique solution.";
  }

  const x =
    (e1.c * e2.b - e2.c * e1.b) / determinant;

  const y =
    (e1.a * e2.c - e2.a * e1.c) / determinant;

  return `Step 1: Write the two equations.

${equations[0]}
${equations[1]}

Step 2: Solve the simultaneous equations using elimination/determinants.

Step 3: Calculate x.

x = ${fmt(x)}

Step 4: Calculate y.

y = ${fmt(y)}

Answer:
x = ${fmt(x)}
y = ${fmt(y)}`;
}

function derivative(s) {
  let expr = s
    .replace(
      /.*?(differentiate|derivative)\s*:\s*/i,
      ""
    )
    .replace(/\s/g, "");

  const terms = expr.match(/[+-]?[^+-]+/g);

  if (!terms) return null;

  const out = [];

  for (const t of terms) {
    const m = t.match(
      /^([+-]?\d*\.?\d*)\*?x(?:\^(\d+))?$/i
    );

    if (m) {
      let a =
        m[1] === "" || m[1] === "+"
          ? 1
          : m[1] === "-"
            ? -1
            : parseFloat(m[1]);

      const n = m[2] ? parseInt(m[2]) : 1;

      const coef = a * n;

      if (n === 1) {
        out.push(fmt(coef));
      } else if (n - 1 === 0) {
        out.push(fmt(coef));
      } else if (n - 1 === 1) {
        out.push(`${fmt(coef)}x`);
      } else {
        out.push(`${fmt(coef)}x^${n - 1}`);
      }
    } else if (!/[xX]/.test(t) && !/^\d/.test(t)) {
      return null;
    }
  }

  if (!out.length) return null;

  return `Step 1: Write the expression.

${expr}

Step 2: Differentiate each term using:

d/dx (xⁿ) = n xⁿ⁻¹

Step 3: Apply the rule to every term.

Answer:

${out.join(" + ").replace(/\+\s-/g, "- ")}`;
}

function mean(s) {
  if (!/(mean|average)/i.test(s)) return null;

  const nums = s.match(/-?\d+(?:\.\d+)?/g);

  if (!nums || nums.length < 2) return null;

  const values = nums.map(Number);

  const sum = values.reduce(
    (total, value) => total + value,
    0
  );

  const answer = sum / values.length;

  return `Step 1: Add all the values.

Sum = ${fmt(sum)}

Step 2: Count the values.

Number of values = ${values.length}

Step 3: Use the mean formula.

Mean = Sum ÷ Number of values

Mean = ${fmt(sum)} ÷ ${values.length}

Answer: ${fmt(answer)}`;
}

function percentage(s) {
  const m = s.match(
    /(?:what\s+is\s+)?(\d+(?:\.\d+)?)\s*%\s*(?:of)\s*(\d+(?:\.\d+)?)/i
  );

  if (!m) return null;

  const percent = Number(m[1]);
  const number = Number(m[2]);

  const answer = (percent / 100) * number;

  return `Step 1: Write the percentage.

${percent}% = ${percent}/100

Step 2: Multiply by the number.

(${percent}/100) × ${number}

Step 3: Calculate.

Answer: ${fmt(answer)}`;
}

function geometry(s) {
  let m = s.match(
    /(?:area.*circle|circle.*area).*?(?:radius|r)\s*=?\s*(\d+(?:\.\d+)?)/i
  );

  if (m) {
    const r = Number(m[1]);

    return `Formula:

Area of circle = πr²

Given:

r = ${r}

Substitute:

Area = π × ${r}²

Answer:

Area = ${fmt(Math.PI * r * r)} square units`;
  }

  m = s.match(
    /(?:perimeter.*circle|circumference).*?(?:radius|r)\s*=?\s*(\d+(?:\.\d+)?)/i
  );

  if (m) {
    const r = Number(m[1]);

    return `Formula:

Circumference = 2πr

Given:

r = ${r}

Substitute:

2 × π × ${r}

Answer: ${fmt(2 * Math.PI * r)} units`;
  }

  return null;
}

function offlineSolve(question) {
  const q = clean(question);

  return (
    simultaneousEquations(q) ||
    percentage(q) ||
    linear(q) ||
    quadratic(q) ||
    derivative(q) ||
    mean(q) ||
    geometry(q) ||
    arithmetic(q)
  );
}

/* =========================
   ONLINE AI SOLVER
   ========================= */

async function onlineSolve(question, classLevel, mode) {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    30000
  );

  try {
    const response = await fetch("/api/solve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question: question.trim(),
        classLevel,
        mode
      }),
      signal: controller.signal
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error || "Online solver failed."
      );
    }

    if (!data.answer) {
      throw new Error("No answer returned.");
    }

    return data.answer;
  } finally {
    clearTimeout(timeout);
  }
}

/* =========================
   MAIN SOLVE FUNCTION
   ========================= */

async function solve() {
  const question = $("question").value.trim();
  const level = $("level").value;
  const mode = $("mode").value;

  if (!question) {
    $("result").textContent =
      "Please enter a math question.";
    return;
  }

  const selectedMode =
    $("connectionMode")?.value || "auto";

  $("solve").disabled = true;

  $("result").textContent =
    selectedMode === "offline"
      ? "Solving offline..."
      : "Connecting to Math AI...";

  try {
    /* ONLINE */

    if (selectedMode !== "offline") {
      try {
        const answer = await onlineSolve(
          question,
          level,
          mode
        );

        $("result").textContent =
          answer + "\n\n✓ Solved by Online AI";

        $("status").textContent =
          "Online AI";

        return;
      } catch (error) {
        console.warn(
          "Online solver unavailable:",
          error
        );

        if (selectedMode === "online") {
          $("result").textContent =
            "Online AI could not be reached.\n\n" +
            "Check your internet connection and Vercel deployment.\n\n" +
            "Error: " +
            error.message;

          $("status").textContent =
            "Online unavailable";

          return;
        }
      }
    }

    /* OFFLINE FALLBACK */

    const offlineAnswer =
      offlineSolve(question);

    if (offlineAnswer) {
      $("result").textContent =
        offlineAnswer +
        "\n\n✓ Solved using Offline Solver";

      $("status").textContent =
        "Offline Solver";

      return;
    }

    $("result").textContent =
      "I couldn't solve this question with the offline solver.\n\n" +
      "Try Online or Auto mode for broader Class 7–12 question support.";

    $("status").textContent =
      "Not solved";
  } catch (error) {
    $("result").textContent =
      "Something went wrong.\n\n" +
      error.message;

    $("status").textContent =
      "Error";
  } finally {
    $("solve").disabled = false;
  }
}

/* =========================
   UI SETUP
   ========================= */

function setupConnectionMode() {
  if ($("connectionMode")) return;

  const modeSelect = $("mode");

  if (!modeSelect) return;

  const wrapper = document.createElement("div");

  wrapper.style.marginTop = "10px";

  wrapper.innerHTML = `
    <label for="connectionMode">
      Connection
    </label>
    <br>
    <select id="connectionMode">
      <option value="auto" selected>
        Auto — Online + Offline
      </option>
      <option value="online">
        Online AI
      </option>
      <option value="offline">
        Offline
      </option>
    </select>
  `;

  modeSelect.parentElement.parentElement.appendChild(
    wrapper
  );
}

function setupStatus() {
  if ($("status")) return;

  const badge = document.createElement("span");

  badge.id = "status";

  badge.className = "badge";

  badge.textContent = "Ready";

  const badges = document.querySelector(
    ".card p"
  );

  if (badges) {
    badges.appendChild(badge);
  }
}

/* =========================
   BUTTONS
   ========================= */

setupConnectionMode();
setupStatus();

$("solve").onclick = solve;

$("clear").onclick = () => {
  $("question").value = "";

  $("result").textContent =
    "Your step-by-step solution will appear here.";

  if ($("status")) {
    $("status").textContent = "Ready";
  }
};

$("question").addEventListener(
  "keydown",
  event => {
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key === "Enter"
    ) {
      solve();
    }
  }
);

/* =========================
   PWA
   ========================= */

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("sw.js")
    .catch(error =>
      console.warn(
        "Service worker registration failed:",
        error
      )
    );
}

let deferredInstallPrompt = null;

window.addEventListener(
  "beforeinstallprompt",
  event => {
    event.preventDefault();

    deferredInstallPrompt = event;

    const installButton = $("install");

    if (installButton) {
      installButton.style.display =
        "inline-block";
    }
  }
);

if ($("install")) {
  $("install").onclick = async () => {
    if (!deferredInstallPrompt) return;

    deferredInstallPrompt.prompt();

    await deferredInstallPrompt.userChoice;

    deferredInstallPrompt = null;
  };
}
