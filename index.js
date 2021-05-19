const { DB_CONFIG } = require('./constants');
const {
	Collections,
	initDB,
	getWorkerByToken,
	insertIntoCollection
} = require('./services/db.service');
const { randomID } = require('./utils');
const { zygote } = require('./services/heartbeat.service');

var _global_ = {};

async function initSelf() {
	const token = process.env.TOKEN;
	
	if( !token ) {
		console.log('*** NO TOKEN FOUND ***');
		process.exit();
	}

	let worker = await getWorkerByToken( token );
	if( !worker ) {
		worker = {
			workerId: randomID(),
			token
		};
		await insertIntoCollection(worker, Collections.COLLECTION_WORKERS);
	}
	_global_.worker = worker;
	zygote(_global_);
}

(async () => {
	const isConnected = await initDB({
		connectionUrl: DB_CONFIG.DB_CONNECTION_URL,
		dbName: DB_CONFIG.DB_NAME
	});

	if( isConnected ) {
		await initSelf();
	} else {
		console.log('*** DB CONNECTION FAILED ***');
	}
})();