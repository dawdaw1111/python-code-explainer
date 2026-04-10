<div align="center">

# PyExplain Lite
### Python 代码解释器（逐行中文解释）

![Platform](https://img.shields.io/badge/Platform-Web-0ea5e9?style=flat-square)
![Tech](https://img.shields.io/badge/Tech-Vanilla%20JavaScript-f59e0b?style=flat-square)
![Stars](https://img.shields.io/github/stars/dawdaw1111/python-code-explainer?style=flat-square)
![Last Commit](https://img.shields.io/github/last-commit/dawdaw1111/python-code-explainer?style=flat-square)

</div>

把 Python 代码按行翻译成更容易理解的中文说明，帮助初学者快速理解语句含义与代码结构。

![PyExplain Preview](./docs/preview.png)

## 项目亮点

- 逐行解释输入代码
- 支持常见语法识别：`print`、`input`、`if/elif/else`、`for/while`、`def/return`、`try/except`、`class/import` 等
- 自动生成整段摘要
- 内置示例代码，一键填充
- 最近历史记录（最多 10 条）
- 本地持久化（`localStorage`）

## 快速开始

1. 克隆仓库或下载源码
2. 直接打开 `index.html`

或启动本地静态服务：

```bash
python -m http.server 8000
```

浏览器访问 `http://127.0.0.1:8000`

## 目录结构

```text
.
├─ index.html       # 页面结构
├─ style.css        # 样式
├─ rules.js         # 语法规则与解释模板
├─ parser.js        # 逐行解析与摘要逻辑
├─ storage.js       # 历史记录存储
├─ app.js           # 交互与渲染
└─ docs/preview.png # README 预览图
```

## 当前边界

- 当前实现基于规则匹配，不是完整 AST 语义分析器
- 对复杂或非常规语法会显示“未识别”保底说明

