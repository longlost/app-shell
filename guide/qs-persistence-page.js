
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


class QuickStartPersistencePage extends AppElement {

  static get is() { return 'qs-persistence-page'; }

  static get template() {
    return html([htmlString]);
  }

}

window.customElements.define(QuickStartPersistencePage.is, QuickStartPersistencePage);
