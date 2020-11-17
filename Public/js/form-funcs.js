const getFormBody = formId => {
    const form = document.getElementById(formId);
    const inputs = [
        ...form.getElementsByTagName('input'),
        ...form.getElementsByTagName('select'),
        ...form.getElementsByTagName('textarea')
    ];
    const formData = [];
    for (input in inputs) {
        const currentInput = inputs[input];
        if (currentInput.tagName == 'INPUT' && (currentInput.type == 'button' || currentInput.type == 'submit')) {
            continue;
        }
        formData.push(currentInput.name + '=' + currentInput.value);
    }
    const bodyData = new URLSearchParams(formData.join('&'));
    return bodyData;
};

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
    console.log(JSON.stringify(formData));
    return JSON.stringify(formData);
};