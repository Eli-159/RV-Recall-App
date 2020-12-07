const hasError = function (field) {
    // This function sets returns whether or not a field is valid using the '.validiity' function. Coppied from CSS Tricks
    if (field.disabled || field.type === 'file' || field.type === 'reset' || field.type === 'submit' || field.type === 'button') return;

    var validity = field.validity;

    if (validity.valid) return;
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
        if (field.hasAttribute('title')) return field.getAttribute('title');
        return 'Please match the requested format.';
    }
    return 'The value you entered for this field is invalid.';
};

const showValidationFeedback = (id, ok, errMes) => {
    // Gets Elements based on the id passed in.
    const inputElement = document.getElementById(id);
    const feedbackElement = inputElement.parentElement;
    const errorElement = document.getElementById(id + 'Error');
    if (ok) {
        // If the element is valid, feedback is shown to that effect.
        feedbackElement.classList.remove('inputInvalid');
        if (inputElement.value != '') {
            feedbackElement.classList.add('inputValid');
        }
        errorElement.style.display = 'none';
    } else {
        // If the input was not found to be valid, the error message and cross are displayed.
        feedbackElement.classList.remove('inputValid');
        if (document.activeElement.id == id) {
        } else {
            feedbackElement.classList.add('inputInvalid');
            errorElement.textContent = errMes;
            errorElement.style.display = 'block';
        }
    }
}

const validateSubmit = () => {
    // Validates the submit by looping over all elements with the class 'validate' and stopping if there was an issue.
    let toBeValidated = document.getElementsByClassName('validate');
    let allOk = true;
    let problem = null;
    for (let i = 0; i < toBeValidated.length; i++) {
        const validatedElement = toBeValidated[i].parentElement;
        if ((validatedElement.classList.contains('inputInvalid')) || !(validatedElement.classList.contains('inputValid'))) {
            allOk = false;
            problem = toBeValidated[i];
            break;
        }
    }
    // Whether it parsed and the problematic element are returned.
    return {parsed: allOk, problemElement: problem};
}

const addValidationEventListeners = () => {
    // Adds the validation event listeners to all elements in the 'toBeValidated' variable. They are trigged by input and blur events.
    let toBeValidated = document.getElementsByClassName('validate');
    for (let i = 0; i < toBeValidated.length; i++) {
        const element = toBeValidated[i];
        const id = element.id;
        const func = () => {
            const valid = hasError(element);
            if (valid == null) {
                showValidationFeedback(id, true);
            } else {
                showValidationFeedback(id, false, valid);
            }
        }
        element.addEventListener('input', func);
        element.addEventListener('blur', func, true);
    }
};