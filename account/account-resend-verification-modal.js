
/**
  * 
  *  `account-resend-verification-modal`
  *
  *
  *  This modal confirms with the user that they 
  *  wish to have an account email address 
  *  verification email sent to them again.
  *
  *
  *  @customElement
  *  @polymer
  *  @demo demo/index.html
  *
  *
  **/

import {AppElement, html} from '@longlost/app-core/app-element.js';
import htmlString         from './account-resend-verification-modal.html';
import '@longlost/app-core/app-shared-styles.css';
import '@longlost/app-overlays/app-modal.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';
import '../shared/app-shell-icons.js';


class AccountResendVerificationModal extends AppElement {

  static get is() { return 'account-resend-verification-modal'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      email: String

    };
  }


  async __dismissButtonClicked() {

    try {
      await this.clicked();
      await this.close();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __resendButtonClicked() {

    try {
      await this.clicked();
      await this.close();

      this.fire('resend-verification-modal-resend');
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

window.customElements.define(AccountResendVerificationModal.is, AccountResendVerificationModal);
