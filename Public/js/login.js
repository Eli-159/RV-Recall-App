document.addEventListener('DOMContentLoaded', () => {
    // Adds the event listeners for the input fields.
    addValidationEventListeners();
    // Adds the event listener to submit the login details.
    document.getElementById('loginSubmitBtn').addEventListener('click', () => {
        // Validates the submit.
        const valid = validateSubmit();
        if (valid) {
            // If the input fields were valid, a fetch is run with them as the body of the request.
            fetch('/login/submit', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(getFormDataAsObject('loginForm'))
            }).then(res => {
                // When the request resolves, the status is tested.
                if (res.status == 200) {
                    // If the status is 200, the user is redirected to the actions page.
                    window.location.href = '/login/redirect';
                } else {
                    // If the status is not 200, the credentials error is shown.
                    document.getElementById('credentialsError').classList.remove('hide');
                }
            })
        }
    });
});