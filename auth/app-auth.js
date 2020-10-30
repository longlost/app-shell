
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

import {appUserAndData}    from 'app.config.js';
import {firebase}          from '../boot/boot.js';
import {message, schedule} from '@longlost/utils/utils.js';
import {AppElement, html}  from '@longlost/app-element/app-element.js';
import htmlString          from './app-auth.html';
import 'firebase/auth';
import '@longlost/app-overlays/app-modal.js';
import '@polymer/paper-button/paper-button.js';
// lazy loading signinModal for better first paint.


class AppAuth extends AppElement {
  static get is() { return 'app-auth'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

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

    this.__initFirebase();
  }


  __userChanged(user) {
    this.fire('auth-userchanged', {user});
  }


  __firebaseAuthChanged() {
    firebase.auth().onAuthStateChanged(async user => {

      if (user) {
        const {displayName} = user;
        const name          = displayName ? ` ${displayName}` : '';
        message(`Welcome${name}!`);
      }

      this._user = user;

    }, error => {
      console.error(error);
      this._user = null;
    });
  }


  async __initFirebase() {
    const persistenceType = () => {

      // local:   User and data reset only when signed out explicitly.
      // session: User and data persisted for current session or tab.
      // none:    User and data cleared on window refresh.
      if (appUserAndData.trustedDevice) {
        return firebase.auth.Auth.Persistence.LOCAL;
      }

      return firebase.auth.Auth.Persistence.SESSION;
    };

    firebase.auth().useDeviceLanguage();

    await firebase.auth().setPersistence(persistenceType());

    this.__firebaseAuthChanged();
  }

  // Anonymous user upgraded account.
  __userUpgraded(event) {
    this._user = event.detail.user;
  }


  __closeAccountModal() {
    return this.$.accountModal.close();
  }


  async __accountModalClicked() {
    try {
      await this.clicked();
      return this.__closeAccountModal();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __accountButtonClicked() {
    try {
      await this.clicked();
      await this.__closeAccountModal();
      this.fire('auth-account-button');
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }  
  }


  async __signOutButtonClicked() {
    try {
      await this.clicked();
      await this.signOut();
      return this.__closeAccountModal();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async showAuthUI() {

    if (this._user) {
      await schedule();
      return this.$.accountModal.open();
    }

    // Lazy load signin-modal for a large perf boost.
    await import(
      /* webpackChunkName: 'siginin-modal' */
      './signin-modal.js'
    );

    return this.$.signinModal.open();
  }


  async signOut() {
    try {

      await firebase.auth().signOut();

      if (this.$.signinModal.reset) {
        this.$.signinModal.reset();
      }
      
      message('You are signed out.');
    }
    catch (error) {
      console.error(error);
    }
  }

}

window.customElements.define(AppAuth.is, AppAuth);
