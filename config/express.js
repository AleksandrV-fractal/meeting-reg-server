// Load the module dependencies
const config = require('./config');
const path = require('path');
const http = require('http');
const express = require('express');
const morgan = require('morgan');
const compress = require('compression');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

// Define the Express configuration method
module.exports = function(db) {
	// Create a new Express application instance
	const app = express();
	
	// Create a new HTTP server
    const server = http.createServer(app);
	// Use the 'NDOE_ENV' variable to activate the 'morgan' logger or 'compress' middleware
	if (process.env.NODE_ENV === 'development') {
		app.use(morgan('dev'));
	} else if (process.env.NODE_ENV === 'production') {
		app.use(compress());
	}

	// Use the 'body-parser' and 'method-override' middleware functions
	app.use(bodyParser.urlencoded({
		extended: true
	}));
	app.use(bodyParser.json());
	app.use(methodOverride());

	// Configure the MongoDB session storage
	const mongoStore = new MongoStore({
		mongooseConnection: db.connection
	});
	
	// Load the routing files	
	require('../app/routes/index.server.routes.js')(app);

	// Load the Socket.io configuration
	//configureSocket(server, io, mongoStore);
	
	// Return the Server instance
	return server;
};