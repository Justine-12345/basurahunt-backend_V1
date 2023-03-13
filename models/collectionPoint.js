const mongoose = require('mongoose')

const collectionPointSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please select Truck Number/ Landfills name'],
        trim: true
    },
   

    collectors:[{
        collector: {
            type: mongoose.Schema.ObjectId,
            ref: 'user'
        }
    }],

    startTime : {
        type: String,
        required: [true, 'Please enter time'],
        trim: true    
    },

    endTime : {
        type: String,
        required: [true, 'Please enter time'],
        trim: true    
    },

    repeats : [{
        repeat:{
            type: String,
            required: [true, 'Please select your preferred repetition'],
            trim: true    
        },
        date: {
            type: Date
        }
    }],

    barangay : {
        type: String,
        required: [true, 'Please enter the barangay'],
        trim: true    
    },

    district: {
        type: Number,
        required: true,
    },

    type : {
        type: String,
        required: [true, 'Please enter the type'],
        trim: true,
        enum: {
            values: [
                'Biodegradable',
                'Non-Biodegradable',
                'Recyclable',
                'Hazardous Waste',
                'Oil',
                'Tires',
                'Glassware',
                'None'
            ]
        }
    },

    status : {
        type: String,
        trim: true,
        default: 'Upcoming',
        enum: {
            values: [
                'On-going',
                'Finished',
                'Upcoming'
            ]
        }
    },

    collectionPoints:[{
        collectionPoint:{
            type:String,
            required: [true, 'Please input collection points'],
        }
    }],

    collectionPerTruck:[{
        numOfTruck:{
            type: Number,
        },
        type:{
            type: String,
            enum:{
                values:[
                    'Biodegradable',
                    'Non-Biodegradable',
                    'Recyclable',
                    'Hazardous Waste',
                    'Oil',
                    'Tires',
                    'Glassware',
                    'None'
                ]
            }
        },
        date:{
            type: Date,
            default: Date.now
        }
    }],

    roomCode : {
        type: String,
        trim: true    
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('CollectionPoint', collectionPointSchema);