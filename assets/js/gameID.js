// --- CẤU HÌNH API (Sao chép từ game.js) ---
// Thay thế bằng BIN_ID và Master Key thực tế của bạn từ JSONBin.io
const BIN_ID = '6935590d43b1c97be9dd6572'; // ID Bin của bạn
const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const API_KEY = '$2a$10$dAGf830CRlXglDv0cce8IOz5ayJDKDIW8.uPxvWVXMgR7Wm.UG.7G';
let allGamesData = [];

// --- CHỨC NĂNG TẠO CARD (Sao chép từ game.js) ---
function createGameCard(game) {
    const imgSrc = `assets/img/game${game.id}.png`;
    
    return `
        <div class="game-card" 
             data-id="${game.id}" 
             data-name="${game.name.toLowerCase()}" 
             data-rating="${game.rating}"
             onclick="goToGameDetail(${game.id})"
             data-aos="fade-up"               
             data-aos-delay="0">      
            <div class="game-image">
                <img src="${imgSrc}" alt="${game.name}" onerror="this.onerror=null;this.src='assets/img/default_game.png'">
            </div>
            <div class="game-content">
                <div>
                    <h4 class="game-title">${game.name}</h4>
                    <p class="game-category">${game.categories.join(' • ')}</p>
                    <p class="game-rating">
                        <i class="fa-solid fa-star"></i> ${game.rating.toFixed(1)}
                    </p>
                </div>
                <button class="btn-download">
                    <i class="fa-solid fa-download"></i> Chi tiết
                </button>
            </div>
        </div>
    `;
}

function goToGameDetail(gameId) {
    window.location.href = `game_ID${gameId}.html`; 
}

// --- CHỨC NĂNG MỚI: RENDER GAME LIÊN QUAN NGẪU NHIÊN ---
function renderRelatedGames(gameData) {
    const relatedGamesContainer = document.getElementById('related-games-list');
    const noResultsDiv = document.getElementById('related-no-results');
    
    // 1. Lấy Game ID hiện tại
    const fileName = window.location.pathname.split('/').pop();
    const match = fileName.match(/game_ID(\d+)\.html/);
    const currentGameId = match ? parseInt(match[1]) : null;
    
    // 2. Lọc bỏ game hiện tại
    let availableGames = gameData.filter(g => g.id !== currentGameId);

    // 3. Xáo trộn mảng (Shuffle Algorithm - Fisher-Yates)
    for (let i = availableGames.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableGames[i], availableGames[j]] = [availableGames[j], availableGames[i]];
    }
    
    // 4. Chọn 2 game đầu tiên
    const relatedGames = availableGames.slice(0, 2); 

    if (relatedGames.length > 0) {
        relatedGamesContainer.innerHTML = relatedGames.map(createGameCard).join('');
        noResultsDiv.style.display = 'none';
    } else {
        relatedGamesContainer.innerHTML = '';
        noResultsDiv.style.display = 'block';
    }

    // Làm mới AOS
    if (typeof AOS !== 'undefined') {
        AOS.refresh();
    }
}

// --- CHỨC NĂNG LẤY DỮ LIỆU TỪ API (AJAX GET) ---
async function fetchAndRenderRelatedGames() {
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

        // Sau khi có dữ liệu, bắt đầu render game liên quan (ngẫu nhiên)
        renderRelatedGames(allGamesData);

    } catch (error) {
        console.error('Lỗi khi tải dữ liệu Game:', error);
        document.getElementById('related-no-results').style.display = 'block';
    }
}

// --- CHỨC NĂNG: XỬ LÝ SỰ KIỆN ĐỔI MEDIA GALLERY ---
function setupMediaGallery() {
    const mediaContainer = document.getElementById('mediaContainer');
    const galleryThumbnails = document.getElementById('galleryThumbnails');

    if (!mediaContainer || !galleryThumbnails) return;

    galleryThumbnails.addEventListener('click', function(e) {
        let thumbnailItem = e.target.closest('.thumbnail-item');
        if (!thumbnailItem) return;

        // 1. Loại bỏ trạng thái 'active' của tất cả thumbnails
        document.querySelectorAll('.thumbnail-item').forEach(item => {
            item.classList.remove('active');
        });

        // 2. Thêm trạng thái 'active' cho thumbnail được click
        thumbnailItem.classList.add('active');

        // 3. Lấy dữ liệu nguồn (src) và loại (type)
        const mediaSrc = thumbnailItem.getAttribute('data-src');
        const mediaType = thumbnailItem.getAttribute('data-type');
        
        if (!mediaSrc) return;

        // 4. Cập nhật nội dung của mediaContainer
        let content = '';
        if (mediaType === 'video') {
            content = `
                <iframe width="100%" height="100%" 
                        src="${mediaSrc}" 
                        title="YouTube video player" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        referrerpolicy="strict-origin-when-cross-origin" 
                        allowfullscreen>
                </iframe>
            `;
        } else if (mediaType === 'image') {
            content = `<img src="${mediaSrc}" alt="Game Image">`;
        } else {
            return;
        }

        // Đặt nội dung mới
        mediaContainer.innerHTML = content;
    });
}

// --- XỬ LÝ SỰ KIỆN TAB (Giữ nguyên) ---
function setupTabEvents() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            document.querySelector(`.tab-content[data-tab="${targetTab}"]`).classList.add('active');
        });
    });
}

// --- CHUẨN BỊ KHI DOM LOAD XONG ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Tải dữ liệu và render game liên quan (ngẫu nhiên)
    fetchAndRenderRelatedGames();

    // 2. Thiết lập sự kiện chuyển tab
    setupTabEvents();

    // 3. Thiết lập sự kiện thay đổi media gallery (Đã thêm logic này)
    setupMediaGallery();
    
    // 4. Khởi tạo AOS 
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800, 
            once: true 
        });
    }
});