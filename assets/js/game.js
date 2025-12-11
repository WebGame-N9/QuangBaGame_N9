const BIN_ID = '6935590d43b1c97be9dd6572'; // ID Bin
const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const API_KEY = '$2a$10$dAGf830CRlXglDv0cce8IOz5ayJDKDIW8.uPxvWVXMgR7Wm.UG.7G';

let allGamesData = [];


// Lay du lieu
async function fetchGamesData() {
    console.log("Đang lấy dữ liệu Game từ API...");
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'X-Master-Key': API_KEY,
            }
        });

        if (!response.ok) {
            throw new Error(`Lỗi HTTP: ${response.status}`);
        }

        const data = await response.json();

        allGamesData = data.record;
        console.log("Dữ liệu đã được tải:", allGamesData.length, "games.");

        renderGameList();

    } catch (error) {
        console.error('Lỗi khi tải dữ liệu Game:', error);
        $('#game-list').html('<p class="error-message">Không thể tải dữ liệu game. Vui lòng thử lại sau.</p>');
    }
}

function openSidebar() {
    $('#filter-sidebar').addClass('open');
    $('#mobile-overlay').addClass('visible');
    $('body').css('overflow', 'hidden');
}

function closeSidebar() {
    $('#filter-sidebar').removeClass('open');
    $('#mobile-overlay').removeClass('visible');
    $('body').css('overflow', 'auto');
}

function goToGameDetail(gameId) {
    window.location.href = `game_detail_template.html?id=${gameId}`;
}

function createGameCard(game) {
    const imgSrc = game.thumbnail;

    const delay = (game.id % 8) * 100;

    return `
        <div class="game-card" 
             data-id="${game.id}" 
             data-name="${game.name.toLowerCase()}" 
             data-rating="${game.rating}"
             onclick="goToGameDetail(${game.id})"
             data-aos="fade-up"               
             data-aos-delay="${delay}">      
            <div class="game-image">
                <img src="${imgSrc}" alt="${game.name}" onerror="this.onerror=null;this.src='assets/img/default_game.png'">
            </div>
            <div class="game-content">
                <div>
                    <h3 class="game-title">${game.name}</h3>
                    <p class="game-category">${game.genres.join(' • ')}</p>
                    <p class="game-rating">
                        <i class="fa-solid fa-star"></i> ${game.rating.toFixed(1)}
                    </p>
                </div>
                <button class="btn-download">
                    <i class="fa-solid fa-info-circle"></i> Chi tiết
                </button>
            </div>
        </div>
    `;
}

function renderGameList() {
    if (allGamesData.length === 0) {
        console.log("Chưa có dữ liệu để render.");
        return;
    }

    const searchInput = $('#search-input').val().toLowerCase().trim();
    const selectedCategories = $('input[name="category"]:checked').map((_, cb) => $(cb).val()).get();
    const selectedPlatforms = $('input[name="platform"]:checked').map((_, cb) => $(cb).val()).get();

    const ratingRadioValue = $('input[name="rating_range"]:checked').val();
    const minRating = ratingRadioValue ? parseFloat(ratingRadioValue) : 0;

    let filteredGames = allGamesData.filter(game => {
        const nameMatch = game.name.toLowerCase().includes(searchInput);
        const categoryMatch = !selectedCategories.length || game.genres.some(cat => selectedCategories.includes(cat)); // Dùng game.genres
        const platformMatch = !selectedPlatforms.length || game.platforms.some(p => selectedPlatforms.includes(p));
        const ratingMatch = game.rating >= minRating;
        return nameMatch && categoryMatch && platformMatch && ratingMatch;
    });

    $('#game-list').html(filteredGames.map(createGameCard).join(''));

    $('#game-count').text(`${filteredGames.length} Games`);

    $('#no-results').toggleClass('visible', !filteredGames.length);

    if (typeof AOS !== 'undefined') {
        AOS.refresh();
    }
}


// Su kien chinh 
$(document).ready(function () {
    $('#filter-toggle-btn').on('click', openSidebar);
    $('#close-btn').on('click', closeSidebar);
    $('#mobile-overlay').on('click', closeSidebar);
    $(window).on('resize', function () {
        if ($(window).width() >= 1024) {
            closeSidebar();
        }
    });
    fetchGamesData();

    $('#search-input').on('input', renderGameList);

    $('#apply-filters-btn').on('click', function () {
        renderGameList();
        closeSidebar();
    });

    $('#clear-filters-btn').on('click', function () {
        $('#search-input').val('');

        $('input[name="category"]').prop('checked', false);
        $('input[name="platform"]').prop('checked', false);

        $('input[name="category"][value="Hành động"]').prop('checked', true);
        $('input[name="category"][value="Phiêu lưu"]').prop('checked', true);

        $('input[name="platform"][value="PC"]').prop('checked', true);

        $('input[name="rating_range"][value="0"]').prop('checked', true);

        renderGameList();
        closeSidebar();
    });

    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true
        });
    }
});