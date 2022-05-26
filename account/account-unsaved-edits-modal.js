
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
import '@longlost/app-core/app-shared-styles.css';
import '@longlost/app-overlays/app-modal.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';
import '../shared/app-shell-icons.js';


class AccountUnsavedEditsModal extends AppElement {

  static get is() { return 'account-unsaved-edits-modal'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      unsaved: Object,

      _items: {
        type: Array,
        computed: '__computeItems(unsaved.*)'
      }

    };
  }


  __computeItems(obj) {

    if (!obj || !obj.base) { return false; }

    const {base: unsaved} = obj; 

    return Object.
             entries(unsaved).
             map(([kind, data]) => ({kind, ...data}));
  }


  __computeLabel(label) {

    return label.split('(')[0];
  }


  __computeValue(kind, value) {

    const val = value.trim();

    // Obfuscate password.
    if (kind === 'password') {
      return val.split('').map(_ => '*').join('');      
    }

    return val;
  }


  async __closeModalFromClick() {

    try {
      await this.clicked();
      return this.close();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  __modalClicked() {

    this.__closeModalFromClick();
  }


  __dismissButtonClicked() {

    this.__closeModalFromClick();
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


  close() {

    return this.$.modal.close();
  }


  open() {

    return this.$.modal.open();
  }

}

window.customElements.define(AccountUnsavedEditsModal.is, AccountUnsavedEditsModal);
