
/**
  * `qs-persistence-page`
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
import htmlString         from './qs-persistence-page.html';
import '@longlost/app-core/app-icons.js';
import '@polymer/iron-icon/iron-icon.js';
import '../shared/app-shell-icons.js';
import '../shared/offline-persistence-selector.js';
import './qs-page-shared-styles.css';
import './animated-wifi-icon.js';
import './animated-cellular-icon.js';


class QuickStartPersistencePage extends AppElement {

  static get is() { return 'qs-persistence-page'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      narrow: Boolean,

      persistence: Boolean

    };
  }

}

window.customElements.define(QuickStartPersistencePage.is, QuickStartPersistencePage);
