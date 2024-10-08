/* global browser */

async function getFromStorage(type, id, fallback) {
  let tmp = await browser.storage.local.get(id);
  return typeof tmp[id] === type ? tmp[id] : fallback;
}
const nl = "\n";

async function onStorageChange() {
  let tmp = await getFromStorage("object", "selectors", []);
  let seperator = await getFromStorage("string", "seperator", "");

  //console.debug('seperator', "'" + seperator +"'");

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

          tmp3 = tmp3 + tmp2 + (seperator === "" ? "\n" : seperator);
          tmp4 = tmp4 + tmp2 + (seperator === "" ? "<br/>" : seperator);

          //console.debug('tmp3', tmp3);
        }

        tmp3 = tmp3.replaceAll("%nl", nl);
        tmp4 = tmp4.replaceAll("%nl", "<br/>");

        if (row.html === true) {
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
      { html: false, name: "Text", format: "%text" },
      { html: false, name: "URL", format: "%url" },
      { html: false, name: "URL - Params", format: "%url_origin%url_params" },
      { html: false, name: "Text + URL", format: "%text + %url" },
      {
        html: false,
        name: "Text + URL - Params",
        format: "%text + %url_origin%url_params",
      },
      { html: false, name: "Markdown", format: "[%text](%url)" },
      { html: true, name: "HTML", format: '<a href="%url">%text</a>' },
    ]);
    browser.runtime.openOptionsPage();
  }
}

(async () => {
  await onStorageChange();
})();

browser.runtime.onInstalled.addListener(handleInstalled);
browser.storage.onChanged.addListener(onStorageChange);

async function onCommand(cmd) {
  const anr = parseInt(cmd.split("_")[1]);

  let tmp = await getFromStorage("object", "selectors", []);
  let seperator = await getFromStorage("string", "seperator", "");

  const row = tmp[anr];

  //-- handle text selection

  const ret = await browser.tabs.executeScript({
    code: `(() => {
        const docLinks = [...document.links];
        let links = [];
            links  = docLinks
            .filter((anchor) => anchor.matches(':hover'));
        if(links.length === 0){
            links  = docLinks
            .filter((anchor) => getSelection().containsNode(anchor, true));
        }
        links = links.map((link) => ({
            text: link.innerText,
            url: link.href,
        }));
        return links;
    })();
          `,
  });

  let links = ret[0];

  //console.debug(links);

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

    tmp3 = tmp3 + tmp2 + (seperator === "" ? "\n" : seperator);
    tmp4 = tmp4 + tmp2 + (seperator === "" ? "<br/>" : seperator);

    //console.debug('tmp3', tmp3);
  }

  tmp3 = tmp3.replaceAll("%nl", nl);
  tmp4 = tmp4.replaceAll("%nl", "<br/>");

  if (row.html === true) {
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
}

browser.commands.onCommand.addListener(onCommand);
