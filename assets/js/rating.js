const REVIEW_BIN_ID = "69343538d0ea881f4016cba7"; 
const REVIEW_API_URL = `https://api.jsonbin.io/v3/b/${REVIEW_BIN_ID}/latest`; 

// THAY ĐỔI DÒNG NÀY BẰNG MASTER KEY MỚI CỦA BẠN (bắt đầu bằng $2b$)
const REVIEW_MASTER_KEY = "$2a$10$dAGf830CRlXglDv0cce8IOz5ayJDKDIW8.uPxvWVXMgR7Wm.UG.7G"; // <<<=== BẮT BUỘC THAY ĐỔI - ĐÃ ĐỔI TÊN

// Biến toàn cục lưu game ID
let gameId = null;

function extractGameId() {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('id')) || 1;
}


async function loadReviews() {
    const container = $(".reviews-list-container"); // DÙNG JQUERY
    if (container.length === 0) return; // Kiểm tra sự tồn tại

    // Hiển thị loading
    container.html(`<p>Loading reviews...</p>`); // DÙNG JQUERY

    try {
        // SỬ DỤNG REVIEW_API_URL VÀ REVIEW_MASTER_KEY
        const response = await fetch(REVIEW_API_URL, { 
            headers: {
                "X-Master-Key": REVIEW_MASTER_KEY
            }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const allReviews = data.record || [];

        // Lọc theo game_id
        const gameReviews = allReviews.filter(r => Number(r.game_id) === gameId);

        if (gameReviews.length === 0) {
            container.html(`<p style="color:#aaa; font-style:italic;">Chưa có đánh giá nào. Hãy là người đầu tiên nhé!</p>`); // DÙNG JQUERY
            return;
        }

        // Sắp xếp mới nhất trước
        gameReviews.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Tạo HTML và chèn vào container (DÙNG JQUERY)
        container.html(gameReviews.map(review => `
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
        `).join(""));

    } catch (err) {
        console.error("Lỗi tải đánh giá:", err);
        container.html(`<p style="color:red;">Lỗi tải đánh giá. Vui lòng thử lại sau.</p>`); // DÙNG JQUERY
    }
}

// =========================
//   GỬI ĐÁNH GIÁ MỚI
// =========================
async function submitReview() {
    // DÙNG JQUERY ĐỂ LẤY ELEMENT
    const textarea = $("#reviewText"); 
    const scoreInput = $('input[name="rating"]:checked');
    const submitBtn = $(".btn-submit-review");

    if (textarea.length === 0 || scoreInput.length === 0) return;

    const comment = textarea.val().trim(); // DÙNG JQUERY
    const score = parseInt(scoreInput.val()); // DÙNG JQUERY

    if (!comment) {
        alert("Vui lòng viết nội dung đánh giá!");
        return;
    }

    if (comment.length > 500) {
        alert("Đánh giá không được quá 500 ký tự!");
        return;
    }

    // Vô hiệu hóa nút trong lúc gửi (DÙNG JQUERY)
    submitBtn.prop('disabled', true);
    submitBtn.text("Sending...");

    try {
        // 1. Lấy dữ liệu hiện tại
        // SỬ DỤNG REVIEW_API_URL (đang trỏ đến /latest) và REVIEW_MASTER_KEY
        const getRes = await fetch(REVIEW_API_URL, { 
            headers: { "X-Master-Key": REVIEW_MASTER_KEY }
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
        const putRes = await fetch(`https://api.jsonbin.io/v3/b/${REVIEW_BIN_ID}`, { 
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Master-Key": REVIEW_MASTER_KEY
            },
            body: JSON.stringify(reviews)
        });

        if (!putRes.ok) throw new Error("Không thể lưu đánh giá");

        alert("Cảm ơn bạn! Đánh giá đã được gửi thành công!");

        // Reset form (DÙNG JQUERY)
        textarea.val("");
        $("#star5").prop("checked", true); // mặc định 5 sao

        // Tải lại danh sách
        loadReviews();

    } catch (err) {
        console.error("Lỗi gửi đánh giá:", err);
        alert("Gửi thất bại. Vui lòng thử lại sau ít phút.");
    } finally {
        // Mở lại nút (DÙNG JQUERY)
        submitBtn.prop('disabled', false);
        submitBtn.text("Gửi đánh giá");
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
//   KHỞI TẠO KHI TRANG LOAD XONG (DÙNG JQUERY)
// =========================
$(document).ready(function() {
    gameId = extractGameId();

    if (!gameId) {
        console.error("Không tìm thấy Game ID trong URL");
        return;
    }

    // Tải đánh giá ngay khi vào trang
    loadReviews();

    // Sự kiện nút gửi đánh giá (DÙNG JQUERY)
    $(".btn-submit-review").on("click", submitReview);

    // Cho phép nhấn Enter trong textarea để gửi (Shift+Enter để xuống dòng) (DÙNG JQUERY)
    $("#reviewText").on("keydown", function(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submitReview();
        }
    });
});