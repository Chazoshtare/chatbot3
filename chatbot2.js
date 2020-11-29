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

let client = new tmi.client(chatbotLogic.chatbotOptions);
// update module reference
const chatbot = (function () {
  let $botStatus = $("#bot-status");
  let $statusON = $("#status-on");
  let $statusOFF = $("#status-off");
  $statusON.click(_startBot);
  $statusOFF.click(_stopBot);
  $statusOFF.prop("disabled", true);

  //functions
  function _startBot() {
    client.connect();
    $botStatus.html("online");
    $statusON.prop("disabled", true);
    setTimeout(() => {
      $statusOFF.prop("disabled", false);
    }, 2000);
  }

  function _stopBot() {
    client.disconnect();
    $botStatus.html("offline");
    $statusOFF.prop("disabled", true);
    setTimeout(() => {
      $statusON.prop("disabled", false);
    }, 2000);
  }
})();

chatbotLogic.inputLoad();
chatbotLogic.displayIgnored();
chatbotLogic.displayPhrases();
sfx._loadSounds();

client.on("connected", function (address, port) {
  console.log(chatbotLogic.chatbotOptions);

  if (chatbotLogic.chatbotOptions.newMsg !== "") {
    client.say(
      chatbotLogic.chatbotOptions.channels[0],
      `${chatbotLogic.chatbotOptions.newMsg}`
    );
  }
});

client.on("chat", (channel, userstate, message, self) => {
  const username = userstate["username"]
  const messageId = userstate["msg-id"]
  const isMod = userstate["mod"]

  if (self
    || chatbotLogic.settings.bots.includes(username)
    || chatbotLogic.settings.ignoredPpl.includes(username.toLowerCase()))
    return;

  if (messageId === "highlighted-message") {
    if (tts.ttsQueue.length < 1 && tts.ttsPlaying === false) {
      tts.sayTTS("fi-FI", message);
    } else {
      tts.addToQueue("fi-FI", message);
    }
    return;
  }

  if (!message.startsWith("!")) {
    return;
  }

  const messageArray = message.split(/ (.+)/)

  const command = messageArray[0].substr(1)
  const content = messageArray[1] && messageArray[1].substr(1) || ""

  // if(userstate)
  // console.log(userstate.badges.hasOwnProperty("vip"));
  //sounds fire
  if (chatbotLogic.settings.sounds.includes(command)) {
    if (sfx.canFireSfx(userstate)) {
      functions.playSound(command, chatbotLogic.settings.audioVolume);
    }
  }

  //no msg-id when normal msg
  //msg-id: "highlighted-message"
  //msg-id: "skip-subs-mode-message"

  if (chatbotLogic.settings.ttsLangs.hasOwnProperty(command)) {
    if (tts.canFireTTS(userstate)) {
      const lang = chatbotLogic.settings.ttsLangs[command]

      if (tts.filterTTS(content)) {
        if (tts.ttsQueue.length < 1) {
          console.log(tts.ttsQueue.length);
          if (tts.ttsPlaying == false) {
            tts.sayTTS(lang, content);
            tts.ttsPlaying == true;
          } else {
            tts.addToQueue(lang, content);
          }
        } else {
          tts.addToQueue(lang, content);
        }
      } else return;
    }
  }

  switch (command) {
    case "join":
      wheel.joinEvent(username);
      break;

    case "debug":
      wheel.debugWheel();
      break;

    case "open":
      if (isMod || username === chatbotLogic.credentials.channelName) {
        wheel.openEvent();
      }
      break;

    case "close":
      if (isMod || username === chatbotLogic.credentials.channelName) {
        wheel.closeEvent();
      }
      break;

    case "langs":
      let languages = Object.keys(chatbotLogic.settings.ttsLangs);
      let langlist = languages.join(", ");
      client.say(chatbotLogic.credentials.channelName, langlist);
      break;

    case "ignore":
      const ignoreGuy = content.toLowerCase();
      console.log(ignoreGuy);

      if (isMod || username === chatbotLogic.credentials.channelName) {
        if (chatbotLogic.settings.ignoredPpl.includes(ignoreGuy)) {
          functions.logToConsole("error", "already in array / its stremer");
        } else {
          chatbotLogic.settings.ignoredPpl.push(ignoreGuy);
          functions.ignoreN(ignoreGuy);
          chatbotLogic.displayIgnored();
        }
      }
      break;

    case "unignore":
      const unignoreGuy = content.toLowerCase();
      if (isMod || username === chatbotLogic.credentials.channelName) {
        if (chatbotLogic.settings.ignoredPpl.includes(unignoreGuy)) {
          let index = chatbotLogic.settings.ignoredPpl.indexOf(unignoreGuy);
          chatbotLogic.settings.ignoredPpl.splice(index, 1);
          functions.unignore(unignoreGuy);
          chatbotLogic.displayIgnored();
        }
      }
      break;

    case "sounds":
      let soundList = "";
      for (let i = 0; i < chatbotLogic.settings.sounds.length; i++) {
        if (soundList.length < 350) {
          soundList = soundList + " !" + chatbotLogic.settings.sounds[i];
        } else {
          client.say(chatbotLogic.credentials.channelName, soundList);
          soundList = "";
        }
      }
      client.say(chatbotLogic.credentials.channelName, soundList);
      break;

    // case "addlang":
    //   if (isMod || username === chatbotLogic.credentials.channelName) {
    //     let args = messageArray.slice(1);
    //     if (
    //       chatbotLogic.settings.ttsLangs[args[0]] == undefined &&
    //       args.length == 2
    //     ) {
    //       console.log("adding lang");
    //       chatbotLogic.settings.ttsLangs[args[0]] = args[1];
    //       functions.addLang(args[0], args[1]);
    //     }
    //   }
    //   break;

    case "skiptts":
      if (isMod || username === chatbotLogic.credentials.channelName) {
        tts.movettsQueue();
      }
      break;
  }
});
