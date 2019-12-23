/**
 * 
 *  `app-account`
 *  prebuilt overlay to handle user account editing and updating
 *
 *  @customElement
 *  @polymer
 *  @demo demo/index.html
 *
 *
 */

import {
  AppElement, 
  html
}                        from '@longlost/app-element/app-element.js';
import {
  confirm,
  listen,
  message,
  schedule,
  warn
}                        from '@longlost/utils/utils.js';
import services          from '@longlost/services/services.js';
import htmlString        from './app-account.html';
import '@longlost/app-header-overlay/app-header-overlay.js';
import '@longlost/edit-input/edit-input.js';
import '@longlost/shipping-inputs/shipping-inputs.js';
import '@longlost/app-spinner/app-spinner.js';
import '@longlost/responsive-image/responsive-image.js';
import '@longlost/app-icons/app-icons.js';
import '@polymer/iron-image/iron-image.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-fab/paper-fab.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/gold-phone-input/gold-phone-input.js';
import '@polymer/paper-ripple/paper-ripple.js';
import '@polymer/paper-button/paper-button.js';
// ./password-modal.js is dynamically imported
// ./reauth-modal.js is dynamically imported
// ./delete-modal.js is dynamically imported


// get credit val from user account
const getCredit = async uid => {
  try {
    const {credit} = await services.get({
      coll: `users/${uid}/credit`,
      doc:  'asg'
    });
    return credit;
  }
  catch (error) {
    if (
      error.message &&
      error.message.includes('No such document!')
    ) { 
      return '0.00';
    }
    else {
      console.error(error);
    }
  }
};


class AppAccount extends AppElement {
  static get is() { return 'app-account'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {
      // from app-user
      user: Object,
      // must be webpack responsive-loader object
      headerImage: String,

      headerSize: {
        type: Number,
        value: 4
      },

      _credit: {
        type: String,
        value: '0.00'
      },

      // regular firestore user data inputs
      _normalKeys: {
        type: Array,
        readOnly: true,
        value: [
          'address1', 
          'address2', 
          'city', 
          'country', 
          'phone', 
          'state', 
          'zip'
        ]
      },
      // save all flow control by password modal
      _passwordPromiseRejecter: Object,
      // save all flow control by password modal
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
          phone:    '',
          fullName: '',
          address1: '', 
          address2: '',
          city:     '',
          state:    '',
          zip:      '',
          country:  '',
        })
      }

    };
  }


  static get observers() {
    return [
      '__currentUserChanged(user)'
    ];
  }
  

  async connectedCallback() {
    super.connectedCallback();

    this.__setupListeners();
    this.__profileImgFix();
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
    const keys = Object.keys(unsaved);
    return keys.some(key => unsaved[key] && unsaved[key].trim());
  }


  async __currentUserChanged(user) {
    try {
      if (user && user.uid) {
        const {uid} = user;
        this._userMeta = await services.get({coll: 'users', doc: uid});
        this._credit   = await getCredit(uid);
      }
    }
    catch (error) { console.error(error); }
  }


  __setupListeners() {
    listen(
      this, 
      'edit-input-changed', 
      this.__editInputChanged.bind(this)
    );
    listen(
      this, 
      'edit-input-confirm-edit', 
      this.__confirmEdit.bind(this)
    );
    listen(
      this.$.passwordModal, 
      'password-modal-confirm', 
      this.__passwordModalConfirm.bind(this)
    );
    listen(
      this.$.reauthModal, 
      'reauth-modal-reauth', 
      this.__reauthenticate.bind(this)
    );
    listen(
      this.$.deleteModal, 
      'delete-modal-delete', 
      this.__deleteUser.bind(this)
    );
    listen(
      this.$.unsavedEditsModal, 
      'unsaved-edits-modal-exit', 
      this.__exitWithoutSavingChanges.bind(this)
    );
    listen(
      this.$.unsavedEditsModal, 
      'unsaved-edits-modal-save-all', 
      this.__saveAll.bind(this)
    );
    listen(
      this.$.overlay,
      'header-overlay-back',
      this.__backButtonClicked.bind(this)
    );
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
      this.__reset();
      this.fire('account-reauth-needed');
    }
    catch (error) { console.error(error); }
  }


  async __openUnsavedEditsModal() {
    try {
      await import(
        /* webpackChunkName: 'account-unsaved-edits-modal' */ 
        './unsaved-edits-modal.js'
      );
      this.$.unsavedEditsModal.open();
    }
    catch (error) { console.error(error); }
  }


  async __exitWithoutSavingChanges() {
    try {
      await this.$.overlay.back();
      this.__reset();
    }
    catch (error) { console.error(error); }
  }


  async __backButtonClicked() {
    try {
      // already has this.clicked from app-header-overlay.js
      if (this._unsavedEdits) {
        this.__openUnsavedEditsModal();
        return;
      }
      await this.$.overlay.back();
      this.__reset();
    }
    catch (error) { console.error(error); }
  }


  async __signOutButtonClicked() {
    try {
      await this.clicked();
      await this.$.overlay.close();
      this.fire('account-signout-button');
      this.__reset();
    }
    catch (error) { 
      if (error === 'click debounced') { return; }
      console.error(error); 
    }
  }


  async __fabClicked() {
    try {
      await this.clicked();
      warn(`Well this is embarassing...  Sorry, we're still working on this feature.`);
    }
    catch (error) { 
      if (error === 'click debounced') { return; }
      console.error(error); 
    }
  }


  async __openPasswordModal() {
    try {
      await import(
        /* webpackChunkName: 'account-password-modal' */ 
        './password-modal.js'
      );
      this.$.passwordModal.open();
    }
    catch (error) { console.error(error); }
  }


  async __openReauthenticateModal() {
    try {
      await import(
        /* webpackChunkName: 'account-reauth-modal' */ 
        './reauth-modal.js'
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
        message('Your password has been updated');
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
      // bail if a required value is empty, address2 not required
      if (!value && (kind !== 'address2' || !value.trim())) {
        await warn('Sorry, this is a required field.');
        stopSpinner();
      }

      const saveEditToDb = async str => {
        const oldVal = this._userMeta[kind];
        if (oldVal !== value) { // ignore if there is no change
          const data = {};
          data[kind] = value;
          await services.set({coll: 'users', doc: this.user.uid, data});
          this.set(`_userMeta.${kind}`, value);
          const event = await confirm(`${str} updated.`);
          const undo  = event.detail.canceled;
          if (undo) {
            data[kind] = oldVal;
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
          // profile obj === {displayName: nullable string, photoURL: nullable string}
          // The profile's displayName and photoURL to update.
          await this.user.updateProfile({
            displayName: value, 
            photoURL:    this.user.photoURL
          });
          this.notifyPath('user.displayName'); // cannot write to firebase user
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
          // sends an email to user for them to verify
          await this.__sendVerificationEmail();
          this.notifyPath('user.email');
          await stopSpinner();
          message('Email updated.');
          break;
        case 'phone':
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
        // password modal controls how this promise resolves
        const promise = new Promise((resolve, reject) => {
          this._passwordPromiseResolver = resolve;
          this._passwordPromiseRejecter = reject;
        });        
        await promise;
      }
      
      const normalSaves = this._normalKeys.reduce((accum, key) => {
        const val = this._unsavedEditsObj[key];
        // address2 can be empty string, not required
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
        // profile obj === {displayName: nullable string, photoURL: nullable string}
        // The profile's displayName and photoURL to update.
        await this.user.updateProfile({
          displayName, 
          photoURL: this.user.photoURL
        });
        this.notifyPath('user.displayName'); // cannot write to firebase user
      };

      const saveEmail = async email => {
        await this.user.updateEmail(email);
        // sends an email to user for them to verify
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
      // update input vals
      const savesKeys = Object.keys(normalSaves);
      savesKeys.forEach(key => {
        const value = normalSaves[key];
        this.set(`_userMeta.${key}`, value);
      });
      // reset obj
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
      // delete and signout user   
      await services.deleteDocument({coll: 'users', doc: this.user.uid});
      await this.user.delete();
      await services.signOut(); 
      await schedule(); 
      await this.$.overlay.close();
      this.__reset();
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
        './delete-modal.js'
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