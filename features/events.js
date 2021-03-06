const tts = require("./tts.js");
const sfx = require("./sfx.js");
const chatbotLogic = require("./chatbotLogic.js");
const chatbotModules = require("./chatbotModules.js");
const fs = require("fs");
const $ = require("jquery");
let init = (function() {
  let btns = document.getElementsByClassName("btn-link");
  Array.from(btns).forEach(item => {
    item.addEventListener("click", e => {
      let sectionName = e.target.name;
      sectionName = sectionName.substr(4);
      document.getElementsByClassName("active")[0].classList.remove("active");
      document.getElementById(`${sectionName}-section`).classList.add("active");
    });
  });
})();

let $reloadSnd = $("#reloadSounds");
let $updateSoundVolume = $("#updateSoundVol");
let $updateTTSVolume = $("#updateTTSVol");
let $addPhraseBtn = $("#addPhrase");
let $addGuyBtn = $("#addGuy");
let $updateBtn = $("#updateAll");

$updateBtn.click(chatbotLogic._updateData);
$reloadSnd.click(sfx._loadSounds);
$updateSoundVolume.click(sfx.updateSoundVolume);
$updateTTSVolume.click(tts.updateTTSVolume);
$("#audio1").on("ended", tts.movettsQueue);
$addPhraseBtn.click(chatbotLogic.addPhrase);
$addGuyBtn.click(chatbotLogic.addGuy);
