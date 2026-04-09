(function runApp(globalScope, documentRef) {
  "use strict";

  const state = {
    selectedExample: "custom",
    currentParsed: null,
    history: [],
    sampleStats: {}
  };

  const dom = {
    codeInput: documentRef.getElementById("codeInput"),
    explainBtn: documentRef.getElementById("explainBtn"),
    clearInputBtn: documentRef.getElementById("clearInputBtn"),
    rerunBtn: documentRef.getElementById("rerunBtn"),
    clearResultBtn: documentRef.getElementById("clearResultBtn"),
    sourcePreview: documentRef.getElementById("sourcePreview"),
    explanationList: documentRef.getElementById("explanationList"),
    summaryCard: documentRef.getElementById("summaryCard"),
    summaryText: documentRef.getElementById("summaryText"),
    emptyResultHint: documentRef.getElementById("emptyResultHint"),
    historyList: documentRef.getElementById("historyList"),
    quickHistoryList: documentRef.getElementById("quickHistoryList"),
    sampleUsageHint: documentRef.getElementById("sampleUsageHint"),
    historyMeta: documentRef.getElementById("historyMeta"),
    clearHistoryBtn: documentRef.getElementById("clearHistoryBtn"),
    tabExplain: documentRef.getElementById("tabExplain"),
    tabHistory: documentRef.getElementById("tabHistory"),
    explainView: documentRef.getElementById("explainView"),
    historyView: documentRef.getElementById("historyView"),
    backToInput: documentRef.getElementById("backToInput"),
    quickToHistory: documentRef.getElementById("quickToHistory"),
    sampleButtons: Array.from(documentRef.querySelectorAll(".sample-btn"))
  };

  function escapeHTML(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatTime(timestamp) {
    const dateObj = new Date(timestamp);
    if (Number.isNaN(dateObj.getTime())) {
      return "刚刚";
    }

    const now = Date.now();
    const diff = now - dateObj.getTime();
    if (diff >= 0 && diff < 60 * 1000) {
      return "刚刚";
    }
    if (diff >= 0 && diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))}分钟前`;
    }
    if (diff >= 0 && diff < 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
    }
    if (diff >= 0 && diff < 7 * 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`;
    }

    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
  }

  function getSampleTypeLabel(sampleType) {
    if (sampleType === "custom") {
      return "自定义代码";
    }
    const examples = globalScope.PYEXPLAIN_EXAMPLES || {};
    if (examples[sampleType] && examples[sampleType].title) {
      return examples[sampleType].title;
    }
    return sampleType;
  }

  function deriveTitle(codeText, sampleType) {
    const examples = globalScope.PYEXPLAIN_EXAMPLES || {};
    if (sampleType && examples[sampleType]) {
      return examples[sampleType].title;
    }

    const firstMeaningfulLine = String(codeText || "")
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0);

    if (!firstMeaningfulLine) {
      return "空代码";
    }
    if (firstMeaningfulLine.length <= 18) {
      return firstMeaningfulLine;
    }
    return `${firstMeaningfulLine.slice(0, 18)}...`;
  }

  function getTypeMeta(type) {
    const metaMap = globalScope.PYEXPLAIN_TYPE_META || {};
    return metaMap[type] || metaMap.unknown || { label: "未识别", className: "type-unknown" };
  }

  function renderSourcePreview(codeText) {
    const hasCode = String(codeText || "").trim().length > 0;
    dom.sourcePreview.textContent = hasCode ? codeText : "等待输入代码...";
  }

  function renderExplanation(parsedResult) {
    const rows = parsedResult ? parsedResult.lines : [];
    dom.explanationList.innerHTML = "";

    if (!rows || !rows.length) {
      dom.emptyResultHint.hidden = false;
      dom.summaryCard.hidden = true;
      dom.summaryText.textContent = "";
      return;
    }

    dom.emptyResultHint.hidden = true;

    const rowHTML = rows
      .map((line) => {
        const meta = getTypeMeta(line.type);
        return `
          <li class="line-card">
            <div class="line-meta">
              <span class="line-number">第 ${line.lineNumber} 行</span>
              <span class="type-pill ${meta.className}">${meta.label}</span>
            </div>
            <pre class="line-code">${escapeHTML(line.raw || "(空行)")}</pre>
            <p class="line-explanation">${escapeHTML(line.explanation)}</p>
          </li>
        `;
      })
      .join("");

    dom.explanationList.innerHTML = rowHTML;

    if (parsedResult.summary) {
      dom.summaryText.textContent = parsedResult.summary;
      dom.summaryCard.hidden = false;
    } else {
      dom.summaryCard.hidden = true;
    }
  }

  function buildHistoryItemHTML(item, compactMode) {
    const safeCode = escapeHTML(item.code || "");
    const title = escapeHTML(item.title || "未命名");
    const timeText = formatTime(item.createdAt);

    return `
      <li class="history-item" data-history-id="${item.id}">
        <div class="history-item-head">
          <p class="history-title">${title}</p>
          <span class="history-time">${timeText}</span>
        </div>
        <pre class="history-code">${safeCode}</pre>
        <div class="history-actions">
          <button type="button" class="history-btn load" data-action="load">${compactMode ? "恢复" : "恢复到输入区"}</button>
          <button type="button" class="history-btn delete" data-action="delete">删除</button>
        </div>
      </li>
    `;
  }

  function renderHistory() {
    const history = state.history;
    const emptyHTML = '<li class="empty-history">还没有历史记录，先解释一段代码吧。</li>';

    if (dom.historyMeta) {
      dom.historyMeta.textContent = `已保存 ${history.length} 条记录`;
    }

    if (!history.length) {
      dom.historyList.innerHTML = emptyHTML;
      dom.quickHistoryList.innerHTML = emptyHTML;
      return;
    }

    dom.historyList.innerHTML = history.map((item) => buildHistoryItemHTML(item, false)).join("");
    dom.quickHistoryList.innerHTML = history
      .slice(0, 3)
      .map((item) => buildHistoryItemHTML(item, true))
      .join("");
  }

  function renderUsageHint() {
    if (!dom.sampleUsageHint) {
      return;
    }

    const stats = state.sampleStats || {};
    const sorted = Object.keys(stats)
      .map((key) => ({ type: key, count: Number(stats[key]) || 0 }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);

    if (!sorted.length) {
      dom.sampleUsageHint.textContent = "历史会记录你最近 10 次解释。";
      return;
    }

    const top = sorted[0];
    dom.sampleUsageHint.textContent = `最常使用：${getSampleTypeLabel(top.type)}（${top.count} 次）`;
  }

  function setTab(tabName) {
    const isExplain = tabName === "explain";
    dom.tabExplain.classList.toggle("active", isExplain);
    dom.tabHistory.classList.toggle("active", !isExplain);
    dom.tabExplain.setAttribute("aria-selected", String(isExplain));
    dom.tabHistory.setAttribute("aria-selected", String(!isExplain));
    dom.explainView.hidden = !isExplain;
    dom.historyView.hidden = isExplain;
    dom.explainView.classList.toggle("active", isExplain);
    dom.historyView.classList.toggle("active", !isExplain);
  }

  function executeExplain(saveHistory) {
    const codeText = dom.codeInput.value || "";
    const trimmed = codeText.trim();

    if (!trimmed) {
      renderSourcePreview("");
      renderExplanation(null);
      return;
    }

    const parsed = globalScope.PyExplainParser.analyzeCode(codeText);
    state.currentParsed = parsed;
    renderSourcePreview(codeText);
    renderExplanation(parsed);
    setTab("explain");

    if (saveHistory) {
      const newHistory = globalScope.PyExplainStorage.addHistory({
        title: deriveTitle(codeText, state.selectedExample),
        code: codeText,
        createdAt: Date.now(),
        sampleType: state.selectedExample
      });
      state.history = newHistory;
      state.sampleStats = globalScope.PyExplainStorage.getSampleStats();
      renderHistory();
      renderUsageHint();
    }
  }

  function updateHistoryFromStorage() {
    state.history = globalScope.PyExplainStorage.getHistory();
    state.sampleStats = globalScope.PyExplainStorage.getSampleStats();
    renderHistory();
    renderUsageHint();
  }

  function loadHistoryToInput(historyId) {
    const historyItem = state.history.find((item) => item.id === historyId);
    if (!historyItem) {
      return;
    }

    dom.codeInput.value = historyItem.code || "";
    state.selectedExample = historyItem.sampleType || "custom";
    executeExplain(false);
    setTab("explain");
  }

  function deleteHistoryById(historyId) {
    const next = globalScope.PyExplainStorage.removeHistory(historyId);
    state.history = next;
    state.sampleStats = globalScope.PyExplainStorage.getSampleStats();
    renderHistory();
    renderUsageHint();
  }

  function clearAllHistory() {
    globalScope.PyExplainStorage.clearHistory();
    updateHistoryFromStorage();
  }

  function onHistoryListClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const item = event.target.closest("[data-history-id]");
    if (!item) {
      return;
    }

    const historyId = item.getAttribute("data-history-id");
    const action = button.getAttribute("data-action");
    if (action === "load") {
      loadHistoryToInput(historyId);
      return;
    }
    if (action === "delete") {
      deleteHistoryById(historyId);
    }
  }

  function bindSampleButtons() {
    const examples = globalScope.PYEXPLAIN_EXAMPLES || {};
    dom.sampleButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const exampleKey = button.getAttribute("data-example") || "";
        const example = examples[exampleKey];
        if (!example) {
          return;
        }
        state.selectedExample = exampleKey;
        dom.codeInput.value = example.code;
        renderSourcePreview(example.code);
        setTab("explain");
      });
    });
  }

  function bindEvents() {
    bindSampleButtons();

    dom.explainBtn.addEventListener("click", () => executeExplain(true));
    dom.rerunBtn.addEventListener("click", () => executeExplain(true));

    dom.clearInputBtn.addEventListener("click", () => {
      state.selectedExample = "custom";
      dom.codeInput.value = "";
      renderSourcePreview("");
    });

    dom.clearResultBtn.addEventListener("click", () => {
      state.currentParsed = null;
      renderSourcePreview("");
      renderExplanation(null);
    });

    dom.codeInput.addEventListener("input", () => {
      state.selectedExample = "custom";
    });

    dom.tabExplain.addEventListener("click", () => setTab("explain"));
    dom.tabHistory.addEventListener("click", () => setTab("history"));
    dom.quickToHistory.addEventListener("click", () => setTab("history"));
    dom.backToInput.addEventListener("click", () => {
      dom.codeInput.focus();
      dom.codeInput.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    dom.historyList.addEventListener("click", onHistoryListClick);
    dom.quickHistoryList.addEventListener("click", onHistoryListClick);
    if (dom.clearHistoryBtn) {
      dom.clearHistoryBtn.addEventListener("click", () => {
        const shouldClear = globalScope.confirm("确认清空全部历史记录吗？");
        if (!shouldClear) {
          return;
        }
        clearAllHistory();
      });
    }
  }

  function init() {
    bindEvents();
    updateHistoryFromStorage();
    setTab("explain");

    const examples = globalScope.PYEXPLAIN_EXAMPLES || {};
    if (examples.loop && !dom.codeInput.value.trim()) {
      state.selectedExample = "loop";
      dom.codeInput.value = examples.loop.code;
      renderSourcePreview(examples.loop.code);
    } else {
      renderSourcePreview(dom.codeInput.value);
    }

    renderExplanation(null);
  }

  documentRef.addEventListener("DOMContentLoaded", init);
})(window, document);
