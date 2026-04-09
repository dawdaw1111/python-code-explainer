(function attachRules(globalScope) {
  "use strict";

  const TYPE_META = {
    blank: { label: "空行", className: "type-blank" },
    comment: { label: "注释", className: "type-comment" },
    module: { label: "导入", className: "type-module" },
    class: { label: "类", className: "type-class" },
    decorator: { label: "装饰器", className: "type-function" },
    assignment: { label: "赋值", className: "type-variable" },
    augmented: { label: "运算赋值", className: "type-operator" },
    unpacking: { label: "解包赋值", className: "type-operator" },
    conditional: { label: "条件表达式", className: "type-operator" },
    lambda: { label: "Lambda", className: "type-function" },
    print: { label: "输出", className: "type-output" },
    input: { label: "输入", className: "type-input" },
    if: { label: "判断", className: "type-flow" },
    elif: { label: "分支", className: "type-flow" },
    else: { label: "否则", className: "type-flow" },
    match: { label: "模式匹配", className: "type-flow" },
    case: { label: "匹配分支", className: "type-flow" },
    for: { label: "循环", className: "type-flow" },
    while: { label: "循环", className: "type-flow" },
    break: { label: "跳出循环", className: "type-flow" },
    continue: { label: "继续循环", className: "type-flow" },
    pass: { label: "占位", className: "type-flow" },
    with: { label: "上下文", className: "type-context" },
    try: { label: "异常处理", className: "type-exception" },
    except: { label: "异常处理", className: "type-exception" },
    finally: { label: "异常处理", className: "type-exception" },
    raise: { label: "抛出异常", className: "type-exception" },
    assert: { label: "断言", className: "type-exception" },
    def: { label: "函数", className: "type-function" },
    return: { label: "返回", className: "type-function" },
    yield: { label: "生成值", className: "type-function" },
    list: { label: "列表", className: "type-list" },
    dict: { label: "字典", className: "type-container" },
    set: { label: "集合", className: "type-container" },
    tuple: { label: "元组", className: "type-container" },
    comprehension: { label: "推导式", className: "type-container" },
    index: { label: "索引/切片", className: "type-container" },
    call: { label: "函数调用", className: "type-call" },
    delete: { label: "删除", className: "type-operator" },
    compare: { label: "比较", className: "type-operator" },
    unknown: { label: "未识别", className: "type-unknown" }
  };

  function readableExpression(value) {
    return String(value || "").trim() || "空值";
  }

  function shortText(value, maxLength) {
    const clean = readableExpression(value);
    const len = Number(maxLength) || 34;
    if (clean.length <= len) {
      return clean;
    }
    return `${clean.slice(0, len)}...`;
  }

  function splitArgs(rawArgs) {
    const text = String(rawArgs || "").trim();
    if (!text) {
      return [];
    }
    return text
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function describeRangeArgs(rawArgs) {
    const args = splitArgs(rawArgs);

    if (args.length === 1) {
      return `循环执行 ${args[0]} 次`;
    }
    if (args.length === 2) {
      return `从 ${args[0]} 开始到 ${args[1]} 之前进行循环`;
    }
    if (args.length >= 3) {
      return `从 ${args[0]} 到 ${args[1]}（步长 ${args[2]}）进行循环`;
    }
    return "按范围进行循环";
  }

  function operatorMeaning(operatorToken) {
    const map = {
      "+": "加法并更新",
      "-": "减法并更新",
      "*": "乘法并更新",
      "/": "除法并更新",
      "//": "整除并更新",
      "%": "取余并更新",
      "**": "幂运算并更新",
      "<<": "左移位并更新",
      ">>": "右移位并更新",
      "&": "按位与并更新",
      "|": "按位或并更新",
      "^": "按位异或并更新"
    };
    return map[operatorToken] || "运算并更新";
  }

  function compareMeaning(operatorToken) {
    const map = {
      "==": "是否等于",
      "!=": "是否不等于",
      ">": "是否大于",
      "<": "是否小于",
      ">=": "是否大于等于",
      "<=": "是否小于等于",
      in: "是否包含于",
      "not in": "是否不包含于",
      is: "是否与",
      "is not": "是否不与"
    };
    return map[operatorToken] || "是否满足比较关系";
  }

  const RULES = [
    {
      type: "comment",
      match: /^\s*#(.*)$/,
      explain(match) {
        const text = (match[1] || "").trim();
        return text ? `这是一行注释：${text}` : "这是一行注释，用来说明代码，不会被执行。";
      }
    },
    {
      type: "comment",
      match: /^\s*(?:'''|""")(.*?)(?:'''|""")\s*$/,
      explain(match) {
        const text = shortText(match[1], 40);
        return text ? `这是一行文档字符串，常用于说明模块、类或函数：${text}` : "这是文档字符串，用来补充说明。";
      }
    },
    {
      type: "module",
      match: /^\s*from\s+([a-zA-Z_][\w.]*)\s+import\s+(.+)\s*$/,
      explain(match) {
        return `从模块 ${match[1]} 导入 ${match[2]}，以便后续直接使用。`;
      }
    },
    {
      type: "module",
      match: /^\s*import\s+(.+)\s*$/,
      explain(match) {
        return `导入模块 ${match[1]}，用于扩展当前程序能力。`;
      }
    },
    {
      type: "class",
      match: /^\s*class\s+([a-zA-Z_]\w*)(?:\s*\(([^)]*)\))?\s*:\s*$/,
      explain(match) {
        const className = match[1];
        const base = (match[2] || "").trim();
        if (base) {
          return `定义类 ${className}，继承自 ${base}。`;
        }
        return `定义类 ${className}，用于组织属性和方法。`;
      }
    },
    {
      type: "decorator",
      match: /^\s*@([a-zA-Z_][\w.]*(?:\([^)]*\))?)\s*$/,
      explain(match) {
        return `使用装饰器 @${match[1]}，对下面的函数或方法进行增强。`;
      }
    },
    {
      type: "def",
      match: /^\s*def\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*:\s*$/,
      explain(match) {
        const functionName = match[1];
        const params = (match[2] || "").trim();
        if (params) {
          return `定义函数 ${functionName}，它接收参数：${params}。`;
        }
        return `定义函数 ${functionName}，暂时不接收参数。`;
      }
    },
    {
      type: "lambda",
      match: /^\s*([a-zA-Z_]\w*)\s*=\s*lambda\s*(.*?)\s*:\s*(.+)\s*$/,
      explain(match) {
        const variable = match[1];
        const args = shortText(match[2] || "无参数");
        const expression = shortText(match[3]);
        return `定义匿名函数并保存到变量 ${variable}，参数为 ${args}，返回表达式 ${expression}。`;
      }
    },
    {
      type: "return",
      match: /^\s*return(?:\s+(.+))?\s*$/,
      explain(match) {
        const value = readableExpression(match[1] || "");
        return `把 ${value} 作为函数结果返回。`;
      }
    },
    {
      type: "yield",
      match: /^\s*yield(?:\s+(.+))?\s*$/,
      explain(match) {
        const value = readableExpression(match[1] || "");
        return `生成一个值 ${value} 并暂停当前生成器，下次继续从这里往下执行。`;
      }
    },
    {
      type: "if",
      match: /^\s*if\s+(.+)\s*:\s*$/,
      explain(match) {
        return `判断条件“${readableExpression(match[1])}”是否成立，成立则执行缩进代码。`;
      }
    },
    {
      type: "elif",
      match: /^\s*elif\s+(.+)\s*:\s*$/,
      explain(match) {
        return `如果前面的判断未命中，再判断“${readableExpression(match[1])}”。`;
      }
    },
    {
      type: "else",
      match: /^\s*else\s*:\s*$/,
      explain() {
        return "当前面的条件都不成立时，执行这里的代码。";
      }
    },
    {
      type: "match",
      match: /^\s*match\s+(.+)\s*:\s*$/,
      explain(match) {
        return `开始对 ${shortText(match[1])} 做模式匹配，不同 case 会命中不同分支。`;
      }
    },
    {
      type: "case",
      match: /^\s*case\s+(.+)\s*:\s*$/,
      explain(match) {
        return `定义一个匹配分支：当模式命中 ${shortText(match[1])} 时执行此分支。`;
      }
    },
    {
      type: "try",
      match: /^\s*try\s*:\s*$/,
      explain() {
        return "开始异常处理块：先执行 try 中的代码，发生异常再交给 except。";
      }
    },
    {
      type: "except",
      match: /^\s*except(?:\s+(.+?))?\s*:\s*$/,
      explain(match) {
        const target = (match[1] || "").trim();
        if (target) {
          return `捕获异常 ${target}，用于处理 try 中可能出现的问题。`;
        }
        return "捕获所有未被提前处理的异常。";
      }
    },
    {
      type: "finally",
      match: /^\s*finally\s*:\s*$/,
      explain() {
        return "无论是否出错，finally 中的代码都会执行。";
      }
    },
    {
      type: "raise",
      match: /^\s*raise(?:\s+(.+))?\s*$/,
      explain(match) {
        const target = (match[1] || "").trim();
        if (target) {
          return `主动抛出异常：${target}。`;
        }
        return "重新抛出当前捕获到的异常。";
      }
    },
    {
      type: "assert",
      match: /^\s*assert\s+(.+?)(?:\s*,\s*(.+))?\s*$/,
      explain(match) {
        const condition = shortText(match[1]);
        const message = (match[2] || "").trim();
        if (message) {
          return `断言条件 ${condition} 必须为真，否则抛出异常并提示 ${message}。`;
        }
        return `断言条件 ${condition} 必须为真，否则抛出异常。`;
      }
    },
    {
      type: "with",
      match: /^\s*with\s+(.+)\s*:\s*$/,
      explain(match) {
        return `进入上下文管理：${shortText(match[1], 40)}，结束后会自动做清理动作（如自动关闭文件）。`;
      }
    },
    {
      type: "for",
      match: /^\s*for\s+([a-zA-Z_]\w*)\s*,\s*([a-zA-Z_]\w*)\s+in\s+enumerate\((.+)\)\s*:\s*$/,
      explain(match) {
        return `遍历 ${shortText(match[3])}，${match[1]} 表示索引，${match[2]} 表示当前元素。`;
      }
    },
    {
      type: "for",
      match: /^\s*for\s+(.+?)\s+in\s+zip\((.+)\)\s*:\s*$/,
      explain(match) {
        return `使用 zip 并行遍历多个序列，并把每轮结果解包到 ${shortText(match[1])}。`;
      }
    },
    {
      type: "for",
      match: /^\s*for\s+(.+?)\s+in\s+range\s*\(([^)]*)\)\s*:\s*$/,
      explain(match) {
        const variable = match[1];
        const args = match[2] || "";
        return `${describeRangeArgs(args)}，每轮把当前值赋给变量 ${variable}。`;
      }
    },
    {
      type: "for",
      match: /^\s*for\s+([a-zA-Z_]\w*)\s+in\s+(.+)\s*:\s*$/,
      explain(match) {
        return `遍历 ${readableExpression(match[2])}，每轮把元素赋给变量 ${match[1]}。`;
      }
    },
    {
      type: "while",
      match: /^\s*while\s+(.+)\s*:\s*$/,
      explain(match) {
        return `只要条件“${readableExpression(match[1])}”为真，就会持续循环执行。`;
      }
    },
    {
      type: "break",
      match: /^\s*break\s*$/,
      explain() {
        return "立即结束当前循环，不再执行后续轮次。";
      }
    },
    {
      type: "continue",
      match: /^\s*continue\s*$/,
      explain() {
        return "跳过本轮循环剩余代码，直接进入下一轮。";
      }
    },
    {
      type: "pass",
      match: /^\s*pass\s*$/,
      explain() {
        return "占位语句，表示这里暂时不执行任何操作。";
      }
    },
    {
      type: "delete",
      match: /^\s*del\s+(.+)\s*$/,
      explain(match) {
        return `删除对象或元素：${shortText(match[1])}。`;
      }
    },
    {
      type: "input",
      match: /^\s*([a-zA-Z_]\w*)\s*=\s*input\s*\((.*)\)\s*$/,
      explain(match) {
        const variable = match[1];
        const promptText = (match[2] || "").trim();
        if (promptText) {
          return `让用户输入内容（提示：${promptText}），并把结果保存到变量 ${variable}。`;
        }
        return `让用户输入内容，并把结果保存到变量 ${variable}。`;
      }
    },
    {
      type: "print",
      match: /^\s*print\s*\((.*)\)\s*$/,
      explain(match) {
        const value = readableExpression(match[1]);
        return `把 ${value} 打印到屏幕上。`;
      }
    },
    {
      type: "comprehension",
      match: /^\s*([a-zA-Z_]\w*)\s*=\s*\[(.+\s+for\s+.+)\]\s*$/,
      explain(match) {
        return `使用列表推导式生成新列表，并保存到 ${match[1]}。`;
      }
    },
    {
      type: "comprehension",
      match: /^\s*([a-zA-Z_]\w*)\s*=\s*\{(.+:\s*.+\s+for\s+.+)\}\s*$/,
      explain(match) {
        return `使用字典推导式生成新字典，并保存到 ${match[1]}。`;
      }
    },
    {
      type: "comprehension",
      match: /^\s*([a-zA-Z_]\w*)\s*=\s*\{(.+\s+for\s+.+)\}\s*$/,
      explain(match) {
        return `使用集合推导式生成新集合，并保存到 ${match[1]}。`;
      }
    },
    {
      type: "conditional",
      match: /^\s*([a-zA-Z_]\w*)\s*=\s*(.+)\s+if\s+(.+)\s+else\s+(.+)\s*$/,
      explain(match) {
        return `条件表达式赋值：当 ${shortText(match[3])} 成立时取 ${shortText(match[2])}，否则取 ${shortText(match[4])}，最终保存到 ${match[1]}。`;
      }
    },
    {
      type: "augmented",
      match: /^\s*([a-zA-Z_]\w*)\s*(\/\/|\*\*|<<|>>|[+\-*/%&|^])=\s*(.+)\s*$/,
      explain(match) {
        const variable = match[1];
        const operatorToken = match[2];
        const rightValue = shortText(match[3]);
        return `对变量 ${variable} 执行“${operatorMeaning(operatorToken)}”操作，右侧值为 ${rightValue}。`;
      }
    },
    {
      type: "unpacking",
      match: /^\s*([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)+)\s*=\s*(.+)\s*$/,
      explain(match) {
        return `把 ${shortText(match[2], 42)} 的多个值，按顺序解包赋值给 ${match[1]}。`;
      }
    },
    {
      type: "assignment",
      match: /^\s*([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w+)+)\s*=\s*(.+)\s*$/,
      explain(match) {
        return `把 ${shortText(match[2], 36)} 的结果赋值给对象属性 ${match[1]}。`;
      }
    },
    {
      type: "list",
      match: /^\s*([a-zA-Z_]\w*)\s*=\s*\[(.*)\]\s*$/,
      explain(match) {
        const listName = match[1];
        const rawItems = (match[2] || "").trim();
        if (!rawItems) {
          return `创建空列表，并保存到变量 ${listName}。`;
        }
        return `创建列表 [${rawItems}]，并保存到变量 ${listName}。`;
      }
    },
    {
      type: "dict",
      match: /^\s*([a-zA-Z_]\w*)\s*=\s*\{\s*\}\s*$/,
      explain(match) {
        return `创建空字典，并保存到变量 ${match[1]}。`;
      }
    },
    {
      type: "dict",
      match: /^\s*([a-zA-Z_]\w*)\s*=\s*\{(.*:.*)\}\s*$/,
      explain(match) {
        const variable = match[1];
        const body = (match[2] || "").trim();
        return `创建字典 {${shortText(body, 48)}}，并保存到变量 ${variable}。`;
      }
    },
    {
      type: "set",
      match: /^\s*([a-zA-Z_]\w*)\s*=\s*\{(.+)\}\s*$/,
      explain(match) {
        const variable = match[1];
        const body = (match[2] || "").trim();
        return `创建集合 {${shortText(body, 48)}}，并保存到变量 ${variable}。`;
      }
    },
    {
      type: "set",
      match: /^\s*([a-zA-Z_]\w*)\s*=\s*set\s*\((.*)\)\s*$/,
      explain(match) {
        const param = (match[2] || "").trim();
        if (param) {
          return `通过 set(${param}) 创建集合并保存到变量 ${match[1]}。`;
        }
        return `创建空集合并保存到变量 ${match[1]}。`;
      }
    },
    {
      type: "tuple",
      match: /^\s*([a-zA-Z_]\w*)\s*=\s*\(\s*\)\s*$/,
      explain(match) {
        return `创建空元组，并保存到变量 ${match[1]}。`;
      }
    },
    {
      type: "tuple",
      match: /^\s*([a-zA-Z_]\w*)\s*=\s*\((.+,.+)\)\s*$/,
      explain(match) {
        return `创建元组 (${shortText(match[2], 48)})，并保存到变量 ${match[1]}。`;
      }
    },
    {
      type: "list",
      match: /^\s*([a-zA-Z_]\w*)\.append\s*\((.*)\)\s*$/,
      explain(match) {
        return `向列表 ${match[1]} 末尾追加元素 ${readableExpression(match[2])}。`;
      }
    },
    {
      type: "list",
      match: /^\s*([a-zA-Z_]\w*)\.pop\s*\((.*)\)\s*$/,
      explain(match) {
        const param = (match[2] || "").trim();
        if (!param) {
          return `从列表 ${match[1]} 末尾移除一个元素。`;
        }
        return `从列表 ${match[1]} 中移除索引为 ${param} 的元素。`;
      }
    },
    {
      type: "list",
      match: /^\s*([a-zA-Z_]\w*)\.(extend|insert|remove|clear|sort|reverse)\s*\((.*)\)\s*$/,
      explain(match) {
        const listName = match[1];
        const method = match[2];
        const args = shortText(match[3], 36);
        const methodMap = {
          extend: `把多个元素追加到列表 ${listName} 末尾`,
          insert: `在列表 ${listName} 指定位置插入元素`,
          remove: `从列表 ${listName} 中删除指定值`,
          clear: `清空列表 ${listName}`,
          sort: `对列表 ${listName} 原地排序`,
          reverse: `把列表 ${listName} 原地反转`
        };
        const prefix = methodMap[method] || `调用列表 ${listName} 的 ${method} 方法`;
        if (args === "空值") {
          return `${prefix}。`;
        }
        return `${prefix}，参数为 ${args}。`;
      }
    },
    {
      type: "dict",
      match: /^\s*([a-zA-Z_]\w*)\.(get|keys|values|items|update|pop|setdefault)\s*\((.*)\)\s*$/,
      explain(match) {
        const dictName = match[1];
        const method = match[2];
        const args = shortText(match[3], 36);
        const methodMap = {
          get: `从字典 ${dictName} 读取指定键的值`,
          keys: `获取字典 ${dictName} 的全部键`,
          values: `获取字典 ${dictName} 的全部值`,
          items: `获取字典 ${dictName} 的键值对`,
          update: `用新数据更新字典 ${dictName}`,
          pop: `从字典 ${dictName} 删除并返回指定键`,
          setdefault: `若键不存在，则在字典 ${dictName} 中写入默认值`
        };
        const prefix = methodMap[method] || `调用字典 ${dictName} 的 ${method} 方法`;
        if (args === "空值") {
          return `${prefix}。`;
        }
        return `${prefix}，参数为 ${args}。`;
      }
    },
    {
      type: "index",
      match: /^\s*([a-zA-Z_]\w*)\[(.+)\]\s*=\s*(.+)\s*$/,
      explain(match) {
        return `把 ${shortText(match[3], 28)} 赋值给 ${match[1]} 的索引/键 ${shortText(match[2], 20)}。`;
      }
    },
    {
      type: "index",
      match: /^\s*([a-zA-Z_]\w*)\s*=\s*([a-zA-Z_]\w*)\[(.+)\]\s*$/,
      explain(match) {
        return `从 ${match[2]} 的索引/键 ${shortText(match[3], 20)} 读取值，并保存到变量 ${match[1]}。`;
      }
    },
    {
      type: "call",
      match: /^\s*([a-zA-Z_]\w*)\s*=\s*([a-zA-Z_][\w.]*)\((.*)\)\s*$/,
      explain(match) {
        const variable = match[1];
        const functionName = match[2];
        const args = splitArgs(match[3]);
        if (args.length > 0) {
          return `调用函数 ${functionName}（参数 ${args.join("、")}），并把结果保存到 ${variable}。`;
        }
        return `调用函数 ${functionName}，并把返回结果保存到 ${variable}。`;
      }
    },
    {
      type: "compare",
      match: /^\s*(.+?)\s*(==|!=|>=|<=|>|<)\s*(.+)\s*$/,
      explain(match) {
        const left = shortText(match[1], 20);
        const operatorToken = match[2];
        const right = shortText(match[3], 20);
        return `比较 ${left} ${compareMeaning(operatorToken)} ${right}。`;
      }
    },
    {
      type: "compare",
      match: /^\s*(.+?)\s+(not in|in|is not|is)\s+(.+)\s*$/,
      explain(match) {
        const left = shortText(match[1], 20);
        const operatorToken = match[2];
        const right = shortText(match[3], 20);
        return `比较 ${left} ${compareMeaning(operatorToken)} ${right}。`;
      }
    },
    {
      type: "call",
      match: /^\s*([a-zA-Z_][\w.]*)\((.*)\)\s*$/,
      explain(match) {
        const functionName = match[1];
        const args = splitArgs(match[2]);
        if (args.length > 0) {
          return `调用函数/方法 ${functionName}，参数为 ${args.join("、")}。`;
        }
        return `调用函数/方法 ${functionName}，不传入额外参数。`;
      }
    },
    {
      type: "assignment",
      match: /^\s*([a-zA-Z_]\w*)\s*=\s*(.+)$/,
      explain(match) {
        return `把 ${readableExpression(match[2])} 的结果保存到变量 ${match[1]}。`;
      }
    }
  ];

  const EXAMPLES = {
    output: {
      title: "输出示例",
      code: 'name = "Python"\nprint(name)\nprint("学习继续加油")'
    },
    input: {
      title: "输入示例",
      code: 'name = input("请输入姓名：")\nprint("你好，" + name)'
    },
    loop: {
      title: "循环示例",
      code: "for i in range(3):\n    print(i)"
    },
    ifelse: {
      title: "判断示例",
      code: 'score = 92\nif score > 90:\n    print("优秀")\nelse:\n    print("继续加油")'
    },
    advanced: {
      title: "进阶示例",
      code: 'from statistics import mean\nscores = [90, 88, 95]\navg = mean(scores)\nif avg >= 90:\n    print("优秀班级")'
    },
    exception: {
      title: "异常处理示例",
      code: 'try:\n    file = open("demo.txt", "r", encoding="utf-8")\n    print(file.read())\nexcept FileNotFoundError:\n    print("文件不存在")\nfinally:\n    print("流程结束")'
    }
  };

  globalScope.PYEXPLAIN_TYPE_META = TYPE_META;
  globalScope.PYEXPLAIN_RULES = RULES;
  globalScope.PYEXPLAIN_EXAMPLES = EXAMPLES;
})(window);
