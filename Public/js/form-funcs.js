const getFormDataAsObject = formId => {
    // This function returns the object of form data from within the form with the id given.
    // Tests if the form id is null, nothing in returned.
    if (formId == null) return;
    // Gets the form by id.
    const form = document.getElementById(formId);
    // Collects all of the input elements from within the form.
    const inputs = [
        ...form.getElementsByTagName('input'),
        ...form.getElementsByTagName('select'),
        ...form.getElementsByTagName('textarea')
    ];
    // Declares the final form data object.
    const formData = {};
    // Loops over all of the inputs.
    for (input in inputs) {
        // Selects the current input.
        const currentInput = inputs[input];
        // Continues if the input element is a button or is disabled.
        if ((currentInput.tagName == 'INPUT' && (currentInput.type == 'button' || currentInput.type == 'submit')) || currentInput.disabled == true) {
            continue;
        }
        // If the input is a checkbox, its 'checked' value is added to the formData object under the current input's 'name' value and continues.
        if (currentInput.tagName == 'INPUT' && currentInput.type == 'checkbox') {
            formData[currentInput.name] = currentInput.checked;
            continue;
        }
        // If the input is a radio button and it is checked, its value is added to the formData object under its name.
        if (currentInput.tagName == 'INPUT' && currentInput.type == 'radio') {
            if (currentInput.checked) {
                formData[currentInput.name] = currentInput.value;
            }
            continue;
        }
        // If the input is a file input, its files attribute is added to the formData object under its name.
        if (currentInput.tagName == 'INPUT' && currentInput.type == 'file') {
            formData[currentInput.name] = currentInput.files;
            continue;
        }
        // If the loop has reached this point, the current input's 'value' value is added to the formData object under the input's name 'value'.
        formData[currentInput.name] = currentInput.value;
    }
    // Returns the formData object created.
    return formData;
};

const disableAllSubmitButtons = (disabled=true) => {
    // Sets the disabled value of the active element to the disabled value passed in, if the active element is a button.
    if (document.activeElement.type == 'button') document.activeElement.disabled = disabled;
    // Sets the disabled value of the button with the class 'submitBtn' to that passed in if there is only one element with that class.
    if (document.getElementsByClassName('submitBtn').length == 1) {
        document.getElementsByClassName('submitBtn')[0].disabled = disabled;
    }
    // Disables all inputs of type button that contain the string 'submit'.
    const inputs = document.getElementsByTagName('input');
    for (let i = 0; i < inputs.length; i++) {
        if (inputs[i].type == 'button' && inputs[i].value.toLowerCase().includes('submit')) inputs[i].disabled = disabled;
    }
}

const postFormData = (url, formId, successResponse, serverErrorRes, validate) => {
    // Disables the submit button.
    disableAllSubmitButtons();
    // Tests if the values to be submited are valid. If not, the appropriate fail response is executed by the function.
    if (validateSubmit() || validate === false) {
        // If the inputs are valid, the data is posted in a fetch.
        fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(getFormDataAsObject(formId))
        }).then(res => {
            // The text is extracted from the promise response.
            // This is done within the previous '.then' so that the rest of the function still has access to the whole response.
            res.text()
            .then(returnedHtml => {
                // Once the response html has been loaded, the main element is found.
                const main = document.getElementsByTagName('main')[0];
                if (res.status != 500) {
                    // If the resoponse status is not 500, the 'main' element is hidden.
                    main.classList.add('hide');
                    // After 250ms, the html returned replaces that of the page and is shown again.
                    // The pause is in place so the CSS can fade the 'main' element.
                    setTimeout(() => {
                        main.innerHTML = '';
                        main.insertAdjacentHTML('afterbegin', returnedHtml);
                        main.classList.remove('hide');
                        if (res.status == 401 || res.status == 403) {
                            // If the status is 401 or 403, the 'startRedirect' function is called, defined in 'redirect.js'.
                            startRedirect();
                        } else if (res.status == 200 && typeof successResponse == 'function') {
                            // If the status is 200 and the successResponse variable is a function, the successResponse function is executed.
                            successResponse();
                            focusFirstField();
                            addSelectEventListeners();
                            addDatePlaceholderFunctions();
                        }
                    }, 250);
                } else {
                    // If the status is 500, it tests if the serverErrorRes variable is a function.
                    if (typeof serverErrorRes == 'function') {
                        // If the serverErrorRes variable is a function, it is executed.
                        serverErrorRes();
                        // Enables the submit button.
                        disableAllSubmitButtons(false);
                    } else {
                        // If no serverErrorRes function was inputed, the returned html is added to the top of the page, unhidden, and scrolled into view as a default response.
                        main.insertAdjacentHTML('afterbegin', returnedHtml);
                        document.getElementById('errorMessage').scrollIntoView({ behavior: 'smooth', block: 'center' });
                        document.getElementById('errorMessage').classList.remove('hide');
                        focusFirstField();
                        addSelectEventListeners();
                        addDatePlaceholderFunctions();
                        // Enables the submit button.
                        disableAllSubmitButtons(false);
                    }
                }
            });
        });
    } else {
        // Enables the submit button.
        disableAllSubmitButtons(false);
    }
};

// Declares a function to focus the first input field of a document.
const focusFirstField = () => {
    // Loads all input elements into an array.
    const inputFields = document.getElementsByTagName('INPUT');
    // Loops over all of the input fields.
    for (let i = 0; i < inputFields.length; i++) {
        // Tests if the current element is a button.
        if (inputFields[i].type != 'button' && inputFields[i].type != 'submit') {
            // Focuses on the first element of the array.
            inputFields[i].focus();
            // Loads the input value into a variable, clears the value, and sets it again. This moves the cursor to the end of the input.
            const inputVal = inputFields[i].value;
            inputFields[i].value = '';
            inputFields[i].value = inputVal;
            // Stops the loop.
            break;
        }
    }
}
// Ties the focusFirstField function to an event listener.
document.addEventListener('DOMContentLoaded', focusFirstField);

// Adds an event listener for any key press.
document.addEventListener('keydown', key => {
    // Checks if the enter key was pressed.
    if (key.code == 'Enter' || key.code == 'NumpadEnter') {
        // Loads an array of all elements with the class 'submitBtn'.
        const submitBtns = document.getElementsByClassName('submitBtn');
        // Loads the active element data into variables.
        const activeEl = document.activeElement
        const activeElTag = activeEl.tagName;
        const activeElType = activeEl.type;
        // Tests that there is only one element with the class name 'submitBtn' and that the current field in focus is not an ignored one.
        if (submitBtns.length == 1 && activeElTag != 'TEXTAREA' && activeElTag != 'BUTTON' && activeElTag != 'A' && !(activeElTag == 'INPUT' && (activeElType == 'button' || activeElType == 'submit')) && activeElTag != 'SELECT') {
            // Executes the blur event on the current active element.
            document.activeElement.dispatchEvent(new Event('blur'));
            // Clicks the submit button.
            submitBtns[0].click();
        }
    }
});

// Creates a function to add a event listener to all select elements.
const addSelectEventListeners = () => {
    // Loads all of the select elements on the current page into a variable.
    const selects = document.getElementsByTagName('select');
    // Loops over all of the found select elements.
    for (let i = 0; i < selects.length; i++) {
        // Adds a change event listener to the current select element.
        selects[i].addEventListener('change', () => {
            // Sets the select's currentVal attribute to its value.
            selects[i].dataset.chosen = selects[i].value;
        });
        // Sets the select's currentVal attribute to its value here as well so that it is done immediately as well as at any change.
        selects[i].dataset.chosen = selects[i].value;
    }
}
// Ties the addSelectEventListeners function to a DOMContentLoaded event listener.
document.addEventListener('DOMContentLoaded', addSelectEventListeners);

// Creates a function to add event listners and show all date input placeholders.
const addDatePlaceholderFunctions = () => {
    // Loads all input elements into a variable.
    const inputs = document.getElementsByTagName('input');
    // Loops over all of the inputs.
    for (let i = 0; i < inputs.length; i++) {
        // Tests if the current input is of type date and has a placeholder.
        if (inputs[i].type == 'date' && inputs[i].placeholder != '') {
            // Creates a function to change the type of the date input.
            const changeDateInputType = () => {
                // Tests if the current date input is focused, has a value, or has no placeholder.
                if (inputs[i].value != "" || document.activeElement.id == inputs[i].id || inputs[i].placeholder == '') {
                    // Sets the input type to date.
                    inputs[i].type = 'date';
                } else {
                    // Sets the input type to text.
                    inputs[i].type = 'text';
                }
            }
            // Ties the changeDateInputType function to a focus and blur event listener.
            inputs[i].addEventListener('focus', changeDateInputType);
            inputs[i].addEventListener('blur', changeDateInputType);
            // Executes the function now.
            changeDateInputType();
        }
    }
}
// Ties the addDatePlaceholderFunctions function to a DOMContentLoaded event listner.
document.addEventListener('DOMContentLoaded', addDatePlaceholderFunctions);