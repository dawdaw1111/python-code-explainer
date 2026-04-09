(function attachStorage(globalScope) {
  "use strict";

  const STORAGE_KEY = "pyexplain.history.v1";
  const MAX_HISTORY = 10;

  let memoryStateFallback = {
    history: [],
    sampleStats: {}
  };

  function safeJSONParse(text, fallbackValue) {
    try {
      return JSON.parse(text);
    } catch (error) {
      return fallbackValue;
    }
  }

  function cloneState(rawState) {
    return {
      history: Array.isArray(rawState.history) ? rawState.history.map((item) => ({ ...item })) : [],
      sampleStats: rawState.sampleStats && typeof rawState.sampleStats === "object" ? { ...rawState.sampleStats } : {}
    };
  }

  function normalizeHistoryEntry(item) {
    const source = item && typeof item === "object" ? item : {};
    return {
      id: String(source.id || `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`),
      title: String(source.title || "自定义代码"),
      code: String(source.code || ""),
      createdAt: Number(source.createdAt) || Date.now(),
      sampleType: String(source.sampleType || "custom")
    };
  }

  function deriveStatsFromHistory(historyList) {
    const stats = {};
    historyList.forEach((entry) => {
      const sampleType = String(entry.sampleType || "custom");
      stats[sampleType] = (stats[sampleType] || 0) + 1;
    });
    return stats;
  }

  function normalizeState(parsedData) {
    if (Array.isArray(parsedData)) {
      const history = parsedData.map(normalizeHistoryEntry).slice(0, MAX_HISTORY);
      return {
        history,
        sampleStats: deriveStatsFromHistory(history)
      };
    }

    if (!parsedData || typeof parsedData !== "object") {
      return {
        history: [],
        sampleStats: {}
      };
    }

    const rawHistory = Array.isArray(parsedData.history) ? parsedData.history : [];
    const history = rawHistory.map(normalizeHistoryEntry).slice(0, MAX_HISTORY);

    const rawStats = parsedData.sampleStats && typeof parsedData.sampleStats === "object"
      ? parsedData.sampleStats
      : {};

    const sampleStats = {};
    Object.keys(rawStats).forEach((key) => {
      const normalizedKey = String(key);
      const value = Number(rawStats[key]);
      if (value > 0) {
        sampleStats[normalizedKey] = value;
      }
    });

    if (!Object.keys(sampleStats).length) {
      return {
        history,
        sampleStats: deriveStatsFromHistory(history)
      };
    }

    return {
      history,
      sampleStats
    };
  }

  function getState() {
    let raw = null;
    try {
      raw = globalScope.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return cloneState(memoryStateFallback);
    }

    if (!raw) {
      return {
        history: [],
        sampleStats: {}
      };
    }

    const parsed = safeJSONParse(raw, null);
    return normalizeState(parsed);
  }

  function persistState(state) {
    const normalized = normalizeState(state);
    memoryStateFallback = cloneState(normalized);
    try {
      globalScope.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (error) {
      return cloneState(normalized);
    }
    return cloneState(normalized);
  }

  function getHistory() {
    return getState().history;
  }

  function getSampleStats() {
    return getState().sampleStats;
  }

  function getMostUsedSampleType() {
    const sampleStats = getSampleStats();
    let topKey = "";
    let topCount = 0;

    Object.keys(sampleStats).forEach((key) => {
      const count = Number(sampleStats[key]) || 0;
      if (count > topCount) {
        topKey = key;
        topCount = count;
      }
    });

    return {
      type: topKey || "custom",
      count: topCount
    };
  }

  function addHistory(entry) {
    const nextEntry = normalizeHistoryEntry(entry);
    const currentState = getState();
    const deduped = currentState.history.filter((item) => item.code !== nextEntry.code);
    deduped.unshift(nextEntry);

    const nextState = {
      history: deduped.slice(0, MAX_HISTORY),
      sampleStats: {
        ...currentState.sampleStats
      }
    };

    const sampleType = nextEntry.sampleType || "custom";
    nextState.sampleStats[sampleType] = (nextState.sampleStats[sampleType] || 0) + 1;

    return persistState(nextState).history;
  }

  function removeHistory(id) {
    const currentState = getState();
    const filtered = currentState.history.filter((item) => item.id !== id);
    return persistState({
      history: filtered,
      sampleStats: currentState.sampleStats
    }).history;
  }

  function clearHistory() {
    return persistState({
      history: [],
      sampleStats: {}
    }).history;
  }

  globalScope.PyExplainStorage = {
    STORAGE_KEY,
    MAX_HISTORY,
    getState,
    getHistory,
    getSampleStats,
    getMostUsedSampleType,
    addHistory,
    removeHistory,
    clearHistory
  };
})(window);
