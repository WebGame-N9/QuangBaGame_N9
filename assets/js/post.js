// Hàm lấy tham số từ URL
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};
function createArticleContent(article, inContentImages) {
    let contentHtml = `<p><strong>${article.summary}</strong></p>`;
    if (article.contentDetails) {

        contentHtml += `
            <h2>1. Chi Tiết Nội Dung Chính</h2>
            <div class="article-body">${article.contentDetails}</div>
        `;
    }
    if (inContentImages.length > 0) {
        contentHtml += `<img src="${inContentImages[0]}" alt="Ảnh minh họa nội dung 1" class="in-content-img">`;
    }

    contentHtml += `
        <h2>2. Thông Tin Bổ Sung</h2>
        <ul>
            <li>Thời gian đọc ước tính: ${article.read_time_minutes} phút.</li>
            <li>Tags: ${article.tags.join(', ')}.</li>
            <li>Tác giả: ${article.author}.</li>
        </ul>
    `;
    if (inContentImages.length > 1) {
        contentHtml += `<img src="${inContentImages[1]}" alt="Ảnh minh họa nội dung 2" class="in-content-img">`;
    }

    $('#dynamic-article-content').html(contentHtml);
}

function loadRelatedAndRecentArticles(allArticles, currentArticleId) {
    const currentId = parseInt(currentArticleId);
    const filteredArticles = allArticles.filter(a => a.id !== currentId);

    filteredArticles.sort((a, b) => {
        const diffA = Math.abs(a.id - currentId);
        const diffB = Math.abs(b.id - currentId);
        if (diffA === diffB) {
            return b.id - a.id;
        }
        return diffA - diffB;
    });

    const recentArticles = filteredArticles.slice(0, 4);
    let recentHtml = '';
    recentArticles.forEach(article => {
        recentHtml += `
            <li>
                <a href="tin-tuc-chi-tiet.html?id=${article.id}" class="index-link">
                    ${article.title}
                </a>
            </li>
        `;
    });
    if (recentArticles.length === 0) {
        recentHtml = `<li><a href="#" class="index-link">Không có bài viết liên quan nào.</a></li>`;
    }
    $('.article-index-list').html(recentHtml);


    const relatedArticles = filteredArticles.slice(0, 3);
    let relatedHtml = '';
    relatedArticles.forEach((article, index) => {
        relatedHtml += `
            <a href="tin-tuc-chi-tiet.html?id=${article.id}" class="article-card" data-aos="zoom-in" data-aos-delay="${index * 100}">
                <div class="article-card-img">
                    <img src="${article.images.thumbnail}" alt="${article.title}"> 
                    </div>
                <div class="article-card-content">
                    <h3 class="article-card-title">${article.title}</h3>
                    <p class="article-card-summary">${article.summary}</p>
                    <div class="article-meta">
                        <span><i class="fas fa-calendar-alt"></i> ${article.date}</span>
                    </div>
                </div>
            </a>
        `;
    });
    if (relatedArticles.length === 0) {
        relatedHtml = `<p>Không có bài viết liên quan nào.</p>`;
    }
    $('#related-articles-grid').html(relatedHtml);
}


function showLoading() {
    $('#loading-indicator').text('Đang tải dữ liệu...');
    $('#loading-indicator').show();
    $('#article-detail-container').hide();
}

function hideLoading() {
    $('#loading-indicator').hide();
    $('#article-detail-container').show();
}

function loadArticleDetail() {
    showLoading();

    const articleId = getUrlParameter('id') || 1;
    const binId = '6937b4ded0ea881f401c3bd2';
    const masterKey = '$2a$10$dAGf830CRlXglDv0cce8IOz5ayJDKDIW8.uPxvWVXMgR7Wm.UG.7G';

    $.ajax({
        url: `https://api.jsonbin.io/v3/b/${binId}/latest`, // Giả lập endpoint JSONBIN
        type: 'GET',
        headers: {
            'X-Master-Key': masterKey
        },
        success: function (data) {
            hideLoading();
            const allArticles = data.record.articles;
            const article = allArticles.find(a => a.id == articleId);

            if (article) {
                loadRelatedAndRecentArticles(allArticles, articleId);
                $('#article-page-title').text(`Chi Tiết Tin Tức: ${article.title}`);
                $('#article-category').text(article.category);
                $('#article-title').text(article.title);
                $('#article-date').html(`<i class="fas fa-calendar-alt"></i> ${article.date}`);
                $('#article-author').html(`<i class="fas fa-user"></i> ${article.author}`);
                $('#article-tags').html(`<i class="fas fa-tags"></i> ${article.tags.join(', ')}`);
                $('#article-featured-image').attr('src', article.images.featured);
                $('#article-featured-image').attr('alt', `Featured Image: ${article.title}`);
                $('#article-summary').text(article.summary);
                createArticleContent(article, article.images.in_content);
                AOS.refresh();
            } else {
                $('#article-title').text('Lỗi 404: Không tìm thấy bài viết');
                $('#article-summary').text('Bài viết bạn đang tìm kiếm không tồn tại hoặc đã bị gỡ bỏ.');
                $('#article-featured-image').attr('src', 'https://placehold.co/1200x500/dc3545/ffffff?text=404+Not+Found');
                $('#dynamic-article-content').html('');
                loadRelatedAndRecentArticles(allArticles, -1);
            }
        },
        error: function (xhr, status, error) {
            hideLoading();
            $('#article-title').text('Lỗi Tải Dữ Liệu');
            $('#article-summary').text('Không thể tải dữ liệu bài viết từ máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.');
            $('#article-featured-image').attr('src', 'https://placehold.co/1200x500/dc3545/ffffff?text=API+Error');
            $('#dynamic-article-content').html('');
            console.error('API Error:', status, error);
        }
    });
}

$(document).ready(function () {
    loadArticleDetail();
    AOS.init({
        duration: 800,
        once: true,
    });
    loadHTML('footer.html', 'footer-placeholder');
});