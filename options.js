/* global browser */

function onChange(evt) {
  let id = evt.target.id;
  let el = document.getElementById(id);

  let value = el.type === "checkbox" ? el.checked : el.value;
  let obj = {};

  //console.log(id,value, el.type,el.min);
  /*
  if (value === "") {
    return;
  }
*/
  if (el.type === "number") {
    try {
      value = parseInt(value);
      if (isNaN(value)) {
        value = el.min;
      }
      if (value < el.min) {
        value = el.min;
      }
    } catch (e) {
      value = el.min;
    }
  }

  obj[id] = value;

  //console.debug(id, value);
  browser.storage.local.set(obj).catch(console.error);
}

[
  /* add individual settings here */
  "seperator",
].map((id) => {
  browser.storage.local
    .get(id)
    .then((obj) => {
      let el = document.getElementById(id);
      let val = obj[id];

      if (typeof val !== "undefined") {
        if (el.type === "checkbox") {
          el.checked = val;
        } else {
          el.value = val;
        }
      } else {
        el.value = "";
      }
    })
    .catch(console.error);

  let el = document.getElementById(id);
  el.addEventListener("input", onChange);
});

function deleteRow(rowTr) {
  let mainTableBody = document.getElementById("mainTableBody");
  mainTableBody.removeChild(rowTr);
}

function createTableRow(feed) {
  let mainTableBody = document.getElementById("mainTableBody");
  let tr = mainTableBody.insertRow();
  tr.style = "vertical-align:top;";

  Object.keys(feed)
    .sort()
    .reverse()
    .forEach((key) => {
      let input;
      if (key === "name" /*|| key === 'default'*/) {
        input = document.createElement("input");
        input.className = key;
        input.placeholder = key;
        input.style.width = "99%";
        input.type = "text";
        input.value = feed[key];
        tr.insertCell().appendChild(input);
      } else if (key === "format" /*|| key === 'default'*/) {
        input = document.createElement("input");
        input.className = key;
        input.placeholder = key;
        input.style.width = "99%";
        input.type = "text";
        input.value = feed[key];
        tr.insertCell().appendChild(input);
      }
    });

  let button;
  if (feed.action === "add") {
    button = createButton("Add", "addButton", function () {}, true);
  } else {
    button = createButton(
      "Delete",
      "deleteButton",
      function () {
        deleteRow(tr);
      },
      false
    );
  }
  tr.insertCell().appendChild(button);
}

function collectConfig() {
  // collect configuration from DOM
  let mainTableBody = document.getElementById("mainTableBody");
  let feeds = [];
  for (let row = 0; row < mainTableBody.rows.length; row++) {
    try {
      let name = mainTableBody.rows[row].querySelector(".name").value.trim();
      let format = mainTableBody.rows[row]
        .querySelector(".format")
        .value.trim();
      if (name !== "" && format !== "") {
        //console.debug(name, format);
        feeds.push({
          name,
          format,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }
  return feeds;
}

function createButton(text, id, callback, submit) {
  let span = document.createElement("span");
  let button = document.createElement("button");
  button.id = id;
  button.textContent = text;
  button.className = "browser-style";
  button.style.width = "99%";
  if (submit) {
    button.type = "submit";
  } else {
    button.type = "button";
  }
  button.name = id;
  button.value = id;
  button.addEventListener("click", callback);
  span.appendChild(button);
  return span;
}

async function saveOptions() {
  let config = collectConfig();
  //config = sanatizeConfig(config);
  await browser.storage.local.set({ selectors: config });
}

async function restoreOptions() {
  createTableRow({
    name: "",
    format: "",
    action: "add",
  });
  let res = await browser.storage.local.get("selectors");
  if (!Array.isArray(res.selectors)) {
    return;
  }
  res.selectors.forEach((selector) => {
    //console.debug(selector);
    selector.action = "delete";
    createTableRow(selector);
  });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);

const impbtnWrp = document.getElementById("impbtn_wrapper");
const impbtn = document.getElementById("impbtn");
const expbtn = document.getElementById("expbtn");

expbtn.addEventListener("click", async function () {
  let dl = document.createElement("a");
  let res = await browser.storage.local.get("selectors");
  let content = JSON.stringify(res.selectors, null, 4);
  dl.setAttribute(
    "href",
    "data:application/json;charset=utf-8," + encodeURIComponent(content)
  );
  dl.setAttribute("download", "data.json");
  dl.setAttribute("visibility", "hidden");
  dl.setAttribute("display", "none");
  document.body.appendChild(dl);
  dl.click();
  document.body.removeChild(dl);
});

// delegate to real Import Button which is a file selector
impbtnWrp.addEventListener("click", function () {
  impbtn.click();
});

impbtn.addEventListener("input", function () {
  let file = this.files[0];
  let reader = new FileReader();
  reader.onload = async function () {
    try {
      let config = JSON.parse(reader.result);

      //config = sanatizeConfig(config);

      await browser.storage.local.set({ selectors: config });
      document.querySelector("form").submit();
    } catch (e) {
      console.error("error loading file: " + e);
    }
  };
  reader.readAsText(file);
});
