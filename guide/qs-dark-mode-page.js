
/**
  * `qs-dark-mode-page`
  * 
  *   
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  **/
  

import {AppElement, html} from '@longlost/app-core/app-element.js';
import htmlString         from './qs-dark-mode-page.html';
import '@longlost/app-core/app-icons.js';
import '@polymer/iron-icon/iron-icon.js';
import '../shared/app-shell-icons.js';
import '../shared/dark-mode-selector.js';
import './qs-page-shared-styles.css';
import './animated-light-mode-icon.js';


class QuickStartDarkModePage extends AppElement {

  static get is() { return 'qs-dark-mode-page'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      autoColorMode: Boolean,

      darkMode: Boolean,

      hideAutoColorMode: Boolean,

      narrow: Boolean

    };
  }

}

window.customElements.define(QuickStartDarkModePage.is, QuickStartDarkModePage);
