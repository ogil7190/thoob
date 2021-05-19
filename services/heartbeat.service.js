const { heartBeat, getLatestWork } = require('./db.service');
const { initWork } = require('./executor.service');

const HEART_BEAT_INTERVAL = 60 * 1000;
const WORK_FINDER_INTERVAL = 1;

async function workFinder( global ) {
    const work = await getLatestWork();
    if( work.compulsory && work.compulsory.stop ) {
        if( work.compulsory.code === 'YELLOW' ) {
            console.log('*** CODE YELLOW ENCOUNTERED ***');
            console.log('*** PUASED ***');
            global.IS_PAUSED = true;
        }

        if( work.compulsory.code === 'RED' ) {
            console.log('*** CODE RED ENCOUNTERED ***');
            console.log('*** EXITING ***');
            process.exit();
        }
    } else {
        global.IS_PAUSED = false;
        const alreadyExecuted = JSON.stringify(global.previousWork) === JSON.stringify(work);

        if(alreadyExecuted) {
            console.log('*** NOTHING NEW ***');
        } else if(global.work === null || global.work === undefined || global.work === 'DONE' ) {
            global.work = work;
            console.log('*** FOUND WORK ***');
            console.log('*** WORKING ***');
            initWork(global);
        } else {
            global.work = work;
        }
    }
}

async function zygote( global ) {
    var count = 0;
    const { worker } = global;
    await workFinder( global );
    
    setInterval( async () => {
        console.log( '*** HeartBeat ***' );
        count += 1;
        
        if( count === WORK_FINDER_INTERVAL ) {
            count = 0;
            await workFinder( global );
        }

        await heartBeat( worker.workerId );
    }, HEART_BEAT_INTERVAL );
}

module.exports = {
    zygote
}