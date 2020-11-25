// This is the variable that holds the ids to be validated by valid.js
let toBeValidated = [
    'vinInput',
    'buildNoInput'
];

document.addEventListener('DOMContentLoaded', () => {
    // Removes the second form and success message and stores them in a variable.
    const userForm = document.getElementById('detailsForm');
    userForm.remove();
    userForm.style.display = 'block';
    const successMessage = document.getElementById('successMessage');
    successMessage.remove();
    successMessage.style.display = 'block';
    // Removes any properties still stored in session storage.
    window.sessionStorage.clear();
    
    document.getElementById('verificationSubmitBtn').addEventListener('click', () => {
        // This function is the one that deals with the vin and build number secrity check. It is trigged by the submit button press.
        // Validates the submited values.
        let submitValidation = validateSubmit();
        if (submitValidation.parsed) {
            // If the values are ok, runs a fetch with them as headers.
            const bodyData = {
                vin: document.getElementById('vinInput').value,
                buildNo: document.getElementById('buildNoInput').value
            };
            fetch('/owner-registration/verifyDetails', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    securityNo: window.sessionStorage.getItem('vin') + window.sessionStorage.getItem('securityNo') + window.sessionStorage.getItem('buildNo')
                },
                body: JSON.stringify(getFormDataAsObject('verificationForm'))
            })
            .then(res => res.json())
            .then(json => {
                // Gets the json returned by the server.
                json = JSON.parse(json);
                if (json['proceed']) {
                    // If the json says that the vin and build number were a match, the security number and given details are loaded into session Storage.
                    window.sessionStorage.setItem('securityNo', json['securityNo']);
                    window.sessionStorage.setItem('vin', document.getElementById('vinInput').value);
                    window.sessionStorage.setItem('buildNo', document.getElementById('buildNoInput').value);
                    // Removes the Security form and adds the details one that was stored in the variable 'userForm' in the beginning.
                    document.getElementById('verificationForm').remove();
                    document.getElementsByTagName('main')[0].appendChild(userForm);
                    // Adds the vehicle description to the form.
                    document.getElementById('vehicleDescription').textContent = json['description'];
                    // Updates the fields to be validated and then adds the event listeners.
                    toBeValidated = ['nameInput', 'phoneInput', 'emailInput', 'addressInput', 'suburbInput', 'postCodeInput'];
                    addValidationEventListeners();
                    // Adds the new submit button event listener.
                    document.getElementById('detailsSubmitBtn').addEventListener('click', () => {
                        // Checks if the inputed values are valid.
                        let submitValidation = validateSubmit();
                        if (submitValidation.parsed) {
                            // Posts the data.
                            fetch('/owner-registration/submit-details', {
                                method: 'POST',
                                headers: {
                                    'Accept': 'application/json',
                                    'Content-Type': 'application/json',
                                    securityNo: window.sessionStorage.getItem('vin') + window.sessionStorage.getItem('securityNo') + window.sessionStorage.getItem('buildNo')
                                },
                                body: JSON.stringify(getFormDataAsObject('detailsForm'))
                            })
                            .then(res => res.json())
                            .then(json => {
                                json = JSON.parse(json);
                                if (json.found == true) {
                                    window.sessionStorage.removeItem('vin');
                                    window.sessionStorage.removeItem('securityNo');
                                    window.sessionStorage.removeItem('buildNo');
                                    userForm.remove();
                                    document.getElementsByTagName('main')[0].appendChild(successMessage);
                                } else {
                                    alert('An unexpected error occured. Please try again.');
                                    //window.history.go();
                                }
                            });
                        } else {
                            // If the values were not valid, the first problematic field is selected and scrolled into view.
                            document.getElementById(submitValidation.problemElement).select();
                            document.getElementById(submitValidation.problemElement + 'Label').scrollIntoView();
                        }
                    });
                } else {
                    // If the server returned that the vin and build number were not a match, the fields are cleared and an alert tells the user it was not a match.
                    const vinInput = document.getElementById('vinInput');
                    vinInput.value = '';
                    vinInput.parentElement.classList.remove('inputValid');
                    const buildNoInput = document.getElementById('buildNoInput');
                    buildNoInput.value = '';
                    buildNoInput.parentElement.classList.remove('inputValid');
                    alert('That VIN or Build Number did not match any known.');
                }
            })
        } else {
            // If the vin or build number were not valid inputs, the first problematic field is selected and scrolled into view.
            document.getElementById(submitValidation.problemElement).select();
            document.getElementById(submitValidation.problemElement + 'Label').scrollIntoView();
        }
    });
});