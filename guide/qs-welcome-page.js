
/**
  * `qs-welcome-page`
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
import htmlString         from './qs-welcome-page.html';
import logo               from 'images/manifest/icon.png';
import '@longlost/app-core/app-shared-styles.js';
import '@longlost/app-images/responsive-image.js';


class QuickStartWelcomePage extends AppElement {

  static get is() { return 'qs-welcome-page'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      user: Object,

      _logo: Object

    };
  }


  connectedCallback() {

    super.connectedCallback();

    this._logo = logo;
  }

}

window.customElements.define(QuickStartWelcomePage.is, QuickStartWelcomePage);
