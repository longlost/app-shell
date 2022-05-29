
/**
  *
  * `animated-wifi-icon`
  *
  *
  *   An animated wifi on/off icon.
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
import template     from './animated-wifi-icon.html';
import '@polymer/iron-icon/iron-icon.js';
import '../shared/app-shell-icons.js';


class AnimatedWifiIcon extends AppElement {

  static get is() { return 'animated-wifi-icon'; }

  static get template() {
    return template;
  }


  static get properties() {
    return {

      _elements: Array

    };
  }


  connectedCallback() {

    super.connectedCallback();

    this._elements = [
      this.$.offWrapper,
      this.$.offIcon,
      this.$.onWrapper,
      this.$.onIcon
    ];

    this.__enter();
  }


  __enter() {

    this.$.onWrapper.classList.remove('hop');

    this._elements.forEach(el => {
      el.classList.remove('exited');
      el.classList.add('enter');
    });
  }


  __exit() {

    this.$.offWrapper.classList.remove('wiggle');

    this._elements.forEach(el => {
      el.classList.remove('entered');
      el.classList.add('exit');
    });
  }


  __startWiggleAnimation() {

    this._elements.forEach(el => {
      el.classList.remove('enter');
      el.classList.add('entered');
    });

    this.$.offWrapper.classList.add('wiggle');
  }


  __startHopAnimation() {

    this._elements.forEach(el => {
      el.classList.remove('exit');
      el.classList.add('exited');
    });

    this.$.onWrapper.classList.add('hop');
  }
 

  __offWrapperAnimationendHandler(event) {

    const {animationName} = event;

    if (animationName === 'off-wrapper-enter') {
      this.__startWiggleAnimation();
    }
    else if (animationName === 'off-wrapper-exit') {
      this.__startHopAnimation();  
    }
    else if (animationName === 'wiggle') {
      this.__exit();
    }    
  }


  __onWrapperAnimationendHandler(event) {

    if (event.animationName === 'hop') {
      this.__enter();
    }    
  }
  
}

window.customElements.define(AnimatedWifiIcon.is, AnimatedWifiIcon);
