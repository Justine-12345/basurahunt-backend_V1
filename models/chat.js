const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema({
    room: {
        type: String,
        trim: true
    },

    chats: [
        {
            room: {
                type: String,
                required: true,
            },
            author: {
                type: mongoose.Schema.ObjectId,
                ref: 'user'
            },
            message: {
                type: String,
                
            },
            time: {
                type: String,
                required: true
            }

        }
    ],

    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Chat', chatSchema);