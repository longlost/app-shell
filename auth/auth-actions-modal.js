
/**
  * 
  * `auth-actions-modal`
  *
  *   This modal presents choices to the user regarding authorization.
  *   They may choose to open the account overlay or logout.
  *
  * 
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  **/


import {AppElement, html} from '@longlost/app-core/app-element.js';
import htmlString         from './auth-actions-modal.html';
import '@longlost/app-core/app-shared-styles.js';
import '@longlost/app-images/avatar-image.js';
import '@longlost/app-overlays/app-modal.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';
import '../shared/app-shell-icons.js';


class AuthActionsModal extends AppElement {
  
  static get is() { return 'auth-actions-modal'; }  

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      avatar: Object

    };
  }


  async __modalClicked() {

    try {
      await  this.clicked();
      return this.close();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  __overlayResetHandler() {

    this.fire('actions-modal-closed');
  }


  async __accountButtonClicked() {

    try {
      await this.clicked();
      await this.close();

      this.fire('actions-modal-account-button-clicked');
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }  
  }


  async __signOutButtonClicked() {

    try {
      await this.clicked();
      
      this.fire('actions-modal-signout-button-clicked');
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

window.customElements.define(AuthActionsModal.is, AuthActionsModal);
