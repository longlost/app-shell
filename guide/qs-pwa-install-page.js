
/**
  * `qs-pwa-install-page`
  * 
  *   
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  **/
  

import {AppElement} from '@longlost/app-core/app-element.js';
import template     from './qs-pwa-install-page.html';
import '@longlost/app-core/app-icons.js';
import '@polymer/iron-icon/iron-icon.js';
import '../shared/app-shell-icons.js';
import '../shared/pwa-install-button.js';
import './qs-page-shared-styles.css';
import './animated-aths-icon.js';
import './install-app-model.js';


class QuickStartPWAInstallPage extends AppElement {

  static get is() { return 'qs-pwa-install-page'; }

  static get template() {
    return template;
  }


  static get properties() {
    return {

      narrow: Boolean

    };
  }

}

window.customElements.define(QuickStartPWAInstallPage.is, QuickStartPWAInstallPage);
