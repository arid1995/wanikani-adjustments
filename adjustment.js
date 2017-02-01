// ==UserScript==
// @name         Vocabulary for dashboard
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds vocabulary to the wanikani dashboard
// @author       Eekone
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
  const DESIRED_SRS_LEVEL = 3;

  class WordElement {
    constructor(word) {
      this.word = word;
      this.el = document.createElement('a');
      this.el.setAttribute('lang', 'ja');
      this.el.setAttribute('rel', 'auto-popover');

      if (!Number.isInteger(this.word.character)) {
        this.el.setAttribute('href', `/vocabulary/${this.word.character}`);
      }

      let parent = document.createElement('div');
      parent.setAttribute('style', `
        background-color: rgba(148, 0, 255, 0.4);
        border-radius: 5px;
        border-width: ${this.word.highlight}px;
        border-color: red;
        border-style: solid;
        height: 28px;
        z-index: 2;
      `);
      this.upperBar = document.createElement('div');
      this.lowerBar = document.createElement('div');

      parent.appendChild(this.el);
      parent.appendChild(this.upperBar);
      parent.appendChild(this.lowerBar);

      this.determineProgressBarLength();

      this.setProgress(this.progressBarLength);

      let radius = `${(this.progressBarLength.top === 0) ? 5 : 0}px
      ${(this.progressBarLength.top === 100) ? 0 : 5}px
      ${(this.progressBarLength.bottom === 100) ? 0 : 5}px
      ${(this.progressBarLength.bottom > 0) ? 0 : 5}px`;

      this.el.setAttribute('style', `
        position: relative;
        float: left;
        margin: 3px;
        background-color: ${this.word.color};
        border-radius: ${radius};
        font-size: 1.2em;
        padding: 1px;
        z-index: 2;
        box-shadow: 0 0 0 0;
        -webkit-box-shadow: 0 0 0 0;
      `);

      this.el.innerHTML = word.character;
      this.wrapper = document.createElement('li');
      this.wrapper.setAttribute('style', 'height: auto;');
      this.wrapper.appendChild(parent);

      if (Number.isInteger(this.word.character)) return;
      this.el.addEventListener('mouseover', this.showPopUp.bind(this));
      this.el.addEventListener('mouseleave', this.hidePopUp.bind(this));
    }

    determineProgressBarLength() {
      this.progressBarLength = {top: 0, bottom: 0};
      switch (this.word.srsLevel) {
        case 4:
          this.progressBarLength.top = 0;
          this.progressBarLength.bottom = 0;
          break;
        case 3:
          this.progressBarLength.top = 50;
          this.progressBarLength.bottom = 0;
          break;
        case 2:
          this.progressBarLength.top = 50;
          this.progressBarLength.bottom = 50;
          break;
        case 1:
          this.progressBarLength.top = 50;
          this.progressBarLength.bottom = 100;
          break;
        default:
          this.progressBarLength.top = 100;
          this.progressBarLength.bottom = 100;
      }
    }

    setProgress(barLength = {top: 0, bottom: 0}) {
      let upperTopLeftRadius = (barLength.top === 50) ? 0 : 5;
      let bottomBottomRightRadius = (barLength.bottom === 50) ? 0 : 5;

      this.upperBar.setAttribute('style', `
        background-color: ${this.word.color};
        border-radius: 5px ${upperTopLeftRadius}px 0px 0px;
        top: 0px;
        width: ${barLength.top}%;
        height: 50%;
        z-index: 1;
      `);

      this.lowerBar.setAttribute('style', `
        background-color: ${this.word.color};
        border-radius: 0px 0px ${bottomBottomRightRadius}px 5px;
        top: 50%;
        width: ${barLength.bottom}%;
        height: 50%;
        z-index: 1;
      `);
    }

    getCoordinates() {
      let coords = { left: 0, top: 0 };
      coords.left += this.el.offsetLeft;
      coords.top += this.el.offsetTop;
      return coords;
    }

    showPopUp() {
      const coords = this.getCoordinates();
      const bBox = this.el.getBoundingClientRect();
      const width = bBox.right - bBox.left;
      const height = bBox.bottom - bBox.top;
      popOverWindow.setCoordinatesAndShow(coords.left, coords.top - height, width);
      popOverWindow.setWord(this.word);
    }

    hidePopUp() {
      popOverWindow.hide();
    }

    attachTo(element) {
      element.appendChild(this.wrapper);
    }
  }

  class PopOverWindow {
    constructor(container) {
      this.el = document.createElement('div');
      this.style = '';
      this.container = container;
      this.buildHTML();
    }

    buildHTML() {
      this.el.setAttribute('class', 'popover lattice right in');
      this.popoverInner = document.createElement('div');
      this.popoverInner.setAttribute('class', 'popover-inner');

      let arrow = document.createElement('div');
      arrow.setAttribute('class', 'arrow');
      this.popoverInner.appendChild(arrow);

      this.popoverTitle = document.createElement('h3');
      this.popoverTitle.setAttribute('class', 'popover-title');

      this.popoverMeaning = document.createElement('span');
      this.popoverTitle.appendChild(this.popoverMeaning);

      this.popoverKana = document.createElement('span');
      this.popoverKana.setAttribute('lang', 'ja');
      this.popoverTitle.appendChild(this.popoverKana);

      this.popoverInner.appendChild(this.popoverTitle);

      this.popoverProgress = document.createElement('div');
      this.popoverProgress.setAttribute('class', 'bar');
      this.popoverProgress.setAttribute('style', 'width: 80%;');
      this.popoverProgress.innerHTML = 'useless info';

      let contentContainer = document.createElement('div');
      contentContainer.setAttribute('class', 'popover-content');

      let progressContainer = document.createElement('div');
      progressContainer.setAttribute('class', 'progress');
      progressContainer.appendChild(this.popoverProgress);
      contentContainer.appendChild(progressContainer);

      this.el.appendChild(this.popoverInner);
      this.el.appendChild(contentContainer);
    }

    show() {
      this.container.appendChild(this.el);
    }

    hide() {
      this.container.removeChild(this.el);
    }

    setCoordinatesAndShow(left, top, elementWidth) {
      this.container.appendChild(this.el);
      this.width = this.el.getBoundingClientRect().right - this.el.getBoundingClientRect().left;

      if (left + this.width > window.innerWidth * 0.95) {
        this.left = left - this.width;
        this.el.setAttribute('class', 'popover lattice left in');
      } else {
        this.left = left + elementWidth
        this.el.setAttribute('class', 'popover lattice right in');
      }

      this.el.setAttribute('style', `
        top: ${top}px;
        left: ${this.left}px;
        display: block;
      `);
    }

    setWord(word) {
      this.popoverMeaning.innerHTML = word.meaning + '<br>';
      this.popoverKana.innerHTML = word.kana + '<br>';
      this.popoverKana.innerHTML += word.nextReview;
    }
  }

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
          let previousWord = null;
          vocabList.sort((left, right) => {return left.level > right.level;});

          vocabList.forEach((value) => {
            if (value.user_specific !== null &&
                  value.user_specific.srs_numeric <= DESIRED_SRS_LEVEL) {
              let word = {};
              word.character = value.character;
              word.kana = value.kana;
              word.meaning = value.meaning.charAt(0).toUpperCase() + value.meaning.split(', ')[0].slice(1);
              word.level = value.level;
              word.srsLevel = value.user_specific.srs_numeric;
              word.color = '#9400ff';
              word.highlight = (word.srsLevel > 1) ? 0 : 1;
              let date = new Date(value.user_specific.available_date * 1000);
              let months = ['Января','Февраля','Марта','Апреля','Мая',
                            'Июня','Июля','Августа','Сентября','Октября',
                            'Ноября','Декабря']
              word.nextReview = `
                ${date.getDay()}-го
                ${months[date.getMonth()]}
                в ${(date.getHours() < 10 ? '0' : '') + date.getHours()}:${(date.getMinutes() < 10 ? '0' : '') + date.getMinutes()}
              `

              if (previousWord === null || previousWord.level !== word.level) {
                let marker = {};
                marker.character = word.level;
                marker.color = 'blue';
                marker.highlight = 0;
                this.vocabulary.push(marker);
              }

              this.vocabulary.push(word);
              previousWord = word;
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
        outerContainer.appendChild(document.createElement('hr'));

        const innerContainer = document.createElement('section');

        const title = document.createElement('h3');
        title.innerHTML = `Level ${this.level} Vocabulary Progression`;
        innerContainer.appendChild(title);

        innerContainer.setAttribute('class', 'lattice-multi-character');

        let list = document.createElement('ul');
        list.setAttribute('style', `
          display: flex;
          justify-content: space-around;
          flex-flow: row wrap;
        `);


        this.vocabulary.forEach((word) => {
          let wordElement = new WordElement(word);
          wordElement.attachTo(list);
      });
      innerContainer.appendChild(list);
      outerContainer.appendChild(innerContainer);
    }
  }

  let begin = (new Date()).getTime();
  const popOverWindow = new PopOverWindow(document.getElementsByTagName('body')[0]);
  const tamperer = new Tamperer();
  for(let i = 0; i < 2000000000; i++);
  alert('Скрипт закончил работу за ' + ((new Date()).getTime() - begin) + ' миллисекунд, так что отсоси');
})();
/* jshint ignore:start */
]]></>).toString();
var c = Babel.transform(inline_src, { presets: [ "es2015", "es2016" ] });
eval(c.code);
/* jshint ignore:end */
