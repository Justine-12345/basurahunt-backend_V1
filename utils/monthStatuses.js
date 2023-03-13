const Dump = require('../models/dump')
const monthStatuses = async () => {
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
            "barangay": barangay
        }

    ).countDocuments()

    unCleanDumps = await Dump.find(
        {
            "createdAt": {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            },
            "status":{$in:["Confirmed","Unfinish"]},
            "barangay": barangay
        }

    ).countDocuments()
    
    barangayStatusesObj.statuses = {cleanDumps, unCleanDumps}
        
    return barangayStatusesObj

}

module.exports = barangayStatuses