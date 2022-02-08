
/**
  * 
  *  `account-remove-address-modal`
  *
  *
  *  Confirmation modal for removing a user's address.
  *
  *
  *  @customElement
  *  @polymer
  *  @demo demo/index.html
  *
  *
  **/

import {AppElement, html} from '@longlost/app-core/app-element.js';
import htmlString         from './account-remove-address-modal.html';
import '@longlost/app-core/app-icons.js';
import '@longlost/app-core/app-shared-styles.js';
import '@longlost/app-overlays/app-modal.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';


class AccountRemoveAddressModal extends AppElement {

  static get is() { return 'account-remove-address-modal'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // Cached value that is passed back on confirmation.
      _model: Object

    };
  }


  __close() {
    return this.$.modal.close();
  }


  async __closeThenFireDismiss() {

    try {
      await this.clicked();
      await this.__close();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  __reauthModalClicked() {

    this.__closeThenFireDismiss();
  }


  __dismissButtonClicked() {

    this.__closeThenFireDismiss();
  }


  async __deleteButtonClicked() {

    try {
      await this.clicked();
      await this.__close();

      this.fire('remove-address-modal-remove', {model: this._model});
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  open(model) {

    this._model = model;

    return this.$.modal.open();
  }
  
}

window.customElements.define(AccountRemoveAddressModal.is, AccountRemoveAddressModal);
