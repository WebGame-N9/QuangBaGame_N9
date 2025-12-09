document.addEventListener('DOMContentLoaded', () => {

    // --- CẤU HÌNH BIẾN TOÀN CỤC ---
    const POSTS_PER_PAGE = 5;
    let currentPage = 1;
    let allPostsData = [];       // Chứa tất cả bài viết
    let currentFilteredPosts = []; // Chứa bài viết đang hiển thị (sau khi lọc)
    let currentPostDetail = null;

    /* ==========================================================================
       1. XỬ LÝ CHUYỂN ĐỔI TAB & ĐIỀU HƯỚNG
       ========================================================================== */
    const tabBtns = document.querySelectorAll('.congdong_tab-btn');
    const sections = {
        'forum': document.getElementById('congdong_forum-section'),
        'trending': document.getElementById('congdong_trending-section')
    };

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            Object.values(sections).forEach(s => {
                if(s) s.style.display = 'none';
            });
            const target = btn.getAttribute('data-target');
            if (sections[target]) {
                sections[target].style.display = 'block';
                sections[target].style.opacity = 0;
                setTimeout(() => sections[target].style.opacity = 1, 50);
            }
        });
    });

    /* ==========================================================================
       2. HÀM TẢI DỮ LIỆU & RENDER (UPDATED WITH AOS)
       ========================================================================== */
    async function loadPostsFromFile() {
        try {
            // Lưu ý: Đường dẫn data/posts.json phải đúng với cấu trúc thư mục của bạn
            const response = await fetch('data/posts.json');
            if (!response.ok) throw new Error('Không thể tải file dữ liệu');
            const data = await response.json();
            allPostsData = data;

            allPostsData.sort((a, b) => b.id - a.id);
            currentFilteredPosts = [...allPostsData];

            renderPosts(currentPage);
            renderPagination();
            renderTrendingWidget();
            renderActiveMembersWidget();

            // --- KHỞI TẠO AOS SAU KHI DỮ LIỆU ĐÃ LOAD ---
            setTimeout(() => {
                if (typeof AOS !== 'undefined') {
                    AOS.init({
                        duration: 800, // Thời lượng animation
                        once: true,    // Chỉ chạy 1 lần
                        offset: 50     // Kích hoạt khi cuộn đến
                    });
                }
            }, 100);

        } catch (error) {
            console.error('Lỗi tải dữ liệu:', error);
            const container = document.getElementById('congdong_post-list-container');
            if(container) {
                container.innerHTML = `<p style="text-align:center; color:red">Lỗi: Không tìm thấy file dữ liệu. Hãy kiểm tra lại đường dẫn hoặc chạy trên Live Server.</p>`;
            }
        }
    }

    // --- RENDER SIDEBAR: TOP VIEWS ---
    function renderTrendingWidget() {
        const listContainer = document.getElementById('congdong_sidebar-trending');
        if (!listContainer) return;

        listContainer.innerHTML = '';
        const topViews = [...allPostsData].sort((a, b) => b.views - a.views).slice(0, 5);

        topViews.forEach((post, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="congdong_rank congdong_rank-${index + 1}">#${index + 1}</span>
                <div class="congdong_trend-info">
                    <a href="#" class="congdong_sidebar-link" data-id="${post.id}">${post.title}</a>
                    <span><i class="fa-regular fa-eye"></i> ${post.views.toLocaleString()} views</span>
                </div>
            `;
            listContainer.appendChild(li);
        });

        // Click sidebar item
        listContainer.querySelectorAll('.congdong_sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const postId = link.getAttribute('data-id');
                const post = allPostsData.find(p => p.id == postId);
                if (post) openPostDetailFromData(post);
            });
        });
    }

    // --- RENDER SIDEBAR: ACTIVE MEMBERS ---
    function renderActiveMembersWidget() {
        const listContainer = document.getElementById('congdong_sidebar-members');
        if (!listContainer) return;
        listContainer.innerHTML = '';

        const memberStats = {};
        allPostsData.forEach(post => {
            if (!memberStats[post.author]) {
                memberStats[post.author] = {
                    name: post.author,
                    avatar_color: post.avatar_color,
                    postCount: 0,
                    totalCommentsReceived: 0
                };
            }
            memberStats[post.author].postCount++;
            memberStats[post.author].totalCommentsReceived += post.comments;
        });

        const sortedMembers = Object.values(memberStats).sort((a, b) => {
            if (b.postCount !== a.postCount) return b.postCount - a.postCount;
            return b.totalCommentsReceived - a.totalCommentsReceived;
        }).slice(0, 5);

        sortedMembers.forEach(member => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="congdong_member-avatar ${member.avatar_color}"></div>
                <div class="congdong_member-info">
                    <span class="name">${member.name}</span>
                    <span class="role">${member.postCount} bài viết • ${member.totalCommentsReceived} tương tác</span>
                </div>
                <span class="congdong_status online"></span>
            `;
            listContainer.appendChild(li);
        });
    }

    // --- RENDER POST LIST (UPDATED CHO AOS) ---
    function renderPosts(page) {
        const postContainer = document.getElementById('congdong_post-list-container');
        postContainer.innerHTML = '';

        const startIndex = (page - 1) * POSTS_PER_PAGE;
        const endIndex = startIndex + POSTS_PER_PAGE;
        const postsToShow = currentFilteredPosts.slice(startIndex, endIndex);

        if (postsToShow.length === 0) {
            postContainer.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:20px;">Không tìm thấy bài viết nào.</p>';
            return;
        }

        const categoryNames = { 'thao-luan': 'Thảo luận', 'huong-dan': 'Hướng dẫn', 'ho-tro': 'Hỗ trợ', 'review': 'Đánh giá' };
        const badgeColors = { 'thao-luan': 'congdong_badge-blue', 'huong-dan': 'congdong_badge-orange', 'review': 'congdong_badge-blue', 'ho-tro': 'congdong_badge-orange' };

        postsToShow.forEach((post, index) => {
            // TÍNH TOÁN DELAY CHO AOS
            const delay = index * 100;

            const html = `
                <article class="congdong_post-card congdong_category-${post.category}" 
                         data-id="${post.id}"
                         data-aos="fade-up" 
                         data-aos-delay="${delay}">
                    <div class="congdong_post-avatar ${post.avatar_color}">${post.avatar_text}</div>
                    <div class="congdong_post-main">
                        <div class="congdong_post-header">
                            <a href="#" class="congdong_post-title">${post.title}</a>
                            <span class="congdong_badge ${badgeColors[post.category] || 'congdong_badge-blue'}">${categoryNames[post.category]}</span>
                            ${post.id > 30 ? '<span class="congdong_badge" style="background:#ef4444; color:white; margin-left:5px">Mới</span>' : ''}
                        </div>
                        <div class="congdong_post-meta-top">
                            <span>by <span class="congdong_author">${post.author}</span></span> • <span>${post.time}</span>
                        </div>
                        <p class="congdong_post-excerpt">${post.excerpt}</p>
                        <div class="congdong_post-footer">
                            <div class="congdong_stats">
                                <span><i class="fa-regular fa-thumbs-up"></i> ${post.likes}</span>
                                <span><i class="fa-regular fa-comment"></i> ${post.comments}</span>
                                <span><i class="fa-regular fa-eye"></i> ${post.views}</span>
                            </div>
                        </div>
                    </div>
                </article>
            `;
            postContainer.insertAdjacentHTML('beforeend', html);
        });

        attachPostEvents();

        // LÀM MỚI AOS ĐỂ NHẬN DIỆN BÀI VIẾT MỚI (KHI CHUYỂN TRANG)
        if (typeof AOS !== 'undefined') {
            AOS.refresh();
        }
    }

    function renderPagination() {
        const paginationContainer = document.getElementById('congdong_pagination');
        if (!paginationContainer) return;

        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(currentFilteredPosts.length / POSTS_PER_PAGE);

        if (totalPages <= 1) return;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                const btn = document.createElement('button');
                btn.className = `congdong_page-btn ${i === currentPage ? 'active' : ''}`;
                btn.innerText = i;
                btn.addEventListener('click', () => {
                    currentPage = i;
                    renderPosts(currentPage); // Hàm này sẽ kích hoạt lại AOS
                    renderPagination();
                    // Scroll lên đầu danh sách bài viết cho trải nghiệm tốt hơn
                    const listTop = document.getElementById('congdong_forum-section');
                    if(listTop) listTop.scrollIntoView({ behavior: 'smooth' });
                });
                paginationContainer.appendChild(btn);
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                const span = document.createElement('span');
                span.innerText = '...';
                span.style.color = '#94a3b8';
                span.style.alignSelf = 'center';
                paginationContainer.appendChild(span);
            }
        }
    }

    /* ==========================================================================
       3. QUẢN LÝ TƯƠNG TÁC
       ========================================================================== */
    function attachPostEvents() {
        const likeBtns = document.querySelectorAll('.congdong_post-footer .congdong_stats span:first-child');
        likeBtns.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.style.cursor = 'pointer';
            newBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                this.classList.toggle('liked');
                const icon = this.querySelector('i');
                let text = this.innerText.trim();
                let count = parseInt(text.replace(/\D/g, '')) || 0;
                if (this.classList.contains('liked')) {
                    icon.classList.remove('fa-regular'); icon.classList.add('fa-solid');
                    newBtn.style.color = '#ef4444'; count++;
                } else {
                    icon.classList.remove('fa-solid'); icon.classList.add('fa-regular');
                    newBtn.style.color = ''; count--;
                }
                this.innerHTML = `<i class="${icon.className}"></i> ${count}`;
            });
        });

        const postTitles = document.querySelectorAll('.congdong_post-title');
        postTitles.forEach(title => {
            const newTitle = title.cloneNode(true);
            title.parentNode.replaceChild(newTitle, title);

            newTitle.addEventListener('click', (e) => {
                e.preventDefault();
                const card = newTitle.closest('.congdong_post-card');
                const postId = card.getAttribute('data-id');
                const postData = allPostsData.find(p => p.id == postId);

                if (postData) {
                    openPostDetailFromData(postData);
                }
            });
        });
    }

    /* ==========================================================================
       4. LOGIC MODAL CHI TIẾT
       ========================================================================== */
    const detailModal = document.getElementById('congdong_post-detail-modal');
    const closeDetail = document.querySelector('.congdong_close-detail');

    function openPostDetailFromData(postData) {
        if (!postData) return;

        document.getElementById('congdong_detail-title').innerText = postData.title;
        document.getElementById('congdong_detail-author').innerText = postData.author;
        document.getElementById('congdong_detail-time').innerText = postData.time;
        document.getElementById('congdong_detail-category').innerText = postData.category.toUpperCase();

        const detailAvatar = document.getElementById('congdong_detail-avatar');
        detailAvatar.className = `congdong_post-avatar ${postData.avatar_color}`;
        detailAvatar.innerText = postData.avatar_text;

        document.getElementById('congdong_detail-content').innerHTML = postData.content || `<p>${postData.excerpt}</p>`;
        document.getElementById('congdong_detail-like-count').innerText = postData.likes;
        document.getElementById('congdong_comment-count').innerText = postData.comments;

        document.getElementById('congdong_comment-list').innerHTML = '';
        if (postData.commentsList && postData.commentsList.length > 0) {
            postData.commentsList.forEach(comment => {
                addCommentToUI(comment.author, comment.text, comment.time, '#64748b');
            });
        } else {
            document.getElementById('congdong_comment-list').innerHTML = '<p style="color:#94a3b8; text-align:center;">Chưa có bình luận nào.</p>';
        }
        currentPostDetail = postData;

        detailModal.style.display = 'block';
    }

    if (closeDetail) {
        closeDetail.addEventListener('click', () => detailModal.style.display = 'none');
    }

    function addCommentToUI(name, text, time = 'Vừa xong', avatarColor = '#64748b') {
        const commentList = document.getElementById('congdong_comment-list');

        if (commentList.querySelector('p[style*="text-align:center"]')) {
            commentList.innerHTML = '';
        }

        const div = document.createElement('div');
        div.className = 'congdong_comment-item';
        div.innerHTML = `
        <div class="congdong_post-avatar" style="background:${avatarColor}; width:32px; height:32px; font-size:0.8rem">${name.charAt(0)}</div>
        <div class="congdong_comment-content">
            <div class="congdong_comment-author">${name} <span class="congdong_comment-date">${time}</span></div>
            <div class="congdong_comment-text">${text}</div>
        </div>
    `;
        commentList.appendChild(div);
    }

    const sendCommentBtn = document.getElementById('congdong_btn-send-comment');
    if (sendCommentBtn) {
        sendCommentBtn.addEventListener('click', () => {
            if (!currentPostDetail) return;

            const input = document.getElementById('congdong_new-comment-content');
            const text = input.value.trim();
            if (text) {
                addCommentToUI('Bạn (Me)', text, 'Vừa xong', '#8b5cf6');

                const newComment = {
                    author: 'Bạn (Me)',
                    text: text,
                    time: 'Vừa xong'
                };

                if (!currentPostDetail.commentsList) currentPostDetail.commentsList = [];
                currentPostDetail.commentsList.push(newComment);

                currentPostDetail.comments = currentPostDetail.commentsList.length;

                const countSpan = document.getElementById('congdong_comment-count');
                countSpan.innerText = currentPostDetail.comments;

                input.value = '';
                const list = document.getElementById('congdong_comment-list');
                list.scrollTop = list.scrollHeight;
            }
        });
    }
    
    const likeDetailBtn = document.querySelector('.congdong_btn-like-detail');
    if (likeDetailBtn) {
        function setDetailLikeState() {
            if (!currentPostDetail) return;
            likeDetailBtn.classList.remove('liked');
            likeDetailBtn.querySelector('i').className = 'fa-regular fa-thumbs-up';
            likeDetailBtn.style.color = '';
        }

        likeDetailBtn.addEventListener('click', function () {
            if (!currentPostDetail) return;

            this.classList.toggle('liked');
            let count = parseInt(document.getElementById('congdong_detail-like-count').innerText);
            const icon = this.querySelector('i');

            if (this.classList.contains('liked')) {
                count++;
                icon.classList.remove('fa-regular');
                icon.classList.add('fa-solid');
                this.style.color = '#ef4444';
            } else {
                count--;
                icon.classList.remove('fa-solid');
                icon.classList.add('fa-regular');
                this.style.color = '';
            }

            currentPostDetail.likes = count;
            document.getElementById('congdong_detail-like-count').innerText = count;

            // Cập nhật lại view bên ngoài nếu cần (nhưng không render lại toàn bộ để tránh mất vị trí scroll)
        });
        
        // Hook vào hàm mở modal để reset trạng thái nút like
        const originalOpenPostDetailFromData = openPostDetailFromData;
        openPostDetailFromData = function (postData) {
            originalOpenPostDetailFromData(postData);
            setDetailLikeState();
        }
    }

    /* ==========================================================================
       5. LOGIC TẠO BÀI & FILTER
       ========================================================================== */
    const createForm = document.getElementById('congdong_create-post-form');
    const createModal = document.getElementById('congdong_create-post-modal');

    document.querySelector('.congdong_btn-create-post').addEventListener('click', () => createModal.style.display = 'block');
    document.querySelector('.congdong_close-modal').addEventListener('click', () => createModal.style.display = 'none');
    document.querySelector('.congdong_close-modal-btn').addEventListener('click', () => createModal.style.display = 'none');

    createForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('congdong_post-title').value;
        const category = document.getElementById('congdong_post-category').value;
        const content = document.getElementById('congdong_post-content').value;

        const newPost = {
            id: Date.now(),
            title: title,
            author: "Bạn (Me)",
            avatar_color: "congdong_color-5",
            avatar_text: "ME",
            time: "Vừa xong",
            category: category,
            excerpt: content,
            content: `<p>${content}</p>`,
            likes: 0, comments: 0, views: 1
        };

        allPostsData.unshift(newPost);
        const currentFilterBtn = document.querySelector('.congdong_filter-chip.active');
        const currentFilter = currentFilterBtn ? currentFilterBtn.getAttribute('data-filter') : 'all';

        if (currentFilter === 'all' || currentFilter === category) {
            currentFilteredPosts.unshift(newPost);
        } else {
            // Nếu bài mới không thuộc filter hiện tại, reset về ALL để thấy bài mới
            const allBtn = document.querySelector('.congdong_filter-chip[data-filter="all"]');
            if(allBtn) allBtn.click();
            currentFilteredPosts = [...allPostsData];
        }

        createForm.reset();
        createModal.style.display = 'none';
        currentPage = 1;
        
        // Render lại danh sách, AOS sẽ tự kích hoạt cho bài mới
        if (currentFilter === 'all' || currentFilter === category) {
            renderPosts(currentPage);
            renderPagination();
        }
    });

    const filterChips = document.querySelectorAll('.congdong_filter-chip');
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const filterValue = chip.getAttribute('data-filter');

            if (filterValue === 'all') currentFilteredPosts = [...allPostsData];
            else currentFilteredPosts = allPostsData.filter(post => post.category === filterValue);

            currentPage = 1;
            renderPosts(currentPage);
            renderPagination();
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target == createModal) createModal.style.display = 'none';
        if (e.target == detailModal) detailModal.style.display = 'none';
    });

    // KHỞI CHẠY
    loadPostsFromFile();
});