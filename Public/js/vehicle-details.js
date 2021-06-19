document.addEventListener('DOMContentLoaded', () => {
    // Adds the event listeners for the vin and build number input fields.
    addValidationEventListeners();
    // Adds the event listener for the submit of the vin or build number.
    document.getElementById('vehicleIdSubmitBtn').addEventListener('click', () => {
        // Gets the vin and build number input.
        const vinInput = document.getElementById('vinInput');
        const buildNoInput = document.getElementById('buildNoInput');
        // Test if either the vin or build number are marked as valid.
        if (vinInput.parentElement.classList.contains('inputValid') || buildNoInput.parentElement.classList.contains('inputValid')) {
            // Posts the form data without validating and loads the response.
            postFormData('/workshop/elite/get-vehicle-details/vehicle-details', 'vinForm', null, () => {
                // If the status code is 500, it is indicated to the user that the vin or build number was unknown.
                document.getElementById('generalUnknownError').classList.remove('hide');
            }, false);
        } else {
            // If neither the vin or build number inputs were valid (client side), the error message requesting one is filled in is shown.
            document.getElementById('enterInputError').classList.remove('hide');
        }
    });
});