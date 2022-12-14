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

//Omar: write the request here, call the endpoint "/orderByCost"
user.post('/orderByCost/', async (req,res)=>{
    // const validE =validateError(req).error;
    // if(validE)
    //     return res.send(validE.details[0].message);

    const result = await userModel.orderByCost(req.body.sourceNode,req.body.destinationNode);
    res.send(result);
    
});



// export default user
module.exports = user