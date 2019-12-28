'use strict'; /* global module sleep */

module.exports.request = async function () { // Cooperative multi-tasking via promises function!
	let before = Date.now();
	// Sleeping yields back to the event loop so other APIs can still run!
	await sleep(500 + 500 * Math.random());
	let after = Date.now();

	this.headers['content-type'] = 'application/json';

	return JSON.stringify({
		duration: after - before,
		unit: 'ms',
		msg: 'I slept for ' + (after - before) + 'ms!',
	});
};

