// This is the variable that holds the ids to be validated by valid.js
let toBeValidated;

// This is the variable that holds the number of incorrect validation attempts.
let incorrectValidationSubmits = 0;

document.addEventListener('DOMContentLoaded', () => {
    // Removes any properties still stored in session storage.
    window.sessionStorage.clear();
    
    document.getElementById('verificationSubmitBtn').addEventListener('click', () => {
        // This function is the one that deals with the vin and build number secrity check. It is trigged by the submit button press.
        // Validates the submited values.
        let submitValidation = validateSubmit();
        if (submitValidation.parsed) {
            // If the values are ok, runs a fetch with them as the body.
            fetch('/owner-registration/verifyDetails', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(getFormDataAsObject('verificationForm'))
            })
            // .then(res => {
            //     return {headers: res.headers, content: res.text()};
            // })
            .then(res => {
                console.log(res.headers);
                console.log(res.headers.get('securityNo'));
                if (res.status != 501) {
                    // If the header says that the vin and build number were a match, the security number and given details are loaded into session Storage.
                    window.sessionStorage.setItem('securityNo', res.headers.get('securityNo'));
                    window.sessionStorage.setItem('vin', document.getElementById('vinInput').value);
                    window.sessionStorage.setItem('buildNo', document.getElementById('buildNoInput').value);
                    // Removes the Security form, adds the one returned and adds the appropriate event listeners.
                    res.text().then(html => {
                        document.getElementById('verificationForm').remove();
                        console.log(html);
                        const main = document.getElementsByTagName('main')[0];
                        main.innerHTML = '';
                        main.insertAdjacentHTML('afterbegin', html);
                        //addValidationEventListeners();
                    });
                } else {
                    // If the server returned that the vin and build number were not a match, it is indicated to the user.
                    document.getElementById('generalUnknownError').style.display = 'block';
                    incorrectValidationSubmits++;
                    if (incorrectValidationSubmits >= 3) {
                        document.getElementById('persistingUnknownError').style.display = 'block';
                    }
                }
            })
        } else {
            // If the vin or build number were not valid inputs, the first problematic field is selected and scrolled into view.
            document.getElementById(submitValidation.problemElement).select();
            document.getElementById(submitValidation.problemElement + 'Label').scrollIntoView();
        }
    });
});

const addDetailsEventListener = () => {
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
};