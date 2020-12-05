
/**
  * 
  *  `account-remove-photo-modal`
  *
  *
  *  Confirmation modal for removing a photo from the user's account profile.
  *
  *
  *  @customElement
  *  @polymer
  *  @demo demo/index.html
  *
  *
  **/

import {AppElement, html} from '@longlost/app-element/app-element.js';
import htmlString         from './account-remove-photo-modal.html';
import '@longlost/app-overlays/app-modal.js';
import '@polymer/paper-button/paper-button.js';


class AccountRemovePhotoModal extends AppElement {
  static get is() { return 'account-remove-photo-modal'; }

  static get template() {
    return html([htmlString]);
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


  async __removeButtonClicked() {
    try {
      await this.clicked();
      await this.close();
      this.fire('remove-photo-modal-remove');
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

window.customElements.define(AccountRemovePhotoModal.is, AccountRemovePhotoModal);
