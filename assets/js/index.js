AOS.init({
    once: true,
    offset: 100,
    duration: 800,
    easing: 'ease-out-cubic',
});

const gameData = [
    {
        id: 'GameID1',
        name: 'Genshin Impact',
        url: 'https://cdn1.epicgames.com/salesEvent/salesEvent/EGS_GenshinImpact_miHoYoLimited_S1_2560x1440-91c6cd7312cc2647c3ebccca10f30399',
        link: 'game_ID1.html',
        cardUrl: 'https://upload.wikimedia.org/wikipedia/vi/0/0a/Genshin_Impact_cover.jpg',
        category: 'Nhập vai Hành động • Thế giới mở • Gacha',
        size: '125 GB',
        downloads: '65M+',
        updateDate: '15/11/2025',
        rating: 4.7,
        hotEvent: 'https://fastcdn.hoyoverse.com/content-v2/hk4e/161127/b0b1baec0c575e02fd8f10391fc044b1_292876649716802309.jpg',
    },
    {
        id: 'GameID2',
        name: 'Fortnite',
        url: 'https://cdn2.unrealengine.com/fneco-2025-keyart-thumb-1920x1080-de84aedabf4d.jpg',
        link: 'game_ID2.html',
        cardUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRls92oO4Eh-3ZGV7ogLhzToIFB1Bhy5wYU9FvHIxi_wAeq24Q3cZu-Q6ssoZ2EQ8xp02qlL922bLTQoNr3BFwmayxuI1Pd6ugoO8-kJQ&s=10',
        category: 'Battle Royale • Sinh tồn • Online',
        size: '50 GB',
        downloads: '500M+',
        updateDate: '01/12/2025',
        rating: 4.5,
        hotEvent: 'https://cafefcdn.com/thumb_w/640/203337114487263232/2025/12/6/photo1765002575453-1765002575749588981854-1765003518830112687538.jpg'
    },
    {
        id: 'GameID3',
        name: 'Minecraft',
        url: 'https://4kwallpapers.com/images/walls/thumbs_3t/24242.jpg',
        link: 'game_ID3.html',
        cardUrl: 'https://cdn-media.sforum.vn/storage/app/media/bookgrinder/minecraft-121-1.jpg',
        category: 'Sandbox • Sinh tồn • Thế giới mở',
        size: '4 GB',
        downloads: '300M+ Units Sold',
        updateDate: '10/10/2025',
        rating: 4.8,
        hotEvent: 'https://cafefcdn.com/thumb_w/640/203337114487263232/2025/12/6/photo1765002575453-1765002575749588981854-1765003518830112687538.jpg'
    },
    {
        id: 'GameID4',
        name: 'League of Legends',
        url: 'https://cdn1.epicgames.com/offer/24b9b5e323bc40eea252a10cdd3b2f10/EGS_LeagueofLegends_RiotGames_S1_2560x1440-47eb328eac5ddd63ebd096ded7d0d5ab',
        link: 'game_ID4.html',
        cardUrl: 'https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/2022_6_1_637897027105597193_lol-la-gi-thumnail.png',
        category: 'MOBA • Chiến thuật',
        size: '30 GB SSD',
        downloads: '152M+',
        updateDate: '28/11/2025',
        rating: 4.6,
        hotEvent: 'https://cafefcdn.com/thumb_w/640/203337114487263232/2025/12/6/photo1765002575453-1765002575749588981854-1765003518830112687538.jpg'
    },
    {
        id: 'GameID5',
        name: 'Ngọc Rồng Online',
        url: 'https://ngocrongonline.com/images/bn_tt25.png',
        link: 'game_ID5.html',
        cardUrl: 'https://play-lh.googleusercontent.com/vKVAdhI6utrhF_HRtfZbI9CCTwN7rRJix35oQuJwEIaYKO8IFXnaijePLOehewDCwWI',
        category: 'MMORPG • 2D',
        size: '100 MB',
        downloads: '5M+',
        updateDate: '20/11/2025',
        rating: 4.2,
        hotEvent: 'https://cafefcdn.com/thumb_w/640/203337114487263232/2025/12/6/photo1765002575453-1765002575749588981854-1765003518830112687538.jpg'
    }
];

const BannerGameID = ['GameID1', 'GameID2', 'GameID3', 'GameID4', 'GameID5'];
let listGameUpdate = ['GameID1', 'GameID2', 'GameID3', 'GameID4', 'GameID5']; // có thể thay đổi
let listGameTrending = ['GameID1', 'GameID2', 'GameID3', 'GameID4', 'GameID5'];// có thể thay đổi
const listHotEvents = ['GameID1', 'GameID2', 'GameID3', 'GameID4', 'GameID5'];

const numberUpdate = 4;
const numberTrending = 3;
const numberEvents = 2;



// phần sắp xếp ngày =============================================================================================================
function parseDate(dateStr) {
    const parts = dateStr.split('/');
    // parts[0] là ngày, parts[1] là tháng, parts[2] là năm
    return new Date(parts[2], parts[1] - 1, parts[0]);
}

// Kiểm tra và sắp xếp
function checkAndSortUpdateList() {
    let isSorted = true;
    for (let i = 0; i < listGameUpdate.length - 1; i++) {
        const idA = listGameUpdate[i];
        const idB = listGameUpdate[i + 1];

        const gameA = gameData.find(g => g.id === idA);
        const gameB = gameData.find(g => g.id === idB);
        if (parseDate(gameA.updateDate) < parseDate(gameB.updateDate)) {
            isSorted = false;
            break;
        }
    }
    if (!isSorted) {
        listGameUpdate.sort((idA, idB) => {
            const gameA = gameData.find(g => g.id === idA);
            const gameB = gameData.find(g => g.id === idB);
            return parseDate(gameB.updateDate) - parseDate(gameA.updateDate);
        });

        updateList = listGameUpdate.map(id => {
            return gameData.find(game => game.id === id);
        }).filter(item => item !== undefined);

        renderUpdateGames();
    } else {
    }
}
// phần sắp xếp ngày =============================================================================================================

// phần sắp xếp lượt tải =============================================================================================================
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
    }

    return number;
} function parseDownloads(downloadStr) {
    if (!downloadStr) return 0;

    let cleanStr = downloadStr.toString().toLowerCase().replace(/,/g, '');

    let numberMatch = cleanStr.match(/[0-9.]+/);
    if (!numberMatch) return 0;

    let number = parseFloat(numberMatch[0]);

    // 3. Nhân với đơn vị
    if (cleanStr.includes('b') && !cleanStr.includes('mb')) {
        return number * 1000000000;
    } else if (cleanStr.includes('m')) {
        return number * 1000000;
    } else if (cleanStr.includes('k')) {
        return number * 1000;
    }

    return number;
}

function sortAndRenderTrending() {
    listGameTrending.sort((idA, idB) => {

        const gameA = gameData.find(g => g.id === idA);
        const gameB = gameData.find(g => g.id === idB);
        console.log(gameA.id + "-" + gameB.id);
        return parseDownloads(gameB.downloads) - parseDownloads(gameA.downloads);
    });

    trendingList = listGameTrending.map(id => {
        return gameData.find(game => game.id === id);
    }).filter(item => item !== undefined);

    renderTrendingGames();
}
// phần sắp xếp lượt tải =============================================================================================================

// lọc,  tìm kiếm( duyệt qua từng id trong BannerGameID và return về các giá trị trong gameData nếu bằng với id của banner và nếu id đó không bị không có gì)
const bannerList = BannerGameID.map(id => {
    return gameData.find(game => game.id === id);
}).filter(item => item !== undefined);

let updateList = listGameUpdate.map(id => {
    return gameData.find(game => game.id === id);
}).filter(item => item !== undefined);

let trendingList = listGameTrending.map(id => {
    return gameData.find(game => game.id === id);
}).filter(item => item !== undefined);

const eventList = listHotEvents.map(id => {
    return gameData.find(game => game.id === id);
}).filter(item => item !== undefined);

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

        linkElement.href = currentGame.link;
        imgElement.src = currentGame.url;
        imgElement.alt = currentGame.name;
    } else {
        imgElement = linkElement.querySelector('img');
        linkElement.href = currentGame.link;

        imgElement.classList.replace('opacity-100', 'opacity-0');

        setTimeout(() => {
            imgElement.src = currentGame.url;
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

    currentBannerIndex = (currentBannerIndex + 1) % bannerList.length;
    updateBanner();
}

function prevBanner() {

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
        const card = document.createElement('div');
        card.className = 'index_bg-card index_card-base index_card-vertical group';

        card.setAttribute('data-aos', 'fade-up');
        card.setAttribute('data-aos-delay', index * 100);

        card.innerHTML = `
            <div class="h-48 overflow-hidden rounded-t-xl relative">
                <img src="${game.url}" alt="${game.name}" 
                     class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
            </div>
            <div class="index_card-content-inner">
                <div>
                    <h3 class="index_game-title truncate" title="${game.name}">${game.name}</h3>
                    <p class="index_game-category truncate" title="${game.category}">${game.category}</p>

                    <div class="index_bg-dark index_card-stat-box">
                        <span title="Dung lượng">
                            <i class="fa-solid fa-hard-drive text-gray-500"></i> ${game.size}
                        </span>
                        <span title="Lượt tải">
                            <i class="fa-solid fa-download text-green-500"></i> ${game.downloads}
                        </span>
                    </div>
                </div>

                <a href="${game.link}" class="w-full py-2 rounded-lg index_btn-primary text-sm font-semibold block text-center mt-2 hover:opacity-90 transition">
                    <i class="fa-solid fa-download mr-1"></i> Tải ngay
                </a>
            </div>
        `;
        updateContainer.appendChild(card);
    });
}
// phần update =============================================================================================================

// phần trending =============================================================================================================
function renderTrendingGames() {
    const trendingContainer = document.querySelector('.index_grid-3-cols');

    if (!trendingContainer || trendingList.length === 0) return;

    trendingContainer.innerHTML = '';

    trendingList.slice(0,numberTrending).forEach((game, index) => {
        const card = document.createElement('div');
        card.className = 'index_bg-card index_hot-card-horizontal group';
        card.setAttribute('data-aos', 'fade-up');
        card.setAttribute('data-aos-delay', index * 100);
        card.innerHTML = `
            <div class="index_hot-card-thumb overflow-hidden rounded-lg">
                <img src="${game.cardUrl}" alt="${game.name}" 
                     class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
            </div>

            <div class="index_hot-card-details w-full pl-3 flex flex-col justify-between">
                <div>
                    <h4 class="index_hot-card-title group-hover:text-purple-400 truncate w-40" title="${game.name}">
                        ${game.name}
                    </h4>
                    
                    <p class="index_hot-card-meta truncate w-40" title="${game.category}">
                        ${game.category}
                    </p>
                    
                    <div class="index_hot-card-rating mt-1">
                        <div class="text-yellow-500 flex items-center">
                            <i class="fa-solid fa-star text-[10px] mr-1"></i> ${game.rating}
                        </div>
                        <span class="text-gray-500 mx-2">|</span>
                        <div class="text-gray-300 text-[10px] flex items-center">
                            <i class="fa-solid fa-hard-drive mr-0.5"></i> ${game.size}
                        </div>
                    </div>
                </div>

                <div class="flex justify-between items-end mt-2">
                    <span class="text-[10px] text-gray-500 truncate max-w-[80px]" title="${game.downloads}">
                        <i class="fa-solid fa-download"></i> ${game.downloads}
                    </span>
                    
                    <a href="${game.link}" class="index_hot-card-download-btn cursor-pointer hover:bg-purple-600 transition-colors">
                        <i class="fa-solid fa-download text-[10px]"></i> Tải
                    </a>
                </div>
            </div>
        `;

        trendingContainer.appendChild(card);
    });
}
// phần treding =============================================================================================================

// phần event ===============================================================================================================
function renderHotEvents() {
    const eventContainer = document.querySelector('.index_grid-2-cols');
    if (!eventContainer || eventList.length === 0) return;
    eventContainer.innerHTML = '';
    eventList.slice(0,numberEvents).forEach((game, index) => {
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
            
            <a href="${game.link}" class="absolute inset-0 z-20"></a>
        `;

        eventContainer.appendChild(card);
    });
}
// phần event ===============================================================================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeDots();
    updateBanner();

    checkAndSortUpdateList();
    sortAndRenderTrending();

    renderHotEvents();
    if (bannerList.length > 1) {
        setInterval(nextBanner, 5000);
    }
});