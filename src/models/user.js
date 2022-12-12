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

//function to return all database nodes
const findAll = async () =>{
    const result = await session.run(`MATCH (n) RETURN n`)
    return {allNodes:result.records.map(i=>i.get('n').properties)}
}

//Omar: write a function to return cost


module.exports = {
    findAll,
    //Omar: write your function name here
}
   