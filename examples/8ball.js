'use strict';
/* global module */

let yes = [
	'Hang on, I need a minute.',
	'Hell yeah, bruh!',
	'My opinion is yes.',
	'I\'m feeling positive about it.',
	'Seems legit...',
	'No doubt, mang.',
	'Let\'s go with yeah on that one.',
	'Affirmative!',
	'Chea boi!',
	'Sure, why not?',
	'Does a bear poop in the woods?',
	'Yes, but don\'t hug me. I have anxiety.',
	'Yeah... now back to my anime... Justice Crash!',
	'Praise the sun! I mean yeah.',
];

let no = [
	'Wait, I wasn\'t ready. What was the question?',
	'Don\'t count on it.',
	'My reply is no.',
	'My sources say no.',
	'The outlook\'s not good.',
	'It\'s doubtful.',
	'That\'s not likely.',
	'I don\'t think you want to know.',
	'If it told you, would you promise not to cry?',
	'You may not like the answer.',
	'Might as well quit while you\'re ahead :(',
];

module.exports.request = function () {
	let prefix = 'The Magic 8-Ball says: ';

	if (Math.random() < 0.5) {
		return prefix + yes[Math.floor(yes.length * Math.random())];
	} else {
		return prefix + no[Math.floor(no.length * Math.random())];
	}
};
