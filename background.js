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
          tmp2 = tmp2.replaceAll("%" + k, v);
        }

        if (row.name.toLowerCase().includes("html")) {
          let div = document.createElement("div");
          div.style.position = "absolute";
          div.style.bottom = "-9999999"; // move it offscreen
          div.innerHTML = tmp2;
          document.body.append(div);

          div.focus();
          document.getSelection().removeAllRanges();
          var range = document.createRange();
          range.selectNode(div);
          document.getSelection().addRange(range);
          document.execCommand("copy");
          div.remove();
        } else {
          navigator.clipboard.writeText(tmp2);
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
