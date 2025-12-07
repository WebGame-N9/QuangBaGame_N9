function loadHTML(url, elementId) {
    const placeholder = document.getElementById(elementId);
    if (!placeholder) {
        console.error(`Lỗi: Không tìm thấy phần tử có ID '${elementId}'`);
        return;
    }

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Không thể tải ${url}. Mã lỗi: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            placeholder.outerHTML = html;

            // Khởi tạo lại AOS (Animate On Scroll) cho các phần tử mới được thêm vào
            if (window.AOS) {
                AOS.init();
            }
        })
        .catch(error => {
            console.error(`Lỗi khi tải chân trang từ ${url}:`, error);
            placeholder.innerHTML = '<footer style="text-align:center; color: #DC2626; padding: 20px; background-color: #1a1c35;">Lỗi khi tải chân trang. Vui lòng kiểm tra console.</footer>';
        });
}