
/**
  *
  * `animated-light-mode-icon`
  *
  *
  *   An light mode icon.
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
import template     from './animated-light-mode-icon.html';


class AnimatedLightModeIcon extends AppElement {

  static get is() { return 'animated-light-mode-icon'; }

  static get template() {
    return template;
  }
  
}

window.customElements.define(AnimatedLightModeIcon.is, AnimatedLightModeIcon);
