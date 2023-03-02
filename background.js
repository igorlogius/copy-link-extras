/* global browser */

/*
const manifest = browser.runtime.getManifest();
const extname = manifest.name;
*/

browser.menus.create({
	title: 'Text',
	contexts: ["link"],
	onclick: (info) => {
		if(typeof info.linkText === 'string'){
			navigator.clipboard.writeText(info.linkText);
		}
	}
});

browser.menus.create({
	title: 'Text + URL',
	contexts: ["link"],
	onclick: (info) => {
		if(typeof info.linkUrl === 'string' && typeof info.linkText === 'string'){
			navigator.clipboard.writeText(info.linkText + " + " + info.linkUrl);
		}
	}
});

browser.menus.create({
	title: 'URL (without Parameters)',
	contexts: ["link"],
	onclick: (info) => {
		let tmp;
		if(typeof info.linkUrl === 'string'){
			tmp = new URL(info.linkUrl); 
			tmp = tmp.origin + tmp.pathname;
			navigator.clipboard.writeText(tmp);
		}
	}
});


browser.menus.create({
	title: 'Text + URL (without Parameters)',
	contexts: ["link"],
	onclick: (info) => {
		let tmp;
		if(typeof info.linkUrl === 'string' && typeof info.linkText === 'string'){
			tmp = new URL(info.linkUrl); 
			tmp = tmp.origin + tmp.pathname;
			navigator.clipboard.writeText(info.linkText + " + " + tmp);
		}
	}
});

