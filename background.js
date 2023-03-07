/* global browser */

/*
const manifest = browser.runtime.getManifest();
const extname = manifest.name;
*/

/*
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
*/

async function getFromStorage(type, id, fallback) {
  let tmp = await browser.storage.local.get(id);
  return typeof tmp[id] === type ? tmp[id] : fallback;
}

async function onStorageChange() {
  //console.debug('onStorageChange');

  let tmp = await getFromStorage("object", "selectors", []);

  //console.debug(tmp);

  await browser.menus.removeAll();

  for (const row of tmp) {
    browser.menus.create({
      title: row.name,
      contexts: ["link"],
      onclick: (info) => {
        const fmtStr = row.format;
        let tmp2 = fmtStr;

        const replacers = new Map();

        const url = new URL(info.linkUrl);

        replacers.set("url_proto", url.protocol);
        replacers.set("url_host", url.hostname);
        replacers.set("url_port", url.port);
        replacers.set("url_path", url.pathname);
        replacers.set("url_params", url.search);
        replacers.set("url_origin", url.origin);
        replacers.set("url", url.href);
        replacers.set("text", info.linkText);

        for (const [k, v] of replacers) {
          //console.debug(k,v);
          tmp2 = tmp2.replaceAll("%" + k, v);
        }
        console.debug(tmp2);
        navigator.clipboard.writeText(tmp2);

        /*
				if(typeof info.linkUrl === 'string' && typeof info.linkText === 'string'){
					tmp = new URL(info.linkUrl); 
					tmp = tmp.origin + tmp.pathname;
					navigator.clipboard.writeText(info.linkText + " + " + tmp);
				}
				*/
      },
    });
  }
}

async function setToStorage(id, value) {
  let obj = {};
  obj[id] = value;
  return browser.storage.local.set(obj);
}

browser.storage.onChanged.addListener(onStorageChange);

(async () => {
  await onStorageChange();
})();

async function handleInstalled(details) {
  await setToStorage("selectors", [
    { name: "Text", format: "%text" },
    { name: "URL", format: "%url" },
    { name: "URL - Params", format: "%url_origin%url_params" },
    { name: "Text + URL", format: "%text + %url" },
    { name: "Text + URL - Params", format: "%text + %url_origin%url_params" },
    { name: "Markdown", format: "[%text](%url)" },
    { name: "HTML", format: '<a href="%url">%text</a>' },
  ]);
  if (details.reason === "install") {
    browser.runtime.openOptionsPage();
  }
}

browser.runtime.onInstalled.addListener(handleInstalled);
