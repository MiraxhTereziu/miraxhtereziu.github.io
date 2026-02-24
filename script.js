// Manage the loading indicator visibility

function manageLoadingIndicator(visible) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (visible) {
        loadingIndicator.style.display = 'block'; // Show
    } else {
        loadingIndicator.style.display = 'none'; // Hide
    }
}

// Example of using the function
document.addEventListener('DOMContentLoaded', () => {
    manageLoadingIndicator(true); // Show on load
    // Simulating loading
    setTimeout(() => manageLoadingIndicator(false), 3000); // Hide after 3 seconds
});