// This is the variable that holds the number of incorrect validation attempts.
let incorrectValidationSubmits = 0;

document.addEventListener('DOMContentLoaded', () => {
    // Loads the url parameters into a variable and then extracts the vin parameter from them.
    const urlParams = new URLSearchParams(window.location.search);
    const vinParam = urlParams.get('vin');
    // Tests if the vin parameter exists.
    if (vinParam == null) {
        // Adds the validation event listeners for the vin and dealer code (verification form).
        addValidationEventListeners();
        document.getElementById('verificationSubmitBtn').addEventListener('click', () => {
            // Posts the form data and loads the response, using the provided function if the response status code is 500.
            postFormData('/workshop/recall/verifyDetails', 'verificationForm', addRecallSubmitEventListener, () => {
                // If the server returned the status code 500, the general unknown error is shown.
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
        addRecallSubmitEventListener();
    }
});

const addRecallSubmitEventListener = () => {
    // Adds the recall form submit button event listener.
    document.getElementById('recallSubmitBtn').addEventListener('click', () => {
        // Gets the work certification and data checkboxes.
        const workCertification = document.getElementById('workCertification');
        const dataCheckboxes = document.getElementsByClassName('dataCheckbox');
        // Loops over the data checkboxes and loads them into a variable whether any changes were made.
        let changed = false;
        for (let i = 0; i < dataCheckboxes.length; i++) {
            if (dataCheckboxes[i].checked == true && dataCheckboxes[i].disabled == false) {
                changed = true;
                break;
            }
        }
        // Tests if the work certification box is checked or no changes are made.
        if (workCertification.checked === true || !changed) {
            // If the test returned true, the work certifiaction box is disabled so that it is not sent to the server as an input.
            workCertification.disabled = true;
            // The form data is then posted and the response handled by the postFormData function.
            postFormData('/workshop/recall/submit-recall-work-details', 'recallWorkForm', addOwnerDetailsEventListeners);
        } else {
            // If the a change has been made and the work certification checkbox is not ticked, an error message is shown and the focus set to that checkbox.
            const workCertificationError = document.getElementById('workCertificationError');
            workCertificationError.classList.add('show');
            workCertificationError.focus();
            workCertificationError.scrollIntoView({ behavior: 'smooth', block: 'center' });

        }
    });
};

const addOwnerDetailsEventListeners = () => {
    // Adds the event listener to validate the owner details form.
    addValidationEventListeners();
    let isDirty = false;
    // Add change event listener to check for any change.
    document.getElementById('detailsForm').addEventListener('change', () => {
        isDirty = true;
    });
    // Adds the event listener to clear the owner details form.
    document.getElementById('clearBtn').addEventListener('click', () => {
        // Loads all inputs and selects into a variable.
        const inputs = [...document.getElementsByTagName('input'), ...document.getElementsByTagName('select')];
        // Loops over all of the elements in the inputs variable.
        for (let i = 0; i < inputs.length; i++) {
            // Tests that the inputs are not buttons.
            if (inputs[i].type != 'button' && inputs[i].type != 'submit') {
                // Sets the value to nothing.
                inputs[i].value = '';
                // Triggers events on the elements so that any relevant event listners will be triggered to fix styling.
                inputs[i].dispatchEvent(new Event('focus'));
                inputs[i].dispatchEvent(new Event('input'));
                inputs[i].dispatchEvent(new Event('change'));
                inputs[i].dispatchEvent(new Event('blur'));
                // Removes input validation classes so that the styling is reset.
                inputs[i].parentElement.classList.remove('inputValid');
                inputs[i].parentElement.classList.remove('inputInvalid');
            }
        }
        // Focuses the first field on the form.
        focusFirstField();
    });
    // Adds the event listener to skip the submission of the owner data.
    document.getElementById('detailsSkipBtn').addEventListener('click', () => {
        // Fetches and loads the success message.
        postFormData('/workshop/recall/skip-details-submit', null, null, null, false);
    });
    // Adds the event listener to submit the owner details data.
    document.getElementById('detailsSubmitBtn').addEventListener('click', () => {
        if (isDirty) {
            // Posts the details form data and loads the success message.
            postFormData('/workshop/recall/submit-owner-details', 'detailsForm');
        } else {
            // Fetches and loads the success message.
            postFormData('/workshop/recall/skip-details-submit', null, null, null, false);
        }
    });
};