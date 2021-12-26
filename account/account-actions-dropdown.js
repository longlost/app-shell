
/**
  * `account-actions-dropdown`
  * 
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  **/
 

import {AppElement, html} from '@longlost/app-core/app-element.js';
import htmlString         from './account-actions-dropdown.html';
import '@longlost/app-core/app-icons.js';
import '@longlost/app-core/app-shared-styles.js';
import '@longlost/grow-shrink-container/grow-shrink-container.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-listbox/paper-listbox.js';


class AccountActionsDropdown extends AppElement {

  static get is() { return 'account-actions-dropdown'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // User email verified state.
      verified: Boolean

    };
  }


  constructor() {

    super();

    this.__close = this.__close.bind(this);
  }


  __close() {

    document.body.removeEventListener('click', this.__close);

    return this.$.container.close();
  }


  async __selectedChangedHandler(event) {

    await this.__close();

    switch (event.detail.value) {

      case 'sign-out':
        this.fire('account-actions-dropdown-sign-out');
        break;

      case 'resend':
        this.fire('account-actions-dropdown-resend');
        break;

      case 'quick-start':
        this.fire('account-actions-dropdown-quick-start');
        break;
    }
  }


  async open() {

    await this.$.container.open();

    document.body.addEventListener('click', this.__close);
  }

}

window.customElements.define(AccountActionsDropdown.is, AccountActionsDropdown);
