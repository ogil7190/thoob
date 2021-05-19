const {MongoClient} = require('mongodb');

const Collections = {
    COLLECTION_WORKS: 'works',
    COLLECTION_LOGS: 'logs',
    COLLECTION_WORKERS: 'workers',
	COLLECTION_MISCELLANEOUS: 'miscellaneous'
};

/**** DO NOT EXPORT ****/
let _DB_INSTANCE_;
/***********************/

const initDB = async ({ connectionUrl, dbName }) => {
	try {
		const client = await MongoClient.connect(connectionUrl, {useNewUrlParser: true, useUnifiedTopology: true});
		_DB_INSTANCE_ = client.db(dbName);
		console.log('--> Connected to DB : ' + dbName);
		return true;
	} catch (error) {
		console.log('--> Error occured while connecting DB ' + error);
		return false;
	}
}

const getLatestWork = async () => {
	const collection = _DB_INSTANCE_.collection(Collections.COLLECTION_WORKS)
	return await collection.findOne({
		isActive: true
	});
}

const heartBeat = async ( workerId ) => {
	const collection = _DB_INSTANCE_.collection(Collections.COLLECTION_WORKERS)
    return await collection.updateOne({ workerId }, { $set : { lastSeen : new Date().getTime() } } );
}

const getWorkerByToken = async ( token ) => {
	const collection = _DB_INSTANCE_.collection(Collections.COLLECTION_WORKERS);
	return await collection.findOne({
		token
	});
}

const getBrowserConfig = async () => {
	const collection = _DB_INSTANCE_.collection(Collections.COLLECTION_MISCELLANEOUS);
	const config = await collection.findOne({
		id: 'browserConfig'
	});
	return config.value;
}

const insertIntoCollection = async (data, collectionName) => {
	const collection = _DB_INSTANCE_.collection(collectionName);
	return await collection.insertOne({ ...data, createdAt: new Date(Date.now()).toISOString() });
}

module.exports = {
	initDB,
    Collections,
	getLatestWork,
    heartBeat,
    getWorkerByToken,
    insertIntoCollection,
	getBrowserConfig
}