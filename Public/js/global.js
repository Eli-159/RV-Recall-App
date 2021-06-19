// Waits for the document to load.
document.addEventListener('DOMContentLoaded', () => {
    // Waits for 50ms.
    setTimeout(() => {
        // Gets all elements with the 'stop-page-load-transition' class and removes it, meaning the transitions can be applied.
        const noTransClass = document.getElementsByClassName('stop-page-load-transition');
        for (let i = 0; i < noTransClass.length; i++) {
            noTransClass[i].classList.remove('stop-page-load-transition');
        };
    }, 50);
});