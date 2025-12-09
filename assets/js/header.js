$(function() {
    // 1. Logic Active Link
    const currentPath = (function() {
        let path = window.location.pathname.split('/').pop().toLowerCase();
        if (path.startsWith('game_detail_template.html')) {
            return 'game.html'; 
        }
        return (path === '' || path === 'index.html') ? 'index.html' : path;
    })();

    $('.nav-link, .mobile-nav-item').each(function() {
        const $this = $(this);
        const pageAttr = $this.data('page');
        
        if (pageAttr === currentPath) {
            $this.addClass('active');
            if (currentPath === 'index.html') {
                $('.header-logo-link').addClass('active');
            }
            return false; // Thoát khỏi vòng lặp sau khi tìm thấy
        }
    });

    // 2. Mobile Hamburger Menu
    const $sidebar = $('#mobile-sidebar');
    const $overlay = $('#mobile-overlay');
    const $body = $('body');

    function toggleSidebar(open) {
        if (open) {
            $overlay.fadeIn(300);
            $sidebar.addClass('open');
            $body.css('overflow', 'hidden'); 
        } else {
            $overlay.fadeOut(300);
            $sidebar.removeClass('open');
            $body.css('overflow', 'auto');
        }
    }

    // Gán sự kiện click cho các nút
    $('#hamburger-btn').on('click', () => toggleSidebar(true));
    $('#close-sidebar-btn').on('click', () => toggleSidebar(false));
    $overlay.on('click', () => toggleSidebar(false));
    
    // Đóng sidebar khi click vào một mục menu
    $('.mobile-nav-item').on('click', () => {
         setTimeout(() => toggleSidebar(false), 150);
    });

    // Sự kiện click nút User
    $('.account-btn').on('click', () => {
        window.location.href = 'user.html';
    });


});