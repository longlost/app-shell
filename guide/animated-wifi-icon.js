
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


import {AppElement, html} from '@longlost/app-core/app-element.js';
import htmlString         from './animated-wifi-icon.html';
import '@polymer/iron-icon/iron-icon.js';
import '../shared/app-shell-icons.js';


class AnimatedWifiIcon extends AppElement {

  static get is() { return 'animated-wifi-icon'; }

  static get template() {
    return html([htmlString]);
  }
  
}

window.customElements.define(AnimatedWifiIcon.is, AnimatedWifiIcon);
