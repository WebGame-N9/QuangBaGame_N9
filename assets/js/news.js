
// Load footer
loadHTML('footer.html', 'footer-placeholder');

// Khởi tạo AOS
AOS.init({
    duration: 800,
    once: true,
});

$(document).ready(function () {
    const BIN_ID = "6937b4ded0ea881f401c3bd2";
    const JSON_BIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}/latest`;
    const MASTER_KEY = "$2a$10$dAGf830CRlXglDv0cce8IOz5ayJDKDIW8.uPxvWVXMgR7Wm.UG.7G";

    function createArticleCard(article, delay) {
        return `
                    <a href="tin-tuc-chi-tiet.html?id=${article.id}" class="article-card" data-aos="zoom-in" data-aos-delay="${delay}">
                        <div class="article-card-img">
                            <img src="${article.images.thumbnail}" alt="${article.title}" loading="lazy">
                        </div>
                        <div class="article-card-content">
                            <h3 class="article-card-title">${article.title}</h3>
                            
                            <p class="article-card-summary">${article.summary}</p>
                            <div class="article-meta">
                                <span><i class="fas fa-calendar-alt"></i> ${article.date}</span>
                                <span><i class="fas fa-tags"></i> ${article.tags.join(', ')}</span>
                            </div>
                        </div>
                    </a>
                `;
    }

    function createFeaturedBanner(article) {
        return `
                    <article class="featured-banner-wrapper" data-aos="fade-up">
                        <a href="tin-tuc-chi-tiet.html?id=${article.id}" class="featured-banner-image group"
                           style="background-image: url('${article.images.featured}');">
                            <div class="banner-content">
                                <span class="tag-badge">NỔI BẬT</span>
                                <h3 class="featured-title-link">
                                    <span class="featured-title">${article.title}</span>
                                </h3>
                                <p class="featured-summary">${article.summary}</p>
                            </div>
                        </a>
                        <div class="article-meta-group">
                            <span class="article-meta-item"><i class="fas fa-calendar-alt"></i> ${article.date}</span>
                            <span class="article-meta-item"><i class="fas fa-user"></i> ${article.author}</span>
                            <span class="article-meta-item"><i class="fas fa-tags"></i> ${article.tags.join(', ')}</span>
                        </div>
                    </article>
                `;
    }

    $.ajax({
        url: JSON_BIN_URL,
        type: 'GET',
        headers: {
            "X-Master-Key": MASTER_KEY  // Dùng master key
            // Nếu dùng secret key thì đổi thành: "X-Bin-Secret-Key": SECRET_KEY
        },
        success: function (data) {
            // Cấu trúc data.record giờ có cả articles và content_sections
            const sourceData = data.record;
            const articles = sourceData.articles;
            const sections = sourceData.content_sections;

            const articleMap = articles.reduce((map, article) => {
                map[article.id] = article;
                return map;
            }, {});

            let newsContentHTML = '';
            let aosDelay = 100;

            // Lặp qua các key trong content_sections để sắp xếp nội dung
            // Object.keys(sections) đảm bảo thứ tự
            const sectionKeys = ["tin-noi-bat", "cap-nhat-moi", "danh-gia-rpg", "tin-esports", "huong-dan-moi"];

            sectionKeys.forEach(sectionKey => {
                const section = sections[sectionKey];
                if (!section) return; // Bỏ qua nếu không tìm thấy section

                const articleIds = section.article_ids;

                // Tạo điểm neo và tiêu đề mục
                newsContentHTML += `<div class="section-separator" id="${sectionKey}"></div>`;
                newsContentHTML += `<h2 class="section-title" data-aos="fade-left" data-aos-delay="${aosDelay}">${section.title}</h2>`;
                aosDelay += 100;

                // Xử lý mục Tin Nổi Bật đặc biệt
                if (sectionKey === 'tin-noi-bat' && articleIds.length > 0) {
                    const featuredArticle = articleMap[articleIds[0]];
                    if (featuredArticle) {
                        newsContentHTML += createFeaturedBanner(featuredArticle);
                    }
                } else {
                    // Xử lý các mục còn lại dưới dạng lưới (grid)
                    let gridHTML = '<div class="news-grid">';
                    articleIds.forEach(id => {
                        const article = articleMap[id];
                        if (article) {
                            gridHTML += createArticleCard(article, aosDelay);
                            aosDelay += 100;
                        }
                    });
                    gridHTML += '</div>';
                    newsContentHTML += gridHTML;
                }
            });


            // Pagination giả
            newsContentHTML += `
                        <div class="pagination-container" data-aos="fade-up" data-aos-delay="${aosDelay}">
                            <button class="pagination-btn pagination-btn-default"><i class="fas fa-arrow-left"></i></button>
                            <span class="pagination-btn pagination-btn-active">1</span>
                            <button class="pagination-btn pagination-btn-default">2</button>
                            <button class="pagination-btn pagination-btn-default">3</button>
                            <button class="pagination-btn pagination-btn-default"><i class="fas fa-arrow-right"></i></button>
                        </div>
                    `;

            $('#news-content-container').html(newsContentHTML);
            AOS.refresh();
        },
        error: function (xhr, status, err) {
            console.error("Lỗi tải JSON Bin:", xhr.status, err);
            $('#news-content-container').html(`
                        <div class="text-center py-20">
                            <i class="fas fa-exclamation-triangle text-6xl text-red-500"></i>
                            <p class="mt-4 text-xl text-red-400">Không thể tải tin tức!</p>
                            <p class="mt-2 text-gray-400">Vui lòng kiểm tra lại Master Key hoặc kết nối mạng.</p>
                        </div>
                    `);
        }
    });
});