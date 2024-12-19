# 安装

1. 下载代码
2. 在 chrome 浏览器中打开 chrome://extensions/ 页面
3. 在右上角点击 "开发者模式"
4. 在左上角点击 "加载已解压的扩展程序"
5. 选择下载的代码目录中的 template 文件夹

# 逐步开发

## 1. 启动 & UI

### 1.1 点击 icon 打开侧边栏

在 `background.js` 中添加以下代码：

```JavaScript
// 点击 icon 打开或关闭侧边栏
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
```

保存后刷新扩展，点击 icon 可打开侧边栏。

## 1.2 搭建侧边栏 UI

在 `side-panel/index.html` 的 `<body>` 标签中添加如下代码：

```html
<div class="label">输入</div>
<div class="input-box">
    <textarea id="input-area"></textarea>
</div>

<div class="label">输出</div>
<div class="output-box">
    <textarea id="output-area" rows="10"></textarea>
</div>
```

在 `side-panel/index.js` 中添加如下代码：

```JavaScript
const inputArea = document.getElementById('input-area');
const outputArea = document.getElementById('output-area');
```

保存后刷新，侧边栏会显示输入和输出区域。

## 2. 自动捕获

### 2.1 监听选中文本

在 `background.js` 中添加如下代码：

```JavaScript
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, tab => {
        if (tab.url?.startsWith('chrome://')) return;
        // 给左侧页面注入脚本
        chrome.scripting.executeScript({
            target: { tabId: activeInfo.tabId },
            function: listenSelection,
        });
    });
});

function listenSelection() {
    document.addEventListener('selectionchange', () => {
        const selection = window.getSelection();
        if (!selection?.toString?.()) return;
        
        const selectedText = selection.toString().trim();
        
        // 获取选中文本所在的元素
        const container = selection.anchorNode?.parentElement;
        // 获取上下文
        const fullText = container?.textContent || '';
        let beforeText = '';
        let afterText = '';
        if (fullText) {
            const selectionStart = fullText?.indexOf?.(selectedText);
        
            if (selectionStart === -1) return;
            // 向前向后各取 20 个单词
            const halfLength = 20;
            beforeText = fullText.slice(0, selectionStart).split(/\s+/).slice(-halfLength).join(' ');
            afterText = fullText.slice(selectionStart + selectedText.length).split(/\s+/).slice(0, halfLength).join(' ');
        };
        
        // 把选中的文本和上下文发送给 extension
        chrome.runtime.sendMessage({ 
            type: 'textSelected',
            text: selectedText,
            context: {
                before: beforeText,
                after: afterText
            }
        });
    });
}
```

### 2.2 侧边栏接收文本

在 `side-panel/index.js` 中添加如下代码：

```JavaScript
chrome.runtime.onMessage.addListener(message => {
    if (message.type === 'textSelected') {
        const { text, context } = message;
        inputArea.value = text;
        explain(text, context);
    }
});
```

保存后刷新扩展，在左侧页面选中文字后，会自动捕获选中的文本和上下文，并发送给侧边栏。

## 3. 核心逻辑：Prompt API

### 3.1 检测可用性

在 `side-panel/index.js` 中添加如下代码：

```JavaScript
await check();

async function check() {
    if (!chrome?.aiOriginTrial?.languageModel?.capabilities) return Promise.reject('no capabilities');
    
    const capabilities = await chrome.aiOriginTrial.languageModel.capabilities();
    const { available } = capabilities;
    console.log('available', available); // no, after-download, readily
    
    if (available === 'no') return Promise.reject('no available');
    return available;
}
```

### 3.2 创建 session

在 `side-panel/index.js` 中添加如下代码：

```JavaScript
let session = null;

await createSession();

async function createSession() {
    const config = {
        initialPrompts: [
            {
                role: 'system',
                content: `You are a language expert who explains words and phrases in their proper context. When given a text and its surrounding context, explain the meaning while considering how the context affects the interpretation. If there is no context, explain the word or phrase in isolation. Use simple terms, relatable examples, and engaging analogies. If you don't understand the content, say so and provide suggestions for finding the answer. Format output in markdown and keep responses under 50 words.`
            }
        ],
    }
    session = await chrome.aiOriginTrial.languageModel.create(config);
}
```

### 3.3 生成解释

在 `side-panel/index.js` 中添加如下代码：

```JavaScript
async function explain(input, context) {
    if (!input) return;
    const prompt = `
        Here is the text that needs to be explained:
        ${input}

        Here is the context where this text appears:
        ${context.before} [${input}] ${context.after}

        Please explain the text above using simple terms, relatable examples, and engaging analogies. Keep your explanation under 30 words and format the response in plain text, not markdown.
    `
    const stream = await session.promptStreaming(prompt);

    for await (const chunk of stream) {
        outputArea.textContent = chunk;
    }
}
```

保存后刷新扩展，在左侧页面选中文字后，侧边栏会自动生成解释，并显示在输出区域。

