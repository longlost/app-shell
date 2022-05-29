
/**
  * 
  *  `account-delete-modal`
  *
  *
  *  Confirmation modal for deleting a user's account.
  *
  *
  *  @customElement
  *  @polymer
  *  @demo demo/index.html
  *
  *
  **/

import {AppElement} from '@longlost/app-core/app-element.js';
import template     from './account-delete-modal.html';
import '@longlost/app-core/app-icons.js';
import '@longlost/app-core/app-shared-styles.css';
import '@longlost/app-overlays/app-modal.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';


class AccountDeleteModal extends AppElement {

  static get is() { return 'account-delete-modal'; }

  static get template() {
    return template;
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


  close() {

    return this.$.modal.close();
  }


  open() {

    return this.$.modal.open();
  }
  
}

window.customElements.define(AccountDeleteModal.is, AccountDeleteModal);
