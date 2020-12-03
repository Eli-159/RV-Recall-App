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
  .then(data => {
      let owner = data.owners[0];
      owner.name = "2nd v100 Owner";
      owner.updatedBy = "dao.update";
      dao.updateOwner(owner.dataValues)
      .then(count => {
          console.log(`Count of update: ${count}`);
      })
    })


/*
dao.updateOwner({id: 5, name: '2nd Owner', updatedBy: 'EQ01'})
  .then(rowCount => console.log(rowCount))
*/
