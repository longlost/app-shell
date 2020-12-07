
/**
  * 
  *  `account-unsaved-edits-modal`
  *
  *
  *  This modal informs the user that they have unsaved input edits.
  *
  *
  *  @customElement
  *  @polymer
  *  @demo demo/index.html
  *
  *
  **/

import {AppElement, html} from '@longlost/app-core/app-element.js';
import htmlString         from './account-unsaved-edits-modal.html';
import '@longlost/app-core/app-icons.js';
import '@longlost/app-overlays/app-modal.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';


class AccountUnsavedEditsModal extends AppElement {
  static get is() { return 'account-unsaved-edits-modal'; }

  static get template() {
    return html([htmlString]);
  }


  async __modalClicked() {
    try {
      await this.clicked();
      return this.close();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __saveAllButtonClicked() {
    try {
      await this.clicked();
      await this.close();
      this.fire('unsaved-edits-modal-save-all');
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __exitAnywayButtonClicked() {
    try {
      await this.clicked();
      await this.close();
      this.fire('unsaved-edits-modal-exit');
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

window.customElements.define(AccountUnsavedEditsModal.is, AccountUnsavedEditsModal);
