const fs = require("fs");
const commandsFile = require("../data/commands.json");
const config = require("../data/config.json");
const chatbotModules = require("./chatbotModules.js");
const $ = require("jquery");
const path = require("path");
const chatbotOptions = {
  options: {
    debug: true,
  },
  connection: {
    cluster: "aws",
    reconnect: true,
  },
  identity: {
    username: config.credentials.botUsername,
    password: config.credentials.botOauth,
  },
  channels: [config.credentials.channelName],
  newMsg: config.credentials.newMsg,
};
let credentials = {
  botUsername: config.credentials.botUsername,
  channelName: config.credentials.channelName,
  botOauth: config.credentials.botOauth,
  newMsg: config.credentials.newMsg,
};

let settings = {
  audioVolume: config.volumes.audioVolume,
  ttsVolume: config.volumes.ttsVolume,
  ignoredPpl: commandsFile.ignoredPpl,
  commands: commandsFile.botCommands,
  bannedPhrases: commandsFile.bannedPhrases,
  bots: ["moobot", "nightbot"],
  sounds: [],
  ttsLangs: commandsFile.ttsLangs,
};
let $phraseList = $("#phraseList");
let $ignoredList = $("#ignoredList");
let folderPath = path.join(__dirname, "../");
module.exports = {
  //variables
  chatbotOptions,
  credentials,
  settings,
  //functions
  inputLoad() {
    for (let key in credentials) {
      $(`#${key}`).val(credentials[key]);
    }
  },
  _updateData() {
    let newData = {
      botUsername: $("#botUsername").val(),
      channelName: $("#channelName").val(),
      botOauth: $("#botOauth").val(),
      newMsg: $("#newMsg").val(),
    };

    if (botUsername == "" || channelName == "" || botOauth == "") {
      chatbotModules.logToConsole("error", "You need to fill all data");
    } else {
      console.log(module.exports.chatbotOptions);
      module.exports.chatbotOptions.identity.username = newData.botUsername;
      module.exports.chatbotOptions.identity.password = newData.botOauth;
      module.exports.chatbotOptions.channels[0] = newData.channelName;
      module.exports.chatbotOptions.newMsg = newData.newMsg;
      fs.readFile(folderPath + "./data/config.json", function (err, data) {
        if (err) {
          console.log(err);
        }
        let obj = JSON.parse(data);
        for (let prop in obj.credentials) {
          obj["credentials"][prop] = newData[prop];
        }
        let json = JSON.stringify(obj, null, 2);
        fs.writeFile(folderPath + "./data/config.json", json, added);
        function added(err) {
          if (err) chatbotModules.logToConsole("error", err);
          chatbotModules.logToConsole("info", "Data updated");
        }
      });
    }
  },
  remFromFile(listType, index) {
    fs.readFile(folderPath + "./data/commands.json", (err, data) => {
      if (err) console.log(err);
      let obj = JSON.parse(data);
      let w = obj[listType][index];
      obj[listType].splice(index, 1);
      let json = JSON.stringify(obj, null, 2);
      fs.writeFile(folderPath + "./data/commands.json", json, added);
      function added(err) {
        if (err) console.log(err);
        chatbotModules.logToConsole("info", "removed: " + w);
      }
    });
  },
  bindDeletePhrases() {
    let ppl = document.getElementsByClassName("del1");
    Array.from(ppl).forEach((item) => {
      item.addEventListener("click", (e) => {
        let $remove = $(e.target).closest("li");
        let phraseToRemove = $("#phraseList").find("li").index($remove);
        $remove.remove();
        settings.bannedPhrases.splice(phraseToRemove, 1);
        module.exports.remFromFile("bannedPhrases", phraseToRemove);
      });
    });
  },
  displayPhrases() {
    let phrasesData = "";
    for (let key in settings.bannedPhrases) {
      phrasesData += `<li> - ${settings.bannedPhrases[key]} <i class="del1">X</i> </li>`;
    }
    $phraseList.html(phrasesData);
    module.exports.bindDeletePhrases();
  },
  addPhrase(e) {
    let phrase = $(e.target).prev("input").val();
    $(e.target).prev("input").val("");
    if (!settings.bannedPhrases.includes(phrase)) {
      settings.bannedPhrases.push(phrase);
      fs.readFile(folderPath + "./data/commands.json", (err, data) => {
        if (err) chatbotModules.logToConsole("error", err);
        let obj = JSON.parse(data);
        obj["bannedPhrases"].push(phrase);
        let json = JSON.stringify(obj, null, 2);
        fs.writeFile(folderPath + "./data/commands.json", json, added);
        function added(err) {
          if (err) chatbotModules.logToConsole("error", err);
          chatbotModules.logToConsole("info", "Added phrase");
        }
      });
      module.exports.displayPhrases();
    } else return;
  },
  bindDeleteGuy() {
    let ppl = document.getElementsByClassName("del");
    Array.from(ppl).forEach((item) => {
      item.addEventListener("click", (e) => {
        let $remove = $(e.target).closest("li");
        let guyToRemove = $("#ignoredList").find("li").index($remove);
        $remove.remove();
        settings.ignoredPpl.splice(guyToRemove, 1);
        module.exports.remFromFile("ignoredPpl", guyToRemove);
      });
    });
  },
  displayIgnored() {
    let ignoredData = "";
    for (let key in settings.ignoredPpl) {
      ignoredData += `<li> - ${settings.ignoredPpl[key]} <i class="del">X</i> </li>`;
    }
    $ignoredList.html(ignoredData);
    module.exports.bindDeleteGuy();
  },
  addGuy(e) {
    let guy = $(e.target).prev("input").val();
    guy = guy.toLowerCase();
    $(e.target).prev("input").val("");
    if (!settings.ignoredPpl.includes(guy)) {
      settings.ignoredPpl.push(guy);
      fs.readFile(folderPath + "./data/commands.json", (err, data) => {
        if (err) chatbotModules.logToConsole("error", err);
        let obj = JSON.parse(data);
        obj["ignoredPpl"].push(guy);
        let json = JSON.stringify(obj, null, 2);
        fs.writeFile(folderPath + "./data/commands.json", json, added);

        function added(err) {
          if (err) chatbotModules.logToConsole("error", err);
          chatbotModules.logToConsole("info", "Guy added: " + guy);
        }
      });
      module.exports.displayIgnored();
    } else return;
  },
};
