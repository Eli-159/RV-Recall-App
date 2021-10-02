document.addEventListener('DOMContentLoaded', () => {
    const repTable = document.getElementById('replaceValsTable');
    const repKeys = repTable.getElementsByClassName('repKey');
    const repVals = repTable.getElementsByClassName('repVal');
    const repTrash = repTable.getElementsByClassName('trash');
    for (let i = 0; i < repKeys.length; i++) {
        repKeys[i].addEventListener('input', repChangeEventListener);
        repVals[i].addEventListener('input', repChangeEventListener);
        repTrash[i].addEventListener('click', trashRow);
    }
});

const repChangeEventListener = () => {
    const repRows = document.getElementById('replaceValsTable').getElementsByTagName('tr');
    let emptyRow = false;
    for (let i = 0; i < repRows.length; i++) {
        const key = repRows[i].getElementsByClassName('repKey')[0];
        const val = repRows[i].getElementsByClassName('repVal')[0];
        if (key.value == '' && val.value == '') {
            emptyRow = true;
            break;
        }
    }
    if (!emptyRow) {
        const newRow = repRows[repRows.length-1].cloneNode(true);
        const newKey = newRow.getElementsByClassName('repKey')[0];
        const newVal = newRow.getElementsByClassName('repVal')[0];
        const newTrash = newRow.getElementsByClassName('trash')[0];
        newKey.name = "repKey" + (repRows.length+1);
        newKey.value = "";
        newKey.addEventListener('input', repChangeEventListener);
        newVal.name = "repVal" + (repRows.length+1);
        newVal.getElementsByTagName("option")[0].selected = true;
        newVal.addEventListener('input', repChangeEventListener);
        newTrash.addEventListener('click', trashRow);
        repRows[0].parentElement.appendChild(newRow);
        addSelectEventListeners();
    }
};

const trashRow = event => {
    event.target.parentElement.parentElement.remove();
    repChangeEventListener();
}