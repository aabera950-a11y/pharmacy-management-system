document.addEventListener('DOMContentLoaded', function() {
    // Check the URL for the 'error' parameter
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('error')) {
        const errorBox = document.getElementById('errorBox');
        errorBox.style.display = 'block';

        // Add a small shake animation to the card for professional feel
        const card = document.querySelector('.login-card');
        card.style.animation = "shake 0.5s";
    }
});