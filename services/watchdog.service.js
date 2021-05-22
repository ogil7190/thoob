const { sleep, randomBtwn } = require('../utils');

var IS_ACTIVE = true;

async function hanldeType( element, type ) {
    if( element && type && IS_ACTIVE ) {
        // console.log('*** FOUND IT ***');
        const options = { delay : randomBtwn( 60, 120) };
        switch( type ) {
            case 'SKIPABLE': {
                await element.click(options);
            }
        }
        console.log('*** CONSUMED ***');
    }
}

async function hunt(session) {
    const TARGET = '.ytp-ad-skip-button';
    const elements = await session.$$(TARGET);
    if( elements.length > 0 ) {
       await hanldeType(elements[0], 'SKIPABLE');
    }
}

async function sniff(session) {
    IS_ACTIVE = true;

    while(IS_ACTIVE) {
        await sleep(randomBtwn(5, 7) * 1000);
        // console.log('*** SNIFFING ***');
        IS_ACTIVE && await hunt(session);
    }
}

function coolDown() {
    console.log('*** WE ARE COOL ***');
    IS_ACTIVE = false;
}

module.exports = {
    sniff,
    coolDown
}