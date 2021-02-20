
/**
  * `dark-mode-app-model`
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
import htmlString         from './dark-mode-app-model.html';
import '@polymer/paper-button/paper-button.js';


class DarkModeAppModel extends AppElement {

  static get is() { return 'dark-mode-app-model'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      disabled: Boolean,

      mode: {
        type: String,
        value: 'light',
        reflectToAttribute: true
      },

      selected: {
        type: Boolean,
        reflectToAttribute: true
      }

    };
  }


  async __btnClicked() {

    try {
      await this.clicked();

      this.fire('dark-mode-app-model-selected', {selected: this.mode});
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }

}

window.customElements.define(DarkModeAppModel.is, DarkModeAppModel);
