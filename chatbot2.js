const tmi = require("tmi.js");
const functions = require("./features/chatbotModules.js");
const remote = require("electron").remote;
const main = remote.require("./index.js");
const electron = require("electron");
const wheel = require("./features/wheel.js");
const $ = require("jquery");

const tts = require("./features/tts.js");
const sfx = require("./features/sfx.js");
const chatbotLogic = require("./features/chatbotLogic.js");

const client = new tmi.client(chatbotLogic.chatbotOptions);
// update module reference
const chatbot = (function() {
  let $botStatus = $("#bot-status");
  let $statusON = $("#status-on");
  let $statusOFF = $("#status-off");
  $statusON.click(_startBot);
  $statusOFF.click(_stopBot);
  //functions
  function _startBot() {
    client.connect();
    $botStatus.html("online");
    $statusON.addClass("disabled");
    $statusOFF.removeClass("disabled");
  }
  function _stopBot() {
    client.disconnect();
    $botStatus.html("offline");
    $statusOFF.addClass("disabled");
    $statusON.removeClass("disabled");
  }
})();

chatbotLogic.inputLoad();
chatbotLogic.displayIgnored();
chatbotLogic.displayPhrases();
sfx._loadSounds();

client.on("connected", function(address, port) {
  if (chatbotLogic.credentials.newMsg == "") {
    return;
  } else {
    client.say(
      chatbotLogic.credentials.channelName,
      `${chatbotLogic.credentials.newMsg}`
    );
  }
});

client.on("chat", (channel, userstate, message, self) => {
  if (self || chatbotLogic.settings.bots.includes(userstate["username"]))
    return;
  if (
    userstate["msg-id"] !== undefined &&
    userstate["msg-id"] == "highlighted-message"
  ) {
    let msg = message.toString();
    msg = msg.split(",").join(" ");
    if (tts.ttsQueue.length < 1) {
      if (tts.ttsPlaying == false) {
        tts.sayTTS("fi-FI", msg);
      } else {
        tts.addToQueue("fi-FI", msg);
      }
    } else {
      tts.addToQueue("fi-FI", msg);
    }
  }
  let messageArray = message.split(" ");
  let cmd = messageArray[0].toLowerCase();
  let lang;
  if (cmd[0] == "!") {
    lang = cmd.substr(1);
  }
  // if(userstate)
  // console.log(userstate.badges.hasOwnProperty("vip"));
  //sounds fire
  let args = messageArray.slice(1);
  if (chatbotLogic.settings.sounds.includes(cmd)) {
    if (sfx.canFireSfx(userstate)) {
      soundname = cmd.substr(1);
      functions.playSound(soundname, chatbotLogic.settings.audioVolume);
    }
  }

  //no msg-id when normal msg
  //msg-id: "highlighted-message"
  //msg-id: "skip-subs-mode-message"
  // if (cmd == "!dud") {
  //   meme();
  // }
  if (chatbotLogic.settings.ttsLangs[lang] !== undefined) {
    if (tts.canFireTTS(userstate)) {
      if (!chatbotLogic.settings.ignoredtts.includes(userstate["username"])) {
        let msg = args.toString();
        msg = msg.split(",").join(" ");
        if (tts.filterTTS(msg)) {
          if (tts.ttsQueue.length < 1) {
            console.log(tts.ttsQueue.length);
            if (tts.ttsPlaying == false) {
              tts.sayTTS(chatbotLogic.settings.ttsLangs[lang], msg);
              tts.ttsPlaying == true;
            } else {
              tts.addToQueue(chatbotLogic.settings.ttsLangs[lang], msg);
            }
          } else {
            tts.addToQueue(chatbotLogic.settings.ttsLangs[lang], msg);
          }
        } else return;
      } else return;
    }
  }
  switch (cmd) {
    case "!join":
      wheel.joinEvent(userstate["username"]);
      break;
    // case "!debug":
    //   wheel.debugWheel();
    //   break;
    case "!open":
      if (
        userstate["mod"] ||
        userstate["username"] == chatbotLogic.credentials.channelName
      ) {
        wheel.openEvent();
      }
      break;
    case "!close":
      if (
        userstate["mod"] ||
        userstate["username"] == chatbotLogic.credentials.channelName
      ) {
        wheel.closeEvent();
      }
      break;
    case "!langs":
      let languages = Object.keys(chatbotLogic.settings.ttsLangs);
      let langlist = Object.keys(languages).join(", ");
      client.say(chatbotLogic.credentials.channelName, langlist);
      break;
    case "!ignore":
      if (
        userstate["mod"] ||
        userstate["username"] == chatbotLogic.credentials.channelName
      ) {
        if (
          args == chatbotLogic.credentials.channelName ||
          chatbotLogic.settings.ignoredtts.includes(args[0])
        ) {
          functions.logToConsole("error", "already in array / its stremer");
        } else {
          chatbotLogic.settings.ignoredtts.push(args[0]);
          functions.ignoreN(args[0]);
          chatbotLogic.displayIgnored();
        }
      }
      break;
    case "!unignore":
      if (
        userstate["mod"] ||
        userstate["username"] == chatbotLogic.credentials.channelName
      ) {
        if (chatbotLogic.settings.ignoredtts.includes(args[0])) {
          let index = chatbotLogic.settings.ignoredtts.indexOf(args[0]);
          chatbotLogic.settings.ignoredtts.splice(index, 1);
          functions.unignore(args[0]);
          chatbotLogic.displayIgnored();
        }
      }
      break;
    case "!sounds":
      let soundList = " ";
      for (var i = 0; i < chatbotLogic.settings.sounds.length; i++) {
        if (soundList.length > 400) {
          client.say(chatbotLogic.credentials.channelName, soundList);
          soundList = " ";
        } else {
          soundList = soundList + " " + settings.sounds[i];
        }
      }
      client.say(chatbotLogic.credentials.channelName, soundList);
      break;
    case "!addlang":
      if (
        userstate["mod"] ||
        userstate["username"] == chatbotLogic.credentials.channelName
      ) {
        if (ttsLangs[args[0]] == undefined && args.length == 2) {
          ttsLangs[args[0]] = args[1];
          functions.addLang(args[0], args[1]);
        }
      }
      break;
    case "!skiptts":
      if (
        userstate["mod"] ||
        userstate["username"] == chatbotLogic.credentials.channelName
      ) {
        tts.movettsQueue();
      }
      break;
  }
});
