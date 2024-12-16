// 创建会话
let initialSession = null;
export async function createSession(downloadCallback = () => {}) {
    initialSession = await chrome.aiOriginTrial.languageModel.create({
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
    const session = await initialSession.clone();
    return session;
}

// 解释
export async function promptStreaming({
    input,
    context = { before: '', after: '' },
    session,
    downloadCallback
}) {
    const { tokensLeft } = session;
    if (!session) (
        session = await createSession(downloadCallback)
    )
    const length = 30;
    if (tokensLeft < length * 7) {
        session = await initialSession.clone();
    }
    const prompt = `
        Here is the text that needs to be explained:
        ${input}

        Here is the context where this text appears:
        ${context.before} [${input}] ${context.after}

        Please explain the text above using simple terms, relatable examples, and engaging analogies. Keep your explanation under ${length} words and format the response in plain text.
    `
    const stream = await session.promptStreaming(prompt);
    return stream;
}