# PyExplain Lite - Python 代码解释器

`PyExplain Lite` 是一个面向初学者的前端小工具，  
可以把输入的 Python 代码按“逐行解释”的方式转成更容易理解的中文说明。

## 功能亮点

- 对输入代码逐行解析并输出解释
- 支持常见结构识别：`print`、`input`、`if/elif/else`、`for/while`、`def/return`、`try/except`、`class/import` 等
- 自动生成整段代码摘要
- 内置示例代码，一键填充测试
- 最近历史记录（最多 10 条）
- 自动本地保存（`localStorage`）

## 快速开始

1. 进入项目目录
2. 直接用浏览器打开 `index.html`

或在目录中启动静态服务：

```bash
python -m http.server 8000
```

然后访问：`http://127.0.0.1:8000`

## 项目结构

- `index.html`：页面结构
- `style.css`：界面样式
- `rules.js`：语法规则与说明模板
- `parser.js`：代码解析与摘要生成
- `storage.js`：历史记录存储
- `app.js`：交互流程与渲染

## 已知限制

- 当前实现为“规则匹配解析”，不是完整 Python AST 解释器
- 对非常复杂或少见语法可能显示为“未识别”

## 技术栈

- HTML5
- CSS3
- Vanilla JavaScript（无框架）

