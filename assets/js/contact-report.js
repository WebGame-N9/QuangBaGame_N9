// ======================================================================
// Cấu hình JSONBin API chung
// ======================================================================
// LƯU Ý QUAN TRỌNG: CÁC THÔNG SỐ NÀY ĐƯỢC LẤY TỪ FILE contact.html BAN ĐẦU
const JSONBIN_MASTER_KEY = '$2a$10$dAGf830CRlXglDv0cce8IOz5ayJDKDIW8.uPxvWVXMgR7Wm.UG.7G';
const BIN_ID = '6936d50aae596e708f8b72dd';
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// ======================================================================
// Hàm định dạng ngày giờ (Dùng chung cho cả hai trang)
// ======================================================================
function formatTimestamp(timestamp, includeTime = true) {
    if (!timestamp) return 'Không có dữ liệu';
    const date = new Date(timestamp);
    const datePart = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (includeTime) {
        const timePart = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        return `${timePart}, ${datePart}`;
    }
    return datePart;
}

// ======================================================================
// LOGIC CHO TRANG contact.html
// ======================================================================

/**
 * 1. Tải lịch sử yêu cầu hỗ trợ từ JSONBin.
 */
function fetchTicketHistory() {
    if (document.getElementById('ticketHistoryList')) { // Chỉ chạy nếu đang ở trang contact.html
        const historyList = $('#ticketHistoryList');
        historyList.html('<div style="text-align: center; color: #ffc107; padding: 10px;"><i class="fas fa-sync fa-spin"></i> Đang tải dữ liệu...</div>');

        $.ajax({
            url: JSONBIN_URL,
            type: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_MASTER_KEY,
                'X-Bin-Meta': false
            },
            success: function (data) {
                // SỬA LỖI: Truy cập trực tiếp data.support_tickets (vì dùng X-Bin-Meta: false)
                const tickets = data.support_tickets ? data.support_tickets.reverse() : [];
                let htmlContent = '';

                if (tickets.length > 0) {
                    $.each(tickets, function (index, ticket) {
                        const statusClass = (ticket.status === 'Đã đóng' || ticket.status === 'Resolved') ? 'resolved' : 'open';

                        // Tạo link dẫn đến trang report.html
                        const ticketLink = `report.html?id=${ticket.submission_id}`;

                        htmlContent += `
                            <a href="${ticketLink}" class="history-item">
                                <div class="ticket-info">
                                    <span class="title" style="color: var(--text-light);">${ticket.subject}</span>
                                    <span class="id-date">${ticket.submission_id} - ${formatTimestamp(ticket.submission_timestamp, false)}</span>
                                </div>
                                <span class="status-btn ${statusClass}">
                                    ${ticket.status}
                                </span>
                            </a>
                        `;
                    });
                    historyList.html(htmlContent);
                } else {
                    historyList.html('<div style="text-align: center; color: var(--text-muted); padding: 10px;">Chưa có yêu cầu hỗ trợ nào được gửi.</div>');
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error("Lỗi khi tải lịch sử: " + textStatus, errorThrown);
                historyList.html('<div style="text-align: center; color: #dc3545; padding: 10px;"><i class="fas fa-exclamation-triangle"></i> Không thể tải lịch sử yêu cầu. Lỗi kết nối jsonBIN.</div>');
            }
        });
    }
}

/**
 * 2. Xử lý sự kiện gửi phiếu hỗ trợ mới.
 */
function handleSupportFormSubmit() {
    $('#supportForm').submit(function (e) {
        e.preventDefault();

        const btn = $('#btnSubmit');
        const submitMessage = $('#submitMessage');
        btn.prop('disabled', true).html('<i class="fas fa-sync fa-spin" style="margin-right: 8px;"></i> Đang gửi...');
        submitMessage.html('');

        const newTicket = {
            submission_id: "TKT-" + new Date().toISOString().slice(0, 10).replace(/-/g, '') + "-" + Math.floor(Math.random() * 90000 + 10000),
            submission_timestamp: new Date().toISOString(),
            full_name: $('#hoTen').val(),
            email: $('#email').val(),
            issue_type: $('#loaiVanDe').val(),
            subject: $('#tieuDe').val(),
            detailed_description: $('#moTaChiTiet').val(),
            status: "Mới",
            assigned_to: "Chưa phân công",
            admin_response: ""
        };

        // Bước 1: GET dữ liệu hiện tại từ jsonbin
        $.ajax({
            url: JSONBIN_URL,
            type: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_MASTER_KEY,
                'X-Bin-Meta': false
            },
            success: function (data) {
                let currentData = data;

                // Thêm phiếu mới vào mảng
                if (!currentData.support_tickets) {
                    currentData.support_tickets = [];
                }
                currentData.support_tickets.push(newTicket);

                // Bước 2: PUT (cập nhật) dữ liệu trở lại jsonbin
                $.ajax({
                    url: JSONBIN_URL,
                    type: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': JSONBIN_MASTER_KEY
                    },
                    data: JSON.stringify(currentData),
                    success: function (putData) {
                        submitMessage.css('color', '#4CAF50').html('<i class="fas fa-check-circle"></i> Gửi phiếu hỗ trợ **thành công**! Mã phiếu: **' + newTicket.submission_id + '**');
                        $('#supportForm')[0].reset();
                        btn.prop('disabled', false).html('<i class="fas fa-paper-plane" style="margin-right: 8px;"></i> Gửi yêu cầu hỗ trợ');
                        fetchTicketHistory(); // Cập nhật lại lịch sử
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.error("Lỗi khi cập nhật Bin: " + textStatus, errorThrown);
                        submitMessage.css('color', '#dc3545').html('<i class="fas fa-times-circle"></i> Lỗi khi gửi phiếu: **Không thể lưu dữ liệu.**');
                        btn.prop('disabled', false).html('<i class="fas fa-paper-plane" style="margin-right: 8px;"></i> Gửi yêu cầu hỗ trợ');
                    }
                });
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error("Lỗi khi GET dữ liệu Bin: " + textStatus, errorThrown);
                submitMessage.css('color', '#dc3545').html('<i class="fas fa-times-circle"></i> Lỗi khi gửi phiếu: **Không thể đọc dữ liệu hiện tại.**');
                btn.prop('disabled', false).html('<i class="fas fa-paper-plane" style="margin-right: 8px;"></i> Gửi yêu cầu hỗ trợ');
            }
        });
    });
}

// ======================================================================
// LOGIC CHO TRANG report.html
// ======================================================================

/**
 * Lấy ID phiếu từ URL
 */
function getTicketIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

/**
 * Điền dữ liệu chi tiết phiếu hỗ trợ vào HTML.
 */
function loadTicketDetails(ticket) {
    // Cập nhật Header
    const statusClass = ticket.status === 'Đã đóng' ? 'resolved' : 
                       ticket.status === 'Đang xử lý' ? 'processing' : 'open';
    const statusText = ticket.status || 'Chưa xác định';
    const statusIcon = statusClass === 'resolved' ? 'fa-check-circle' : 
                      statusClass === 'processing' ? 'fa-sync-alt' : 'fa-clock';

    $('.report-title').text(`Phiếu Hỗ Trợ: ${ticket.subject}`);
    $('title').text(`Chi Tiết Phiếu Hỗ Trợ #${ticket.submission_id} - DT9`);

    // Cập nhật Meta (Status)
    $('.report-meta').html(`
        <span class="status-badge ${statusClass}"><i class="fas ${statusIcon}"></i> ${statusText}</span>
    `);

    // Nội dung tin nhắn của khách hàng
    const detailedDescription = ticket.detailed_description 
        ? ticket.detailed_description.replace(/\n/g, '<br>') 
        : 'Không có mô tả chi tiết.';

    const userMessage = `
        <div class="message-card user-message">
            <div class="message-header">
                <span class="author">${ticket.full_name} (Khách hàng)</span>
                <span class="timestamp">Đã gửi: ${formatTimestamp(ticket.submission_timestamp)}</span>
            </div>
            <div class="message-body">
                <p><b>Loại vấn đề:</b> ${ticket.issue_type}</p>
                <p>${detailedDescription}</p>
            </div>
        </div>`;

    // ===== PHẦN QUAN TRỌNG: SỬA PHẢN HỒI ADMIN ĐỂ HIỂN THỊ TÊN THỰC TẾ =====
    let adminMessage = '';

    if (ticket.admin_response && ticket.admin_response.trim() !== '') {
        // Lấy tên admin từ trường assigned_to, nếu trống thì dùng "Admin"
        const adminName = ticket.assigned_to && ticket.assigned_to.trim() !== '' 
            ? ticket.assigned_to 
            : 'Admin';

        // Nếu có trường response_timestamp thì dùng, nếu không thì hiển thị "Chưa ghi nhận thời gian"
        const responseTime = ticket.response_timestamp 
            ? formatTimestamp(ticket.response_timestamp) 
            : 'Chưa ghi nhận thời gian';

        const adminResponseContent = ticket.admin_response.replace(/\n/g, '<br>');

        adminMessage = `
            <div class="message-card admin-response">
                <div class="message-header">
                    <span class="author">Admin DT9 (${adminName})</span>
                    <span class="timestamp">Đã phản hồi: ${responseTime}</span>
                </div>
                <div class="message-body">
                    <p>${adminResponseContent}</p>
                    ${ticket.status === 'Đã đóng' ? '<p class="admin-note">Phiếu đã được đóng sau khi phản hồi.</p>' : ''}
                </div>
            </div>`;
    } else {
        adminMessage = `<div style="padding: 20px; color: #9ca3af; border: 1px dashed #444; margin-top: 20px; text-align: center; background: #1e293b;">
            Phiếu này chưa có phản hồi từ Admin. Vui lòng chờ đợi hoặc liên hệ qua fanpage nếu cần hỗ trợ gấp.
        </div>`;
    }

    // Gộp nội dung và đẩy vào trang
    $('.report-content').html(userMessage + adminMessage);
}

/**
 * 3. Tải chi tiết phiếu hỗ trợ.
 */
function fetchTicketDetails() {
    const ticketId = getTicketIdFromUrl();
    if (!ticketId) return; // Chỉ chạy nếu đang ở trang report.html

    // Cập nhật tiêu đề tạm thời
    $('.report-title').text(`Đang tải phiếu: #${ticketId}...`);
    $('.report-content').html("<p style='color: #9ca3af; padding: 20px;'>Đang tải dữ liệu, vui lòng chờ...</p>");

    // Gửi yêu cầu AJAX để đọc JSONBin
    $.ajax({
        url: JSONBIN_URL,
        type: 'GET',
        headers: {
            'X-Master-Key': JSONBIN_MASTER_KEY
        },
        success: function (response) {
            // Dữ liệu thực tế thường nằm trong response.record
            const tickets = response.record ? response.record.support_tickets : [];

            // 4. Tìm kiếm phiếu theo ID
            const ticket = tickets.find(t => t.submission_id === ticketId);

            if (ticket) {
                // 5. Load dữ liệu lên trang
                loadTicketDetails(ticket);
            } else {
                // Phiếu không tồn tại
                $('.report-title').text("Lỗi: Không tìm thấy phiếu hỗ trợ");
                $('.report-content').html(`<p style='color: #9ca3af; padding: 20px;'>Phiếu hỗ trợ với ID <b>${ticketId}</b> không tồn tại.</p>`);
            }
        },
        error: function (xhr, status, error) {
            // Xử lý lỗi kết nối hoặc API
            console.error("Lỗi khi tải dữ liệu từ JSONBin:", error);
            $('.report-title').text("Lỗi: Không thể kết nối dữ liệu");
            $('.report-content').html("<p style='color: red; padding: 20px;'>Không thể tải dữ liệu phiếu. Vui lòng kiểm tra kết nối API.</p>");
        }
    });
}


// ======================================================================
// MAIN - Kích hoạt các hàm khi DOM sẵn sàng
// ======================================================================
$(document).ready(function () {
    // Kích hoạt logic cho trang contact.html
    if (document.getElementById('ticketHistoryList')) {
        fetchTicketHistory();
        handleSupportFormSubmit();
    }

    // Kích hoạt logic cho trang report.html
    if (getTicketIdFromUrl()) {
        fetchTicketDetails();
    }
});