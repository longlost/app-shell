
/**
  * 
  *  `account-inputs`
  *
  *
  *  User account info inputs.
  *
  *
  *  @customElement
  *  @polymer
  *  @demo demo/index.html
  *
  *
  **/

import {AppElement, html} from '@longlost/app-core/app-element.js';
import {hijackEvent}      from '@longlost/app-core/utils.js';
import htmlString         from './account-inputs.html';
import '@longlost/app-core/app-icons.js';
import '@longlost/app-core/app-shared-styles.js';
import '@longlost/app-inputs/edit-input.js';
import '@longlost/app-inputs/shipping-inputs.js';
import '@polymer/gold-phone-input/gold-phone-input.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-input/paper-input.js';
import '../shared/app-shell-icons.js';


// User input data captured.
//
// address1, address2, city, country, 
// displayName, first, last, middle, 
// phone, state, zip


class AccountInputs extends AppElement {

  static get is() { return 'account-inputs'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // From app-user.
      user: Object,

      data: Object

    };
  }
  

  connectedCallback() {

    super.connectedCallback();

    this.__editInputChanged = this.__editInputChanged.bind(this);
    this.__editInputConfirm = this.__editInputConfirm.bind(this);

    this.addEventListener('edit-input-changed',      this.__editInputChanged);
    this.addEventListener('edit-input-confirm-edit', this.__editInputConfirm);
  }


  disconnectedCallback() {

    super.disconnectedCallback();

    this.removeEventListener('edit-input-changed',      this.__editInputChanged);
    this.removeEventListener('edit-input-confirm-edit', this.__editInputConfirm);
  }


  __computeDisplayNamePlaceholder(displayName) {

    return displayName ? displayName : 'No profile name';
  }


  __computeFirstNamePlaceholder(firstName) {

    return firstName ? firstName : 'No first name';
  }


  __computeMiddleNamePlaceholder(middleName) {

    return middleName ? middleName : 'No middle name';
  }


  __computeLastNamePlaceholder(lastName) {

    return lastName ? lastName : 'No last name';
  }


  __computeEmailLabel(verified) {

    return verified ? 'Email Verified' : 'Email';
  }

  __computeEmailPlaceholder(email) {

    return email ? email : 'No email';
  }


  __computePhonePlaceholder(number) {

    return number ? number : 'No phone number';
  }


  __editInputChanged(event) {

    hijackEvent(event);

    this.fire('app-inputs-value-changed', event.detail);
  }


  __editInputConfirm(event) {

    hijackEvent(event);

    this.fire('app-inputs-save-value', event.detail);
  }


  showWeakPasswordError() {

    this.select('#passwordInput').errorMessage = 'Weak password';
    this.select('#passwordInput').invalid      = true;
  }


  showInvalidEmailError() {

    this.select('#emailInput').errorMessage = 'Invalid email address';
    this.select('#emailInput').invalid      = true;
  }


  showEmailInUseError() {

    this.select('#emailInput').errorMessage = 'Email already in use';
    this.select('#emailInput').invalid      = true;
  }

}

window.customElements.define(AccountInputs.is, AccountInputs);
