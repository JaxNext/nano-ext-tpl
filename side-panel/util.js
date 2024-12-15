export function formatProgress(loaded, total) {
    return `${(loaded / total * 100).toFixed(2)}%`;
}

export function formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex ++;
    }
    
    return `${unitIndex === 0 ? size : size.toFixed(2)}${units[unitIndex]}`;
}