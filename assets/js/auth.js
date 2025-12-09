// =================================================
// 1. CẤU HÌNH FIREBASE (Dùng link CDN online)
// =================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Bộ key Firebase của dự án "dt4web"
const firebaseConfig = {
    apiKey: "AIzaSyB3OT-00L522Ds6JtQnGmTyaKmvrXxdv9E",
    authDomain: "dt4web.firebaseapp.com",
    projectId: "dt4web",
    storageBucket: "dt4web.firebasestorage.app",
    messagingSenderId: "568847489386",
    appId: "1:568847489386:web:23ec1b0bc81db041c76d13",
    measurementId: "G-BJET3KH62L"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// =================================================
// 2. LOGIC TRANG WEB (jQuery)
// =================================================
$(document).ready(function () {
    const API_URL = 'https://6936e836f8dc350aff32b679.mockapi.io/users';

    const EMAILJS_SERVICE_ID = "service_68k252o";
    const EMAILJS_TEMPLATE_ID = "template_fzyn5om";
    let generatedOTP = null;
    let tempRegisterData = {};

    // --- HÀM HIỂN THỊ THÔNG BÁO (THAY THẾ ALERT) ---
    function showToast(message, type = 'success') {
        $('#custom_toast').remove();

        let bgClass = type === 'success' ? 'bg-green-600' : 'bg-red-600';
        let icon = type === 'success' ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-circle-exclamation"></i>';

        const toastHtml = `
            <div id="custom_toast" class="fixed top-5 right-5 z-[9999] flex items-center gap-3 px-6 py-4 text-white rounded-lg shadow-2xl transform translate-x-full transition-all duration-300 ${bgClass}" style="min-width: 300px; backdrop-filter: blur(10px);">
                <div class="text-xl">${icon}</div>
                <div class="font-medium">${message}</div>
            </div>
        `;

        $('body').append(toastHtml);

        setTimeout(() => {
            $('#custom_toast').removeClass('translate-x-full');
        }, 100);

        setTimeout(() => {
            $('#custom_toast').addClass('translate-x-full');
            setTimeout(() => $('#custom_toast').remove(), 300);
        }, 3000);
    }

    // --- HÀM HIỂN THỊ LỖI Ở INPUT ---
    function showError(inputSelector, message) {
        const $input = $(inputSelector);
        const $parent = $input.closest('.auth_input-group, .auth_grid-2-col > div');

        $parent.find('.auth_error-message').remove();
        $input.addClass('input-error');
        const errorHtml = `<div class="auth_error-message"><i class="fa-solid fa-triangle-exclamation"></i> ${message}</div>`;
        if ($input.parent().hasClass('auth_password-wrapper')) {
            $input.parent().after(errorHtml);
        } else {
            $input.after(errorHtml);
        }

        $parent.find('.auth_error-message').slideDown(200);
    }

    function clearError(inputSelector) {
        const $input = $(inputSelector);
        $input.removeClass('input-error');
        const $parent = $input.closest('.auth_input-group, .auth_grid-2-col > div');
        $parent.find('.auth_error-message').slideUp(200, function () { $(this).remove(); });
    }

    $('input').on('input focus', function () {
        clearError(this);
    });

    const $btnRegister = $('#btn_submit_register');
    const $checkTerms = $('#reg_terms_check');

    $btnRegister.addClass('btn-disabled');

    // Sự kiện khi click checkbox
    $checkTerms.change(function () {
        if (this.checked) {
            $btnRegister.removeClass('btn-disabled');
        } else {
            $btnRegister.addClass('btn-disabled');
        }
    });

    // ----------------------------------------------------
    // XỬ LÝ LOGIN GOOGLE
    // ----------------------------------------------------
    const $loginGoogle = $('.auth_social-login button:first-child');
    const $registerGoogle = $('.auth_social-icons button:first-child');
    const $targetBtn = $loginGoogle.add($registerGoogle);

    $targetBtn.click(async function (e) {
        e.preventDefault();
        const $btn = $(this);
        const originalContent = $btn.html();

        // Hiệu ứng loading
        $btn.html('<i class="fa-solid fa-spinner fa-spin"></i> Đang kết nối...').prop('disabled', true);

        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            console.log("Google Auth thành công:", user.email);
            let currentUserData = null;

            try {
                const checkUser = await $.get(`${API_URL}?email=${user.email}`);
                if (checkUser && checkUser.length > 0) {
                    currentUserData = checkUser[0];
                }
            } catch (err) {
                if (err.status !== 404) throw err;
            }

            if (currentUserData) {
                console.log("User cũ, đang lấy dữ liệu...");
            } else {
                console.log("User mới, đang tạo tài khoản...");
                let baseName = user.email.split('@')[0];
                let randomSuffix = Math.floor(Math.random() * 10000);

                const newUser = {
                    fullname: user.displayName || baseName,
                    email: user.email,
                    username: baseName + "_" + randomSuffix,
                    password: "",
                    avatar: user.photoURL,
                    loginType: 'google',
                    createdAt: new Date().toISOString()
                };

                currentUserData = await $.post(API_URL, newUser);
            }
            localStorage.setItem('currentUser', JSON.stringify(currentUserData));
            
            showToast('Đăng nhập Google thành công!', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);

        } catch (error) {
            console.error("Lỗi:", error);
            let msg = 'Đăng nhập thất bại.';
            if (error.code === 'auth/popup-closed-by-user') msg = 'Bạn đã hủy đăng nhập.';
            
            showToast(msg, 'error');
            $btn.html(originalContent).prop('disabled', false);
        }
    });

    // ----------------------------------------------------
    // CHUYỂN ĐỔI TAB UI
    // ----------------------------------------------------
    $('.auth_tab-btn').click(function () {
        restartAOSChildren();
        $('.auth_tab-btn').removeClass('active');
        $(this).addClass('active');
        $('#login_form, #register_form, #forgot_form, #2fa_form').addClass('hidden');
        $('#' + $(this).data('target')).removeClass('hidden');
        $('#auth_tabs').slideDown();
        updateLinePosition($(this));
    });

    $('#btn_forgot_password').click(function (e) {
        e.preventDefault();
        $('#auth_tabs').slideUp();
        $('#login_form').addClass('hidden');
        $('#forgot_form').removeClass('hidden');
    });

    // Nút Quay lại chung cho Forgot và 2FA
    $('.auth_btn-back_login').click(function () {
        restartAOSChildren();
        $('#forgot_form, #2fa_form').addClass('hidden');
        $('#auth_tabs').slideDown();

        // Mặc định quay về login
        $('#login_form').removeClass('hidden');
        $('.auth_tab-btn').removeClass('active');
        $('.auth_tab-btn[data-target="login_form"]').addClass('active');
        updateLinePosition($('.auth_tab-btn[data-target="login_form"]'));
    });

    $('.auth_nav-btn').click(function () {
        const targetId = $(this).data('target');
        $('#forgot_form').addClass('hidden');
        $('#auth_tabs').slideDown();
        $('.auth_tab-btn').removeClass('active');
        const $targetBtn = $('.auth_tab-btn[data-target="' + targetId + '"]');
        $targetBtn.addClass('active');
        updateLinePosition($targetBtn);
        $('#login_form, #register_form, #2fa_form').addClass('hidden');
        $('#' + targetId).removeClass('hidden');
    });

    $('.auth_toggle-password').click(function () {
        const input = $(this).prev('input');
        input.attr('type', input.attr('type') === 'password' ? 'text' : 'password');
        $(this).toggleClass('fa-eye fa-eye-slash');
    });

    // ----------------------------------------------------
    // LOGIC ĐĂNG KÝ + GỬI OTP 
    // ----------------------------------------------------
    $('#btn_submit_register').click(async function () {
        // Reset toàn bộ lỗi trước khi check
        $('.auth_error-message').remove();
        $('.auth_input').removeClass('input-error');

        // Lấy giá trị
        const fullname = $('#reg_fullname').val()?.trim() || '';
        const email = $('#reg_email').val()?.trim() || '';
        const username = $('#reg_username').val()?.trim() || '';
        const password = $('#reg_password').val();
        const confirm = $('#reg_confirm').val();
        const isTermsChecked = $('#reg_terms_check').is(':checked');

        let hasError = false;

        // --- 1. Validate Checkbox Điều khoản ---
        if (!isTermsChecked) {
            showToast("Vui lòng đồng ý điều khoản!", "error");
            return; 
        }

        // --- 2. Validate Họ tên ---
        if (fullname === '') {
            showError('#reg_fullname', 'Vui lòng nhập họ và tên');
            hasError = true;
        } else if (fullname.length < 2) {
            showError('#reg_fullname', 'Họ tên phải có ít nhất 2 ký tự');
            hasError = true;
        }

        // --- 3. Validate Email ---
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email === '') {
            showError('#reg_email', 'Vui lòng nhập địa chỉ email');
            hasError = true;
        } else if (!emailRegex.test(email)) {
            showError('#reg_email', 'Email không đúng định dạng');
            hasError = true;
        }

        // --- 4. Validate Username ---
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (username === '') {
            showError('#reg_username', 'Vui lòng nhập tên đăng nhập');
            hasError = true;
        } else if (!usernameRegex.test(username)) {
            showError('#reg_username', 'Username 3-20 ký tự, không chứa kí tự đặc biệt');
            hasError = true;
        }

        // --- 5. Validate Password ---
        if (password === '') {
            showError('#reg_password', 'Vui lòng nhập mật khẩu');
            hasError = true;
        } else if (password.length < 6) {
            showError('#reg_password', 'Mật khẩu phải có ít nhất 6 ký tự');
            hasError = true;
        }

        // --- 6. Validate Confirm Password ---
        if (confirm === '') {
            showError('#reg_confirm', 'Vui lòng nhập lại mật khẩu xác nhận');
            hasError = true;
        } else if (password !== confirm) {
            showError('#reg_confirm', 'Mật khẩu xác nhận không khớp');
            hasError = true;
        }

        if (hasError) return;

        // --- NẾU QUA HẾT VALIDATE ---
        const $btn = $(this);
        const originalText = $btn.text();
        $btn.text('Đang xử lý...').prop('disabled', true);

        try {
            let emailExists = false;
            let userExists = false;

            try {
                const checkEmail = await $.get(`${API_URL}?email=${email}`);
                if (checkEmail && checkEmail.length > 0) emailExists = true;
            } catch (err) { if (err.status !== 404) throw err; }

            try {
                const checkUser = await $.get(`${API_URL}?username=${username}`);
                if (checkUser && checkUser.length > 0) userExists = true;
            } catch (err) { if (err.status !== 404) throw err; }

            if (emailExists) {
                showError('#reg_email', 'Email này đã được sử dụng!');
                $btn.text(originalText).prop('disabled', false);
                return;
            }
            if (userExists) {
                showError('#reg_username', 'Username này đã được sử dụng!');
                $btn.text(originalText).prop('disabled', false);
                return;
            }

            // Gửi OTP
            $btn.text('Đang gửi OTP...');
            generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
            tempRegisterData = { fullname, email, username, password };

            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                email: email, passcode: generatedOTP
            });

            restartAOSChildren();
            $('#register_form').addClass('hidden');
            $('#auth_tabs').slideUp();
            $('#2fa_form').removeClass('hidden');
            $('#2fa_form p').text(`Nhập mã 6 số được gửi tới: ${email}`);
            $('.auth_otp-box').val('').first().focus();
            
            showToast('Mã OTP đã được gửi!', 'success');

        } catch (e) {
            console.error(e);
            showToast('Lỗi hệ thống hoặc gửi mail thất bại.', 'error');
        } finally {
            $btn.text(originalText).prop('disabled', false);
        }
    });

    // Logic nhập OTP
    $('.auth_otp-box').on('input', function () {
        if (this.value.length === 1) {
            $(this).next('.auth_otp-box').focus();
        }
    });
    $('.auth_otp-box').on('keydown', function (e) {
        if (e.key === 'Backspace' && this.value.length === 0) {
            $(this).prev('.auth_otp-box').focus();
        }
    });

    // ----------------------------------------------------
    // XÁC NHẬN OTP -> TẠO TÀI KHOẢN THẬT
    // ----------------------------------------------------
    $('#btn_submit_2fa').click(async function () {
        let userOTP = '';
        $('.auth_otp-box').each(function () { userOTP += $(this).val(); });

        if (userOTP.length < 6) {
            showToast('Vui lòng nhập đủ 6 số OTP', 'error');
            return;
        }

        const $btn = $(this);
        const txt = $btn.text();
        $btn.text('Đang xác minh...').prop('disabled', true);

        try {
            if (userOTP === generatedOTP) {
                const finalUser = {
                    ...tempRegisterData,
                    avatar: "https://ui-avatars.com/api/?background=random&name=" + tempRegisterData.fullname,
                    createdAt: new Date().toISOString()
                };

                await $.post(API_URL, finalUser);
                showToast('Đăng ký thành công! Vui lòng đăng nhập.', 'success');

                // Reset biến tạm
                generatedOTP = null;
                tempRegisterData = {};

                // Quay về Login
                $('#2fa_form').addClass('hidden');
                $('#auth_tabs').slideDown();
                $('.auth_tab-btn[data-target="login_form"]').click();
                $('#register_form')[0].reset();
            } else {
                showToast('Mã xác minh không đúng!', 'error');
                $('.auth_otp-box').val('').first().focus();
            }
        } catch (e) {
            showToast('Lỗi hệ thống khi tạo tài khoản!', 'error');
        } finally {
            $btn.text(txt).prop('disabled', false);
        }
    });

    // ----------------------------------------------------
    // LOGIC LOGIN THƯỜNG
    // ----------------------------------------------------
    $('#btn_submit_login').click(async function () {
        $('.auth_error-message').remove();
        $('.auth_input').removeClass('input-error');

        const inputVal = $('#login_input').val()?.trim();
        const password = $('#login_password').val();

        let hasError = false;

        if (!inputVal) {
            showError('#login_input', 'Vui lòng nhập Email hoặc Username');
            hasError = true;
        }
        if (!password) {
            showError('#login_password', 'Vui lòng nhập mật khẩu');
            hasError = true;
        }

        if (hasError) return;

        const $btn = $(this), txt = $btn.text();
        $btn.text('Đang kiểm tra...').prop('disabled', true);

        try {
            const users = await $.get(API_URL);
            const user = users.find(u => (u.email === inputVal || u.username === inputVal) && u.password === password);

            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                showToast('Đăng nhập thành công!', 'success');
                setTimeout(() => {
                     window.location.href = 'index.html';
                }, 1000);
            } else {
                showError('#login_input', 'Sai tài khoản hoặc mật khẩu');
                showError('#login_password', 'Sai tài khoản hoặc mật khẩu');
            }
        } catch (e) {
            showToast('Không thể kết nối đến máy chủ!', 'error');
        } finally {
            $btn.text(txt).prop('disabled', false);
        }
    });

    // =================================================
    // LOGIC QUÊN MẬT KHẨU (FULL FLOW)
    // =================================================
    let forgotOTP = null;
    let forgotEmail = null;
    let forgotUserId = null;

    // --- BƯỚC 1: GỬI OTP ---
    $('#btn_forgot_send_otp').click(async function() {
        $('.auth_error-message').remove();
        $('.auth_input').removeClass('input-error');

        const email = $('#forgot_email').val()?.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            showError('#forgot_email', 'Vui lòng nhập email');
            return;
        }
        if (!emailRegex.test(email)) {
            showError('#forgot_email', 'Email không hợp lệ');
            return;
        }

        const $btn = $(this);
        const originalText = $btn.text();
        $btn.text('Đang kiểm tra...').prop('disabled', true);

        try {
            const checkUser = await $.get(`${API_URL}?email=${email}`);

            if (checkUser && checkUser.length > 0) {
                forgotUserId = checkUser[0].id;
                forgotEmail = email;

                $btn.text('Đang gửi OTP...');
                forgotOTP = Math.floor(100000 + Math.random() * 900000).toString();

                await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                    email: forgotEmail,
                    passcode: forgotOTP
                });

                showToast(`OTP đã gửi tới: ${forgotEmail}`, 'success');

                $('#forgot_step_1').slideUp();
                $('#forgot_step_2').removeClass('hidden').slideDown();

                $('#forgot_title').text('Nhập mã OTP');
                $('#forgot_subtitle').text(`Mã 6 số đã gửi tới: ${forgotEmail}`);
                $('.forgot-otp').val('').first().focus();

            } else {
                showError('#forgot_email', 'Email này chưa được đăng ký!');
            }
        } catch (e) {
            console.error(e);
            showToast('Lỗi kết nối hoặc gửi mail thất bại.', 'error');
        } finally {
            $btn.text(originalText).prop('disabled', false);
        }
    });

    $('.forgot-otp').on('input', function () {
        if (this.value.length === 1) {
            $(this).next('.forgot-otp').focus();
        }
    });
    $('.forgot-otp').on('keydown', function (e) {
        if (e.key === 'Backspace' && this.value.length === 0) {
            $(this).prev('.forgot-otp').focus();
        }
    });

    // --- BƯỚC 2: XÁC THỰC OTP ---
    $('#btn_forgot_verify_otp').click(function() {
        let userOTP = '';
        $('.forgot-otp').each(function () { userOTP += $(this).val(); });

        if (userOTP.length < 6) {
            showToast('Vui lòng nhập đủ 6 số OTP', 'error');
            return;
        }

        if (userOTP === forgotOTP) {
            showToast('Xác thực thành công!', 'success');
            
            $('#forgot_step_2').slideUp();
            $('#forgot_step_3').removeClass('hidden').slideDown();

            $('#forgot_title').text('Đặt lại mật khẩu');
            $('#forgot_subtitle').text('Vui lòng nhập mật khẩu mới.');
        } else {
            showToast('Mã OTP không chính xác!', 'error');
            $('.forgot-otp').val('').first().focus();
        }
    });

    // --- BƯỚC 3: CẬP NHẬT MẬT KHẨU MỚI ---
    $('#btn_reset_password').click(async function() {
        $('.auth_error-message').remove();
        $('.auth_input').removeClass('input-error');

        const newPass = $('#new_password').val();
        const confirmPass = $('#confirm_new_password').val();

        if (newPass.length < 6) {
            showError('#new_password', 'Mật khẩu phải từ 6 ký tự trở lên');
            return;
        }
        if (newPass !== confirmPass) {
            showError('#confirm_new_password', 'Mật khẩu xác nhận không khớp');
            return;
        }

        const $btn = $(this);
        const originalText = $btn.text();
        $btn.text('Đang cập nhật...').prop('disabled', true);

        try {
            await $.ajax({
                url: `${API_URL}/${forgotUserId}`,
                type: 'PUT',
                data: { password: newPass },
                success: function() {
                    showToast('Đổi mật khẩu thành công!', 'success');

                    // Đợi 2 giây cho người dùng đọc thông báo rồi mới reload
                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                }
            });
        } catch (e) {
            console.error(e);
            showToast('Lỗi khi cập nhật mật khẩu.', 'error');
            $btn.text(originalText).prop('disabled', false);
        }
    });
});

// --- AOS & UI Effect ---
AOS.init({ once: false, offset: 0 });
function restartAOSChildren() {
    $('.runAOSChild [data-aos]').removeClass('aos-animate');
    setTimeout(() => AOS.refresh(), 100);
}
const $line = $('.auth_tab-line');
function updateLinePosition(targetBtn) {
    if (!targetBtn || !targetBtn.length) return;
    $line.css({ left: targetBtn[0].offsetLeft + 'px', width: targetBtn[0].offsetWidth + 'px' });
}
$(window).on('load resize', function () { updateLinePosition($('.auth_tab-btn.active')); });