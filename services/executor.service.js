const puppeteer = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');
const { getLatestWork, getBrowserConfig } = require('./db.service');
const { sleep, randomBtwn, calculateSlotFromString, executeAfter } = require('../utils');
const WatchDog = require('./watchdog.service');

async function initWork( global ) {
    global.browserConfig = await getBrowserConfig();
    global.work = await getLatestWork();
    global.session = await startBrowserSessionWithConfig( global.browserConfig );
    await executeWork(global);
}

async function startBrowserSessionWithConfig( config ){
    puppeteer.use(pluginStealth());
    const browser = await puppeteer.launch({
        ...config,
        executablePath: process.env.CHROME_BIN || null
    });
    return browser.newPage();
}

async function sleepTillPaused(global) {
    console.log('*** WE NEED TO PAUSE ***');
    const CHECK_INTERVAL = 10 * 1000;

    while( global.IS_PAUSED ) {
        await sleep(CHECK_INTERVAL);
    }
}

async function executeWork(global) {
    if( global.work ) {
        for(let i=0; i<global.work.targets.length; i++){
    
            if(global.IS_PAUSED) {
                await sleepTillPaused(global);
            }
    
            await executeIDProcedure(global.work.targets[i], global.work, global);
            console.log(`*** A UNIT WORK DONE [${i}] ***`);
            
            //@todo log into logs.
    
            if( global.work.allowRandom && (i % global.work.randomInterval === 0) ) {
                await executeRandomProcedure(global.work, global);
            }
        }
    
        if( global.work.repeat ) {
            await executeWork( global );
        } else {
            console.log('*** DONE ***');
            global.previousWork = global.work;
            global.work = 'DONE';
        }
    }
}

async function search(value, session) {
    const SEARCH_TARGET = 'input#search';
    const SEARCH_TILE_TARGET = '.ytd-search #dismissible';
    const CORRECTION_TARGET = '.original-link';

    //input the id into search bar
    await input(SEARCH_TARGET, value, session);
    await sleep(randomBtwn(400, 800));
    await session.keyboard.press('Enter');
    await sleep(randomBtwn(5, 10) * 1000);

    // if auto corrected occured
    await click(CORRECTION_TARGET, session);
    await sleep(3000);

    // open the first video
    await click(SEARCH_TILE_TARGET, session);
    await sleep(randomBtwn(5, 10) * 1000);

    //@todo can add scroll to make it more authentic
}

/**
 * trigger Interaction service
 */
async function executeIDProcedure(id, work, global) {
    const APPEND = 'watch?v=';
    const HOME_TARGET = '#logo.ytd-masthead';
    
    await navigate(work.platform, global.session);
    await sleep(randomBtwn(1000, 3000));
    
    if(work.visitBySearch) {
        await search(id, global.session);
    } else {
        const link = `${work.platform}${APPEND}${id}`;
        await navigate(link, global.session);
    }
    
    WatchDog.sniff(global.session);

    const slotTime = calculateSlotFromString(work.sessionSlot);
    await executeAfter(slotTime, async () => {
        WatchDog.coolDown();
        await click(HOME_TARGET, global.session);
        await sleep(randomBtwn(5, 10) * 1000);
    });
}

async function executeRandomProcedure(work, global) {
    const TILE_TARGET = '#content.ytd-rich-item-renderer';
    const HOME_TARGET = '#logo.ytd-masthead';

    await navigate(work.platform, global.session);
    
    const luckyNum = randomBtwn(0, 6);
    await click(TILE_TARGET, global.session, luckyNum);
    await sleep(randomBtwn(5, 10) * 1000);

    const luckDraw = randomBtwn(1,6);
    
    if(luckDraw < 3) {
        WatchDog.sniff(global.session);
    }
    
    const slotTime = calculateSlotFromString(work.randomSlot);
    await executeAfter(slotTime, async () => {
        if(luckDraw < 3) {
            WatchDog.coolDown();
        }
        await click(HOME_TARGET, global.session);
        await sleep(randomBtwn(5, 10) * 1000);
    });
}

/************************************************/
async function navigate(url, session) {
    try {
        // await session.setDefaultNavigationTimeout(10 * 1000 );
        await session.goto( url, {waitUntil: 'load', timeout: 0});
        // await session.waitForNavigation({ waitUntil : 'networkidle2', time });
        console.log('*** True Navigation ***');
    } catch {
        console.log('*** Leap of faith ***');
    }
}

async function click(locateKey, session, index = 0) {
    const options = { delay : randomBtwn( 60, 120) };
    const elements = await session.$$(locateKey);
    if( elements.length > index ) {
        const element = elements[ index ];
        await element.click(options);
    }
}

async function input(locateKey, value, session, index = 0) {
    const options = { delay : randomBtwn( 100, 200) };
    const elements = await session.$$(locateKey);
    if( elements.length > index ) {
        const element = elements[ index ];
        await element.type(value, options);
    }
}
/************************************************/

module.exports = {
    initWork
};