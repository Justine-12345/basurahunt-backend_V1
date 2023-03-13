const mongoose = require('mongoose')

const newsfeedSchema = new mongoose.Schema({
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

    title: {
        type: String,
        required: [true, 'Please select your title'],
        trim: true
    },

    content: {
        type: String,
        required: [true, 'Please select your content'],
        trim: true
    },

    user_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'user'
    },

    tags:[{
        tag:{
            type:String,
            required: [true, 'Please input tags'],
        }
    }],

    updatedAt: {
        type: Date,
        default: null
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Newsfeed', newsfeedSchema);