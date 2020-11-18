const getFormDataAsObject = formId => {
    const form = document.getElementById(formId);
    const inputs = [
        ...form.getElementsByTagName('input'),
        ...form.getElementsByTagName('select'),
        ...form.getElementsByTagName('textarea')
    ];
    const formData = {};
    for (input in inputs) {
        const currentInput = inputs[input];
        if (currentInput.tagName == 'INPUT' && (currentInput.type == 'button' || currentInput.type == 'submit')) {
            continue;
        }
        
        formData[currentInput.name] = currentInput.value;
        
    }
    return formData;
};