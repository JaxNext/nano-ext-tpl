// 点击 icon 打开或关闭侧边栏
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
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
        console.log('ttt', beforeText, afterText, selectedText);
        
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