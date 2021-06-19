document.addEventListener('DOMContentLoaded', () => {
    // Adds the validation event listeners.
    addValidationEventListeners();
    // Adds a click event listener to the submit button.
    document.getElementById('csvSubmitBtn').addEventListener('click', () => {
        // Disables the submit button.
        disableAllSubmitButtons();
        // Shows validaton feedback and enables the submit button again if the submit was not valid.
        if (validateSubmit()) disableAllSubmitButtons(false);
    });
});