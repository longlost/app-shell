
/**
  *
  * `animated-aths-icon`
  *
  *
  *   An animated add-to-home-screen icon.
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
import template     from './animated-aths-icon.html';


class AnimatedAddToHomeScreenIcon extends AppElement {

  static get is() { return 'animated-aths-icon'; }

  static get template() {
    return template;
  }
  
}

window.customElements.define(AnimatedAddToHomeScreenIcon.is, AnimatedAddToHomeScreenIcon);
