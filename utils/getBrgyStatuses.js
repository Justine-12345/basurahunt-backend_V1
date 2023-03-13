const Dump = require('../models/dump')
const barangayStatuses = async (startDate, endDate, barangay, listOfViolation) => {
    let barangayStatusesObj = {
        clusterName:barangay,
        statuses:{}
    }
    cleanDumps = await Dump.find(
        {
            "createdAt": {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            },
            "status": "Cleaned",
            "barangay": barangay,
            "category_violation": { $in: listOfViolation }
        }

    ).countDocuments()

    unCleanDumps = await Dump.find(
        {
            "createdAt": {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            },
            "status":{$in:["Confirmed","Unfinish"]},
            "barangay": barangay,
            "category_violation": { $in: listOfViolation }
        }

    ).countDocuments()
    
    barangayStatusesObj.statuses = {cleanDumps, unCleanDumps}
        
    return barangayStatusesObj

}

module.exports = barangayStatuses