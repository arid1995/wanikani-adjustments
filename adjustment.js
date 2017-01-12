// ==UserScript==
// @name         New ES6-Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  shows how to use babel compiler
// @author       You
// @require      https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/6.18.2/babel.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.16.0/polyfill.js
// @match        https://www.wanikani.com/dashboard
// ==/UserScript==

/* jshint ignore:start */
var inline_src = (<><![CDATA[
/* jshint ignore:end */
/* jshint esnext: false */
/* jshint esversion: 6 */

(function() {
  const BASE_URL = 'https://www.wanikani.com/api/user/4c584e8833a17997674551e4538b7830/';
  const DESIRED_SRS_LEVEL = 4;

  class Tamperer {
    constructor() {
      this.vocabulary = [];

      this.getLevel().then((level) => {
        this.level = level;
        this.buildVocab(`${this.level-1},${this.level}`).then(() => {
          this.visualize();
        });
      });
    }

    getLevel() {
      return new Promise ((resolve, reject) => {
        this.sendRequest('GET', 'user-information').then((userInfo) => {
          const info = JSON.parse(userInfo);
          resolve(info.user_information.level);
        })
        .catch(() => alert('Something has gone south when obtaining level'));
      });
    }

    getOuterContainer() {
      return document.querySelector('.progression');
    }

    buildVocab(level) {
      return new Promise((resolve, reject) => {
        this.sendRequest('GET', `vocabulary/${level}`).then((list) => {
          const vocabList = JSON.parse(list).requested_information;
          vocabList.forEach((value) => {
            if (value.user_specific !== null &&
                  value.user_specific.srs_numeric <= DESIRED_SRS_LEVEL) {
              let word = {};
              word.character = value.character;
              word.kana = value.kana;
              word.meaning = value.meaning;
              this.vocabulary.push(word);
            }
          });
          resolve();
        })
        .catch(() => alert('Something has gone south when obtaining vocab list'));
      });
    }

    sendRequest(method, relativeURL) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, BASE_URL + relativeURL);
        xhr.send();
        xhr.onreadystatechange = function() {
          if (xhr.readyState == 4) {
            if (this.status == 200) {
              resolve(xhr.responseText);
            } else {
              reject();
            }
          }
        };
      });
    }

    visualize() {
        const outerContainer = this.getOuterContainer();
        const innerContainer = document.createElement('section');
        innerContainer.setAttribute('class', 'lattice-multi-character');

        let innerHtmlString = '<ul>';
        this.vocabulary.forEach((word) => {
          innerHtmlString = innerHtmlString.concat(`
          <li>
          <a lang="ja" title="" rel="auto-popover" meaning="${word.meaning}"
          kana="${word.kana}" style="background-color: blue;">${word.character}</a>
          </li>
          `);
          console.log(word);
        innerContainer.innerHTML = innerHtmlString + '</ul>';
        outerContainer.appendChild(innerContainer);
      });
    }
  }

  const tamperer = new Tamperer();
})();
/* jshint ignore:start */
]]></>).toString();
var c = Babel.transform(inline_src, { presets: [ "es2015", "es2016" ] });
eval(c.code);
/* jshint ignore:end */
