document.addEventListener('DOMContentLoaded', function() {
    // 1. Process Security Validation Errors
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('error')) {
        const errorBox = document.getElementById('errorBox');
        if (errorBox) errorBox.style.display = 'flex';

        // Triggers the fully implemented CSS structural shake
        const card = document.querySelector('.login-card');
        if (card) {
            card.classList.add('card-shake');
        }
    }

    // 2. Interactive Password Field Visibility Eye-Toggle
    const passwordToggle = document.getElementById('passwordToggle');
    const passwordInput = document.getElementById('password');

    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener('click', function() {
            const isHidden = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isHidden ? 'text' : 'password');

            // Swap icons smoothly
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }
});