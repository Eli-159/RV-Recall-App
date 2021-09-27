const fs = require('fs');
const dao = require ('../data/dao.js');

// Declares a function to sort the vehicle data for the email.
module.exports.sortVehicleDataForEmail = (vehicleData) => {
    // Declares an object that contains the vehicle data required for the email.
    const processedVehicleData = {
        vehicleVin: vehicleData.vin,
        vehicleBuildNo: vehicleData.buildNo,
        vehicleIpa: vehicleData.ipa,
        vehicleEngineNo: vehicleData.engineNo,
        vehicleModelDesc: vehicleData.modelDesc,
        vehicleAddSpec: vehicleData.addSpec,
        vehicleVariantCode: vehicleData.variantCode
    };
    // Returns the previously delcared object.
    return processedVehicleData;
};

// Declares a function to sort the owner data for the email.
module.exports.sortOwnerDataForEmail = (vehicleData) => {
    // Declares an object that contains the owner data required for the email.
    const processedOwnerData =  {
        ownerName: vehicleData.owners[0].name,
        ownerEmail: vehicleData.owners[0].email,
        ownerPhone: vehicleData.owners[0].phone,
        ownerStreet: vehicleData.owners[0].street,
        ownerSuburb: vehicleData.owners[0].suburb,
        ownerState: vehicleData.owners[0].state,
        ownerPostcode: vehicleData.owners[0].postcode,
        ownerRegoState: vehicleData.owners[0].regoState,
        ownerRegoNo: vehicleData.owners[0].regoNo,
        ownerRegoDt: vehicleData.owners[0].regoDt
    };
    // Returns the previously delcared object.
    return processedOwnerData;
};

// Declares a function to sort and add the workshop data for the email.
module.exports.sortWorkshopDataForEmail = (vehicleData) => {
    // Declares an object to contaiin the sorted workshop data.
    const processedWorkshopData = {};
    // Declares variables to hold the most recent date, and the index of the record containing them.
    let recentDate = 0;
    let recentIndex = 0;
    // Loops over the contact records.
    for (record in vehicleData.recallContacts) {
        // Gets the current record and current date.
        const currRec = vehicleData.recallContacts[record];
        const currDate = new Date(currRec.createdAt).getTime();
        // Tests if the date is more recent than the previously found one, and if it from a recall registration record created by the owner.
        if (currDate > maxDate && currRec.action == 'recall registration' && currRec.createdBy == 'owner') {
            // Updates the recentDate and recentIndex variables.
            recentDate = currDate;
            recentIndex = record;
        }
    }
    // Checks if a workshop record has been found.
    if (recentDate != 0) {
        // Sets the workshopFound value to true, indicating there was a record found.
        processedWorkshopData.workshopFound = true;
        // Loads the most recent record and the feedback from it into variables.
        const recentRecord = vehicleData.recallContacts[recentIndex];
        const recallFeedback = recentRecord.recallFeedbacks[0].feedback;
        // Loads the saved workshop location into a variable.
        const chosenWorkshop = (recallFeedback.includes(';') ? recallFeedback.split(';')[0] : undefined);
        // Tests if the selected workshop was Sydney.
        if (chosenWorkshop == 'sydney') {
            // Loads the appropriate data into the processedWorkshopData variable.
            processedWorkshopData.workshopLocation = 'Sydney';
            processedWorkshopData.workshopCode = 'EN01';
            processedWorkshopData.workshopName = 'Elite NSW';
            processedWorkshopData.workshopEmail = 'nsw@elite.com.au'
        // Tests if the selected workshop was Melbourne.
        } else if (chosenWorkshop == 'melbourne') {
            // Loads the appropriate data into the processedWorkshopData variable.
            processedWorkshopData.workshopLocation = 'Melbourne';
            processedWorkshopData.workshopCode = 'EV01';
            processedWorkshopData.workshopName = 'Elite Vic';
            processedWorkshopData.workshopEmail = 'vic@elite.com.au'
        // Tests if the selected workshop was the Gold Coast.
        } else if (chosenWorkshop == 'gold-coast') {
            // Loads the appropriate data into the processedWorkshopData variable.
            processedWorkshopData.workshopLocation = 'Gold Coast';
            processedWorkshopData.workshopCode = 'EQ01';
            processedWorkshopData.workshopName = 'Elite Qld';
            processedWorkshopData.workshopEmail = 'qld@elite.com.au'
        // Tests if there was no workshop that was accessible for the owner.
        } else if (chosenWorkshop == 'other') {
            // Loads the appropriate data into the processedWorkshopData variable.
            processedWorkshopData.workshopLocation = 'Other';
            processedWorkshopData.workshopCode = 'MYRV';
            processedWorkshopData.workshopName = 'Other';
            processedWorkshopData.workshopEmail = 'recalls@my-rv.com.au'
        } else {
            // If none of the expected options were in chosenWorkshop, the workshopFound property is set to false.
            processedWorkshopData.workshopFound = false;
        }
    } else {
        // If no owner registration contact record was found, the workshopFound property is set to false.
        processedWorkshopData.workshopFound = false;
    }
    return processedWorkshopData;
};

module.exports.getEmailDataObject = (vin) => {
    // Returns a promise.
    return new Promise((resolve, reject) => {
        dao.getVehicleByVin(vin).then(rawVehicleData => {
            const vehicleData = JSON.parse(JSON.stringify(rawVehicleData));
            const emailDataObject = {
                ...module.exports.sortVehicleDataForEmail(vehicleData),
                ...module.exports.sortOwnerDataForEmail(vehicleData),
                ...module.exports.sortWorkshopDataForEmail(vehicleData)
            };
            resolve(emailDataObject);
        }).catch(err => reject(err));
    });
}