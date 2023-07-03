document.addEventListener('DOMContentLoaded', () => {
    // Adds the visual validation even listeners.
    addValidationEventListeners();
    // Adds the new submit button event listener.
    document.getElementById('detailsSubmitBtn').addEventListener('click', () => {
        // Posts the form data and loads the response.
        postFormData('/workshop/admin/recall-registration/submit-details', 'detailsForm', startRedirect);
    });
});