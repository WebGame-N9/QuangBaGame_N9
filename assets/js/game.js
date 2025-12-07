// --- CẤU HÌNH API ---
// Thay thế bằng BIN_ID và Master Key thực tế của bạn từ JSONBin.io
const BIN_ID = '6935590d43b1c97be9dd6572'; // ID Bin của bạn
const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const API_KEY = '$2a$10$dAGf830CRlXglDv0cce8IOz5ayJDKDIW8.uPxvWVXMgR7Wm.UG.7G';

// Biến toàn cục để lưu trữ dữ liệu sau khi GET thành công
let allGamesData = [];


// --- CHỨC NĂNG LẤY DỮ LIỆU TỪ API (AJAX GET) ---
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

        // JSONBin.io trả về dữ liệu của bạn trong trường 'record'
        allGamesData = data.record;
        console.log("Dữ liệu đã được tải:", allGamesData.length, "games.");

        // Sau khi có dữ liệu, mới bắt đầu hiển thị
        renderGameList();

    } catch (error) {
        console.error('Lỗi khi tải dữ liệu Game:', error);

        // Hiển thị thông báo lỗi cho người dùng
        const gameListContainer = document.getElementById('game-list');
        gameListContainer.innerHTML = '<p class="error-message">Không thể tải dữ liệu game. Vui lòng thử lại sau.</p>';
    }
}


// --- CÁC HÀM XỬ LÝ GIAO DIỆN VÀ FILTER ---

let sidebar = null;
let overlay = null;

function openSidebar() {
    if (!sidebar || !overlay) return;
    sidebar.classList.add('open');
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    if (!sidebar || !overlay) return;
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
    document.body.style.overflow = 'auto';
}

window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) closeSidebar();
});

// *** ĐÃ SỬA: Dùng game.genres thay vì game.categories ***
function createGameCard(game) {
    const imgSrc = game.thumbnail;
    
    // Tính toán độ trễ dựa trên ID để tạo hiệu ứng xếp tầng
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
                    <i class="fa-solid fa-download"></i> Chi tiết
                </button>
            </div>
        </div>
    `;
}

// Chuyển hướng đến trang chi tiết game
function goToGameDetail(gameId) {
    window.location.href = `game_detail_template.html?id=${gameId}`; 
}

function renderGameList() {
    // *** CHỈNH SỬA: Dùng allGamesData thay vì gamesData ***
    if (allGamesData.length === 0) {
        console.log("Chưa có dữ liệu để render.");
        return; // Thoát nếu dữ liệu chưa được tải
    }

    const gameListContainer = document.getElementById('game-list');
    const searchInput = document.getElementById('search-input').value.toLowerCase().trim();
    const selectedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(cb => cb.value);
    const selectedPlatforms = Array.from(document.querySelectorAll('input[name="platform"]:checked')).map(cb => cb.value);

    // Đảm bảo có ít nhất một rating được chọn, nếu không thì mặc định là 0
    const ratingRadio = document.querySelector('input[name="rating_range"]:checked');
    const minRating = ratingRadio ? parseFloat(ratingRadio.value) : 0;

    const gameCountSpan = document.getElementById('game-count');
    const noResultsDiv = document.getElementById('no-results');

    // *** ĐÃ SỬA: Lọc từ allGamesData, SỬA game.categories thành game.genres ***
    let filteredGames = allGamesData.filter(game => {
        const nameMatch = game.name.toLowerCase().includes(searchInput);
        const categoryMatch = !selectedCategories.length || game.genres.some(cat => selectedCategories.includes(cat)); // Dùng game.genres
        const platformMatch = !selectedPlatforms.length || game.platforms.some(p => selectedPlatforms.includes(p));
        const ratingMatch = game.rating >= minRating;
        return nameMatch && categoryMatch && platformMatch && ratingMatch;
    });

    gameListContainer.innerHTML = filteredGames.map(createGameCard).join('');

    // Cập nhật số lượng game
    gameCountSpan.textContent = `${filteredGames.length} Games`;

    noResultsDiv.classList.toggle('visible', !filteredGames.length);
    
    // *** THÊM VÀO ĐÂY: Làm mới AOS sau khi DOM được cập nhật ***
    if (typeof AOS !== 'undefined') {
        AOS.refresh();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Gán các phần tử DOM sau khi DOM sẵn sàng
    sidebar = document.getElementById('filter-sidebar');
    overlay = document.getElementById('mobile-overlay');

    // Kết nối nút hamburger (nếu có)
    const hamburger = document.querySelector('.hamburger-btn');
    if (hamburger) hamburger.addEventListener('click', openSidebar);

    // 1. Tải dữ liệu từ API ngay khi DOM được tải
    fetchGamesData();

    // Thiết lập các bộ lắng nghe sự kiện
    document.getElementById('search-input').addEventListener('input', renderGameList);
    
    document.getElementById('apply-filters-btn').addEventListener('click', () => {
        renderGameList();
        closeSidebar();
    });
    
    document.getElementById('clear-filters-btn').addEventListener('click', () => {
        // Thiết lập lại giá trị mặc định cho bộ lọc
        document.getElementById('search-input').value = '';
        document.querySelectorAll('input[name="category"]').forEach(cb => cb.checked = false);
        // Chọn lại mặc định ban đầu
        const catHaDong = document.querySelector('input[name="category"][value="Hành động"]');
        const catPhieuLuu = document.querySelector('input[name="category"][value="Phiêu lưu"]');
        if (catHaDong) catHaDong.checked = true;
        if (catPhieuLuu) catPhieuLuu.checked = true;
        document.querySelectorAll('input[name="platform"]').forEach(cb => cb.checked = false);
        const pc = document.querySelector('input[name="platform"][value="PC"]');
        if (pc) pc.checked = true;
        const rating0 = document.querySelector('input[name="rating_range"][value="0"]');
        if (rating0) rating0.checked = true;
        
        renderGameList();
        closeSidebar();
    });
    
    // *** THÊM VÀO ĐÂY: Khởi tạo AOS sau khi DOM sẵn sàng ***
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800, // Thời gian animation
            once: true // Chỉ chạy một lần
        });
    }
});