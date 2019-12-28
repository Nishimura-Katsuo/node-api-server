'use strict'; /* global module */

module.exports.request = function * () { // Cooperative multi-tasking via generator function!
	let loops = 0;

	for (let c = 0; c < 1000; c++) {
		for (let d = 0; d < 1000; d++) {
			loops++;
		}

		yield; // Yield back to the event loop for a moment.
	}

	return 'I did ' + loops + ' loops!';
};

