// This function sets returns whether or not a field is valid using the '.validiity' function. Copied from CSS Tricks
const hasError = function (field) {
    // If the field is of a type or has a propery that is not wanted, the function returns null.
    if (field.disabled || field.type === 'file' || field.type === 'reset' || field.type === 'submit' || field.type === 'button') return null;
    // Loads the validity of the field into a variable. This function is provided by the browser.
    var validity = field.validity;
    // If the field is valid, null is returned.
    if (validity.valid) return null;
    // If the field is invalid, a number of standard tests are run as to the reason for the invalidity.
    if (validity.valueMissing) return 'Please fill out this field.';
    if (validity.typeMismatch) {
        if (field.type === 'email') return 'Please enter an email address.';
        if (field.type === 'url') return 'Please enter a URL.';
    }
    if (validity.tooShort) return 'Please lengthen this text to ' + field.getAttribute('minLength') + ' characters or more. You are currently using ' + field.value.length + ' characters.';
    if (validity.tooLong) return 'Please shorten this text to no more than ' + field.getAttribute('maxLength') + ' characters. You are currently using ' + field.value.length + ' characters.';
    if (validity.badInput) return 'Please enter a number.';
    if (validity.stepMismatch) return 'Please select a valid value.';
    if (validity.rangeOverflow) return 'Please select a value that is no more than ' + field.getAttribute('max') + '.';
    if (validity.rangeUnderflow) return 'Please select a value that is no less than ' + field.getAttribute('min') + '.';
    if (validity.patternMismatch) {
        if (field.hasAttribute('data-pattern-err-msg')) return field.getAttribute('data-pattern-err-msg');
        if (field.classList.contains('phone')) return 'Please enter a phone number, including an area code';
        return 'Please match the requested format.';
    }
    // If the reason for the invalidity cannot be found, a standardised error message is returned.
    return 'The value you entered for this field is invalid.';
};

// This function gives the validation feedback per field based on the three values passed in.
const showValidationFeedback = (id, ok, errMes) => {
    // Gets the input field based on the id passed in.
    const inputElement = document.getElementById(id);
    // Gets the parent element of the input field with the id given as the tick and cross is applied to that element.
    const feedbackElement = inputElement.parentElement;
    // Gets the element that shows the reason for the error based on the id passed in.
    const errorElement = document.getElementById(id + 'Error');
    if (ok) {
        // If the element is valid, 'inputInvalid' class is removed so that the cross is no longer shown.
        feedbackElement.classList.remove('inputInvalid');
        // If the input element is not empty and is valid, the 'inputValid' class is added so the tick is displayed.
        if (inputElement.value != '') {
            feedbackElement.classList.add('inputValid');
        }
    } else {
        // If the input was not valid, the 'inputValid' class is removed.
        feedbackElement.classList.remove('inputValid');
        // If the current element isn't active, the 'inputInvalid' class is added and the reason is shown in the error message section.
        if (document.activeElement.id != id) {
            feedbackElement.classList.add('inputInvalid');
            errorElement.textContent = errMes;
        }
    }
}

// This function validates the submit of all element marked with the class 'validate' using the 'hasError' function.
const validateSubmit = () => {
    // Gets all element with the class 'validate'.
    let toBeValidated = document.getElementsByClassName('validate');
    // Declares a variable that holds a boolean value indicating whether everything is valid.
    let allOk = true;
    // Loops over all of the elements with the class 'validate'.
    for (let i = 0; i < toBeValidated.length; i++) {
        // Formats the fields.
        formatFields(toBeValidated[i].id);
        // Gets the validity of the current element from the 'hasError' function.
        const valid = hasError(toBeValidated[i]);
        // If the element was not valid, allOk is set to false, records the current element as the 'problem' and breaks the loop to save time. 
        if (valid != null) {
            showValidationFeedback(toBeValidated[i].id, false, valid);
            if (allOk) {
                allOk = false;
                toBeValidated[i].select();
                document.getElementById((toBeValidated[i].id) + 'Label').scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            showValidationFeedback(toBeValidated[i].id, true);
        }
    }
    // Whether it parsed is returned as a boolean.
    return allOk;
}

// Adds the validation event listeners to all elements with the class 'validate'.
const addValidationEventListeners = () => {
    // Gets all the elements with the class 'validate'.
    let toBeValidated = document.getElementsByClassName('validate');
    // Loops over all the elements with the class 'validate'.
    for (let i = 0; i < toBeValidated.length; i++) {
        // Gets the current element and its id.
        const element = toBeValidated[i];
        const id = element.id;
        // Defines the function that is triggered by the event listeners.
        const func = event => {
            // Tests if the event was of type blur.
            if (event.type == 'blur') {
                // Formats the field.
                formatFields(element.id);
            }
            // Loads the validity of the element into a variable.
            const valid = hasError(element);
            // Shows the validation feedback.
            if (valid == null) {
                showValidationFeedback(id, true);
            } else {
                showValidationFeedback(id, false, valid);
            }
        };
        // Adds an input and blur event listener to the current element with the function previously defined.
        element.addEventListener('input', func);
        element.addEventListener('blur', func, true);
    }
};

const formatFields = id => {
    // Loads the element by the id provided.
    const element = document.getElementById(id);
    // Tests if the current element has the class 'phone'.
    if (element.classList.contains('phone')) {
        // Removes all characters that are not digits.
        element.value = element.value.replace(/\D/g, '');
        // Inserts three spaces into the phone number.
        if (element.value.slice(0, 2) == '04') {
            element.value = element.value.slice(0, 4) + ' ' + element.value.slice(4, 7) + ' ' + element.value.slice(7);
        } else {
            element.value = element.value.slice(0, 2) + ' ' + element.value.slice(2, 6) + ' ' + element.value.slice(6);
        }
    } else if (element.id.toLowerCase().includes('vin') || element.id.includes('regoNo')) {
        // Applies the toUpperCase() function to the value of the element.
        element.value = element.value.toUpperCase();
    } else if (element.id.includes('regoDt') && element.type == 'date' && element.value != '') {
        // Splits the date and gets the year.
        const splitDate = element.value.split('-');
        const year = parseInt(splitDate[0]);
        // Tests if the year is less than or equal to 50.
        if (year <= 50) {
            // Adds 2000 to the year and sets the date again.
            splitDate[0] = (year+2000).toString();
            element.value = splitDate.join('-');
        }
        
    }
}