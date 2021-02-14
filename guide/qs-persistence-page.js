
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
  

import {webpackConfig}    from 'config.js';
import {AppElement, html} from '@longlost/app-core/app-element.js';
import htmlString         from './qs-persistence-page.html';
import '@longlost/app-core/app-icons.js';
import '@polymer/iron-icon/iron-icon.js';
import '../app-shell-icons.js';


class QuickStartPersistencePage extends AppElement {

  static get is() { return 'qs-persistence-page'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      _appName: String

    };
  }


  connectedCallback() {

    super.connectedCallback();

    this._appName = webpackConfig.name;
  }

}

window.customElements.define(QuickStartPersistencePage.is, QuickStartPersistencePage);
