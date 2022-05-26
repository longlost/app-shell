
/**
  * 
  *  `account-reauth-modal`
  *
  *
  *  This modal informs the user that they must 
  *  log in again in order to make a particular change.
  *
  *
  *  @customElement
  *  @polymer
  *  @demo demo/index.html
  *
  *
  **/

import {AppElement, html} from '@longlost/app-core/app-element.js';
import htmlString         from './account-reauth-modal.html';
import '@longlost/app-core/app-shared-styles.css';
import '@longlost/app-overlays/app-modal.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';
import '../shared/app-shell-icons.js';


class AccountReauthModal extends AppElement {

  static get is() { return 'account-reauth-modal'; }

  static get template() {
    return html([htmlString]);
  }


  async __closeThenFireDismiss() {

    try {
      await this.clicked();
      await this.close();
      this.fire('reauth-modal-dismiss');
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


  async __reauthButtonClicked() {

    try {
      await this.clicked();
      await this.close();
      this.fire('reauth-modal-reauth');
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

window.customElements.define(AccountReauthModal.is, AccountReauthModal);
