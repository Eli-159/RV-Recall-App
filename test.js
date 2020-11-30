var dao = require ('./data/dao.js');


/*
dao.newOwner(
    {
        vehicleId: 100,
        name: 'Second Owner',
        email: 'v100.2@example.com',
        phone: '0404 040 404',
        createdBy: 'owner',
        updatedBy: 'owner'

    }
).then( data => {
    console.log(data.toJSON());
}
).catch(err => {
    console.log(err);
})
*/

dao.getVehicleByVin('ZFA25000002775146')
  .then(data => console.log(JSON.stringify(data)));