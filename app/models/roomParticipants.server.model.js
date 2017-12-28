const mongoose = require('mongoose');
const Schema = mongoose.Schema;

RoomParticipantsSchema = new Schema({
    // doing it this way because you will always have the room list available before participant list
    // as such it is meaningless to join them
    saId : {
        type: String,
    },
    cellNo: {
           type : String 
       },
    meetingId : {
            type : String
            // this is a reference to the meeting however it would be annoying to automate it
       }

    
})

mongoose.model('RoomParticipant',RoomParticipantsSchema);