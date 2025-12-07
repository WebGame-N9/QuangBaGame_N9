// =========================
//   RATING.JS - PHIÊN BẢN HOÀN CHỈNH & ỔN ĐỊNH 2025
//   Dành cho tất cả các trang game_ID1.html, game_ID2.html,...
// =========================

// CẤU HÌNH JSONBIN (thay key của bạn vào đây)
const REVIEW_BIN_ID = "69343538d0ea881f4016cba7"; // ĐÃ ĐỔI TÊN
const REVIEW_API_URL = `https://api.jsonbin.io/v3/b/${REVIEW_BIN_ID}/latest`; // ĐÃ ĐỔI TÊN

// THAY ĐỔI DÒNG NÀY BẰNG MASTER KEY MỚI CỦA BẠN (bắt đầu bằng $2b$)
const REVIEW_MASTER_KEY = "$2a$10$dAGf830CRlXglDv0cce8IOz5ayJDKDIW8.uPxvWVXMgR7Wm.UG.7G"; // <<<=== BẮT BUỘC THAY ĐỔI - ĐÃ ĐỔI TÊN

// Biến toàn cục lưu game ID
let gameId = null;

// =========================
//   LẤY GAME ID TỪ TÊN FILE (game_ID1.html → 1)
// =========================
// function extractGameId() {
//     const match = location.pathname.match(/ID(\d+)/i);
//     return match ? parseInt(match[1]) : null;
// }

function extractGameId() {
    // 1. Lấy từ tham số URL (?id=x)
    const params = new URLSearchParams(window.location.search);
    const idFromQuery = params.get('id');
    if (idFromQuery) {
        return parseInt(idFromQuery);
    }
    
    // 2. Dự phòng: Lấy từ tên file (dành cho game_IDx.html cũ)
    const match = location.pathname.match(/ID(\d+)/i);
    return match ? parseInt(match[1]) : null;
}



// =========================
//   TẢI ĐÁNH GIÁ CỦA GAME
// =========================
async function loadReviews() {
    const container = document.querySelector(".reviews-list-container");
    if (!container) return;

    // Hiển thị loading
    container.innerHTML = `<p>Loading reviews...</p>`;

    try {
        // SỬ DỤNG REVIEW_API_URL VÀ REVIEW_MASTER_KEY
        const response = await fetch(REVIEW_API_URL, { 
            headers: {
                "X-Master-Key": REVIEW_MASTER_KEY // ĐÃ CẬP NHẬT
            }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const allReviews = data.record || [];

        // Lọc theo game_id
        const gameReviews = allReviews.filter(r => Number(r.game_id) === gameId);

        if (gameReviews.length === 0) {
            container.innerHTML = `<p style="color:#aaa; font-style:italic;">Chưa có đánh giá nào. Hãy là người đầu tiên nhé!</p>`;
            return;
        }

        // Sắp xếp mới nhất trước
        gameReviews.sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = gameReviews.map(review => `
            <div class="review-item" style="border-bottom:1px solid #333; padding:15px 0;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <div class="review-user">
                        <b>${escapeHtml(review.user || "Khách")}</b>
                    </div>
                    <span style="color:#888; font-size:0.9em;">${formatDate(review.date)}</span>
                </div>
               <div class="review-score" style="color:#f39c12; font-size:1.1em; margin-bottom:8px;">
                    ${'★'.repeat(review.score)}${'☆'.repeat(5 - review.score)} <b>${review.score}/5</b>
                </div>
                <p style="margin:0; line-height:1.5;">${escapeHtml(review.comment)}</p>
            </div>
        `).join("");

    } catch (err) {
        console.error("Lỗi tải đánh giá:", err);
        container.innerHTML = `<p style="color:red;">Lỗi tải đánh giá. Vui lòng thử lại sau.</p>`;
    }
}

// =========================
//   GỬI ĐÁNH GIÁ MỚI
// =========================
async function submitReview() {
    const textarea = document.querySelector(".review-section textarea");
    const scoreInput = document.querySelector('input[name="rating"]:checked');
    const submitBtn = document.querySelector(".btn-submit-review");

    if (!textarea || !scoreInput) return;

    const comment = textarea.value.trim();
    const score = parseInt(scoreInput.value);

    if (!comment) {
        alert("Vui lòng viết nội dung đánh giá!");
        return;
    }

    if (comment.length > 500) {
        alert("Đánh giá không được quá 500 ký tự!");
        return;
    }

    // Vô hiệu hóa nút trong lúc gửi
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    try {
        // 1. Lấy dữ liệu hiện tại
        // SỬ DỤNG REVIEW_API_URL (đang trỏ đến /latest) và REVIEW_MASTER_KEY
        const getRes = await fetch(REVIEW_API_URL, { 
            headers: { "X-Master-Key": REVIEW_MASTER_KEY } // ĐÃ CẬP NHẬT
        });

        if (!getRes.ok) throw new Error("Không thể lấy dữ liệu");

        const json = await getRes.json();
        let reviews = json.record || [];

        // 2. Thêm đánh giá mới
        const newReview = {
            id: Date.now(),
            game_id: gameId,
            user: "Khách", // Có thể mở rộng thêm form nhập tên sau
            score: score,
            comment: comment,
            date: new Date().toISOString().split("T")[0] // YYYY-MM-DD
        };

        reviews.push(newReview);

        // 3. Cập nhật lại bin
        // SỬ DỤNG REVIEW_BIN_ID VÀ REVIEW_MASTER_KEY
        const putRes = await fetch(`https://api.jsonbin.io/v3/b/${REVIEW_BIN_ID}`, { // ĐÃ CẬP NHẬT BIN_ID
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Master-Key": REVIEW_MASTER_KEY // ĐÃ CẬP NHẬT
            },
            body: JSON.stringify(reviews)
        });

        if (!putRes.ok) throw new Error("Không thể lưu đánh giá");

        alert("Cảm ơn bạn! Đánh giá đã được gửi thành công!");

        // Reset form
        textarea.value = "";
        document.getElementById("star5").checked = true; // mặc định 5 sao

        // Tải lại danh sách
        loadReviews();

    } catch (err) {
        console.error("Lỗi gửi đánh giá:", err);
        alert("Gửi thất bại. Vui lòng thử lại sau ít phút.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Gửi đánh giá";
    }
}

// =========================
//   HÀM HỖ TRỢ
// =========================
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    const date = new Date(dateStr + "T00:00:00");
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Hôm nay";
    if (days === 1) return "Hôm qua";
    if (days < 30) return `${days} ngày trước`;
    if (days < 365) return `${Math.floor(days/30)} tháng trước`;
    return `${Math.floor(days/365)} năm trước`;
}

// =========================
//   KHỞI TẠO KHI TRANG LOAD XONG
// =========================
document.addEventListener("DOMContentLoaded", () => {
    gameId = extractGameId();

    if (!gameId) {
        console.error("Không tìm thấy Game ID trong URL");
        return;
    }

    // Tải đánh giá ngay khi vào trang
    loadReviews();

    // Sự kiện nút gửi đánh giá
    const submitBtn = document.querySelector(".btn-submit-review");
    if (submitBtn) {
        submitBtn.addEventListener("click", submitReview);
    }

    // Cho phép nhấn Enter trong textarea để gửi (Shift+Enter để xuống dòng)
    const textarea = document.querySelector(".review-section textarea");
    if (textarea) {
        textarea.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submitReview();
            }
        });
    }
});