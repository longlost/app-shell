
/**
  * 
  *  `unsaved-edits-modal`
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

import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import htmlString from './unsaved-edits-modal.html';
import '@longlost/app-overlays/app-modal.js';
import '@longlost/app-icons/app-icons.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';


class AccountUnsavedEditsModal extends AppElement {
  static get is() { return 'unsaved-edits-modal'; }

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
