const BIN_ID = '6935590d43b1c97be9dd6572';
const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}/latest`;
const API_KEY = '$2a$10$dAGf830CRlXglDv0cce8IOz5ayJDKDIW8.uPxvWVXMgR7Wm.UG.7G';

let currentGame = null;
let allGames = [];

// Ham lấy id tu link de loaqt game co id do
function getGameIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('id')) || 1;
}

// HAm hien thi sao
function renderStars(rating) {
    const full = '★';
    const half = '½';
    const empty = '☆';
    const stars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    return full.repeat(stars) + (hasHalf ? half : '') + empty.repeat(5 - stars - (hasHalf ? 1 : 0));
}


function createRelatedCard(game) {
    const imgSrc = game.thumbnail;
    // Thêm kiểm tra an toàn: Đảm bảo game.categories là một mảng trước khi gọi join()
    const categories = Array.isArray(game.genres) ? game.genres : ['Chưa phân loại'];

    return `
        <div class="game-card" onclick="window.location.href='game_detail_template.html?id=${game.id}'" data-aos="fade-up">
            <div class="game-image">
                <img src="${imgSrc}" alt="${game.name}" onerror="this.src='assets/img/default_game.png'">
            </div>
            <div class="game-content">
                <h4 class="game-title">${game.name}</h4>
                <p class="game-category">${categories.join(' • ')}</p> <p class="game-rating"><i class="fa-solid fa-star"></i> ${game.rating.toFixed(1)}</p>
                <button class="btn-download"><i class="fa-solid fa-download"></i> Chi tiết</button>
            </div>
        </div>
    `;
}
$(document).ready(function () {
    const gameId = getGameIdFromURL();
    $.ajax({
        url: API_URL,
        method: 'GET',
        headers: { 'X-Master-Key': API_KEY },
        success: function (data) {
            allGames = data.record;
            currentGame = allGames.find(g => g.id === gameId);

            if (!currentGame) {
                alert("Không tìm thấy game!");
                return;
            }

            // Cập nhật tiêu đề
            $('#pageTitle').text(currentGame.name + " - Chi tiết Game");
            $('#gameTitle').text(currentGame.name);
            $('#sidebarTitle').text(currentGame.name);
            $('#sidebarSubtitle').text(`${currentGame.developer} | ${currentGame.genres.join(', ')}`);

            // Thông tin sidebar
            $('#officialLink').attr('href', currentGame.officialWebsite);
            $('#releaseDate').text(currentGame.releaseDate);
            $('#developer').text(currentGame.developer);
            $('#genres').text(currentGame.genres.join(', '));
            $('#platforms').text(currentGame.platforms.join(', '));
            $('#onlineRequired').text(currentGame.requiresInternet ? 'CÓ' : 'KHÔNG BẮT BUỘC')
                .toggleClass('success', !currentGame.requiresInternet)
                .toggleClass('warning', currentGame.requiresInternet);

            $('#downloadText').text(currentGame.downloadText || '⬇ Tải Game');

            // Media & Gallery
            let galleryHTML = '';
            if (currentGame.trailer) {
                galleryHTML += `<div class="thumbnail-item active" data-type="video" data-src="${currentGame.trailer}">
                    <img src="${currentGame.thumbnail}" alt="Trailer">
                </div>`;
                $('#mediaContainer').html(`<iframe width="560" height="315" src="${currentGame.trailer}" frameborder="0" allowfullscreen></iframe>`);
            }
            currentGame.screenshots.forEach(src => {
                galleryHTML += `<div class="thumbnail-item" data-type="image" data-src="${src}">
                    <img src="${src}" alt="Screenshot">
                </div>`;
            });
            $('#galleryThumbnails').html(galleryHTML);

            // Tổng quan
            $('#overviewTab').html(`
                <div>
                    <h2 class="section-title">Về ${currentGame.name}</h2>
                    <p class="description-text">${currentGame.description}</p>
                </div>
                <div>
                    <h3 class="section-subtitle">Tính năng chính</h3>
                    <ul class="feature-list">
                        ${currentGame.features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                </div>
            `);

            // Cấu hình
            $('#configTab').html(`
                <h2 class="section-title">Yêu cầu cấu hình</h2>
                <div class="config-grid">
                    <div class="config-box">
                        <h3 class="config-title yellow-text">Tối thiểu</h3>
                        ${Object.entries(currentGame.config.min).map(([k, v]) =>
                `<div class="config-item"><span class="config-label">${k}:</span> ${v}</div>`
            ).join('')}
                    </div>
                    <br>
                    <div class="config-box">
                        <h3 class="config-title green-text">Đề nghị</h3>
                        ${Object.entries(currentGame.config.rec).map(([k, v]) =>
                `<div class="config-item"><span class="config-label">${k}:</span> ${v}</div>`
            ).join('')}
                    </div>
                </div>
            `);

            $('#avgRating').text(currentGame.rating.toFixed(1));
            $('#avgStars').html(renderStars(currentGame.rating));
            $('#reviewCount').text(`Dựa trên ${currentGame.reviewCount.toLocaleString()} đánh giá`);

            $('#discussionTab').html(currentGame.discussionHTML || `
                <h2 class="section-title">Diễn đàn & Thảo luận</h2>
                <p class="description-text">Khu vực này dành cho các chủ đề thảo luận của cộng đồng game thủ.</p>
                <div class="discussion-box">
                    <p class="discussion-title">Chủ đề nổi bật:</p>
                    <ul class="discussion-list">
                        <li><a href="#">Thảo luận chung về ${currentGame.name}</a></li>
                        <li><a href="#">Mẹo chơi và hướng dẫn</a></li>
                        <li><a href="#">Tìm bạn chơi cùng</a></li>
                    </ul>
                </div>
            `);

            // Game liên quan (ngẫu nhiên, loại trừ game hiện tại)
            const related = allGames
                .filter(g => g.id !== gameId)
                .sort(() => 0.5 - Math.random())
                .slice(0, 2);
            $('#related-games-list').html(related.map(createRelatedCard).join(''));

            // Setup gallery click
            $('#galleryThumbnails').on('click', '.thumbnail-item', function () {
                $('.thumbnail-item').removeClass('active');
                $(this).addClass('active');
                const src = $(this).data('src');
                const type = $(this).data('type');
                if (type === 'video') {
                    $('#mediaContainer').html(`<iframe width="100%" height="100%" src="${src}" frameborder="0" allowfullscreen></iframe>`);
                } else {
                    $('#mediaContainer').html(`<img src="${src}" style="width:100%;height:100%;object-fit:contain;">`);
                }
            });

            $('.tab-button').click(function () {
                const tab = $(this).data('tab');
                $('.tab-button').removeClass('active');
                $(this).addClass('active');
                $('.tab-content').removeClass('active');
                $(`.tab-content[data-tab="${tab}"]`).addClass('active');
            });

            AOS.init({ duration: 800, once: true });
        },
        error: function (err) {
            console.error("Lỗi tải dữ liệu:", err);
            alert("Không thể tải thông tin game. Vui lòng thử lại sau.");
        }
    });
});


$('#downloadBtn').on('click', function () {
        window.location.href = 'https://www.google.com/';
});

$('.share-button').on('click', function () {
    const shareData = {
        title: document.getElementById('gameTitle').innerText,
        text: 'Xem trò chơi này trên DT9:',
        url: window.location.href
    };
    if (navigator.share) {
        navigator.share(shareData)
            .then(() => {
                console.log('Chia sẻ thành công!');
            })
            .catch((error) => {
                console.error('Lỗi khi chia sẻ hoặc người dùng hủy bỏ:', error);
            });

    } else {
        alert('Trình duyệt không hỗ trợ Web Share API. Đang sao chép URL vào clipboard.');
        navigator.clipboard.writeText(shareData.url).then(() => {
            alert('URL đã được sao chép vào clipboard!');
        }).catch(err => {
            console.error('Không thể sao chép URL: ', err);
        });
    }
});
