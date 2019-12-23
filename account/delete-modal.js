
import {
  AppElement,
  html
}                 from '@longlost/app-element/app-element.js';
import htmlString from './delete-modal.html';
import '@longlost/app-modal/app-modal.js';
import '@longlost/app-icons/app-icons.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';


class AccountDeleteModal extends AppElement {
  static get is() { return 'delete-modal'; }

  static get template() {
    return html([htmlString]);
  }


  close() {
    return this.$.modal.close();
  }


  open() {
    return this.$.modal.open();
  }


  async __closeThenFireDismiss() {
    try {
      await this.clicked();
      await this.close();
      this.fire('delete-modal-dismiss');
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
      await this.close();
      this.fire('delete-modal-delete');
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }
  
}

window.customElements.define(AccountDeleteModal.is, AccountDeleteModal);
