// This is the variable that holds the number of incorrect validation attempts.
let incorrectValidationSubmits = 0;

document.addEventListener('DOMContentLoaded', () => {
    // Adds the Verification Form event listeners.
    addValidationEventListeners();
    document.getElementById('verificationSubmitBtn').addEventListener('click', () => {
        // Posts the form data and loads the response, using the provided function if the response status code is 500.
        postFormData('/owner-registration/verifyDetails', 'verificationForm', addDetailsSubmitEventListener,  () => {
            // If the server returned that the vin and build number were not a match (indicated by the status), it is indicated to the user.
            document.getElementById('generalUnknownError').classList.remove('hide');
            // The number of incorrect submits are increased.
            incorrectValidationSubmits++;
            // If there has been 3 or more incorrect submits, an additional error message is shown.
            if (incorrectValidationSubmits >= 3) {
                document.getElementById('persistingUnknownError').classList.remove('hide');
            }
        });
    });
});

const addDetailsSubmitEventListener = () => {
    // Adds the visual validation even listeners.
    addValidationEventListeners();
    // Adds the new submit button event listener.
    document.getElementById('detailsSubmitBtn').addEventListener('click', () => {
        // Posts the form data and loads the response.
        postFormData('/owner-registration/submit-details', 'detailsForm');
    });
};