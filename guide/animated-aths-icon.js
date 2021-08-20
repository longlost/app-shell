
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


import {AppElement, html} from '@longlost/app-core/app-element.js';
import htmlString         from './animated-aths-icon.html';


class AnimatedAddToHomeScreenIcon extends AppElement {

  static get is() { return 'animated-aths-icon'; }

  static get template() {
    return html([htmlString]);
  }
  
}

window.customElements.define(AnimatedAddToHomeScreenIcon.is, AnimatedAddToHomeScreenIcon);
