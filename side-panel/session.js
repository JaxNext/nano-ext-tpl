// 创建会话
export async function createSession(downloadCallback) {
    return await chrome.aiOriginTrial.languageModel.create({
        // signal,
        // systemPrompt: '',
        // topK: 10,
        // temperature: 0.5,
        initialPrompts: [
            {
                role: 'system',
                content: `You are a language expert who explains words and phrases in their proper context. When given a text and its surrounding context, explain the meaning while considering how the context affects the interpretation. If there is no context, explain the word or phrase in isolation. Use simple terms, relatable examples, and engaging analogies. If you don't understand the content, say so and provide suggestions for finding the answer. Format output in markdown and keep responses under 50 words.`
            }
        ],
        // 监听模型下载进度
        monitor: m => {
            m.addEventListener('downloadprogress', downloadCallback)
        }
    });
}