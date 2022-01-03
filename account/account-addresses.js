
/**
  * 
  *  `account-addresses`
  *
  *
  *  User may add up to 5 unique account address info sections.
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
} from '@longlost/app-core/app-element.js';

import {
  getRootTarget,
  hijackEvent,
  warn
} from '@longlost/app-core/utils.js';

import {
  deleteDocument,
  set, 
  subscribe
} from '@longlost/app-core/services/services.js';

import htmlString from './account-addresses.html';
import '@longlost/app-core/app-icons.js';
import '@longlost/app-core/app-shared-styles.js';
import '@longlost/app-inputs/edit-input.js';
import '@longlost/app-inputs/shipping-inputs.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-fab/paper-fab.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-radio-button/paper-radio-button.js';
import '../shared/app-shell-icons.js';


// User input data captured.
//
// first, last, middle, 
// address1, address2, city, 
// country, state, zip


class AccountAddresses extends AppElement {

  static get is() { return 'account-addresses'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // The maximum number of addresses a user can have.
      max: {
        type: Number,
        value: 5
      },

      // From app-user.
      user: Object,

      _addresses: {
        type: Array,
        value: [{
          billing: null, 
          default: null, 
          index:   0
        }]
      },

      _addressesUnsubscribe: Object,

      _hideAddFab: {
        type: Boolean,
        value: false,
        computed: '__computeHideAddFab(_addresses, max)'
      }

    };
  }
  

  connectedCallback() {

    super.connectedCallback();

    this.__startAddressesSub();
  }


  disconnectedCallback() {

    super.disconnectedCallback();

    this.__stopAddressesSub();
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


  __computeAddressNumber(index) {

    return `${index + 1}`;
  }


  __computeHideRemoveBtn(addresses) {

    if (!Array.isArray(addresses)) { return true; }

    return addresses.length <= 1;
  }


  __computeHideAddFab(addresses, max) {

    if (!Array.isArray(addresses)) { return true; }

    return addresses.length >= max;
  }


  async __startAddressesSub() {

    if (this._addressesUnsubscribe) { return; }

    const callback = dbData => {
      this._addresses = dbData;



      console.log('addresses: ', dbData);

      

    };

    const errorCallback = async error => {

      try {
        const doesNotExist = error?.message.includes('does not exist');

        // Initialize the addresses collection.
        if (doesNotExist) { 

          await set({
            coll: `users/${this.user.uid}/addresses`, 
            doc:  '0', 
            data: {
              billing: null, 
              default: null, 
              index:   0
            }
          });

          return; 
        }

        console.error(error);
      }
      catch (err) {
        console.error(err);
      }      
    };

    this._addressesUnsubscribe = await subscribe({
      callback,
      coll: `users/${this.user.uid}/addresses`,
      errorCallback,
      query: {
        orderBy: 'index',
        limit:    this.max
      }
    });
  }


  __stopAddressesSub() {

    if (this._addressesUnsubscribe) {
      this._addressesUnsubscribe();
      this._addressesUnsubscribe = undefined;
      this._addresses            = undefined;
    }
  }


  async __removeButtonClicked(event) {

    try {

      // NOT using the 'model.index' here as
      // discrepencies may arise between the template
      // array and the db data.
      const {index} = event.model.item;

      await this.clicked();

      await deleteDocument({
        coll: `users/${this.user.uid}/addresses`, 
        doc:  `${index}`
      });
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }

  // Manually maintain checked state of `paper-radio-button`.
  // Wrapping them in a `paper-radio-group` won't work here,
  // since there are 2 seperate kinds of radio per item.
  __deselectOtherRadios(index, name) {

    const radios      = this.selectAll('.radio');
    const sameType    = radios.filter(el   => el.name  === name);
    const notSelected = sameType.filter(el => el.index !== index);

    notSelected.forEach(el => {
      el.checked = false;
    });
  }


  async __saveRadioState(checked, index, name) {

    try {
      await set({
        coll: `users/${this.user.uid}/addresses`, 
        doc:  `${index}`, 
        data: {
          index,
          [name]: checked
        }
      })
    }
    catch (error) {
      console.error(error);

      warn('Sorry, your change was not saved.');
    }
  }


  __radioCheckedChangedHandler(event) {

    hijackEvent(event);

    const target = getRootTarget(event);
    const {checked, index, name} = target;

    // Ignore events from radios that have been deselected.
    if (checked) {
      this.__deselectOtherRadios(index, name);
    }

    this.__saveRadioState(checked, index, name);
  }


  async __addFabClicked() {

    try {
      await this.clicked();

      const length = this._addresses.length;

      if (length >= this.max) { return; }

      // MUST use the data's index here instead of the
      // array's since there can be discrepencies in the
      // data from deleting items from the middle of the list.
      const {index}   = this._addresses[length - 1];
      const nextIndex = index + 1;

      await set({
        coll: `users/${this.user.uid}/addresses`, 
        doc:  `${nextIndex}`, 
        data: {
          billing: null, 
          default: null, 
          index:   nextIndex
        }
      });
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }

}

window.customElements.define(AccountAddresses.is, AccountAddresses);
