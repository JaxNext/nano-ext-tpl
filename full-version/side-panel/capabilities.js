export async function checkCapabilities() {
    let capabilities = null;
    if (!chrome?.aiOriginTrial?.languageModel?.capabilities) {
        capabilities = {
            available: 'no',
        }
    } else {
        capabilities = await chrome.aiOriginTrial.languageModel.capabilities();
    }
    return capabilities;
}