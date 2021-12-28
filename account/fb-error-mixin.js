
/**
  * `FbErrorMixin`
  *
  *   Firebase specific error handling for `app-account`.
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  **/


// `account-reauth-modal` lazy loaded.


import {warn} from '@longlost/app-core/utils.js';


export const FbErrorMixin = superClass => {

  return class FbErrorMixin extends superClass {


    static get properties() {
      return {

        // Flow control for password modal during attempted password saves.
        _passwordPromiseRejecter: Object

      };
    }


    async __openReauthenticateModal() {

      try {
        await import(
          /* webpackChunkName: 'account-reauth-modal' */ 
          './account-reauth-modal.js'
        );

        await this.select('#reauthModal').open();

        if (this._passwordPromiseRejecter) {

          await schedule();
          
          this._passwordPromiseRejecter('reauth needed');
        }

        return this.select('#passwordModal')?.close();
      }
      catch (error) { console.error(error); }
    }


    async __weakPassword() {

      this.select('#inputs').showWeakPasswordError();

      await this.select('#passwordModal').close();

      return warn('Please create a stronger password.');
    }


    __invalidEmail() {

      this.select('#inputs').showInvalidEmailError();

      return warn('The email address is invalid. Please try again.');
    }


    __emailAlreadyInUse() {

      this.select('#inputs').showEmailInUseError();

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

  };
};
