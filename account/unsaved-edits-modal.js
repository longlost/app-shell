
import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import htmlString from './unsaved-edits-modal.html';
import '@longlost/app-modal/app-modal.js';
import '@longlost/app-icons/app-icons.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';


class AccountUnsavedEditsModal extends AppElement {
  static get is() { return 'unsaved-edits-modal'; }

  static get template() {
    return html([htmlString]);
  }


  close() {
    return this.$.modal.close();
  }


  open() {
    return this.$.modal.open();
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

}

window.customElements.define(AccountUnsavedEditsModal.is, AccountUnsavedEditsModal);
