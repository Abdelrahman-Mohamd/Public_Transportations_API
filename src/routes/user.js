const {Router} = require('express');
const userModel = require('../models/user');
const user = Router()


user.get('/', async (req,res)=>{
    const result = await userModel.findAll()
    res.json(result)
})

user.post('/orderByDistance', async (req,res)=>{
    var locationNode = req.body.Location;
    var destinationNode = req.body.Destination;
    const result = await userModel.orderByDistance(locationNode , destinationNode)
    res.json(result)
})


user.post('/orderByCost', async (req,res)=>{
    var locationNode = req.body.Location;
    var destinationNode = req.body.Destination;
    const result = await userModel.orderByCost(locationNode , destinationNode);
    res.send(result);
    
});



// export default user
module.exports = user