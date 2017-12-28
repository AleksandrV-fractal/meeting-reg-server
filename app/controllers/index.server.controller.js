var mongoose = require('mongoose')
// var MeetingParticipant = mongoose.model('RoomParticipant')
// var Meeting = mongoose.model('RoomDetails')

var cachedRooms = {
	/*
	This object is used to cache rooms so that the server does not need to 
	keep calling the db to look up the secret for a particular meeting 
	naturally as it starts empty it will continue to be so but this should speed up life
	quite a bit 
	*/
	// form of "meetingId" : "secret"
}

const getErrorMessage = function (err) {
	if (err.errors) {
		for (const errName in err.errors) {
			if (err.errors[errName].message) return err.errors[errName].message;
		}
	} else {
		return 'Unknown server error';
	}
};

exports.setSecret = function (req, res) {
	/* 
	this function is used to set the secret associated with a room in a mongoose db
	for convenience sake this function can also be used to implicitly create a room 
	****** This function MUST update the secret in the "cache" FIRST *********
	then attempt to write to db, while not prefect this should prevent a db failiure from
	killing the process

	{
		meetingId
		meetingSecret
	}
	*/
	let newSecret = req.body.meetingSecret
	if (newSecret != '') {
		Meeting = mongoose.model('RoomDetails')
		// request exists, now to upsert I think would be best
		// upsert meeting into table 
		Meeting.update(
			{
				//query
				meetingId: req.params.meetingId,
				meetingSecret: req.body.meetingSecret
			}, {
				//doc
				$set: { meetingSecret: req.body.meetingSecret }
			}, {
				//optsÏ
				upsert: true,
				setDefaultsOnInsert: true
			},
			// call back , can use as promise but eh 

			(err) => {
				if (err) {
					res.status(400).send({
						result: 'faliure',
						message: getErrorMessage(err)
					});
				} else {
					cachedRooms[req.params.meetingId] = req.body.meetingSecret
					console.log(cachedRooms)
					res.status(200).send({
						result: 'success'
					});
				}
			}

		);
	} else {
		request.status(400).send({
			'result': 'faliure',
			message: 'secret must be inclued in this request'
		})
	}
}

exports.getSecret = function (req, res, next) {
	/* 
	this function is a caching mutator / access function 

	{
		meetingId
	}
	*/

	console.log('getting Secret')
	if (req.params.meetingId != '') {
		if (cachedRooms[req.params.meetingId]) {
			console.log('meetingData exists')
			//move on
			next()
		} else {
			// load from db
			Meeting = mongoose.model('RoomDetails')
			Meeting.findOne({ meetingId: req.params.meetingId }).exec().then((meetData, err) => {
				console.log("promise returned")
				if (err) {
					console.log(err)
					res.status(400).send({
						result: 'failiure',
						message: getErrorMessage(err)
					})
				} else {
					if (meetData != '') {
						console.log(meetData)
						cachedRooms[meetData.meetingId] = meetData.meetingSecret
						// now that its set, move on
						next()
					} else {
						res.status(400).send({
							result: 'failiure',
							message: 'meeting does not yet have a secret'
						})
					}
				}
			})

		}
	} else {
		res.status(400).send({
			result: 'faliure',
			message: 'meetingId must be included in the request'
		})

	}

}

exports.checkRegistration = function (req, res) {
	/*  
	this function is used to get the registration staus of a participant 

	cellNo
	saId
	meetingId
	*/
	console.log('checking registration')

	if (req.body.cellNo != '') {
		/*
		now check db for the participant.
		Not that cellNo, saId can be used as pk with meetingId
		*/

		Participant = mongoose.model('RoomParticipant')
		console.log('findingPart')
		Participant.findOne({
			$and: [{ meetingId: req.params.meetingId }, { saId: req.body.saId }]
		}).exec().then((partData, err) => {
			if (err != '') {
				if (partData != '') {
					// if found then he is registered 
					res.status(200).send({
						result: 'success',
						message: 'The SA Id number ' + req.body.saId + ' is  registered to the meeting id ' + req.params.meetingId
					})
				} else {
					res.status(400).send({
						result: 'failiure',
						message: 'The SA Id number ' + req.body.saId + ' is not registered to the meeting id ' + req.params.meetingId
					})
				}
			} else {
				res.status(400).send({
					result: 'faliure',
					message: 'meetingId must be included in the request'
				})
			}
		})


	} else {
		res.status(400).send({
			result: 'faliure',
			message: 'SA Id of participant to check must be included'
		})
	}

}

exports.registerParticipant = function (req, res) {
	/* 
	this function is used to register a participant to a room, 
	it will check the provided secrete against that of a the room and respond by either writing the part
	to the room or by rejection

	{
		secret
		meetingId
		saId
		cellNo
	}
	*/

	if ((req.body.cellNo) && (req.body.saId) && (req.body.secret)) {
		// all fields exist 
		let meetSecret = cachedRooms[req.params.meetingId]
		if (meetSecret == req.body.secret) {
			// secrets match

			MeetingParticipant = mongoose.model('RoomParticipant')
			meetingParticipant = new MeetingParticipant()
			// going to set values explicitly  
			meetingParticipant.saId = req.body.saId
			meetingParticipant.cellNo = req.body.cellNo
			meetingParticipant.meetingId = req.params.meetingId

			// now to save the model to db

			meetingParticipant.save((err) => {
				if (!err) {
					res.status(200).send({
						result: 'success',
						message: 'participant: ' + meetingParticipant.saId + ';' + meetingParticipant.cellNo + ';' + meetingParticipant.meetingId
					})
				} else {
					res.status(400).send({
						result: 'error',
						message: getErrorMessage(err)
					})
				}
			})


		} else {
			// they dont match
			res.status(400).send({
				result: 'faliure',
				message: 'the supplied secret does not match that of the provided meeting Id'
			})
		}
	} else {
		// there are fields missing
		res.status(400).send({
			result: 'faliure',
			message: 'cellNo , saId , secret must all be included in the request to be registered'
		})
	}

}

exports.getRegisteredParticipants = function (req, res) {
	/* 
	this function is an admin function to see all participants registered to a particular room

	{
		meetingId
	}
	*/

	let meetId = req.params.meetingId;
	let Meeting = mongoose.model('RoomParticipant');

	Meeting.find({ meetingId: meetId },'-_id -__v').exec().then((returnedData, err) => {
		if (!err) {
			res.status(200).send({
				result: 'success',
				data: returnedData
			})
		} else {
			res.send(400).send({
				result: 'faliure',
				message: getErrorMessage(err)
			})
		}
	});


}
