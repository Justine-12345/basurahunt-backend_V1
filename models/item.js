const mongoose = require('mongoose')

const itemSchema = new mongoose.Schema({
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
    received_images: [
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

    receiver_name : {
        type: String,
        trim: true    
    },

    barangay_hall: {
        type: String,
        trim: true
    },
    
    district: {
        type: Number,
    },

    item_type:[{
        type:{
            type:String,
            required: [true, 'Please select type of item'],
        }
    }],

    item_desc:{
        type:String,
        default:''
    },

    name : {
        type: String,
        required: [true, 'Please enter the item name'],
        trim: true    
    },

    addional_desciption : {
        type: String,
        trim: true    
    },

    donate_using : {
        type: String,
        required: [true, 'Please select your preferred identity in report using'],
        trim: true,
        enum: {
            values: [
                'Real name',
                'Alias',
                'Anonymous'
            ]
        }  
    },

    user_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'user'
    },

    receiver_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'user'
    },

    status : {
        type: String,
        trim: true,
        default:'Unclaimed',
        enum: {
            values: [
                'Received',
                'Unclaimed',
                'Claimed',
                'Confirmed'
            ]
        }
    },

    date_recieved: {
        type: Date,
    },

    date_claimed: {
        type: Date,
    },

    code : {
        type: String
    },
    
    score: {
        type: Number,
        default:0
    },

    receiver_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'user',
        default: null
    },

    chat_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'Chat'
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Item', itemSchema);