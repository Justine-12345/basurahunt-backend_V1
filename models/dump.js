const mongoose = require('mongoose')

const dumpSchema = new mongoose.Schema({
    images: [
        {
            public_id: {
                type: String,
                required: true,
            },
            url: {
                type: String,
                required: true,
            },
        }    
    ],
    accomplished_images: [
        {
            public_id: {
                type: String
            },
            url: {
                type: String
            },
        }    
    ],
    coordinates:{

            latitude: {
                type: Number,
                required: true,
            },
            longtitude: {
                type: Number,
                required: true,
            },
        }
    ,

    complete_address: {
        type: String,
        required: [true, 'Please enter complete address'],
        trim: true,
        maxLength: [100, 'Complete address cannot exceed 255 characters']
    },

   barangay: {
        type: String,
        required: [true, 'Please enter Barangay'],
        trim: true,
        maxLength: [100, 'Complete address cannot exceed 255 characters']
    },

    purok: {
        type: String
    },


    district: {
        type: Number,
        required: true,
    },

    approxDayToClean: {
        type: String
    },

    landmark: {
        type: String,
        trim: true,
        maxLength: [100, 'Landmark cannot exceed 255 characters']
    },

    waste_type:[{
        type:{
            type:String,
            required: [true, 'Please select type of waste'],
        }
    }],

    waste_desc:{
        type:String,
        default:''
    },


    waste_size : {
        type: String,
        // required: [true, 'Please enter size of waste'],
        trim: true    
    },

    accessible_by : {
        type: String,
        // required: [true, 'Please enter accessible by'],
        trim: true    
    },

    category_violation : {
        type: String,
        // required: [true, 'Please enter category of violation'],
        trim: true    
    },

    additional_desciption : {
        type: String,
        trim: true,
        default:'',    
    },

    report_using : {
        type: String,
        required: [true, 'Please select your preferred identity in report using'],
        trim: true    
    },

    user_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'user'
    },

    status : {
        type: String,
        trim: true,
        default:'newReport',
        enum: {
            values: [
                'newReport',
                'Confirmed',
                'Unfinish',
                'Cleaned',
                'Rejected'
            ]
        }  
    },

    score: {
        type: Number,
        default:0
    },

    date_cleaned: {
        type: Date,
    },

    comments: [
        {   
            user: {
                type: mongoose.Schema.ObjectId,
                ref: 'user'
            },
            author: {
                type: String,
                required: true,
            },
            comment: {
                type: String,
                required: true,
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ],

    chat_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'Chat'
    },

    collectors:[{
        collector: {
            type: mongoose.Schema.ObjectId,
            ref: 'user'
        }
    }],

    barangayAssigned:{
        type: String,
        trim: true    
    },


    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Dump', dumpSchema);