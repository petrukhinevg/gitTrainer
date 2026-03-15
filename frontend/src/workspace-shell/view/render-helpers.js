export function formatDifficulty(value) {
    if (!value) {
        return "Unknown";
    }

    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

export function encodeHashSegment(value) {
    return encodeURIComponent(String(value));
}

export function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
}
