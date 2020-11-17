const toBeValidated = [
    'nameInput',
    'phoneInput',
    'emailInput',
    'messageInput'
];

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
        feedbackElement.classList.remove('inputInvalid');
        if (inputElement.value != '') {
            feedbackElement.classList.add('inputValid');
        }
        errorElement.style.display = 'none';
    } else {
        feedbackElement.classList.remove('inputValid');
        if (document.activeElement.id == id) {
            console.log( id + ' focused');
        } else {
            feedbackElement.classList.add('inputInvalid');
            errorElement.textContent = errMes;
            errorElement.style.display = 'block';
        }
    }
}

const validateSubmit = () => {
    let allOk = true;
    let problem;
    for (let i = 0; i < toBeValidated.length; i++) {
        const validatedElement = document.getElementById(toBeValidated[i]).parentElement;
        if ((validatedElement.classList.contains('inputInvalid')) || !(validatedElement.classList.contains('inputValid'))) {
            allOk = false;
            problem = toBeValidated[i];
            break;
        }
    }
    return {parsed: allOk, problemElement: problem};
}



document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('submitBtn').addEventListener('click', () => {
        let submitValidation = validateSubmit();
        if (submitValidation.parsed) {
            const postBtn = document.getElementById('postBtn');
            postBtn.disabled = false;
            postBtn.click();
            postBtn.disabled = true;
        } else {
            document.getElementById(submitValidation.problemElement).select();
            document.getElementById(submitValidation.problemElement + 'Label').scrollIntoView();
        }
    });

    for (let i = 0; i < toBeValidated.length; i++) {
        const id = toBeValidated[i];
        const element = document.getElementById(id);
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
});