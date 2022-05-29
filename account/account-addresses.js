
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

import {AppElement} from '@longlost/app-core/app-element.js';

import {
  compose,
  rest,
  split,
  tail
} from '@longlost/app-core/lambda.js';

import {
  getRootTarget,
  hijackEvent,
  listenOnce,
  message,
  schedule,
  warn
} from '@longlost/app-core/utils.js';

import {
  deleteDocument,
  set, 
  subscribe
} from '@longlost/app-core/services/services.js';

import template from './account-addresses.html';
import '@longlost/app-core/app-icons.js';
import '@longlost/app-core/app-shared-styles.css';
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


const notRequired = str => (

  str.includes('address2') ||
  str === 'middle'         ||
  str === 'phone'
);

// 'kind' string formatted ie. 'address-0-first'.
const getKeyFromKind = compose(split('-'), tail);


class AccountAddresses extends AppElement {

  static get is() { return 'account-addresses'; }

  static get template() {
    return template;
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
        }],
        observer: '__addressesChanged'
      },

      _addressesUnsubscribe: Object,

      _firstFadeIn: Boolean,

      _hideAddFab: {
        type: Boolean,
        value: false,
        computed: '__computeHideAddFab(_addresses, max)'
      }

    };
  }


  static get observers() {
    return [
      '__firstFadeChanged(_firstFadeIn)'
    ];
  }
  

  connectedCallback() {

    super.connectedCallback();

    this.__editInputChanged = this.__editInputChanged.bind(this);
    this.__editInputConfirm = this.__editInputConfirm.bind(this);

    this.addEventListener('edit-input-changed',      this.__editInputChanged);
    this.addEventListener('edit-input-confirm-edit', this.__editInputConfirm);

    this.__startAddressesSub();
  }


  disconnectedCallback() {

    super.disconnectedCallback();

    this.removeEventListener('edit-input-changed',      this.__editInputChanged);
    this.removeEventListener('edit-input-confirm-edit', this.__editInputConfirm);

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


  __firstFadeChanged(bool) {

    if (bool) {
      const elements = this.selectAll('.address');

      elements.forEach(el => {
        el.classList.add('fade-in-address');
      });
    }
  }


  async __addressesChanged(newVal, oldVal) {

    if (this._firstFadeIn) { return; }

    await listenOnce(this.select('#repeater'), 'dom-change'); 

    if (oldVal) { 
      this._firstFadeIn = true;
    }
  }


  async __startAddressesSub() {

    if (this._addressesUnsubscribe) { return; }

    const callback = dbData => {
      this._addresses = dbData;
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
      orderBy: {prop: 'index'},
      limit:   this.max
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

      const {model} = event;

      await this.clicked();

      this.fire('addresses-open-remove-modal', {model});
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


  __getDbIndexFromEvent(event) {

    const target = getRootTarget(event);

    return this.$.repeater.itemForElement(target).index;
  }


  __editInputChanged(event) {

    hijackEvent(event);

    const index           = this.__getDbIndexFromEvent(event);
    const {kind, ...data} = event.detail;

    this.fire('addresses-input-changed', {
      ...data, 
      kind: `addresses-${index}-${kind}`, 
      index,
      isAddress: true
    });
  }


  async __editInputConfirm(event) {

    hijackEvent(event);

    const {kind, reset, stopSpinner, value} = event.detail;

    try {

      // Bail if a required value is empty, 
      // middle, phone and address2 are not required.
      if ((!value || !value.trim()) && !notRequired(kind)) {

        await warn('Sorry, this is a required field.');

        stopSpinner();

        return;
      }


      const index  = this.__getDbIndexFromEvent(event);
      const newVal = value || null;


      const saveEditToDb = async str => {

        const current = this._addresses.find(address => address.index === index);

        const oldVal = current[kind];

        if (oldVal !== newVal) { // Ignore if there is no change.

          const data = {[kind]: newVal};

          await set({
            coll: `users/${this.user.uid}/addresses`, 
            doc:   `${index}`, 
            data
          });

          await message(`${str} updated.`);
        }

        await stopSpinner();

        reset();
      };

      switch (kind) {

        case 'first':
          await saveEditToDb('First name');
          break;

        case 'middle':
          await saveEditToDb('Middle name');
          break;

        case 'last':
          await saveEditToDb('Last name');
          break;

        case 'address1':
          await saveEditToDb('Address');
          break;

        case 'address2':
          await saveEditToDb('Address');
          break;

        case 'city':
          await saveEditToDb('City');
          break;

        case 'state':
          await saveEditToDb('State/province/region');
          break;

        case 'zip':
          await saveEditToDb('Zip/postal code');
          break;

        case 'country':
          await saveEditToDb('Country');
          break;

        default:
          console.warn('no such input kind: ', kind);
          break;
      }

      this.fire('addresses-value-saved', {kind: `addresses-${index}-${kind}`});
    }
    catch (error) {
      console.error(error);
      stopSpinner();
    }
  }


  __getAnimationElements(index) {

    const elements = this.selectAll('.address');
    const element  = elements[index];
    const next     = rest(index + 1, elements);

    return {element, next};
  }


  async __addAddressAnimation(element) {

    const {height} = element.getBoundingClientRect();
      
    this.fire('addresses-add-animation-setup', {height});

    await schedule();

    this.fire('addresses-add-animation-play');

    element.classList.add('fade-in-address');

    return new Promise(resolve => {
      element.addEventListener('transitionend', event => {

        const target = getRootTarget(event);

        if (target.classList.contains('fade-in-address')) {
          resolve(event);
        }
      });
    });    
  }


  async __addFabClicked() {

    try {
      await this.clicked();

      const length = this._addresses.length;

      if (length >= this.max) { return; }

      // MUST use the data's index here instead of the
      // array's since there can be discrepencies in the
      // data from deleting items from the middle of the list.
      const {index}   = tail(this._addresses);
      const nextIndex = index + 1;

      // NOT waiting for this promise, as it finishes AFTER
      // the dom has updated.
      set({
        coll: `users/${this.user.uid}/addresses`, 
        doc:  `${nextIndex}`, 
        data: {
          billing: null, 
          default: null, 
          index:   nextIndex
        }
      });

      await listenOnce(this.select('#repeater'), 'dom-change');

      const {element} = this.__getAnimationElements(this._addresses.length - 1);

      // 'model.index' refers to the repeated dom element order.
      await this.__addAddressAnimation(element);

      this.fire('addresses-address-added');
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __removeAddressAnimation(element, next) {
    
    next.forEach(el => {
      el.classList.add('move-up-next');
    });

    const {height} = element.getBoundingClientRect();
      
    this.fire('addresses-remove-animation', {height});

    element.classList.add('move-up-address');

    return new Promise(resolve => {
      element.addEventListener('transitionend', event => {

        const target = getRootTarget(event);

        if (target.classList.contains('move-up-address')) {
          resolve(event);
        }
      });
    });    
  }


  __cleanupRemoveAddressAnimation(element, next) {

    next.forEach(el => {
      el.classList.remove('move-up-next');
    });

    element.classList.remove('move-up-address');
  }


  async removeAddress(model) {

    try {

      const {element, next} = this.__getAnimationElements(model.index);

      // 'model.index' refers to the repeated dom element order.
      await this.__removeAddressAnimation(element, next);

      // NOT waiting for this promise, as it finishes AFTER
      // the dom has updated.
      deleteDocument({
        coll: `users/${this.user.uid}/addresses`, 

        // NOT using the 'model.index' here as
        // discrepencies may arise between the template
        // array and the db data.
        doc: `${model.item.index}`
      });

      await listenOnce(this.select('#repeater'), 'dom-change');

      this.fire('addresses-address-removed', {index: model.item.index});

      this.__cleanupRemoveAddressAnimation(element, next);
    }
    catch (error) {
      console.error(error);
    }
  }


  save(addresses) {

    const saves = addresses.map(address => {

      const {index, kind, value} = address;

      const key  = getKeyFromKind(kind);
      const data = {[key]: value};

      set({
        coll: `users/${this.user.uid}/addresses`, 
        doc:  `${index}`, 
        data
      });
    });

    return saves;
  }

}

window.customElements.define(AccountAddresses.is, AccountAddresses);
