const fs = require('fs');
const dao = require('../data/dao.js');

const data = [
    {
        id: 100,
        buildNo: 155421,
        vin: 'ZFA25000002775146',
        recallItem: 'Gas Locker cabinet',
        status: 'new',
        'updatedAt:1': '2020-11-21 02:48:48'
    },
    {
        id: 100,
        buildNo: 155421,
        vin: 'ZFA25000002775146',
        recallItem: 'Lower Ventilation',
        status: 'new',
        'updatedAt:1': '2020-11-21 02:48:48'
    },
    {
        id: 100,
        buildNo: 155421,
        vin: 'ZFA25000002775146',
        recallItem: 'Stickers',
        status: 'new',
        'updatedAt:1': '2020-11-21 02:48:48'
    },
    {
        id: 100,
        buildNo: 155421,
        vin: 'ZFA25000002775146',
        recallItem: 'Upper Ventilation',
        status: 'new',
        'updatedAt:1': '2020-11-21 02:48:48'
    },
    {
        id: 200,
        buildNo: 170643,
        vin: 'ZFA25000002E10013',
        recallItem: 'Gas Locker cabinet',
        status: 'new',
        'updatedAt:1': '2020-11-13 20:09:29'
    },
    {
        id: 200,
        buildNo: 170643,
        vin: 'ZFA25000002E10013',
        recallItem: 'Lower Ventilation',
        status: 'new',
        'updatedAt:1': '2020-11-13 20:09:29'
    },
    {
        id: 200,
        buildNo: 170643,
        vin: 'ZFA25000002E10013',
        recallItem: 'Stickers',
        status: 'new',
        'updatedAt:1': '2020-11-13 20:09:29'
    },
    {
        id: 200,
        buildNo: 170643,
        vin: 'ZFA25000002E10013',
        recallItem: 'Upper Ventilation',
        status: 'new',
        'updatedAt:1': '2020-11-13 20:09:29'
    },
    {
        id: 300,
        buildNo: 185612,
        vin: 'ZFA25000002G71421',
        recallItem: 'Gas Locker cabinet',
        status: 'new',
        'updatedAt:1': '2020-11-22 00:49:48'
    },
    {
        id: 300,
        buildNo: 185612,
        vin: 'ZFA25000002G71421',
        recallItem: 'Lower Ventilation',
        status: 'new',
        'updatedAt:1': '2020-11-22 00:49:48'
    }
];

let processedData = [];

for (let i = 0; i < data.length; i++) {
    processedData.push([
        data[i].id,
        data[i].vin,
        data[i].buildNo,
        data[i].recallItem,
        data[i].status,
        data[i]['updatedAt:1']
    ].join(','));
}
processedData = processedData.join('\n');
fs.writeFile('vehicleData.csv', processedData, (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
});