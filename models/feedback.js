const mongoose = require('mongoose')

const feedbackSchema = new mongoose.Schema({
    subject: {
        type: String,
        trim: true
    },
    
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

    feedback: {
        type: String,
        trim: true
    },

    user_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'user'
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Feedback', feedbackSchema);