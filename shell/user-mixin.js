
/**
  * `UserMixin`
  *
  *   User state originating from 'auth/app-auth.js' is handled here.
  * 
  *   Anytime a user is logged in, setup a subscription to their
  *   corresponding additional data object that's kept in Firestore.
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  **/


import {appUserAndData} from 'config.js';

import {
  hijackEvent,
  schedule,
  message,
  wait
} from '@longlost/app-core/utils.js';

import firebaseReady from '@longlost/app-core/firebase.js';


export const UserMixin = superClass => {

  return class UserMixin extends superClass {
    
    static get properties() {
      return {

        // For whitelisted apps such as CMS.
        accountRequired: Boolean,

        // Show 'person-outline' icon when no user is logged in.
        // Show 'account-circle' icon when user is logged in.
        _accountIcon: {
          type: String,
          computed: '__computeAccountIcon(_user)'
        },    

        // User's profile avatar photo.
        //
        // Favors the 'avatar' obj from '_userData', which contains the 
        // most up-to-date data from the live subscription. 
        _avatar: {
          type: Object,
          computed: '__computeAvatar(_user, _userData)'
        },

        // Very important to have an inital value set as new users
        // will have an undefined value from the db. The change
        // from false to undefined triggers '__onboardedVerifiedChanged'
        // to run for new users.
        _onboarded: {
          type: Boolean,
          value: false, 
          computed: '__computeOnboarded(_userData.onboarded)'
        },

        // Drives 'dom-if' template that wraps 'app-quick-start'
        _stampQuickStart: Boolean,

        _user: { 
          type: Object,
          value: null,
          observer: '__userChanged'
        },

        _userData: Object,

        _userDataUnsub: Object,

        // Very important to have an inital value set as new users
        // will have an undefined value from the db. The change
        // from false to undefined triggers '__onboardedVerifiedChanged'
        // to run for new users.
        _verifiedOrVerificationSent: {
          type: Boolean,
          value: false,
          computed: '__computeVerifiedOrVerificationSent(_user.emailVerified, _userData.verificationEmailSent)'
        }

      };
    }

    
    static get observers() {
      return [ 
        '__onboardedVerifiedChanged(_onboarded, _verifiedOrVerificationSent)',
        '__userDataChanged(_userData)'
      ];
    }
    

    __computeAccountIcon(user) {

      if (!user) { return 'app-shell-icons:person-outline'; }

      return 'app-shell-icons:account-circle';
    }


    __computeAvatar(user, userData) {

      if (!user || !userData) { return; }

      // 'avatar' is null when user chooses to remove their avatar.
      if (userData.avatar === undefined) { return user.photoURL; }

      return userData.avatar;
    }

    // Used to latch this value, so '__onboardedVerifiedChanged'
    // does not run each time '_userData' is set in the subscription
    // callback.
    __computeOnboarded(onboarded) {

      return onboarded;
    }

    // Used to latch this value, so '__onboardedVerifiedChanged'
    // does not run each time '_userData' is set in the subscription
    // callback.
    __computeVerifiedOrVerificationSent(verified, verificationSent) {

      return verified || verificationSent;
    }


    async __userChanged(newVal, oldVal) { 

      if (newVal && !oldVal) { // Only run once, when user is initialized.

        if (this.accountRequired) { // Whitelist apps.
          await this.__hideAccountRequiredOverlay();
        }

        this.__startUserDataSub(newVal);
      }
      else if (!newVal) {

        if (this.accountRequired) { // Whitelist apps.
          await this.__showAccountRequiredOverlay();
        }

        this.__unsubFromUserData();
      }

      this.fire('app-shell-user-changed', {value: newVal});
    }


    __userDataChanged(data) {

      this.fire('app-shell-user-data-changed', {value: data});
    }

    // NOT passing '_user' and '_userData' here since we don't
    // want this method running repeatedly when other values change.
    async __onboardedVerifiedChanged(onboarded, verifiedOrVerificationSent) {

      // User logged out, or an error fetching _userData.
      if (!this._user || !this._userData) { return; } 

      // Welcome returning users and those who have completed
      // the quick start guide.
      if (onboarded && verifiedOrVerificationSent) {        

        const {displayName} = this._user;

        const name = displayName ? ` ${displayName}` : '';

        message(`Welcome${name}!`);
      }

      // Send out an email account verification email to new users.
      if (!verifiedOrVerificationSent) {

        const {loadAuth}              = await firebaseReady();
        const {sendEmailVerification} = await loadAuth();

        const {set} = await import(
          /* webpackChunkName: 'services' */ 
          '@longlost/app-core/services/services.js'
        );    

        await sendEmailVerification(this._user);

        // Do NOT await this promise. Fall through so the
        // following 'if' statement picks up the NEXT
        // invocation of this callback, after which, the 
        // user data is fully updated. Doing so avoids
        // jank/broken quick start overlay animations.
        set({
          coll: 'users',
          doc:   this._user.uid,
          data: {verificationEmailSent: true}
        });
      }

      // Open the quick start guide for new users.
      //
      // Wait until AFTER 'verificationEmailSent' has been set
      // from the previous invocation, to avoid jank that
      // breaks the quickstart overlay animation.
      if (!onboarded && verifiedOrVerificationSent) {

        this.__openQuickStart();
      }
    }


    __drawerAccountSelectedHandler(event) {

      hijackEvent(event);

      if (this._user) {
        this.__prepToOpenOverlay({id: 'account'});
      }
      else {
        this.showAuthUI();
      }
    }


    async __accountReauthNeededHandler(event) {

      try {
        hijackEvent(event);

        await this.__signOut();      

        this.showAuthUI();
      }
      catch (error) {
        console.warn('__accountReauthNeededHandler error: ', error);
      }
    }


    __accountSignoutClickedHandler(event) {

      hijackEvent(event);

      this.__signOut();
    }


    __authAccountBtnHandler(event) {

      hijackEvent(event);

      this.__prepToOpenOverlay({id: 'account'});
    }


    __authUserHandler(event) {

      hijackEvent(event);

      this._user = event.detail.user;
    }


    __accountUserDeletedHandler(event) {

      hijackEvent(event);

      this._autoColorMode  = true;
      this._persistence    = appUserAndData.trustedDevice;
      this._quickStartPage = 'welcome';
    }


    __avatarClickedHandler(event) {

      hijackEvent(event);

      this.showAuthUI();
    }


    async __quickStartClosedHandler(event) {

      hijackEvent(event);

      this._stampQuickStart = false;

      const {set} = await import(
        /* webpackChunkName: 'services' */ 
        '@longlost/app-core/services/services.js'
      );

      set({
        coll: 'users',
        doc:   this._user.uid,
        data: {onboarded: true}
      });
    }


    __quickStartPageHandler(event) {

      hijackEvent(event);

      this._quickStartPage = event.detail.value;
    }


    async __showAccountRequiredOverlay() {

      try {
        this.$.accountRequiredOverlay.style.display = 'flex';

        await schedule();

        this.$.accountRequiredOverlay.classList.add('show-account-required');

        return wait(200);
      }
      catch (error) {
        console.error(error);
      }
    }


    async __hideAccountRequiredOverlay() {

      try {
        this.$.accountRequiredOverlay.classList.remove('show-account-required');

        await wait(200);

        this.$.accountRequiredOverlay.style.display = 'none';
      }
      catch (error) {
        console.error(error);
      }
    }


    async __startUserDataSub(user) {

      if (this._userDataUnsub) { return; } // Already subscribed.

      const {subscribe} = await import(
        /* webpackChunkName: 'services' */ 
        '@longlost/app-core/services/services.js'
      );

      const callback = data => {

        this._userData = data;
      };

      const errorCallback = error => {

        this._userData = undefined;
        console.error(error);
      };
   
      this._userDataUnsub = await subscribe({
        callback,
        coll: 'users',
        doc:   user.uid,
        errorCallback
      });
    }


    __unsubFromUserData() {

      if (this._userDataUnsub) {
        this._userDataUnsub();
        this._userDataUnsub = undefined;
        this._userData      = undefined;
      }
    }


    async __openQuickStart() {

      await import(
        /* webpackChunkName: 'app-quick-start' */ 
        '../guide/app-quick-start.js'
      );

      await this.__waitForTemplateToStamp('_stampQuickStart', 'qsTemplate');

      return this.select('#quickStart').open();
    }    


    __signOut() {

      return this.$.auth.signOut();
    }


    __showAuthUIHandler(event) {

      hijackEvent(event);

      this.showAuthUI();
    }


    showAuthUI() {

      return this.$.auth.showAuthUI();
    }

  };
};
