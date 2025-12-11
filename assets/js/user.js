let db = { allGames: [], library: [], reviews: [], wishlist: [], currentUser: null }; 
let CURRENT_USER_ID = null;

// ============================================================
// 0. CẤU HÌNH API GHI VÀ HÀM CẬP NHẬT
// ============================================================

const JSONBIN_USER_ID = "69380bb1d0ea881f401ccc14"; // Bin chứa dữ liệu users
const BASE_URL = "https://api.jsonbin.io/v3/b/";
const JSONBIN_USER_UPDATE_URL = `${BASE_URL}${JSONBIN_USER_ID}`;
const MASTER_KEY = "$2a$10$dAGf830CRlXglDv0cce8IOz5ayJDKDIW8.uPxvWVXMgR7Wm.UG.7G"; // ĐÃ THÊM KEY THẬT

function updateUserLikesOnServer() {
    if (!db.currentUser || !CURRENT_USER_ID || !db.users) {
        console.warn("Không đủ dữ liệu để cập nhật server (currentUser hoặc users)");
        return;
    }

    const newLikedGameIds = db.wishlist.map(g => g.id);
    db.currentUser.user_data_summary.liked_game_ids = newLikedGameIds;

    const updatedUsersData = {
        users: db.users.map(u => 
            u.user_profile.user_id === CURRENT_USER_ID ? db.currentUser : u
        )
    };

    console.log("Đang gửi cập nhật Wishlist lên server:", newLikedGameIds);

    fetch(JSONBIN_USER_UPDATE_URL, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': MASTER_KEY
        },
        body: JSON.stringify(updatedUsersData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Cập nhật Wishlist thành công!", data);
        ui.showToast("Đã cập nhật Wishlist lên server thành công!", "success");
    })
    .catch(error => {
        console.error("Lỗi khi cập nhật JSONBIN:", error);
        ui.showToast("Lỗi: Không thể cập nhật Wishlist lên server!", "error");
    });
}

window.onclick = function (event) {
  if (
    !event.target.closest("#notify-container-desktop") &&
    !event.target.closest("#notify-container-mobile")
  ) {
    document
      .querySelectorAll(".notify-dropdown")
      .forEach((d) => d.classList.remove("show"));
  }

  const wrapper = document.getElementById("user-dropdown-wrapper");
  if (wrapper && !event.target.closest("#user-dropdown-wrapper")) {
    const userDropdown = document.getElementById("user-dropdown");
    if (userDropdown) userDropdown.classList.remove("show");
  }
};


const backend = {
  logout: () => confirm("Đăng xuất?") && location.reload(),

  like: (id) => {
    const libItem = db.library.find((x) => x.id == id);
    if (libItem) {
        libItem.liked = !libItem.liked;
    }
    
    const indexInWishlist = db.wishlist.findIndex(x => x.id == id);
    if (indexInWishlist > -1) {
        db.wishlist.splice(indexInWishlist, 1);
        ui.showToast(`Đã xóa khỏi Wishlist`, "info");
    } else {
        const gameInfo = db.allGames.find(g => g.id == id);
        if (gameInfo) {
            db.wishlist.unshift({ id: id, ...gameInfo });
            ui.showToast(`Đã thêm vào Wishlist: ${gameInfo.name}`, "success");
        }
    }

    if (document.getElementById("library-container")) ui.renderLibrary();
    if (document.getElementById("wishlist-container")) ui.renderWishlist();
    
    saveLikesToStorage(); 
    updateUserLikesOnServer();
  },
  play: () => console.log("Play clicked"),
  update: (name) => {
    ui.showToast(`Đang cập nhật ${name}...`, "info");
    setTimeout(
      () => ui.showToast(`Cập nhật ${name} thành công!`, "success"),
      2000
    );
  },
};

const router = {
  navigate: (page) => {
    ["library", "wishlist", "reviews"].forEach((id) => {
      const section = document.getElementById("section-" + id);
      if (section) section.classList.add("hidden");
      const nav = document.getElementById("nav-" + id);
      if (nav) nav.classList.remove("active");
      
      const mobNav = document.getElementById("mobile-nav-" + id);
      if (mobNav) mobNav.classList.remove("mobile-tab-active");
    });

    const activeSection = document.getElementById("section-" + page);
    if (activeSection) activeSection.classList.remove("hidden");
    const activeNav = document.getElementById("nav-" + page);
    if (activeNav) activeNav.classList.add("active");
    
    const activeMobNav = document.getElementById("mobile-nav-" + page);
    if (activeMobNav) activeMobNav.classList.add("mobile-tab-active");

    if (page === "library") ui.renderLibrary();
    if (page === "wishlist") ui.renderWishlist();
    if (page === "reviews") ui.renderReviewsHistory();
  },
};

function saveLikesToStorage() {
  try {
    if (!CURRENT_USER_ID) return; 
    const likes = {};
    db.library.forEach((item) => {
      likes[item.id] = !!item.liked;
    });
    localStorage.setItem("gs_library_likes_" + CURRENT_USER_ID, JSON.stringify(likes));
  } catch (e) {
    console.error("Không thể lưu likes vào localStorage:", e);
  }
}

function loadLikesFromStorage() {
  try {
    if (!CURRENT_USER_ID) return; 
    const raw = localStorage.getItem("gs_library_likes_" + CURRENT_USER_ID);
    if (!raw) return;

    const likes = JSON.parse(raw);
    db.library = db.library.map((item) => {
      if (Object.prototype.hasOwnProperty.call(likes, item.id)) {
        return { ...item, liked: !!likes[item.id] };
      }
      return item;
    });
  } catch (e) {
    console.error("Không thể đọc likes từ localStorage:", e);
  }
}

function processUserData(allGamesData, allReviewsData, usersData) {
    const user = usersData.users.find(u => u.user_profile.user_id === CURRENT_USER_ID);
    if (!user) {
        console.error("Không tìm thấy người dùng hiện tại:", CURRENT_USER_ID);
        return false;
    }
    
    db.users = usersData.users; 
    db.currentUser = user;
    const summary = user.user_data_summary;

    db.library = allGamesData
        .filter(g => summary.library_game_ids.includes(g.id))
        .map(game => {
            const hours = game.id % 2 === 0 ? "730h" : "150h";
            const progress = game.id % 3 === 0 ? 100 : 75;

            return {
                id: game.id,
                hours: hours,
                progress: progress,
                liked: false,
            };
        });
        
    db.wishlist = summary.liked_game_ids
        .map(gameId => {
            const gameInfo = allGamesData.find(g => g.id === gameId);
            return gameInfo ? { id: gameId, ...gameInfo } : null;
        })
        .filter(g => g !== null);

    db.reviews = allReviewsData.filter(r => r.user === CURRENT_USER_ID);
    
    const usernameElement = document.querySelector('.aside-user-profile .font-bold.text-white');
    if (usernameElement) {
        usernameElement.textContent = db.currentUser.user_profile.username;
    }
    const userIdElement = document.querySelector('.aside-user-profile .text-xs.text-slate-500');
    if (userIdElement) {
        userIdElement.textContent = `ID: ${db.currentUser.user_profile.user_id}`;
    }

    loadLikesFromStorage();

    const totalGames = db.library.length;
    const totalHours = db.library.reduce((sum, item) => sum + parseInt(item.hours.replace('h', '')), 0) + 'h'; 
    const playing = db.library.filter(item => item.progress < 100).length;
    const completed = db.library.filter(item => item.progress === 100).length;

    const statsElements = document.querySelectorAll('#section-library .p-4.rounded-lg');
    if (statsElements.length === 4) {
        statsElements[0].querySelector('.text-xl.font-bold').textContent = totalGames;
        statsElements[1].querySelector('.text-xl.font-bold').textContent = totalHours;
        statsElements[2].querySelector('.text-xl.font-bold').textContent = playing;
        statsElements[3].querySelector('.text-xl.font-bold').textContent = completed;
    }

    return true;
}

const ui = {
  init: () => {
    const params = new URLSearchParams(window.location.search);
    CURRENT_USER_ID = params.get('user_id'); 
    
    if (!CURRENT_USER_ID) {
        CURRENT_USER_ID = "U001_Alpha"; 
        console.warn("Không tìm thấy user_id trong URL, sử dụng ID mặc định: U001_Alpha");
    }
    
    const JSONBIN_GAMES_ID = "6935590d43b1c97be9dd6572";
    const JSONBIN_REVIEWS_ID = "69343538d0ea881f4016cba7";
    
    const JSONBIN_USER_URL = `${BASE_URL}${JSONBIN_USER_ID}/latest`;
    const JSONBIN_GAMES_URL = `${BASE_URL}${JSONBIN_GAMES_ID}/latest`;
    const JSONBIN_REVIEWS_URL = `${BASE_URL}${JSONBIN_REVIEWS_ID}/latest`;

    Promise.all([
      fetch(JSONBIN_GAMES_URL).then((res) => res.json()).then(data => data.record), 
      fetch(JSONBIN_REVIEWS_URL).then((res) => res.json()).then(data => data.record), 
      fetch(JSONBIN_USER_URL).then((res) => res.json()).then(data => data.record), 
    ])
      .then(([gamesData, reviewsData, usersData]) => {
        db.allGames = gamesData;

        const success = processUserData(gamesData, reviewsData, usersData);
        if (!success) {
            ui.showToast(`Lỗi: Không tìm thấy dữ liệu cho user ID: ${CURRENT_USER_ID}`, "error");
            return;
        }

        const detailContainer = document.getElementById("game-info-section");
        if (detailContainer) {
          renderDetailPage();
        } else if (document.getElementById("library-container")) {
          router.navigate('library'); 
        }
      })
      .catch((err) => {
        console.error("Lỗi tải JSON từ jsonBIN.io:", err);
        ui.showToast("Lỗi tải dữ liệu. Hãy kiểm tra kết nối!", "error");
      });
  },

  renderLibrary: (customList = null) => {
    const container = document.getElementById("library-container");
    if (!container) return;
    const listToRender = customList || db.library;

    container.innerHTML = listToRender
      .map((libItem) => {
        const gameInfo = db.allGames.find((g) => g.id === libItem.id);
        if (!gameInfo) return "";

        return `
            <div class="game-card flex-col sm:flex-row items-stretch sm:items-center">
                <div class="w-full sm:w-40 h-32 sm:h-24 bg-slate-900 rounded-lg overflow-hidden shrink-0">
                    <img src="${gameInfo.thumbnail}" class="w-full h-full object-cover">
                </div>
                <div class="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 class="font-bold text-white text-lg">${gameInfo.name}</h3>
                    <div class="text-sm text-slate-400 mt-1 mb-3">${libItem.hours} giờ • ★ ${gameInfo.rating} • Đã cài đặt</div>
                    <div class="w-full max-w-md h-2 bg-indigo-900 rounded-full overflow-hidden">
                        <div class="h-full progress-gradient" style="width: ${libItem.progress}%"></div>
                    </div>
                </div>
                <div class="flex flex-col items-end gap-3 mt-4 sm:mt-0">
                    <div class="flex gap-2">
                        <button class="btn-play" onclick="backend.play()">Chơi ngay</button>
                        <button class="btn-secondary" onclick="window.location.href='game_detail_template.html?id=${libItem.id}'">Chi tiết</button>
                        <button class="btn-secondary" onclick="backend.update('${gameInfo.name}')">Cập nhật</button>
                    </div>
                    <button onclick="backend.like(${libItem.id})" class="btn-heart ${libItem.liked ? "liked" : ""}"><i class="${libItem.liked ? "fa-solid" : "fa-regular"} fa-heart"></i></button>
                </div>
            </div>`;
      })
      .join("");
  },

  renderWishlist: () => {
    const container = document.getElementById("wishlist-container");
    if (!container) return;
    
    const likedGames = db.wishlist; 

    container.innerHTML = likedGames
      .map(
        (g) => {
            const isOwned = db.library.some(l => l.id === g.id);
            const playButton = isOwned ? 
                `<button class="btn-play flex-1 sm:flex-none text-center justify-center" onclick="backend.play()">Chơi ngay</button>` :
                `<button class="btn-secondary flex-1 sm:flex-none text-center justify-center bg-green-600 text-white hover:bg-green-700" onclick="handleDownload(${g.id})">Tải Ngay</button>`;
                
            return `
                <div class="game-card flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <img src="${g.thumbnail}" class="w-full sm:w-32 h-32 sm:h-20 object-cover rounded-lg">
                    <div class="flex-1">
                        <h3 class="font-bold text-white text-lg">${g.name}</h3>
                    </div>
                    <div class="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        ${playButton}
                        <button class="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:border-red-500 hover:text-red-500 transition" onclick="backend.like(${g.id})">Xóa</button>
                    </div>
                </div>
            `;
        }
      )
      .join("");
    const empty = document.getElementById("wishlist-empty");
    if (empty) empty.classList.toggle("hidden", likedGames.length > 0);
  },

  renderReviewsHistory: () => {
    const container = document.getElementById("reviews-container");
    if (!container) return;
    const myReviews = db.reviews; 

    container.innerHTML = myReviews
      .map((r) => {
        const game = db.allGames.find((g) => g.id === r.game_id);
        const gameName = game ? game.name : "Unknown";
        const gameImg = game ? game.thumbnail : "";
        let stars = "";
        for (let i = 1; i <= 5; i++)
          stars += `<i class="fa-solid fa-star ${i <= r.score ? "text-yellow-400" : "text-slate-600"} text-xs"></i>`;

        return `
            <div class="review-card flex-col sm:flex-row gap-4">
                <div class="shrink-0"><img src="${gameImg}" class="w-28 h-16 sm:w-32 sm:h-20 rounded-lg object-cover border border-slate-600"></div>
                <div class="flex-1">
                    <div class="flex justify-between items-start">
                        <div><div class="font-bold text-white text-lg">${gameName}</div><div class="flex gap-1 mt-1">${stars}</div></div>
                        <div class="text-xs text-slate-500">${r.date}</div>
                    </div>
                    <div class="mt-2 text-sm text-slate-300 italic">"${r.comment}"</div>
                </div>
            </div>`;
      })
      .join("");
    const empty = document.getElementById("reviews-empty");
    if (empty) empty.classList.toggle("hidden", myReviews.length > 0);
  },

  showToast: (msg, type) => {
    const box = document.getElementById("toast-container");
    if (!box) return;
    const div = document.createElement("div");
    div.className = `toast-msg ${type}`;
    div.innerHTML = `<span>${msg}</span>`;
    box.appendChild(div);
    setTimeout(() => div.remove(), 3000);
  },
};


function renderDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const gameId = parseInt(params.get("id"));
  const game = db.allGames.find((g) => g.id === gameId);

  if (!game) return;

  const isOwned = db.library.some((l) => l.id === gameId);

  document.getElementById("game-info-section").innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 space-y-6">
                <div class="rounded-xl overflow-hidden bg-black aspect-video relative shadow-2xl">
                    <iframe class="w-full h-full absolute inset-0" src="${game.trailer}" frameborder="0" allowfullscreen></iframe>
                </div>
                
                <div>
                  <h3 class="text-xl font-bold text-white mb-3">Hình ảnh</h3>
                    <div class="grid grid-cols-5 gap-2">
                    ${game.screenshots && game.screenshots.length
                        ? (() => {
                            const shots = game.screenshots.slice(0, 5);
                            while (shots.length < 5) shots.push(shots[shots.length - 1]);
                            return shots.map(src => `
                              <div class="aspect-video rounded overflow-hidden border border-slate-700 hover:border-indigo-500 cursor-pointer transition">
                                <img src="${src}" class="w-full h-full object-cover">
                              </div>`).join("");
                          })()
                        : ""
                    }
                  </div>
                </div>

                <div>
                    <h2 class="text-2xl font-bold text-white mb-3 border-l-4 border-indigo-500 pl-3">Giới thiệu</h2>
                    <p class="text-slate-300 leading-relaxed">${game.description}</p>
                </div>
            </div>

            <div class="bg-[#1e293b] p-5 rounded-xl border border-slate-700 h-fit text-center">
                <img src="${game.thumbnail}" class="w-32 h-32 rounded-lg mx-auto mb-4 object-cover shadow-lg">
                <h1 class="text-2xl font-bold text-white mb-1">${game.name}</h1>
                <p class="text-indigo-400 font-bold mb-4">${game.developer}</p>
                
                <button onclick="handleDownload(${game.id})" class="block w-full text-white font-bold py-3 rounded-lg transition mb-3 ${isOwned ? "bg-slate-700 cursor-default" : "bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/20"}">
                    ${isOwned ? '<i class="fa-solid fa-check"></i> Đã cài đặt' : '<i class="fa-solid fa-download"></i> Tải Ngay'}
                </button>
                
                <div class="text-left mt-6 pt-4 border-t border-slate-600 text-sm text-slate-300 space-y-2">
                    <p><span class="font-bold text-slate-500 w-10 inline-block">CPU:</span> ${game.config.rec.CPU}</p>
                    <p><span class="font-bold text-slate-500 w-10 inline-block">RAM:</span> ${game.config.rec.RAM}</p>
                    <p><span class="font-bold text-slate-500 w-10 inline-block">VGA:</span> ${game.config.rec.Card}</p>
                </div>
            </div>
        </div>
    `;

  renderSimilarGames(game);
  renderReviewsSection(gameId, isOwned);
}

function renderSimilarGames(currentGame) {
  const similarList = db.allGames.filter((g) => g.id !== currentGame.id).slice(0, 4);

  document.getElementById("similar-games-section").innerHTML = `
        <h2 class="text-2xl font-bold text-white mb-6">Game tương tự</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            ${similarList.map((g) => {
                const isOwned = db.library.some((l) => l.id === g.id);
                const btnText = isOwned ? "Đã cài đặt" : "Tải ngay";
                const btnClass = isOwned ? "bg-slate-700 text-slate-400" : "bg-indigo-600 text-white hover:bg-indigo-700";
                const action = isOwned ? "" : `onclick="handleDownload(${g.id})"`;

                return `
                <div class="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden group hover:border-indigo-500 transition">
                    <div class="h-32 overflow-hidden cursor-pointer" onclick="window.location.href='game_detail.html?id=${g.id}'">
                        <img src="${g.thumbnail}" class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
                    </div>
                    <div class="p-4">
                        <h3 class="font-bold text-white text-lg truncate mb-2 cursor-pointer" onclick="window.location.href='game_detail.html?id=${g.id}'">${g.name}</h3>
                        <button class="w-full py-2 rounded-lg text-sm font-bold transition ${btnClass}" ${action}>
                            ${btnText}
                        </button>
                    </div>
                </div>`;
              }).join("")}
        </div>
    `;
}

function renderReviewsSection(gameId, isOwned) {
  const gameReviews = db.reviews.filter((r) => r.game_id === gameId);
  const container = document.getElementById("game-reviews-section");
  if (!container) return;

  const reviewFormHtml = isOwned ? `
    <form onsubmit="submitReview(event, ${gameId})" class="bg-[#1e293b] p-6 rounded-xl border border-slate-700 mb-6 space-y-4">
        <h3 class="text-xl font-bold text-white mb-3">Gửi đánh giá của bạn</h3>
        <input id="rv-user" type="text" placeholder="Tên của bạn" required class="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500" value="${db.currentUser.user_profile.username}" readonly>
        <select id="rv-score" required class="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:ring-indigo-500 focus:border-indigo-500">
            <option value="5">★★★★★ Rất tốt</option>
            <option value="4">★★★★☆ Tốt</option>
            <option value="3">★★★☆☆ Bình thường</option>
            <option value="2">★★☆☆☆ Tệ</option>
            <option value="1">★☆☆☆☆ Rất tệ</option>
        </select>
        <textarea id="rv-comment" rows="3" placeholder="Viết bình luận chi tiết..." required class="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
        <button type="submit" class="btn-play w-full">Gửi đánh giá</button>
    </form>
  ` : '';

  container.innerHTML = `
    <h2 class="text-2xl font-bold text-white mb-6">Đánh giá (${gameReviews.length})</h2>
    ${reviewFormHtml}
    <div class="space-y-4">
      ${gameReviews.length > 0
          ? gameReviews.map(r => `
          <div class="review-card flex gap-4">
            <div class="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0">
              ${r.user.charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="font-bold text-white">${r.user}</span>
                <span class="text-xs text-slate-500">${r.date}</span>
              </div>
              <div class="text-yellow-400 text-xs mb-2">${"★".repeat(r.score)}</div>
              <p class="text-slate-300 text-sm">${r.comment}</p>
            </div>
          </div>
        `).join("")
          : '<div class="text-slate-500 italic p-4">Chưa có đánh giá nào.</div>'
      }
    </div>
  `;
}

function submitReview(e, gameId) {
  e.preventDefault();
  const user = document.getElementById("rv-user").value;
  const comment = document.getElementById("rv-comment").value;
  const score = parseInt(document.getElementById("rv-score").value);

  db.reviews.unshift({
    id: Date.now(),
    game_id: gameId,
    user: user, 
    score,
    comment,
    date: "Vừa xong",
  });
  
  document.getElementById("rv-comment").value = "";

  const isOwned = db.library.some((l) => l.id === gameId);
  renderReviewsSection(gameId, isOwned); 
  
  ui.showToast("Đã gửi đánh giá thành công!", "success");
}

function handleDownload(gameId) {
  if (confirm("Tải game này về máy?")) {
    alert("Đang tải xuống...");
    const gameToInstall = db.allGames.find(g => g.id === gameId);
    if (gameToInstall && !db.library.some(l => l.id === gameId)) {
        db.library.push({
            id: gameId,
            hours: "0h", 
            progress: 0, 
            liked: db.wishlist.some(w => w.id === gameId)
        });
        saveLikesToStorage(); 
    }
    location.reload();
  }
}

function toggleUserDropdown() {
  const dropdown = document.getElementById("user-dropdown");
  if (!dropdown) return;
  dropdown.classList.toggle("show");
}

document.addEventListener("DOMContentLoaded", ui.init);