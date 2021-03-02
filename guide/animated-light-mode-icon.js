
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


import {AppElement, html} from '@longlost/app-core/app-element.js';
import htmlString         from './animated-light-mode-icon.html';


class AnimatedLightModeIcon extends AppElement {

  static get is() { return 'animated-light-mode-icon'; }

  static get template() {
    return html([htmlString]);
  }
  
}

window.customElements.define(AnimatedLightModeIcon.is, AnimatedLightModeIcon);
