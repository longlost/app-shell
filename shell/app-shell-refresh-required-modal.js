
/**
  * `app-shell-refresh-required-modal`
  *
  *   Common app settings ui.
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  **/


import {AppElement} from '@longlost/app-core/app-element.js';
import template     from './app-shell-refresh-required-modal.html';
import '@longlost/app-core/app-shared-styles.css';
import '@longlost/app-overlays/app-modal.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';
import '../shared/app-shell-icons.js';


class RefreshRequiredModal extends AppElement {

  static get is() { return 'app-shell-refresh-required-modal'; }

  static get template() {
    return template;
  }


  async __dismissButtonClicked() {

    try {
      await this.clicked();

      this.$.overlay.close();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __refreshButtonClicked() {

    try {
      await this.clicked();
      
      window.location.reload();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  open() {

    return this.$.overlay.open();
  }

}

window.customElements.define(RefreshRequiredModal.is, RefreshRequiredModal);
