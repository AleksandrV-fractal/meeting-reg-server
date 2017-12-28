// Load the 'index' controller
const index = require('../controllers/index.server.controller');

// Define the routes module' method
module.exports = function(app) {
	// Mount the 'index' controller's 'render' method
	app.route('/participants/:meetingId')
		.post(index.getSecret,index.registerParticipant)
		.put(index.getSecret,index.checkRegistration)
		.get(index.getRegisteredParticipants)

	app.route('/meeting/:meetingId')
		.post(index.setSecret)

	//app.param('meetingId')
};