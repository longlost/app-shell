
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


import {AppElement, html}  from '@longlost/app-core/app-element.js';
import {message, schedule} from '@longlost/app-core/utils.js';
import {initAuth}          from './auth.js';
import htmlString          from './app-auth.html';
import '@longlost/app-core/app-shared-styles.js';
import '@longlost/app-images/avatar-image.js';
import '@longlost/app-overlays/app-modal.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';
import '../shared/app-shell-icons.js';
// Lazy loading `signin-modal` for better loading performance.


class AppAuth extends AppElement {

  static get is() { return 'app-auth'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      avatar: Object,

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

  // Anonymous user upgraded account.
  __userUpgraded(event) {

    this._user = event.detail.user;
  }


  __closeAccountModal() {

    return this.$.accountModal.close();
  }


  async __accountModalClicked() {

    try {
      await  this.clicked();
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
      await  schedule();
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

      const {auth, signOut} = await initAuth();

      await signOut(auth);

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
