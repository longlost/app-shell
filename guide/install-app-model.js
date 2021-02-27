
/**
  * `install-app-model`
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
import htmlString         from './install-app-model.html';


class InstallAppModel extends AppElement {

  static get is() { return 'install-app-model'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // Include faux browser chrome when true.
      chrome: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      }

    };
  }

}

window.customElements.define(InstallAppModel.is, InstallAppModel);
