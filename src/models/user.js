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
const findAll = async () => {
    const result = await session.run(`MATCH (n) RETURN n`)
    return { allNodes: result.records.map(i => i.get('n').properties) }
}

//a function to order all available paths by distance given 2 points
const orderByDistance = async (locationNode, destinationNode) => {
    const result = await session.run(`MATCH (n1:LOCATION {name:$locationParam}),
                                            (n2:LOCATION {name:$destinationParam}),
                                            p =(n1)-[:LINE*]->(n2)
                                            With count(*) as numberOfAvailablePaths
                                      MATCH (n1:LOCATION {name:$locationParam}),
                                            (n2:LOCATION {name:$destinationParam}),
                                            path =(n1)-[:LINE*]->(n2)
                                      return path,
                                             numberOfAvailablePaths,
                                             reduce(s=0, i in relationships(path) | s+i.cost ) as totalCost,
                                             reduce(s=0, i in relationships(path) | s+i.distance ) as totalDistance,
                                             size(nodes(path)) as numberOfStops
                                      order By  totalDistance,totalCost` ,
        { locationParam: locationNode, destinationParam: destinationNode })

    // numberOfAvailablePaths: how many paths are there between the given 2 points
    let numberOfAvailablePaths = result.records.length;
    // allPaths[]: an array to store the stops of all paths combined together in order but with no subarrays 
    let allPaths = []
    //routes[]: an array to represent each path in the allPaths[] as a subarray
    let routes = []
    //numberOfStops[]: an array to store number of stops for each path 
    let numberOfStops = [];

    // to get number of stops for each route, and store them in numberOfStops[]
    for (let i = 0; i < numberOfAvailablePaths; i++) {
        numberOfStops.push(result.records[i]._fields[4].low)
    }

    //for every available path, loop through each stop and store the given data inside allPaths[]
    for (let i = 0; i < numberOfAvailablePaths; i++) {
        let totalCost = 0;
        let totalDistance = 0;
        for (let j = 0; j < numberOfStops[i] - 1; j++) {
            allPaths.push({
                name: result.records[i]._fields[0].segments[j].start.properties.name,
                latitude: result.records[i]._fields[0].segments[j].start.properties.latitude,
                longitude: result.records[i]._fields[0].segments[j].start.properties.longtude,
                transportationType: result.records[i]._fields[0].segments[j].relationship.properties.type,
                lineNumber: result.records[i]._fields[0].segments[j].relationship.properties.name,
                distance: result.records[i]._fields[0].segments[j].relationship.properties.distance,
                cost: result.records[i]._fields[0].segments[j].relationship.properties.cost.low,
            });
            //for every available path, calculate the sum of distance & cost
            totalCost += result.records[i]._fields[0].segments[j].relationship.properties.cost.low;
            totalDistance += result.records[i]._fields[0].segments[j].relationship.properties.distance;
        }
        /* to store endNode in allPaths[]
           NOTE: endNode contains the properties of: toalCost , totalDistance of the whole path */
        allPaths.push({
            name: result.records[numberOfAvailablePaths - 1]._fields[0].segments[3].end.properties.name,
            latitude: result.records[numberOfAvailablePaths - 1]._fields[0].segments[3].end.properties.latitude,
            longitude: result.records[numberOfAvailablePaths - 1]._fields[0].segments[3].end.properties.longtude,
            totalCost: totalCost,
            totalDistance: totalDistance
        });

    }
    // to slice the allPaths[] array into subarrays, each representing a path
    let j = 0
    // loop through allPaths array, and slice(currentPosition , pathFinalStop) into subarray
    for (let i = 0; i < allPaths.length; i = i + (numberOfStops[j - 1])) {
        let k = numberOfStops[j]
        routes.push(allPaths.slice(i, i + k));
        k = k + (numberOfStops[j])
        j++
    }
    return routes
}

//a function to order all available paths by cost given 2 points
const orderByCost = async (locationNode, destinationNode) => {

    let result = await session.run(
        `MATCH (n1:LOCATION {name: '${locationNode}'} ),
            (n2:LOCATION {name: '${destinationNode}'}),
            p =(n1)-[:LINE*]->(n2)
            With count(*) as numberOfAvailablePaths
            MATCH (n1:LOCATION {name: '${locationNode}'} ),
            (n2:LOCATION {name: '${destinationNode}'}),
            path =(n1)-[:LINE*]->(n2)
            return path,
            numberOfAvailablePaths,
            reduce(s=0, i in relationships(path) | s+i.cost ) as totalCost,
            reduce(s=0, i in relationships(path) | s+i.distance ) as totalDistance,
            size(nodes(path)) as numberOfStops
            order By totalCost,totalDistance`)

    // paths[]: an array to store the stops of all paths combined together in order but with no subarrays     
    let paths = [];

    //path[]: an array to represent each path in the allPaths[] as a subarray    
    let path = [];
    // explained in inkodo
    let records = result.records;
    let recordNo, segmentNo;
    let recordsLength = `${records.length}`;

    for (recordNo = 0; recordNo < recordsLength; recordNo++) {
        // explained in inkodo
        let segments = result.records[recordNo]._fields[0].segments;
        let segmentsLength = `${segments.length}`;
        let totalCost = 0; let totalDistance = 0;
        for (segmentNo = 0; segmentNo < segmentsLength; segmentNo++) {
            path.push({
                name: segments[segmentNo].start.properties.name,
                latitude: segments[segmentNo].start.properties.latitude,
                longitude: segments[segmentNo].start.properties.longtude,
                cost: segments[segmentNo].relationship.properties.cost.low,
                distance: segments[segmentNo].relationship.properties.distance,
                transportationType: segments[segmentNo].relationship.properties.type,
                lineNumber: segments[segmentNo].relationship.properties.name
            });
            totalCost += segments[segmentNo].relationship.properties.cost.low;
            totalDistance += segments[segmentNo].relationship.properties.distance;
            if (segmentNo == segmentsLength - 1) {
                path.push({
                    name: segments[segmentNo].end.properties.name,
                    latitude: segments[segmentNo].end.properties.latitude,
                    longitude: segments[segmentNo].end.properties.longtude,
                    totalCost: totalCost,
                    totalDistance: totalDistance
                });
            }
        }
        paths.push(path);
        path = [];
    }
    return paths;
}

module.exports = {
    findAll,
    orderByCost,
    orderByDistance
}

