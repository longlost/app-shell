
/**
  *
  * `animated-cellular-icon`
  *
  *
  *   An animated cellular signal icon.
  *
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  *
  **/


import {AppElement} from '@longlost/app-core/app-element.js';
import {wait}       from '@longlost/app-core/utils.js';
import template     from './animated-cellular-icon.html';


class AnimatedCellularIcon extends AppElement {

  static get is() { return 'animated-cellular-icon'; }

  static get template() {
    return template;
  }


  static get properties() {
    return {

      _backgrounds: Array

    };
  }


  connectedCallback() {

    super.connectedCallback();

    this._backgrounds = [
      this.$.notchWrapper,
      this.$.notch,
      this.$.fullWrapper,
      this.$.full
    ];

    this.__enter();
  }


  __enter() {

    this.$.bar.classList.remove('bar-exit');
    this.$.point.classList.remove('point-exit');

    this._backgrounds.forEach(el => {
      el.classList.remove('exited');
      el.classList.add('enter');
    });

    this.$.bar.classList.add('bar-enter');
    this.$.point.classList.add('point-enter');
  }


  __startSignalAndExclamationAnimations() {

    this._backgrounds.forEach(el => {
      el.classList.remove('enter');
      el.classList.add('entered');
    });

    this.$.signal.classList.add('signal-flaky');
    this.$.exclamation.classList.add('exclamation-wiggle');
  }


  async __replay() {

    this._backgrounds.forEach(el => {
      el.classList.remove('exit');
      el.classList.add('exited');
    });

    await wait(1000);

    this.__enter();
  }
 

  __notchAnimationendHandler() {

    if (this.$.notch.classList.contains('enter')) {
      this.__startSignalAndExclamationAnimations();      
    }
    else {
      this.__replay();      
    }
  }


  __exit() {

    this.$.signal.classList.remove('signal-flaky');
    this.$.exclamation.classList.remove('exclamation-wiggle');    
    this.$.bar.classList.remove('bar-enter');
    this.$.point.classList.remove('point-enter');

    this._backgrounds.forEach(el => {
      el.classList.remove('entered');
      el.classList.add('exit');
    });

    this.$.bar.classList.add('bar-exit');
    this.$.point.classList.add('point-exit');
  }


  __signalAnimationendHandler(event) {

    if (event.animationName === 'signal-flaky') {
      this.__exit();
    }
  }
  
}

window.customElements.define(AnimatedCellularIcon.is, AnimatedCellularIcon);
