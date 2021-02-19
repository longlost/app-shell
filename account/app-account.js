
/**
  * 
  *  `app-account`
  *
  *
  *  Prebuilt overlay to handle editing and updating user account info.
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
  message,
  schedule,
  wait,
  warn
} from '@longlost/app-core/utils.js';

import {init as initDb} from '@longlost/app-core/services/db.js';

import services   from '@longlost/app-core/services/services.js';
import htmlString from './app-account.html';
import '@longlost/app-core/app-icons.js';
import '@longlost/app-core/app-shared-styles.js';
import '@longlost/app-images/app-image.js';
import '@longlost/app-images/avatar-image.js';
import '@longlost/app-inputs/edit-input.js';
import '@longlost/app-inputs/shipping-inputs.js';
import '@longlost/app-overlays/app-header-overlay.js';
import '@longlost/app-spinner/app-spinner.js';
import '@polymer/gold-phone-input/gold-phone-input.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-input/paper-input.js';
import '../shared/app-shell-icons.js';

// The following modules are lazy loaded:
//
//  `account-delete-modal`
//  `account-password-modal` 
//  `account-reauth-modal` 
//  `account-unsaved-edits-modal`
//  `account-photo-picker`


const notRequired = str => (
  str === 'address2' ||
  str === 'middle'   ||
  str === 'phone'
);


class AppAccount extends AppElement {

  static get is() { return 'app-account'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      darkMode: Boolean,

      // From app-user.
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

      // The most current user avatar photo item.
      _avatar: {
        type: Object,
        computed: '__computeAvatar(_opened, user, _userData)'
      },

      // A pointer to the public 'headerImage' object so
      // that the image is not loaded until after the first open.
      _headerPlaceholderImg: Object,

      // Regular firestore user data inputs.
      _normalKeys: {
        type: Array,
        readOnly: true,
        value: [
          'address1', 
          'address2', 
          'city', 
          'country',
          'first',
          'last',
          'middle',
          'phone', 
          'state', 
          'zip'
        ]
      },

      // Save all flow control by password modal.
      _passwordPromiseRejecter: Object,

      // Save all flow control by password modal.
      _passwordPromiseResolver: Object,

      _photoPickerOpened: Boolean,

      _photoPickerType: {
        type: String,
        value: 'avatar' // Or 'background'.
      },

      _profileBackground: {
        type: Object,
        computed: '__computeProfileBackground(_opened, _headerPlaceholderImg, _userDataSnapshot, _userData)'
      },

      _unsavedEdits: {
        type: Boolean,
        computed: '__computeUnsavedEdits(_unsavedEditsObj.*)'
      },

      _unsavedEditsObj: {
        type: Object,
        value: () => ({})
      },

      // From a live subscription, which
      // is only started if the photo picker
      // has been opened.
      _userData: Object,

      // An initial recording of the user's data.
      _userDataSnapshot: {
        type: Object,
        value: () => ({
          address1:    null, 
          address2:    null,
          city:        null,
          country:     null,
          displayName: null,
          first:       null,
          last:        null,
          middle:      null,
          phone:       null,
          state:       null,
          zip:         null
        })
      },

      // Firebase unsubscribe function.
      _userDataUnsubscribe: Object

    };
  }


  static get observers() {
    return [
      '__avatarChanged(_avatar)',
      '__userChanged(user)',
      '__openedPickerOpenedUserChanged(_opened, _photoPickerOpened, user)'
    ];
  }
  

  connectedCallback() {

    super.connectedCallback();

    this.__editInputChanged = this.__editInputChanged.bind(this);
    this.__confirmEdit      = this.__confirmEdit.bind(this);

    this.addEventListener('edit-input-changed', this.__editInputChanged);
    this.addEventListener('edit-input-confirm-edit', this.__confirmEdit);
  }


  disconnectedCallback() {

    super.disconnectedCallback();

    this.removeEventListener('edit-input-changed', this.__editInputChanged);
    this.removeEventListener('edit-input-confirm-edit', this.__confirmEdit);
  }


  __computeAvatar(opened, user, userData) {

    if (!opened || !user) { return; }

    if (userData) { return userData.avatar; }

    return user.photoURL;
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


  __computeProfileBackground(opened, placeholder, userDataSnapshot, userData) {

    if (!opened) { return; }

    // If user removes the background, the display the placeholder.
    if (userData) { 
      return userData.background ? userData.background : placeholder; 
    }

    if (userDataSnapshot?.background) { return userDataSnapshot.background; }

    return placeholder;
  }


  __computeUnsavedEdits(obj) {

    if (!obj || !obj.base) { return false; }

    const {base: unsaved} = obj; 
    const values = Object.values(unsaved);

    return values.some(val => val && val.trim());
  }


  __avatarChanged(avatar) {

    this.fire('app-account-avatar-changed', {value: avatar});
  }


  async __userChanged(user) {

    try {
      if (user && user.uid) {
        const {uid} = user;

        this._userDataSnapshot = await services.get({coll: 'users', doc: uid});
      }
    }
    catch (error) { console.error(error); }
  }


  __openedPickerOpenedUserChanged(opened, pickerOpened, user) {

    if (!user) {
      this.__stopUserDataSub();

      this._userData         = undefined;
      this._userDataSnapshot = undefined;
    }

    if (pickerOpened) {
      this.__startUserDataSub();
    }
    else if (!opened) {
      this.__stopUserDataSub();
    }
  }


  async __startUserDataSub() {

    if (this._userDataUnsubscribe) { return; }

    const callback = dbData => {
      this._userData = dbData;
    };

    const errorCallback = error => {
      this._userData = undefined;

      console.error(error);
    };

    this._userDataUnsubscribe = await services.subscribe({
      callback,
      coll: 'users',
      doc:   this.user.uid,
      errorCallback
    });
  }


  __stopUserDataSub() {

    if (this._userDataUnsubscribe) {
      this._userDataUnsubscribe();
      this._userDataUnsubscribe = undefined;
    }
  }


  __editInputChanged(event) {

    const {kind, value} = event.detail;
    this.set(`_unsavedEditsObj.${kind}`, value);
  }


  __reset() {

    this._opened = false;
  }


  async __reauthenticate() {

    try {
      await this.$.overlay.close();

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
      this.$.unsavedEditsModal.open();
    }
    catch (error) { console.error(error); }
  }


  __exitWithoutSavingChanges() {

    this.$.overlay.back();
  }


  __overlayBack() {

    // Already has this.clicked from app-header-overlay.js
    if (this._unsavedEdits) {
      this.__openUnsavedEditsModal();
      return;
    }

    this.$.overlay.back();
  }


  async __signOutButtonClicked() {

    try {
      await this.clicked();
      await this.$.overlay.close();

      this.fire('app-account-signout-clicked');
    }
    catch (error) { 
      if (error === 'click debounced') { return; }
      console.error(error); 
    }
  }


  async __openPhotoPicker() {

    try {
      if (!this.user) {
        throw new Error('User is not logged in before attempting to add/edit the profile avatar.');
      }

      await import(
        /* webpackChunkName: 'account-photo-picker' */ 
        './account-photo-picker.js'
      );

      await schedule();

      await this.$.picker.open();
    }
    catch (error) {
      console.error(error); 

      warn('Sorry, the photo picker failed to load.');
    }
  }


  async __changeBackgroundButtonClicked() {

    try {
      await this.clicked();

      this._photoPickerType = 'background';

      this.__openPhotoPicker();
    }
    catch (error) { 
      if (error === 'click debounced') { return; }
      console.error(error); 
    }
  }


  __avatarClicked() {

    this._photoPickerType = 'avatar';
    this.__openPhotoPicker();
  }


  __photoPickerOpenedChangedHandler(event) {

    hijackEvent(event);

    this._photoPickerOpened = event.detail.value;
  }


  async __openPasswordModal() {

    await import(
      /* webpackChunkName: 'account-password-modal' */ 
      './account-password-modal.js'
    );
    this.$.passwordModal.open();
  }


  async __openReauthenticateModal() {

    try {
      await import(
        /* webpackChunkName: 'account-reauth-modal' */ 
        './account-reauth-modal.js'
      );

      await this.$.reauthModal.open();

      if (this._passwordPromiseRejecter) {
        await schedule();
        this._passwordPromiseRejecter('reauth needed');
      }

      if (this.$.passwordModal.close) {
        return this.$.passwordModal.close();
      }
    }
    catch (error) { console.error(error); }
  }


  async __weakPassword() {

    this.$.passwordInput.errorMessage = 'Weak password';
    this.$.passwordInput.invalid      = true;

    await  this.$.passwordModal.close();

    return warn('Please create a stronger password.');
  }


  __invalidEmail() {

    this.$.emailInput.errorMessage = 'Invalid email address';
    this.$.emailInput.invalid      = true;

    return warn('The email address is invalid. Please try again.');
  }


  __emailAlreadyInUse() {

    this.$.emailInput.errorMessage = 'Email already in use';
    this.$.emailInput.invalid      = true;

    return warn('This email address is already taken. Please try another one.');
  }


  __handleFirebaseErrors(error) {

    if (!error || !error.code) { 
      console.error(error);
      return Promise.resolve(); 
    }

    switch (error.code) {

      // Thrown if the user's last sign-in time does not meet the security threshold. 
      // This does not apply if the user is anonymous.
      case 'auth/requires-recent-login':
        return this.__openReauthenticateModal();

      // Thrown if the password is not strong enough.
      case 'auth/weak-password':
        return this.__weakPassword();

      // Thrown if the email used is invalid.
      case 'auth/invalid-email':
        return this.__invalidEmail();

      // Thrown if the email is already used by another user.
      case 'auth/email-already-in-use':
        return this.__emailAlreadyInUse();

      default:
        console.error('firebase user profile edit error: ', error);
        return Promise.resolve();
    }
  }


  async __passwordModalConfirm(event) {

    const {password, stopSpinner} = event.detail;

    try {

      if (password === this._newPassword) {
        await this.user.updatePassword(password);
        await stopSpinner();
        await this.$.passwordModal.close();

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
  

  __sendVerificationEmail() {

    if (!this.user) { return; }

    return this.user.sendEmailVerification();
  }


  async __confirmEdit(event) {

    const {kind, reset, stopSpinner, value} = event.detail;

    try {

      // Bail if a required value is empty, 
      // middle, phone and address2 are not required.
      if (!value && (!notRequired(kind) || !value.trim())) {

        await warn('Sorry, this is a required field.');

        stopSpinner();
      }


      const saveEditToDb = async str => {

        const oldVal = this._userDataSnapshot[kind];

        if (oldVal !== value) { // Ignore if there is no change.

          const data = {};
          data[kind] = value;

          await services.set({coll: 'users', doc: this.user.uid, data});

          this.set(`_userDataSnapshot.${kind}`, value);

          await message(`${str} updated.`);
        }

        stopSpinner();
      };

      switch (kind) {

        case 'displayName':

          const previousDisplayName = this.user.displayName;

          // Profile obj === {displayName: nullable string, photoURL: nullable string}.
          // The profile's displayName and photoURL to update.
          await this.user.updateProfile({displayName: value});

          this.notifyPath('user.displayName'); // Cannot write to Firebase user.

          await message('Profile name updated.');

          stopSpinner();

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

          await this.user.updateEmail(value);

          // Sends an email to user for them to verify.
          await this.__sendVerificationEmail();
          this.notifyPath('user.email');

          await stopSpinner();
          message('Email updated.');

          break;

        case 'phone':
          await saveEditToDb('Phone number');
          break;

        case 'password':

          this._newPassword = value;

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

      this.set(`_unsavedEditsObj.${kind}`, '');
    }
    catch (error) {
      stopSpinner();
      this.__handleFirebaseErrors(error);
    }
  }


  async __saveAll() {

    try {
      await this.$.spinner.show('Saving edits.');

      const pwEdit = this._unsavedEditsObj['password'];

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
      
      const normalSaves = this._normalKeys.reduce((accum, key) => {

        const val = this._unsavedEditsObj[key];

        // 'address2' can be empty string, not required.
        if (val && (notRequired(key) || val.trim())) {
          accum[key] = val;
        }

        return accum; 
      }, {});

      const normalSavePromise = services.set({
        coll: 'users', 
        doc:  this.user.uid, 
        data: normalSaves
      });

      const saveDisplayName = async displayName => {

        // Profile obj === {displayName: nullable string, photoURL: nullable string}.
        // The profile's displayName and photoURL to update.
        await this.user.updateProfile({displayName});

        this.notifyPath('user.displayName'); // Cannot write to firebase user.
      };

      const saveEmail = async email => {

        await this.user.updateEmail(email);

        // Sends an email to user for them to verify.
        await this.__sendVerificationEmail();

        this.notifyPath('user.email');
      };

      const displayNameVal = this._unsavedEditsObj['displayName'];
      const displayNameSavePromise = 
        displayNameVal && displayNameVal.trim() ?
          saveDisplayName(displayNameVal) : Promise.resolve();

      const emailVal = this._unsavedEditsObj['email'];
      const emailSavePromise = 
        emailVal && emailVal.trim() ?
          saveEmail(emailVal) : Promise.resolve();

      await Promise.all([
        normalSavePromise, 
        displayNameSavePromise, 
        emailSavePromise
      ]);

      // Update input vals.
      const savesKeys = Object.keys(normalSaves);

      savesKeys.forEach(key => {
        const value = normalSaves[key];
        this.set(`_userDataSnapshot.${key}`, value);
      });

      // Reset obj.
      this.set('_unsavedEditsObj', {});

      await message('Account updated.');
    }
    catch (error) {
      await this.__handleFirebaseErrors(error);
    }
    finally {
      await  this.$.overlay.reset();
      return this.$.spinner.hide();
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

      await this.$.spinner.show('Deleting your account. Please wait.');

      // Delete and signout user.
      await Promise.all([
        this.user.delete(),
        wait(1000)
      ]);

      await this.$.spinner.show('Deleting app data from this device. Please wait.');

      // Get the currently running firestore instance.
      const db = await initDb();

      // Shutdown and remove cached user data from device.
      await db.terminate();
      await db.clearPersistence();

      this.fire('app-account-user-deleted');

      // Start a new firestore instance.
      await initDb();

      await schedule();

      await this.$.spinner.hide();

      await this.$.overlay.close();
    }
    catch (error) {

      await this.$.spinner.hide();

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

      this.$.deleteModal.open();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async open() {

    try {
      await this.$.overlay.open();
      await schedule();

      this._opened               = true;
      this._headerPlaceholderImg = this.headerImage;
    }
    catch (error) { console.error(error); }
  }

}

window.customElements.define(AppAccount.is, AppAccount);
