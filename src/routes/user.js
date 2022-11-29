import { Router } from "express";
import userModel from '../models/user'
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
user.post('/showResult', async (req,res)=>{
    var locationNode = req.body.Location;
    var destinationNode = req.body.Destination;
    const result = await userModel.shortestPath(locationNode , destinationNode)
    res.json(result)
})



export default user