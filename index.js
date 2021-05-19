
const fs = require('fs');
const path = require('path');
const express = require('express');
const { DB_CONFIG } = require('./constants');
const {
	Collections,
	initDB,
	getWorkerByToken,
	insertIntoCollection
} = require('./services/db.service');
const { randomID } = require('./utils');
const { zygote } = require('./services/heartbeat.service');
const { router } = require('./routes');

var _global_ = {};
const directory = 'temp';
const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(router);
app.listen(PORT);
app.use('/ss', express.static(__dirname + `/${directory}`));

function cleanDir( directory ) {
    fs.readdir(directory, (err, files) => {
        if (err) throw err;
      
        for (const file of files) {
          fs.unlink(path.join(directory, file), err => {
            if (err) throw err;
          });
        }
    });
}

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
	try {
		if( fs.existsSync(directory) ){
			cleanDir( directory );
		}
		else {
			fs.mkdirSync(directory);
		}
	} catch {}
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