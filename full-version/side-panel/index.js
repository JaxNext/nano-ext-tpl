// 侧边栏 JavaScript
import { checkCapabilities } from './capabilities.js';
import { createSession, promptStreaming } from './session.js';
import { formatProgress, formatSize } from './util.js';

// 页面元素
const statusBox = document.querySelector('.status-box');
const availableRow = statusBox.querySelector('.available-row');
const availableValue = availableRow.querySelector('.value');
const downloadRow = statusBox.querySelector('.download-row');
const downloadValue = downloadRow.querySelector('.value');
const inputBox = document.querySelector('.input-box');
const inputArea = inputBox.querySelector('.input-area');
const outputBox = document.querySelector('.output-box');
const outputArea = outputBox.querySelector('.output-area');
// const tokenRow = statusBox.querySelector('.token-row');
// const tokenValue = tokenRow.querySelector('.value');

// 全局变量
let isApiReady = false;
let session = null;
let debounceTimer = null;

// 事件绑定
inputArea.addEventListener('input', handleInput);
chrome.runtime.onMessage.addListener(handleMessage);

// 初始化
await initCheck();
session = await createSession(downloadCallback);
updateTokenStatus();

// 检查可用性
async function initCheck() {
    const { available } = await checkCapabilities();
    updateStatus(available);
}

function updateStatus(available) {
    const textMap = {
        'no': {
            availableText: 'API 不可用',
            availableColor: 'red',
            downloadText: '--',
            downloadColor: 'red',
        },
        'after-download': {
            availableText: '模型待下载',
            availableColor: 'orange',
            downloadText: '',
            downloadColor: 'orange',
        },
        'readily': {
            availableText: 'API 可用',
            availableColor: 'green',
            downloadText: '100%',
            downloadColor: 'green',
        },
    }
    availableValue.textContent = textMap[available].availableText;
    availableValue.style.color = textMap[available].availableColor;
    downloadValue.textContent = textMap[available].downloadText;
    downloadValue.style.color = textMap[available].downloadColor;
    isApiReady = available === 'readily';
    inputArea.disabled = !isApiReady;
}

function downloadCallback(e) {
    const { loaded, total } = e;
    const progress = formatProgress(loaded, total);
    const size = formatSize(loaded) + ' / ' + formatSize(total);
    downloadValue.textContent = `${progress} (${size})`;
    if (progress === '100.00%') {
        updateStatus('readily');
    }
}

function handleInput() {
    triggerExplain();
}

// 处理选中文本
function handleMessage(message) {
    if (message.type === 'textSelected' && isApiReady) {
        const { text, context } = message;
        inputArea.value = text;
        triggerExplain(context);
    }
}

// 处理输入
function triggerExplain(context) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(explain, 1000, context);
}

// 解释
async function explain(context) {
    if (!isApiReady) return;
    outputArea.textContent = '处理中...';
    const input = inputArea.value;
    if (!input) return;
    const stream = await promptStreaming({ input, context, session, downloadCallback });

    for await (const chunk of stream) {
        outputArea.textContent = chunk;
    }
    updateTokenStatus();
}

function updateTokenStatus() {
    const {
        maxTokens = 0,
        tokensSoFar = 0,
        tokensLeft = 0
    } = session;
    // tokenValue.textContent = `${tokensSoFar} / ${maxTokens}`;
}