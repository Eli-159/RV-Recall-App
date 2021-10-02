document.addEventListener('DOMContentLoaded', () => {
    // Loads the Replace Values table into a variable.
    const repTable = document.getElementById('replaceValsTable');
    // Loads the key and value inputs, as well as the trash button, into variables.
    const repKeys = repTable.getElementsByClassName('repKey');
    const repVals = repTable.getElementsByClassName('repVal');
    const repTrash = repTable.getElementsByClassName('trash');
    // Loops over the repKeys variable.
    for (let i = 0; i < repKeys.length; i++) {
        // Adds the appropriate event listeners. These are all done in one loop as there should be one per row.
        repKeys[i].addEventListener('input', testAndAddNewRow);
        repVals[i].addEventListener('input', testAndAddNewRow);
        repTrash[i].addEventListener('click', trashRow);
    }
    // Adds the event listener to validate the owner details form.
    addValidationEventListeners();
    // Adds the event listener to submit the email data.
    document.getElementById('emailSubmitBtn').addEventListener('click', () => {
        // Posts the email data and loads the success message.
        postFormData('/workshop/admin/google/edit-auto-email/submit', 'editEmailForm');
    });
    // Adds the event listener to delete the email data.
    document.getElementById('emailDeleteBtn').addEventListener('click', () => {
        // Posts the email data and loads the success message.
        postFormData('/workshop/admin/google/edit-auto-email/delete', null, null, null, false);
    });
});

// Declares a function to add a new row to the table if all existing ones have an input.
const testAndAddNewRow = () => {
    // Gets all of the rows.
    const repRows = document.getElementById('replaceValsTable').getElementsByTagName('tr');
    // Declares a variable to hold whether or not there is an empty row.
    let emptyRow = false;
    // Loops over all of the rows.
    for (let i = 0; i < repRows.length; i++) {
        // Loads the key and value inputs of the current row into variables.
        const key = repRows[i].getElementsByClassName('repKey')[0];
        const val = repRows[i].getElementsByClassName('repVal')[0];
        // Tests if they both have a blank value.
        if (key.value == '' && val.value == '') {
            // Sets the emptyRow variable to true and stops the loop.
            emptyRow = true;
            break;
        }
    }
    // Tests if no empty row was found.
    if (!emptyRow) {
        // Clones the last row of the table and loads it into a variable.
        const newRow = repRows[repRows.length-1].cloneNode(true);
        // Gets the new key and value inputs, as well as the trash button.
        const newKey = newRow.getElementsByClassName('repKey')[0];
        const newVal = newRow.getElementsByClassName('repVal')[0];
        const newTrash = newRow.getElementsByClassName('trash')[0];
        // Resets the key input properties and adds its event listener.
        newKey.name = "repKey" + (repRows.length+1);
        newKey.value = "";
        newKey.addEventListener('input', testAndAddNewRow);
        // Resets the value input properties and adds its event listener.
        newVal.name = "repVal" + (repRows.length+1);
        newVal.getElementsByTagName("option")[0].selected = true;
        newVal.addEventListener('input', testAndAddNewRow);
        // Adds the event listener to the trash button.
        newTrash.addEventListener('click', trashRow);
        // Adds the new element to the bottom of the table.
        repRows[0].parentElement.appendChild(newRow);
        // Adds the select event listeners, meaning the css classes will be up to date on the new value input.
        addSelectEventListeners();
    }
};

// Declares a function to trash a row.
const trashRow = event => {
    // Removes the parent row of the trash button.
    event.target.parentElement.parentElement.remove();
    // Checks if a new blank row should be added, and adds it if necessary.
    testAndAddNewRow();
}