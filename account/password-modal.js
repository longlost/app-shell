
import {
  AppElement,
  html
}                 from '@longlost/app-element/app-element.js';
import htmlString from './password-modal.html';
import '@longlost/app-modal/app-modal.js';
import '@longlost/icon-to-spinner/icon-to-spinner.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-button/paper-button.js';


class AccountPasswordModal extends AppElement {
  static get is() { return 'password-modal'; }

  static get template() {
    return html([htmlString]);
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


  async close() {
    await this.$.modal.close();
    this.$.inputIcon.stopSpinner();
    this._password = '';
  }


  open() {
    return this.$.modal.open();
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

}

window.customElements.define(AccountPasswordModal.is, AccountPasswordModal);
