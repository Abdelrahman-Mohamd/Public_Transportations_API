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

const findAll = async () =>{
    const result = await session.run(`MATCH (n) RETURN n`)
    return {allNodes:result.records.map(i=>i.get('n').properties)}
}
const shortestPath = async (locationNode , destinationNode) =>{
    const result = await session.run(`MATCH (n:bus {name:$locationParam} ),
                                            (n2:bus {name:$destinationParam}),
                                            p = allshortestPaths((n)-[*]->(n2))
                                            RETURN p` ,
                                            {locationParam : locationNode, destinationParam : destinationNode})
    let length = result.records[0]._fields[0].length;
    let endPoint = result.records[0]._fields[0].segments[length-1].end.properties.name;
    let recordsLength = result.records.length;
    let routes = [];
    let endNode= result.records[0]._fields[0].segments[length-1].end.properties.name;
    let allPaths = [];
    for(let i = 0 ; i < recordsLength ; i++){
        for(let j=0 ; j<length ; j++){
            allPaths.push({
                name: result.records[i]._fields[0].segments[j].start.properties.name,
                lineNumber: result.records[i]._fields[0].segments[j].relationship.properties.lineNumber,
            });
        }
    }
    let k = length;
    for(let i =0 ; i<allPaths.length ; i=i+length){
            
                routes.push(allPaths.slice(i,k));
                k = k + length;
            
        }
        let routeNumber = 1;    
    return {endNode:endNode , routes:routes , recordsLength:recordsLength , length:length}
}

export default {
    findAll,
    shortestPath
}
   