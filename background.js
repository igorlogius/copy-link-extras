/* global browser */

async function getFromStorage(type, id, fallback) {
  let tmp = await browser.storage.local.get(id);
  return typeof tmp[id] === type ? tmp[id] : fallback;
}

async function onStorageChange() {
  let tmp = await getFromStorage("object", "selectors", []);

  await browser.menus.removeAll();

  for (const row of tmp) {
    browser.menus.create({
      title: row.name,
      contexts: ["link", "selection"],
      onclick: async (info) => {
        //-- handle text selection

        let links = [];

        if (info.selectionText) {
          const ret = await browser.tabs.executeScript({
            code: `
          selection = getSelection();
             [...document.links]
          .filter((anchor) => selection.containsNode(anchor, true))
        .map((link) => ({
            text: link.innerText,
            url: link.href,
        }));


          `,
          });

          //console.debug('ret', ret[0]);

          links = ret[0];
        } else {
          //-- handle link selection

          links.push({ text: info.linkText, url: info.linkUrl });
        }

        let tmp3 = "";
        let tmp4 = "";

        for (const link of links) {
          const fmtStr = row.format;
          let tmp2 = fmtStr;

          const replacers = new Map();

          const url = new URL(link.url);

          replacers.set("url_proto", url.protocol);
          replacers.set("url_host", url.hostname);
          replacers.set("url_port", url.port);
          replacers.set("url_path", url.pathname);
          replacers.set("url_params", url.search);
          replacers.set("url_origin", url.origin);
          replacers.set("url", url.href);
          replacers.set("text", link.text);

          for (const [k, v] of replacers) {
            tmp2 = tmp2.replaceAll("%" + k, v);
          }
          tmp3 = tmp3 + tmp2 + "\n";
          tmp4 = tmp4 + tmp2 + "<br/>";

          //console.debug('tmp3', tmp3);
        }

        if (row.name.toLowerCase().includes("html")) {
          let div = document.createElement("div");
          div.style.position = "absolute";
          div.style.bottom = "-9999999"; // move it offscreen
          div.innerHTML = tmp4;
          document.body.append(div);

          div.focus();
          document.getSelection().removeAllRanges();
          var range = document.createRange();
          range.selectNode(div);
          document.getSelection().addRange(range);
          document.execCommand("copy");
          div.remove();
        } else {
          navigator.clipboard.writeText(tmp3);
        }
      },
    });
  }
}

async function setToStorage(id, value) {
  let obj = {};
  obj[id] = value;
  return browser.storage.local.set(obj);
}

async function handleInstalled(details) {
  if (details.reason === "install") {
    await setToStorage("selectors", [
      { name: "Text", format: "%text" },
      { name: "URL", format: "%url" },
      { name: "URL - Params", format: "%url_origin%url_params" },
      { name: "Text + URL", format: "%text + %url" },
      { name: "Text + URL - Params", format: "%text + %url_origin%url_params" },
      { name: "Markdown", format: "[%text](%url)" },
      { name: "HTML", format: '<a href="%url">%text</a>' },
    ]);
    browser.runtime.openOptionsPage();
  }
}

(async () => {
  await onStorageChange();
})();

browser.runtime.onInstalled.addListener(handleInstalled);
browser.storage.onChanged.addListener(onStorageChange);
