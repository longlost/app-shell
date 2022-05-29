
/**
  * 
  *  `account-password-modal`
  *
  *
  *  Confirmation modal for changing a user's account password.
  *
  *
  *  @customElement
  *  @polymer
  *  @demo demo/index.html
  *
  *
  **/

import {AppElement} from '@longlost/app-core/app-element.js';
import template     from './account-password-modal.html';
import '@longlost/app-core/app-shared-styles.css';
import '@longlost/app-overlays/app-modal.js';
import '@longlost/icon-to-spinner/icon-to-spinner.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-button/paper-button.js';
import '../shared/app-shell-icons.js';


class AccountPasswordModal extends AppElement {

  static get is() { return 'account-password-modal'; }

  static get template() {
    return template;
  }


  static get properties() {
    return {

      _password: {
        type: String,
        value: ''
      }

    };
  }


  __computeColor(invalid, focused) {

    if (invalid) { return 'invalid'; }
    if (focused) { return 'focused'; }

    return '';
  }


  __computeDisabled(pw, invalid) {

    if (invalid) { return true; }
    if (pw)      { return false; }

    return true;
  }


  async __closeThenFireDismiss() {

    try {
      await this.clicked();
      await this.close();

      this.fire('password-modal-dismiss');
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  __passwordModalClicked() {

    this.__closeThenFireDismiss();
  }


  __dismissButtonClicked() {

    this.__closeThenFireDismiss();
  }


  async __confirmClicked() {

    try {
      if (!this._password) { return; }
      
      await this.clicked();
      await this.$.inputIcon.startSpinner();

      this.fire('password-modal-confirm', {
        password:    this._password, 
        stopSpinner: this.$.inputIcon.stopSpinner.bind(this.$.inputIcon)
      });
    }
    catch(error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async close() {

    await this.$.modal.close();

    this.$.inputIcon.stopSpinner();
    this._password = '';
  }


  open() {
    
    return this.$.modal.open();
  }

}

window.customElements.define(AccountPasswordModal.is, AccountPasswordModal);
