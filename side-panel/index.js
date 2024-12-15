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

// 全局变量
let isApiReady = false;
let session = null;
let debounceTimer = null;

// 事件绑定
inputArea.addEventListener('input', handleInput);

// 初始化
await initCheck();
session = await createSession(downloadCallback);
console.log('session 创建成功', session);

// 检查可用性
async function initCheck() {
    const { available } = await checkCapabilities();
    console.log('available', available);
    const textMap = {
        'no': 'API 不可用',
        'after-download': '模型待下载',
        'readily': 'API 可用',
    }
    availableValue.textContent = textMap[available];
    isApiReady = available === 'readily';
    inputArea.disabled = !isApiReady;
}

function downloadCallback(e) {
    const { loaded, total } = e;
    downloadValue.textContent = `${formatProgress(loaded, total)} (${formatSize(loaded)} / ${formatSize(total)})`;
}

// 处理输入
function handleInput(e) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(explain, 1000);
}

// 解释
async function explain() {
    const input = inputArea.value;
    if (!input) return;
    const stream = await promptStreaming({ input, session, downloadCallback });

    for await (const chunk of stream) {
        outputArea.textContent = chunk;
    }
}
