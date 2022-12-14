const {Router} = require('express');
const userModel = require('../models/user');
const user = Router()
const neo4j = require('neo4j-driver');
require('dotenv').config()
const {
    url,
    db_username,
    db_password,
    database,
} = process.env
const driver = neo4j.driver(url, neo4j.auth.basic(db_username, db_password));
const session = driver.session({ database });

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



// export default user
module.exports = user