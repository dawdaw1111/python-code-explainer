(function attachParser(globalScope) {
  "use strict";

  function findFirstRuleMatch(rawLine) {
    const rules = globalScope.PYEXPLAIN_RULES || [];
    for (let i = 0; i < rules.length; i += 1) {
      const rule = rules[i];
      const matched = rawLine.match(rule.match);
      if (matched) {
        return {
          type: rule.type,
          explanation: rule.explain(matched),
          matched
        };
      }
    }
    return null;
  }

  function classifyLine(rawLine, lineNumber) {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      return {
        lineNumber,
        raw: rawLine,
        type: "blank",
        explanation: "这一行是空行，主要用于分段或提升可读性。"
      };
    }

    const ruleResult = findFirstRuleMatch(rawLine);
    if (ruleResult) {
      return {
        lineNumber,
        raw: rawLine,
        type: ruleResult.type,
        explanation: ruleResult.explanation
      };
    }

    return {
      lineNumber,
      raw: rawLine,
      type: "unknown",
      explanation: "这行语句暂未命中当前扩展规则，建议结合上下文理解其作用。"
    };
  }

  function countByType(results) {
    return results.reduce((counter, item) => {
      counter[item.type] = (counter[item.type] || 0) + 1;
      return counter;
    }, {});
  }

  function countGroup(countMap, typeList) {
    return typeList.reduce((sum, key) => sum + (countMap[key] || 0), 0);
  }

  function makeSummary(results) {
    const usefulRows = results.filter((item) => item.type !== "blank");
    if (!usefulRows.length) {
      return "当前内容只有空行，建议先输入一段 Python 代码。";
    }

    const counts = countByType(usefulRows);
    const parts = [];

    const moduleCount = counts.module || 0;
    if (moduleCount) {
      parts.push(`导入了 ${moduleCount} 行模块/依赖`);
    }

    const classCount = counts.class || 0;
    if (classCount) {
      parts.push(`定义了 ${classCount} 个类结构`);
    }

    if (counts.input) {
      parts.push(`包含 ${counts.input} 行输入语句`);
    }

    const assignCount = countGroup(counts, ["assignment", "augmented", "unpacking", "conditional", "delete", "index"]);
    if (assignCount) {
      parts.push(`包含 ${assignCount} 处赋值或数据更新`);
    }

    const containerCount = countGroup(counts, ["list", "dict", "set", "tuple", "comprehension", "index"]);
    if (containerCount) {
      parts.push(`涉及 ${containerCount} 处容器（列表/字典/集合/元组）操作`);
    }

    const outputCount = counts.print || 0;
    if (outputCount) {
      parts.push(`会输出 ${outputCount} 行信息`);
    }

    const callCount = counts.call || 0;
    if (callCount) {
      parts.push(`包含 ${callCount} 处函数/方法调用`);
    }

    const loopCount = (counts.for || 0) + (counts.while || 0);
    if (loopCount > 0) {
      parts.push(`包含 ${loopCount} 处循环逻辑`);
    }

    const controlCount = (counts.break || 0) + (counts.continue || 0) + (counts.pass || 0);
    if (controlCount > 0) {
      parts.push(`有 ${controlCount} 处流程控制语句`);
    }

    const branchCount = (counts.if || 0) + (counts.elif || 0) + (counts.else || 0) + (counts.match || 0) + (counts.case || 0);
    if (branchCount > 0) {
      parts.push(`包含 ${branchCount} 处分支判断`);
    }

    const functionCount = (counts.decorator || 0) + (counts.def || 0) + (counts.lambda || 0) + (counts.return || 0) + (counts.yield || 0);
    if (functionCount > 0) {
      parts.push(`涉及 ${functionCount} 行函数定义或返回逻辑`);
    }

    const exceptionCount = (counts.try || 0) + (counts.except || 0) + (counts.finally || 0) + (counts.raise || 0) + (counts.assert || 0);
    if (exceptionCount > 0) {
      parts.push(`包含 ${exceptionCount} 处异常处理相关语句`);
    }

    if (counts.with) {
      parts.push(`使用了 ${counts.with} 处上下文管理`);
    }

    if (counts.compare) {
      parts.push(`出现了 ${counts.compare} 行显式比较表达式`);
    }

    if (counts.comment) {
      parts.push(`带有 ${counts.comment} 行注释说明`);
    }

    if (counts.unknown) {
      parts.push(`有 ${counts.unknown} 行暂未完全识别，已做保底解释`);
    }

    if (!parts.length) {
      return "这段代码结构较简单，主要由基础语句组成。";
    }

    return `这段代码${parts.join("，")}。`;
  }

  function analyzeCode(rawCode) {
    const safeCode = String(rawCode || "").replace(/\r\n/g, "\n");
    const lines = safeCode.split("\n");
    const lineResults = lines.map((line, index) => classifyLine(line, index + 1));

    return {
      lines: lineResults,
      summary: makeSummary(lineResults)
    };
  }

  globalScope.PyExplainParser = {
    analyzeCode,
    classifyLine,
    makeSummary
  };
})(window);
