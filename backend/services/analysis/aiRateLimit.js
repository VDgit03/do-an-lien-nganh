// Giới hạn chi phí khi gọi AI: mỗi người dùng tối đa 10 lượt / 10 phút.
// Lưu trong bộ nhớ tiến trình (đủ cho đồ án; cần Redis nếu chạy nhiều server).
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 10;
const history = new Map();

export const isAiRateLimited = (userId) => {
    const now = Date.now();
    const recent = (history.get(userId) || []).filter((t) => now - t < WINDOW_MS);

    if (recent.length >= MAX_REQUESTS) {
        history.set(userId, recent);
        return true;
    }

    recent.push(now);
    history.set(userId, recent);
    return false;
};
