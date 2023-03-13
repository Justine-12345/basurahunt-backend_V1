const Dump = require('../models/dump')

const districtStatuses = async (startDate, endDate, district, listOfViolation) => {
    let districtStatusesObj = {
        clusterName:district,
        statuses:{}
    }

    cleanDumps = await Dump.find(
        {
            "createdAt": {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            },
            "status": "Cleaned",
            "district": district,
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
            "district": district,
            "category_violation": { $in: listOfViolation }
        }

    ).countDocuments()
    
    districtStatusesObj.statuses = {cleanDumps, unCleanDumps}
        
    return districtStatusesObj

}

module.exports = districtStatuses