
/**
  * 
  * `app-auth`
  *
  *   Wrapper for firebase and firebaseui authentication.
  *
  * Api:
  *
  *   Methods: 
  *
  *     signOut()             signout current user from firebase auth and services
  *
  *     showAuthUI()          show signup/signin firebaseui if no user
  *                           or show signout modal if ther is a current user
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
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
  schedule
} from '@longlost/app-core/utils.js';

import {initAuth} from './auth.js';
import htmlString from './app-auth.html';

// MUST load firebaseui to check for pending redirects
// from federated providers such as Google.
import './auth-signin-modal.js';

// Lazy loading action-modal for better loading performance.


class AppAuth extends AppElement {

  static get is() { return 'app-auth'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      avatar: Object,

      _checkedForRedirect: {
        type: Boolean,
        value: false
      },

      _stampActions: Boolean,

      _stampSignin: {
        type: Boolean,
        value: true
      },

      //   user.displayName
      //   user.email
      //   user.emailVerified
      //   user.photoURL
      //   user.uid
      //   user.phoneNumber
      //   user.providerData
      //   user.getIdToken().
      //     then(accessToken => console.log('accessToken: ', accessToken));
      _user: Object

    };
  }


  static get observers() {
    return [
      '__userChanged(_user)'
    ];
  }


  connectedCallback() {

    super.connectedCallback();    

    this.__initAuth();
  }


  __userChanged(user) {

    this.fire('auth-user-changed', {user});
  }


  async __initAuth() {

    const {auth, onAuthStateChanged} = await initAuth();

    onAuthStateChanged(auth, async user => {

      this._user = user;

    }, error => {

      console.error(error);

      this._user = null;
    });
  }


  __signinResetHandler() {

    this._checkedForRedirect = true;
    this._stampSignin        = false;
  }

  // Anonymous user upgraded account.
  __userUpgradedHandler(event) {

    this._user = event.detail.user;
  }


  __closeActionsModal() {

    return this.select('auth-actions-modal').close();
  }


  async __accountButtonClicked(event) {

    hijackEvent(event);

    // Fire event AFTER `auth-actions-modal` 
    // has closed and been garbage collected.
    await schedule();

    this.fire('auth-account-button');
  }


  __actionsClosedHandler() {

    this._stampActions = false;
  }


  async __signOutButtonClicked() {

    try {
      await this.signOut();
      
      return this.__closeActionsModal();
    }
    catch (error) {
      console.error(error);
    }
  }


  async __openActionsModal() {

    await import(
      /* webpackChunkName: 'auth-actions-modal' */
      './auth-actions-modal.js'
    );

    this._stampActions = true;

    await listenOnce(this.$.actionsTemplate, 'dom-change');

    return this.select('auth-actions-modal').open();
  }


  async __openSigninModal() {

    this._stampSignin = true;

    await listenOnce(this.$.signinTemplate, 'dom-change');

    return this.select('auth-signin-modal').open();
  }


  async showAuthUI() {

    if (this._user) {
      await  schedule();
      return this.__openActionsModal();
    }

    return this.__openSigninModal();
  }


  async signOut() {

    try {

      const {auth, signOut} = await initAuth();

      await signOut(auth);
      
      message('You are signed out.');
    }
    catch (error) {
      console.error(error);
    }
  }

}

window.customElements.define(AppAuth.is, AppAuth);
