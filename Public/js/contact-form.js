// This is the variable that holds the number of incorrect validation attempts.
let incorrectValidationSubmits = 0;

document.addEventListener('DOMContentLoaded', () => {
    // Loads the url parameters into a variable and then extracts the vin parameter from them.
    const urlParams = new URLSearchParams(window.location.search);
    const vinParam = urlParams.get('vin');
    // Tests if the vin parameter exists.
    if (vinParam == null) {
        // Adds the validation event listeners for the vin and dealer code (vin form).
        addValidationEventListeners();
        document.getElementById('vinSubmitBtn').addEventListener('click', (e) => {
            // Posts the form data and loads the response, using the provided function if the response status code is 500.
            postFormData('/workshop/contact/verifyVin', 'vinForm', addContactFormEventListeners, () => {
                // If the server returned the status code 500, it is indicated to the user that the vin and build number were not a match.
                document.getElementById('generalUnknownError').classList.remove('hide');
                // The number of incorrect submits is increased.
                incorrectValidationSubmits++;
                // If there are 3 or more incorrect submits, an additional error message is shown.
                if (incorrectValidationSubmits >= 3) {
                    document.getElementById('persistingUnknownError').classList.remove('hide');
                }
            });
        });
    } else {
        // Skips the first page of event listeners and skips straight to the second page.
        addContactFormEventListeners();
    }
});

const addContactFormEventListeners = () => {
    // Adds the event listener to validate the contact form.
    addValidationEventListeners();
    // Adds the event listener to submit the contact details data.
    document.getElementById('contactSubmitBtn').addEventListener('click', () => {
        // Posts the form data and loads the response.
        postFormData('/workshop/contact/submit-contact-details', 'contactForm');
    });
}