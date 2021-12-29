
/**
  * 
  *  `app-account`
  *
  *
  *  Ui to display, edit and update user account info.
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
  hijackEvent,
  listenOnce,
  message,
  schedule,
  wait,
  warn
} from '@longlost/app-core/utils.js';

import {
  get, 
  initDb, 
  set, 
  subscribe,
  shutdownDb
} from '@longlost/app-core/services/services.js';

import firebaseReady        from '@longlost/app-core/firebase.js';
import {FbErrorMixin}       from './fb-error-mixin.js';
import {HeaderActionsMixin} from './header-actions-mixin.js';
import htmlString           from './app-account.html';
import '@longlost/app-core/app-shared-styles.js';
import '@longlost/app-overlays/app-header-overlay.js';
import '@longlost/app-spinner/app-spinner.js';
import '@polymer/paper-button/paper-button.js';
import './account-inputs.js';

// The following modules are lazy loaded:
//
//  `account-delete-modal`
//  `account-password-modal` 
//  `account-reauth-modal`
//  `account-remove-photo-modal`
//  `account-resend-verification-modal`
//  `account-unsaved-edits-modal`
//  `account-photo-picker`


// User input data captured.
//
// address1, address2, city, country, 
// displayName, first, last, middle, 
// phone, state, zip


const notRequired = str => (
  str === 'address2' ||
  str === 'middle'   ||
  str === 'phone'
);


class AppAccount extends HeaderActionsMixin(FbErrorMixin(AppElement)) {

  static get is() { return 'app-account'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      darkMode: Boolean,

      // From `app-auth`.
      user: Object,

      // Should be a webpack responsive-loader image object.
      //
      // This is used as a branded placeholder only when the user 
      // has not provided a personalized profile background photo.
      headerImage: Object,

      headerSize: {
        type: Number,
        value: 4
      },

      // From a live subscription to the user's database collection.
      _data: Object,

      // Firebase unsubscribe function.
      _dataUnsubscribe: Object,

      // Save all flow control by password modal.
      _passwordPromiseRejecter: Object,

      // Save all flow control by password modal.
      _passwordPromiseResolver: Object,

      _spinnerShown: Boolean,

      _stamp: Boolean,

      _unsavedEdits: {
        type: Boolean,
        computed: '__computeUnsavedEdits(_unsavedEditsObj.*)'
      },

      _unsavedEditsObj: {
        type: Object,
        value: () => ({})
      }

    };
  }


  static get observers() {
    return [
      '__openedUserChanged(_opened, user)',
      '__openedSpinnerShownChanged(_opened, _spinnerShown)'
    ];
  }


  __computeUnsavedEdits(obj) {

    if (!obj || !obj.base) { return false; }

    const {base: unsaved} = obj; 
    const entries = Object.entries(unsaved);

    return entries.
             filter(([_, obj]) => obj !== null). // Null entries have already been saved.
             some(([key, obj]) => 
               notRequired(key) || // Unrequired entries can be empty.
               (typeof obj.value === 'string' && obj.value.trim()));
  }


  __openedUserChanged(opened, user) {

    if (user) {
      this.__startUserDataSub();
      return;
    }
    
    this.__stopUserDataSub();    
  }

  // NOT a computed prop since '_stamp' is set prior to opening.
  __openedSpinnerShownChanged(opened, spinnerShown) {

    if (!opened && !spinnerShown) {
      this._stamp = false;
    }
  }


  async __startUserDataSub() {

    if (this._dataUnsubscribe) { return; }

    const callback = dbData => {
      this._data = dbData;
    };

    const errorCallback = error => {
      this._data = {};

      console.error(error);
    };

    this._dataUnsubscribe = await subscribe({
      callback,
      coll: 'users',
      doc:   this.user.uid,
      errorCallback
    });
  }


  __stopUserDataSub() {

    if (this._dataUnsubscribe) {
      this._dataUnsubscribe();
      this._dataUnsubscribe = undefined;
      this._data = {};
    }
  }


  __inputsValueChangedHandler(event) {

    hijackEvent(event);

    const {kind, ...data} = event.detail;

    this.set(`_unsavedEditsObj.${kind}`, data);
  }


  __clearUnsavedEdits() {

    this.set('_unsavedEditsObj', {});
  }


  __overlayReset() {

    this._opened = false;
    this.__clearUnsavedEdits();
  }


  async __reauthenticate() {

    try {
      await this.select('#overlay').close();

      this.fire('app-account-reauth-needed');
    }
    catch (error) { console.error(error); }
  }


  async __openUnsavedEditsModal() {

    try {
      await import(
        /* webpackChunkName: 'account-unsaved-edits-modal' */ 
        './account-unsaved-edits-modal.js'
      );

      this.select('#unsavedEditsModal').open();
    }
    catch (error) { console.error(error); }
  }


  __exitWithoutSavingChanges() {

    this.select('#overlay').back();
  }


  __overlayBack() {

    // Already has this.clicked from app-header-overlay.js
    if (this._unsavedEdits) {
      this.__openUnsavedEditsModal();
      return;
    }

    this.select('#overlay').back();
  }


  async __openPasswordModal() {

    await import(
      /* webpackChunkName: 'account-password-modal' */ 
      './account-password-modal.js'
    );

    this.select('#passwordModal').open();
  }

  // Handle cases where the password modal is
  // dismissed during a 'save all' scenario.
  async __passwordModalDismissHandler(event) {

    hijackEvent(event);

    if (this._passwordPromiseResolver) {
      await schedule();
      this._passwordPromiseResolver();
    }    
  }


  async __passwordModalConfirmHandler(event) {

    hijackEvent(event);

    const {password, stopSpinner} = event.detail;

    try {

      if (password === this._newPassword) {

        const {loadAuth}       = await firebaseReady();
        const {updatePassword} = await loadAuth();

        await updatePassword(this.user, password);
        await stopSpinner();
        await this.select('#passwordModal').close();

        message('Your password has been updated.');

        if (this._passwordPromiseResolver) {
          await schedule();
          this._passwordPromiseResolver();
        }
      }
      else {
        await stopSpinner();

        warn('Your new password inputs do not match. Please try again.');

        if (this._passwordPromiseRejecter) {
          await schedule();
          this._passwordPromiseRejecter('passwords dont match');
        }
      }
    }
    catch (error) {
      stopSpinner();

      if (this._passwordPromiseRejecter) {
        await schedule();
        this._passwordPromiseRejecter(error);
      }
      else {
        this.__handleFirebaseErrors(error);
      }
    }
  }
  

  async __sendVerificationEmail() {

    if (!this.user) { return; }

    const {loadAuth}              = await firebaseReady();
    const {sendEmailVerification} = await loadAuth();

    await sendEmailVerification(this.user);

    return message('Account verification email sent.');
  }


  async __saveDisplayName(displayName) {

    // Cannot be nullish or an empty string.
    if (!displayName || !displayName.trim()) { return; }

    const previous = this.user.displayName;

    // No need to save unchanged values.
    if (previous === displayName) { return; }

    const {loadAuth}      = await firebaseReady();
    const {updateProfile} = await loadAuth();

    // Profile obj === {displayName: nullable string, photoURL: nullable string}.
    // The profile's displayName and photoURL to update.
    await updateProfile(this.user, {displayName});

    this.notifyPath('user.displayName'); // Cannot write to Firebase user.
  }


  async __saveEmail(email) {

    // Cannot be nullish or an empty string.
    if (!email || !email.trim()) { return; }

    const previous = this.user.email;

    // No need to save unchanged values.
    if (previous === newVal) { return; }

    const {loadAuth}    = await firebaseReady();
    const {updateEmail} = await loadAuth();

    await updateEmail(this.user, newVal);

    // Sends an email to user for them to verify ownership.
    await this.__sendVerificationEmail();

    this.notifyPath('user.email');
  }


  async __inputsSaveValueHandler(event) {

    hijackEvent(event);

    // Payload of an `edit-input`.
    const {kind, reset, stopSpinner, value} = event.detail;

    try {

      // Bail if a required value is empty, 
      // middle, phone and address2 are not required.
      if ((!value || !value.trim()) && !notRequired(kind)) {

        await warn('Sorry, this is a required field.');

        stopSpinner();

        return;
      }

      const newVal = value || null;


      const saveEditToDb = async str => {

        const oldVal = this._data[kind];

        if (oldVal !== newVal) { // Ignore if there is no change.

          const data = {};
          data[kind] = newVal;

          await set({coll: 'users', doc: this.user.uid, data});
          await message(`${str} updated.`);
        }

        await stopSpinner();

        reset();
      };

      switch (kind) {

        case 'displayName':
          await this.__saveDisplayName(newVal);
          await saveEditToDb('Profile name');
          break;

        case 'first':
          await saveEditToDb('First name');
          break;

        case 'middle':
          await saveEditToDb('Middle name');
          break;

        case 'last':
          await saveEditToDb('Last name');
          break;

        case 'email':
          await this.__saveEmail(newVal);
          await saveEditToDb('Email');
          break;

        case 'phone':
          await saveEditToDb('Phone number');
          break;

        case 'password':

          this._newPassword = newVal;

          await stopSpinner();
          await this.__openPasswordModal();

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

      this.set(`_unsavedEditsObj.${kind}`, null);
    }
    catch (error) {
      stopSpinner();
      this.__handleFirebaseErrors(error);
    }
  }


  __showSpinner(text) {

    this._spinnerShown = true;

    return this.select('#spinner').show(text);
  }


  async __hideSpinner() {

    await this.select('#spinner').hide();

    this._spinnerShown = false;
  }


  async __saveAll() {

    try {
      await this.__showSpinner('Saving edits.');

      const pwEdit = this._unsavedEditsObj?.password.value;

      if (pwEdit && pwEdit.trim()) {   

        this._newPassword = pwEdit;

        await this.__openPasswordModal();

        // Password modal controls how this promise resolves.
        const promise = new Promise((resolve, reject) => {
          this._passwordPromiseResolver = resolve;
          this._passwordPromiseRejecter = reject;
        });

        await promise;
      }

      // Make sure no required fields are empty.
      const data = Object.entries(this._unsavedEditsObj).reduce(
        (accum, [key, obj]) => {

          const {value} = obj;

          // Unrequired entries can be empty.
          if (notRequired(key) || (value && value.trim())) {
            accum[key] = value;
          }

          return accum; 
        }, 
        {}
      );

      const userDataSave = set({
        coll: 'users', 
        doc:   this.user.uid, 
        data
      });

      const {displayName, email} = this._unsavedEditsObj;

      await Promise.all([
        userDataSave, 
        this.__saveDisplayName(displayName?.value), 
        this.__saveEmail(email?.value)
      ]);

      this.__clearUnsavedEdits();

      await message('Account updated.');
    }
    catch (error) {
      await this.__handleFirebaseErrors(error);
    }
    finally {
      await  this.select('#overlay').reset();
      return this.__hideSpinner();
    }
  }


  async __saveAllButtonClicked() {

    try {
      await this.clicked();
      await this.__saveAll();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __deleteUser() {

    try {

      await this.__showSpinner('Deleting your account. Please wait.');

      const {loadAuth}   = await firebaseReady();
      const {deleteUser} = await loadAuth();

      // Delete and signout user.
      //
      // User data is removed by a triggered cloud function. 
      // See `app-core/cloud.js`.
      await Promise.all([
        deleteUser(this.user),
        wait(1000)
      ]);

      await this.__showSpinner('Deleting app data from this device. Please wait.');

      // Shutdown firestore.
      await shutdownDb();

      this.fire('app-account-user-deleted');

      // Start a new firestore instance.
      await initDb();
      await schedule();
      await this.__hideSpinner();
      await this.select('#overlay').close();
    }
    catch (error) {

      await this.__hideSpinner();

      this.__handleFirebaseErrors(error);
    }
  }


  async __deleteUserButtonClicked() {

    try {
      await this.clicked();

      await import(
        /* webpackChunkName: 'account-delete-modal' */ 
        './account-delete-modal.js'
      );

      this.select('#deleteModal').open();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async open() {

    try {

      this._stamp = true;

      await listenOnce(this.$.stamper, 'dom-change');
      await this.select('#overlay').open();
      await schedule();

      this._opened = true;
    }
    catch (error) { console.error(error); }
  }

}

window.customElements.define(AppAccount.is, AppAccount);
