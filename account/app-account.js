
/**
  * 
  *  `app-account`
  *
  *
  *  Prebuilt overlay to handle editing and updating user account.
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
} from '@longlost/app-element/app-element.js';

import {
  confirm,
  message,
  schedule,
  warn
} from '@longlost/utils/utils.js';

import services   from '../services/services.js';
import htmlString from './app-account.html';
import '@longlost/app-icons/app-icons.js';
import '@longlost/app-images/responsive-image.js';
import '@longlost/app-inputs/edit-input.js';
import '@longlost/app-inputs/shipping-inputs.js';
import '@longlost/app-overlays/app-header-overlay.js';
import '@longlost/app-shared-styles/app-shared-styles.js';
import '@longlost/app-spinner/app-spinner.js';
import '@polymer/iron-image/iron-image.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-fab/paper-fab.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/gold-phone-input/gold-phone-input.js';
import '@polymer/paper-ripple/paper-ripple.js';
import '@polymer/paper-button/paper-button.js';
// delete-modal, password-modal, reauth-modal, unsaved-edits-modal
// and app-camera dynamically imported.



// TODO:
//      Create a more generic way to get user store credit data.
//      Should be included in user's data document.

// // Get credit val from user account.
// const getCredit = async uid => {
//   try {
//     const {credit} = await services.get({
//       coll: `users/${uid}/credit`,
//       doc:  'asg'
//     });
//     return credit;
//   }
//   catch (error) {
//     if (
//       error.message &&
//       error.message.includes('No such document!')
//     ) { 
//       return '0.00';
//     }
//     else {
//       console.error(error);
//     }
//   }
// };


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

      // Must be webpack responsive-loader object.
      headerImage: String,

      headerSize: {
        type: Number,
        value: 4
      },

      _credit: {
        type: String,
        value: '0.00'
      },

      // Regular firestore user data inputs.
      _normalKeys: {
        type: Array,
        readOnly: true,
        value: [
          'address1', 
          'address2', 
          'city', 
          'country', 
          'phoneNumber', 
          'state', 
          'zip'
        ]
      },

      // Save all flow control by password modal.
      _passwordPromiseRejecter: Object,

      // Save all flow control by password modal.
      _passwordPromiseResolver: Object,

      _unsavedEdits: {
        type: Boolean,
        computed: '__computeUnsavedEdits(_unsavedEditsObj.*)'
      },

      _unsavedEditsObj: {
        type: Object,
        value: () => ({})
      },

      _userMeta: {
        type: Object,
        value: () => ({
          phoneNumber: null,
          fullName:    null,
          address1:    null, 
          address2:    null,
          city:        null,
          state:       null,
          zip:         null,
          country:     null,
        })
      }

    };
  }


  static get observers() {
    return [
      '__currentUserChanged(user)'
    ];
  }
  

  connectedCallback() {
    super.connectedCallback();

    this.__editInputChanged = this.__editInputChanged.bind(this);
    this.__confirmEdit      = this.__confirmEdit.bind(this);

    this.addEventListener('edit-input-changed', this.__editInputChanged);
    this.addEventListener('edit-input-confirm-edit', this.__confirmEdit);

    this.__profileImgFix();
  }


  disconnectedCallback() {
    super.disconnectedCallback();

    this.removeEventListener('edit-input-changed', this.__editInputChanged);
    this.removeEventListener('edit-input-confirm-edit', this.__confirmEdit);
  }


  __computeHideCredit(credit) {
    return !credit || Number(credit) <= 0;
  }


  __computeDisplayNamePlaceholder(displayName) {
    return displayName ? displayName : 'No display name';
  }

  __computeEmailPlaceholder(email) {
    return email ? email : 'No email';
  }


  __computeEmailLabel(verified) {
    return verified ? 'Email Verified' : 'Email';
  }


  __computePhonePlaceholder(number) {
    return number ? number : 'No phone number';
  }


  __computePhotoURLPlaceholder(url) {
    return url ? url : 'No profile photo';
  }


  __computeUnsavedEdits(obj) {
    if (!obj || !obj.base) { return false; }

    const {base: unsaved} = obj; 
    const values = Object.values(unsaved);

    return values.some(val => val && val.trim());
  }


  async __currentUserChanged(user) {
    try {
      if (user && user.uid) {
        const {uid} = user;

        this._userMeta = await services.get({coll: 'users', doc: uid});

        // TODO:
        //      Create a more generic way to get user store credit data.
        //      Should be included in user's data document.

        // this._credit   = await getCredit(uid);
      }
    }
    catch (error) { console.error(error); }
  }


  __profileImgFix() {
    const imgSizedImgDiv = this.select('#sizedImgDiv', this.$.profilePhoto);
    const imgPlaceholder = this.select('#placeholder', this.$.profilePhoto);
    imgSizedImgDiv.style.borderRadius   = '50%';
    imgPlaceholder.style.borderRadius   = '50%';
    imgPlaceholder.style.overflow       = 'hidden';
    imgPlaceholder.style.backgroundClip = 'border-box';
  }


  __editInputChanged(event) {
    const {kind, value} = event.detail;
    this.set(`_unsavedEditsObj.${kind}`, value);
  }


  __reset() {
    this.$.content.classList.remove('content-enter');
  }


  async __reauthenticate() {
    try {
      await this.$.overlay.close();

      this.fire('account-reauth-needed');
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

      this.fire('account-signout-button');
    }
    catch (error) { 
      if (error === 'click debounced') { return; }
      console.error(error); 
    }
  }


  async __fabClicked() {
    try {
      await this.clicked();

      if (!this.user) {
        throw new Error('User is not logged in before attempting to add/edit the profile pic.');
      }

      await import(
        /* webpackChunkName: 'app-camera-system' */ 
        '@longlost/app-camera/app-camera-system.js'
      );

      await this.$.camera.openChooser();
    }
    catch (error) { 
      if (error === 'click debounced') { return; }
      console.error(error); 

      warn('Sorry, the camera failed to load.');
    }
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

      // Bail if a required value is empty, address2 not required.
      if (!value && (kind !== 'address2' || !value.trim())) {
        await warn('Sorry, this is a required field.');
        stopSpinner();
      }

      const saveEditToDb = async str => {
        const oldVal = this._userMeta[kind];

        if (oldVal !== value) { // Ignore if there is no change.
          const data = {};
          data[kind] = value;

          await services.set({coll: 'users', doc: this.user.uid, data});

          this.set(`_userMeta.${kind}`, value);
          const event = await confirm(`${str} updated.`);
          const undo  = event.detail.canceled;

          if (undo) {
            data[kind] = oldVal || null; // Firebase does not accept undefined as a value.

            await services.set({coll: 'users', doc: this.user.uid, data});

            this.set(`_userMeta.${kind}`, oldVal);
            reset();

            await stopSpinner();

            message('Change undone.');

            return;
          }
        }

        stopSpinner();
      };

      switch (kind) {
        case 'displayName':
          const previousDisplayName = this.user.displayName;

          // Profile obj === {displayName: nullable string, photoURL: nullable string}.
          // The profile's displayName and photoURL to update.
          await this.user.updateProfile({
            displayName: value, 
            photoURL:    this.user.photoURL
          });

          this.notifyPath('user.displayName'); // Cannot write to Firebase user.

          const event = await confirm('Display name updated.');
          const undo  = event.detail.canceled;

          if (undo) {
            await this.user.updateProfile({
              displayName: previousDisplayName, 
              photoURL:    this.user.photoURL
            });

            this.notifyPath('user.displayName');
            await stopSpinner();

            reset();
            message('Change undone.');
          } 
          else {
            stopSpinner();
          }

          break;

        case 'password':
          this._newPassword = value;

          await stopSpinner();
          await this.__openPasswordModal();

          break;

        case 'email':

          await this.user.updateEmail(value);

          // Sends an email to user for them to verify.
          await this.__sendVerificationEmail();
          this.notifyPath('user.email');

          await stopSpinner();
          message('Email updated.');

          break;

        case 'phoneNumber':
          await saveEditToDb('Phone number');
          break;

        case 'fullName':
          await saveEditToDb('Full name');
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
        if (val && (key === 'address2' || val.trim())) {
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
        await this.user.updateProfile({
          displayName, 
          photoURL: this.user.photoURL
        });

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
        this.set(`_userMeta.${key}`, value);
      });

      // Reset obj.
      this.set('_unsavedEditsObj', {});

      await message('Account updated.');
    }
    catch (error) {
      await this.__handleFirebaseErrors(error);
    }
    finally {
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

      // Delete and signout user.
      await services.deleteDocument({coll: 'users', doc: this.user.uid});
      await this.user.delete();
      await schedule(); 
      await this.$.overlay.close();
    }
    catch (error) {
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
      this.$.content.classList.add('content-enter');
      await schedule();
      this._headerImg = this.headerImage;
    }
    catch (error) { console.error(error); }
  }

}

window.customElements.define(AppAccount.is, AppAccount);
