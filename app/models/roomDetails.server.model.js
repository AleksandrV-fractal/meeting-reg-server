const mongoose = require('mongoose');
const crypto = require('crypto');
const Schema = mongoose.Schema;

RoomDetailsSchema = new Schema({
    meetingId: {
        type: String,
        required: 'meetingId is required is required',
        unique: true
    },
    meetingSecret: {
        // while not great for now ill refrain from hashing the meeting secret
        type : String,
        default  : 'needs a secret'
    },
    created: {
        type: Date,
        default: Date.now
    }



})
// model the new schema
mongoose.model('RoomDetails', RoomDetailsSchema);