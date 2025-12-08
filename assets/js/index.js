// --- CẤU HÌNH API ---
// Thay thế bằng BIN_ID và Master Key thực tế của bạn từ JSONBin.io
const BIN_ID = '6935590d43b1c97be9dd6572'; 
const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const API_KEY = '$2a$10$dAGf830CRlXglDv0cce8IOz5ayJDKDIW8.uPxvWVXMgR7Wm.UG.7G'; 

// Biến toàn cục để lưu trữ dữ liệu sau khi GET thành công
let allGamesData = [];

// --- CẤU HÌNH HIỂN THỊ CỤC BỘ (Dùng ID từ JSON) ---
const BannerGameIDs = [4, 1, 2, 3, 5]; 
let listGameUpdateIDs = [4, 1, 2, 3, 5];
let listGameTrendingIDs = [4, 1, 2, 3, 5];
const listHotEventIDs = [4, 1];

const numberUpdate = 4;
const numberTrending = 3;
const numberEvents = 2;


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
        allGamesData = data.record;
        console.log("Dữ liệu đã được tải:", allGamesData.length, "games.");

        // Sau khi có dữ liệu, mới bắt đầu xử lý và hiển thị
        initializeGameLists();
        renderHotEvents();
        
        // Khởi tạo Banner
        initializeDots();
        updateBanner();
        if (bannerList.length > 1) {
            setInterval(nextBanner, 5000);
        }

    } catch (error) {
        console.error('Lỗi khi tải dữ liệu Game:', error);
    }
}

// --- KHỞI TẠO VÀ LỌC DANH SÁCH GAME ---
let bannerList = [];
let updateList = [];
let trendingList = [];
let eventList = [];

function getGameDataByID(id) {
    // Lấy dữ liệu game bằng ID, ID được chuyển thành dạng số
    return allGamesData.find(game => game.id === Number(id));
}

function initializeGameLists() {
    // 1. Lấy dữ liệu thô cho các danh sách
    bannerList = BannerGameIDs.map(getGameDataByID).filter(item => item !== undefined);
    
    // Đảm bảo các ID cấu hình có trong dữ liệu
    listGameUpdateIDs = listGameUpdateIDs.filter(id => getGameDataByID(id) !== undefined);
    listGameTrendingIDs = listGameTrendingIDs.filter(id => getGameDataByID(id) !== undefined);
    
    // 2. Sắp xếp và render Update
    checkAndSortUpdateList();
    
    // 3. Sắp xếp và render Trending
    sortAndRenderTrending();
    
    // 4. Lấy danh sách Hot Events
    eventList = listHotEventIDs.map(getGameDataByID).filter(item => item !== undefined);
}

// --- PHẦN SẮP XẾP NGÀY UPDATE ---
function parseDate(dateStr) {
    if (!dateStr) return new Date(0); // Trả về ngày rất cũ nếu không có ngày
    const parts = dateStr.split('/');
    // parts[0] là ngày, parts[1] là tháng, parts[2] là năm
    return new Date(parts[2], parts[1] - 1, parts[0]);
}

function checkAndSortUpdateList() {
    listGameUpdateIDs.sort((idA, idB) => {
        const gameA = getGameDataByID(idA);
        const gameB = getGameDataByID(idB);
        // Sắp xếp giảm dần theo ngày (ngày mới nhất đứng đầu)
        return parseDate(gameB.updateDate) - parseDate(gameA.updateDate);
    });

    updateList = listGameUpdateIDs.map(getGameDataByID).filter(item => item !== undefined);

    renderUpdateGames();
}

// --- PHẦN SẮP XẾP LƯỢT TẢI ---
function parseDownloads(downloadStr) {
    if (!downloadStr) return 0;
    let cleanStr = downloadStr.toString().toLowerCase().replace(/,/g, '');
    let numberMatch = cleanStr.match(/[0-9.]+/);
    if (!numberMatch) return 0;
    let number = parseFloat(numberMatch[0]);

    if (cleanStr.includes('b') && !cleanStr.includes('mb')) {
        return number * 1000000000;
    } else if (cleanStr.includes('m')) {
        return number * 1000000;
    } else if (cleanStr.includes('k')) {
        return number * 1000;
    } else if (cleanStr.includes('units sold')) {
        // Xử lý riêng cho trường hợp '300M+ Units Sold' của Minecraft
        return number * 1000000;
    }
    return number;
}

function sortAndRenderTrending() {
    listGameTrendingIDs.sort((idA, idB) => {
        const gameA = getGameDataByID(idA);
        const gameB = getGameDataByID(idB);
        // Sắp xếp giảm dần theo lượt tải
        return parseDownloads(gameB.downloads) - parseDownloads(gameA.downloads);
    });

    trendingList = listGameTrendingIDs.map(getGameDataByID).filter(item => item !== undefined);

    renderTrendingGames();
}

// --- CÁC PHẦN RENDER GIAO DIỆN ---
let currentBannerIndex = 0;
const bannerContainer = document.getElementById('index_main-banner-container');
const bannerDotsContainer = document.getElementById('index_banner-dots-container');
const prevButton = document.querySelector('.fa-chevron-left')?.parentElement;
const nextButton = document.querySelector('.fa-chevron-right')?.parentElement;


// phần banner =============================================================================================================
function updateBanner() {
    if (!bannerContainer || bannerList.length === 0) return;
    const currentGame = bannerList[currentBannerIndex];
    let linkElement = bannerContainer.querySelector('a');
    let imgElement;

    // SỬ DỤNG CÚ PHÁP LINK MỚI: game_detail_template.html?id=${gameId}
    const gameLink = `game_detail_template.html?id=${currentGame.id}`; 

    if (!linkElement) {
        bannerContainer.innerHTML = '';
        linkElement = document.createElement('a');
        linkElement.classList.add('w-full', 'h-full', 'block');

        imgElement = document.createElement('img');
        imgElement.classList.add('w-full', 'h-full', 'rounded-2xl',
            'object-cover', 'transition-opacity', 'duration-500', 'ease-in-out', 'opacity-100');

        linkElement.appendChild(imgElement);
        bannerContainer.appendChild(linkElement);
        bannerContainer.classList.remove('index_img-placeholder', 'text-3xl');

        linkElement.href = gameLink;
        // Sử dụng game.url (link banner)
        imgElement.src = currentGame.url || currentGame.thumbnail; 
        imgElement.alt = currentGame.name;
    } else {
        imgElement = linkElement.querySelector('img');
        linkElement.href = gameLink;

        imgElement.classList.replace('opacity-100', 'opacity-0');

        setTimeout(() => {
            imgElement.src = currentGame.url || currentGame.thumbnail;
            imgElement.alt = currentGame.name;
            imgElement.classList.replace('opacity-0', 'opacity-100');
            updateDots();
        }, 500);
    }
}
// phần banner =============================================================================================================

// phần nút mũi tên ========================================================================================================
function initializeDots() {
    if (bannerDotsContainer && bannerList.length > 0) {
        bannerDotsContainer.innerHTML = '';
        bannerList.forEach((_, index) => {
            const dot = document.createElement('div');

            dot.className = `w-2 h-2 rounded-full transition duration-300 cursor-pointer ${index === currentBannerIndex ? 'bg-white' : 'bg-gray-500 hover:bg-white'}`;

            dot.addEventListener('click', () => {
                currentBannerIndex = index;
                updateBanner();
                updateDots();
            });
            bannerDotsContainer.appendChild(dot);
        });
    }
}

function updateDots() {
    if (!bannerDotsContainer) return;
    const dots = bannerDotsContainer.querySelectorAll('div');
    dots.forEach((dot, index) => {
        if (index === currentBannerIndex) {
            dot.classList.remove('bg-gray-500', 'hover:bg-white');
            dot.classList.add('bg-white');
        } else {
            dot.classList.remove('bg-white');
            dot.classList.add('bg-gray-500', 'hover:bg-white');
        }
    });
}

function nextBanner() {
    if (bannerList.length === 0) return;
    currentBannerIndex = (currentBannerIndex + 1) % bannerList.length;
    updateBanner();
}

function prevBanner() {
    if (bannerList.length === 0) return;
    currentBannerIndex = (currentBannerIndex - 1 + bannerList.length) % bannerList.length;
    updateBanner();
}

if (prevButton) prevButton.addEventListener('click', prevBanner);
if (nextButton) nextButton.addEventListener('click', nextBanner);
// phần nút mũi tên ========================================================================================================

// phần update =============================================================================================================
function renderUpdateGames() {
    const updateContainer = document.querySelector('.index_grid-4-cols');

    if (!updateContainer || updateList.length === 0) return;

    updateContainer.innerHTML = '';

    updateList.slice(0,numberUpdate).forEach((game, index) => {
        // SỬ DỤNG game.genres thay vì game.category
        const categoryString = game.genres ? game.genres.join(' • ') : 'Đang cập nhật';
        const gameLink = `game_detail_template.html?id=${game.id}`; 
        
        const card = document.createElement('div');
        card.className = 'index_bg-card index_card-base index_card-vertical group';

        card.setAttribute('data-aos', 'fade-up');
        card.setAttribute('data-aos-delay', index * 100);

        card.innerHTML = `
            <div class="h-48 overflow-hidden rounded-t-xl relative">
                <img src="${game.url || game.thumbnail}" alt="${game.name}" 
                     class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
            </div>
            <div class="index_card-content-inner">
                <div>
                    <h3 class="index_game-title truncate" title="${game.name}">${game.name}</h3>
                    <p class="index_game-category truncate" title="${categoryString}">${categoryString}</p>

                    <div class="index_bg-dark index_card-stat-box">
                        <span title="Dung lượng">
                            <i class="fa-solid fa-hard-drive text-gray-500"></i> ${game.size || 'N/A'}
                        </span>
                        <span title="Lượt tải">
                            <i class="fa-solid fa-download text-green-500"></i> ${game.downloads || 'N/A'}
                        </span>
                    </div>
                </div>

                <a href="${gameLink}" class="w-full py-2 rounded-lg index_btn-primary text-sm font-semibold block text-center mt-2 hover:opacity-90 transition">
                    <i class="fa-solid fa-download mr-1"></i> Tải ngay
                </a>
            </div>
        `;
        updateContainer.appendChild(card);
    });
    if (typeof AOS !== 'undefined') { AOS.refresh(); }
}
// phần update =============================================================================================================

// phần trending =============================================================================================================
function renderTrendingGames() {
    const trendingContainer = document.querySelector('.index_grid-3-cols');

    if (!trendingContainer || trendingList.length === 0) return;

    trendingContainer.innerHTML = '';

    trendingList.slice(0,numberTrending).forEach((game, index) => {
        // SỬ DỤNG game.genres thay vì game.category
        const categoryString = game.genres ? game.genres.join(' • ') : 'Đang cập nhật';
        const gameLink = `game_detail_template.html?id=${game.id}`; 
        
        const card = document.createElement('div');
        card.className = 'index_bg-card index_hot-card-horizontal group';
        card.setAttribute('data-aos', 'fade-up');
        card.setAttribute('data-aos-delay', index * 100);
        card.innerHTML = `
            <div class="index_hot-card-thumb overflow-hidden rounded-lg">
                <img src="${game.cardUrl || game.thumbnail}" alt="${game.name}" 
                     class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
            </div>

            <div class="index_hot-card-details w-full pl-3 flex flex-col justify-between">
                <div>
                    <h4 class="index_hot-card-title group-hover:text-purple-400 truncate w-40" title="${game.name}">
                        ${game.name}
                    </h4>
                    
                    <p class="index_hot-card-meta truncate w-40" title="${categoryString}">
                        ${categoryString}
                    </p>
                    
                    <div class="index_hot-card-rating mt-1">
                        <div class="text-yellow-500 flex items-center">
                            <i class="fa-solid fa-star text-[10px] mr-1"></i> ${game.rating.toFixed(1)}
                        </div>
                        <span class="text-gray-500 mx-2">|</span>
                        <div class="text-gray-300 text-[10px] flex items-center">
                            <i class="fa-solid fa-hard-drive mr-0.5"></i> ${game.size || 'N/A'}
                        </div>
                    </div>
                </div>

                <div class="flex justify-between items-end mt-2">
                    <span class="text-[10px] text-gray-500 truncate max-w-[80px]" title="${game.downloads}">
                        <i class="fa-solid fa-download"></i> ${game.downloads || 'N/A'}
                    </span>
                    
                    <a href="${gameLink}" class="index_hot-card-download-btn cursor-pointer hover:bg-purple-600 transition-colors">
                        <i class="fa-solid fa-download text-[10px]"></i> Tải
                    </a>
                </div>
            </div>
        `;

        trendingContainer.appendChild(card);
    });
    if (typeof AOS !== 'undefined') { AOS.refresh(); }
}
// phần treding =============================================================================================================

// phần event ===============================================================================================================
function renderHotEvents() {
    const eventContainer = document.querySelector('.index_grid-2-cols');
    if (!eventContainer || eventList.length === 0) return;
    eventContainer.innerHTML = '';
    eventList.slice(0,numberEvents).forEach((game, index) => {
        const gameLink = `game_detail_template.html?id=${game.id}`; 
        
        const card = document.createElement('div');
        card.className = 'index_event-card-base group relative overflow-hidden rounded-2xl h-48 md:h-64 cursor-pointer';

        card.setAttribute('data-aos', 'flip-up');
        card.setAttribute('data-aos-delay', index * 200);

        card.innerHTML = `
            <img src="${game.hotEvent}" alt="${game.name} Event" 
                 class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">

            <div class="index_event-card-overlay absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors"></div>

            <div class="absolute bottom-4 left-4 z-10 flex flex-col items-start">
                <span class="index_event-card-text font-extrabold tracking-wider text-white text-xl uppercase drop-shadow-md">
                    ${game.name}
                </span>
                <span class="index_event-card-text text-sm font-normal mt-1 text-gray-200 opacity-90">
                    Sự kiện hot đang diễn ra
                </span>
            </div>

            <i class="fa-solid fa-fire absolute top-4 right-4 text-orange-400 text-3xl opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all drop-shadow-lg"></i>
            
            <a href="${gameLink}" class="absolute inset-0 z-20"></a>
        `;

        eventContainer.appendChild(card);
    });
    if (typeof AOS !== 'undefined') { AOS.refresh(); }
}
// phần event ===============================================================================================================


document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo AOS trước để các phần tử HTML có thể sử dụng
    AOS.init({
        once: true,
        offset: 100,
        duration: 800,
        easing: 'ease-out-cubic',
    });
    
    // Bắt đầu quá trình tải dữ liệu
    fetchGamesData();
});