const form = document.querySelector("#rewriteForm");
const sourceText = document.querySelector("#sourceText");
const submitBtn = document.querySelector("#submitBtn");
const resultText = document.querySelector("#resultText");
const copyBtn = document.querySelector("#copyBtn");
const toast = document.querySelector("#toast");
const output = document.querySelector(".output");
const examples = document.querySelector(".examples");

let latestResult = "";

function setResult(text, state = "ready") {
  resultText.textContent = text;
  resultText.classList.toggle("placeholder", state === "placeholder");
  resultText.classList.toggle("error", state === "error");
  output.classList.toggle("loading", state === "loading");
  output.classList.toggle("has-result", state === "ready");
  copyBtn.disabled = state !== "ready";
  latestResult = state === "ready" ? text : "";
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1200);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = sourceText.value.trim();

  if (!text) {
    setResult("先输入一句要转译的内容。", "error");
    sourceText.focus();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "转译中";
  setResult("转译中", "loading");

  try {
    const response = await fetch("/api/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "转译失败");
    }

    setResult(data.result.trim(), "ready");
  } catch (error) {
    setResult(error.message || "转译失败，请稍后再试。", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "转译";
  }
});

copyBtn.addEventListener("click", async () => {
  if (!latestResult) return;
  try {
    await navigator.clipboard.writeText(latestResult);
    showToast("已复制");
  } catch {
    showToast("复制被浏览器拦截，可手动选中");
  }
});

examples.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-example]");
  if (!button) return;
  examples.querySelectorAll("button").forEach((item) => item.classList.remove("picked"));
  button.classList.add("picked");
  sourceText.value = button.dataset.example;
  resizeInput();
  sourceText.focus();
});

function resizeInput() {
  sourceText.style.height = "auto";
  sourceText.style.height = `${Math.min(sourceText.scrollHeight, 260)}px`;
}

sourceText.addEventListener("input", () => {
  examples.querySelectorAll("button").forEach((item) => item.classList.remove("picked"));
  resizeInput();
});

window.addEventListener("pointermove", (event) => {
  const x = Math.round((event.clientX / window.innerWidth) * 100);
  const y = Math.round((event.clientY / window.innerHeight) * 100);
  document.body.style.setProperty("--mx", `${x}%`);
  document.body.style.setProperty("--my", `${y}%`);
});
