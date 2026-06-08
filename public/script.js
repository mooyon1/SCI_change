const inputView = document.querySelector("#inputView");
const resultView = document.querySelector("#resultView");
const form = document.querySelector("#rewriteForm");
const inputCard = document.querySelector("#inputCard");
const sourceText = document.querySelector("#sourceText");
const counter = document.querySelector("#counter");
const submitBtn = document.querySelector("#submitBtn");
const submitText = document.querySelector("#submitText");
const reviewLoader = document.querySelector("#reviewLoader");
const examples = document.querySelector(".examples");
const sourcePreview = document.querySelector("#sourcePreview");
const resultText = document.querySelector("#resultText");
const copyBtn = document.querySelector("#copyBtn");
const regenBtn = document.querySelector("#regenBtn");
const resubmitBtn = document.querySelector("#resubmitBtn");
const acceptBtn = document.querySelector("#acceptBtn");
const rejectBtn = document.querySelector("#rejectBtn");
const editorialText = document.querySelector("#editorialText");
const acceptNote = document.querySelector("#acceptNote");
const editorialCard = document.querySelector(".editorial-card");
const voteBurst = document.querySelector("#voteBurst");
const toast = document.querySelector("#toast");

let latestSource = "";
let latestResult = "";

const cannedResults = new Map([
  [
    "普通人想要翻身，记得买一根一米二的充电线",
    "对普通个体而言，完成处境层面的翻身并不完全取决于主观努力，还受到基础设施条件的制约；其中，一根一米二的充电线构成了提升该行动可达性的关键外部变量。",
  ],
  [
    "今天是星期四，记得 v 我 50",
    "鉴于当前时间节点已进入星期四，信息接收方应重新激活与转账行为相关的行动记忆，并向请求发出方完成 50 元的资金转移。",
  ],
  [
    "一只黄狗因为学会说“这个需求帮我做一下”，成功晋升成了产品经理",
    "该黄狗在掌握“请相关执行主体代为完成该项需求”这一低成本责任外包话语后，成功完成了由动物主体向需求分发型组织角色的制度性跃迁。",
  ],
]);

function updateCounter() {
  counter.textContent = `${sourceText.value.length}/200`;
}

function resizeInput() {
  sourceText.style.height = "auto";
  sourceText.style.height = `${Math.min(sourceText.scrollHeight, 220)}px`;
}

function flashInput() {
  inputCard.classList.remove("is-filled-flash");
  void inputCard.offsetWidth;
  inputCard.classList.add("is-filled-flash");
  window.setTimeout(() => inputCard.classList.remove("is-filled-flash"), 520);
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("is-show");
  window.setTimeout(() => toast.classList.remove("is-show"), 1500);
}

function showInputView() {
  inputView.classList.remove("is-submitting");
  resultView.classList.remove("is-active");
  inputView.classList.add("is-active");
  acceptNote.classList.remove("is-show");
  acceptBtn.classList.remove("is-active");
  rejectBtn.classList.remove("is-active");
  editorialCard.classList.remove("accepted", "rejected");
  voteBurst.classList.remove("is-accept", "is-reject");
  regenBtn.classList.remove("is-loading");
  resultText.classList.remove("is-changing");
  sourceText.focus();
}

function showResultView(source, result) {
  latestSource = source;
  latestResult = result;
  sourcePreview.textContent = source;
  resultText.textContent = result;
  editorialText.textContent = "这稿子有内味儿了。";
  acceptBtn.classList.remove("is-active");
  rejectBtn.classList.remove("is-active");
  editorialCard.classList.remove("accepted", "rejected");
  voteBurst.classList.remove("is-accept", "is-reject");
  acceptNote.classList.remove("is-show");
  inputView.classList.add("is-submitting");
  inputView.classList.remove("is-active");
  window.setTimeout(() => {
    inputView.classList.remove("is-submitting");
    resultView.classList.add("is-active");
  }, 260);
}

async function requestRewrite(text, { useCanned = true } = {}) {
  const cannedResult = useCanned ? cannedResults.get(text) : "";
  if (cannedResult) {
    await new Promise((resolve) => window.setTimeout(resolve, 850));
    return cannedResult;
  }

  const response = await fetch("/api/rewrite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "转译失败");
  }

  return data.result.trim();
}

async function generateResult({ useCanned = true } = {}) {
  const text = sourceText.value.trim();

  if (!text) {
    showToast("先写一句再送审");
    flashInput();
    sourceText.focus();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.classList.add("is-loading");
  inputCard.classList.add("is-reviewing");
  reviewLoader.classList.add("is-show");
  submitText.classList.add("loading-dots");
  submitText.textContent = "送审中";

  try {
    const result = await requestRewrite(text, { useCanned });
    showResultView(text, result);
  } catch (error) {
    showToast(error.message || "转译失败，请稍后再试");
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove("is-loading");
    inputCard.classList.remove("is-reviewing");
    reviewLoader.classList.remove("is-show");
    submitText.classList.remove("loading-dots");
    submitText.textContent = "一键送审";
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  generateResult();
});

examples.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-example]");
  if (!button) return;
  sourceText.value = button.dataset.example;
  updateCounter();
  resizeInput();
  flashInput();
  sourceText.focus();
});

sourceText.addEventListener("input", () => {
  updateCounter();
  resizeInput();
});

copyBtn.addEventListener("click", async () => {
  if (!latestResult) return;
  try {
    await navigator.clipboard.writeText(latestResult);
    copyBtn.textContent = "已复制";
    showToast("已复制");
    window.setTimeout(() => {
      copyBtn.textContent = "复制";
    }, 1100);
  } catch {
    showToast("复制被浏览器拦截，可手动选中");
  }
});

regenBtn.addEventListener("click", async () => {
  if (!latestSource) return;
  regenBtn.classList.add("is-loading");
  resultText.classList.add("is-changing");
  try {
    const result = await requestRewrite(latestSource, { useCanned: false });
    latestResult = result;
    window.setTimeout(() => {
      resultText.textContent = result;
      resultText.classList.remove("is-changing");
    }, 180);
  } catch (error) {
    resultText.classList.remove("is-changing");
    showToast(error.message || "再生成失败");
  } finally {
    regenBtn.classList.remove("is-loading");
  }
});

function resetSubmission() {
  sourceText.value = "";
  latestSource = "";
  latestResult = "";
  updateCounter();
  resizeInput();
  showInputView();
  flashInput();
}

resubmitBtn.addEventListener("click", () => {
  resetSubmission();
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("#resubmitBtn")) return;
  resetSubmission();
});

acceptBtn.addEventListener("click", () => {
  editorialCard.classList.remove("accepted", "rejected");
  voteBurst.classList.remove("is-accept", "is-reject");
  void editorialCard.offsetWidth;
  acceptBtn.classList.add("is-active");
  rejectBtn.classList.remove("is-active");
  editorialCard.classList.add("accepted");
  voteBurst.classList.add("is-accept");
  acceptNote.classList.add("is-show");
  showToast("已过稿，拟同意发表");
});

rejectBtn.addEventListener("click", async () => {
  editorialCard.classList.remove("accepted", "rejected");
  voteBurst.classList.remove("is-accept", "is-reject");
  void editorialCard.offsetWidth;
  rejectBtn.classList.add("is-active");
  acceptBtn.classList.remove("is-active");
  editorialCard.classList.add("rejected");
  voteBurst.classList.add("is-reject");
  acceptNote.classList.remove("is-show");
  showToast("已退稿，正在退修重投...");
  regenBtn.click();
  window.setTimeout(() => {
    rejectBtn.classList.remove("is-active");
    voteBurst.classList.remove("is-reject");
  }, 650);
});

updateCounter();
resizeInput();
