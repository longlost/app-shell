/**
  * 
  * `app-auth`
  *
  *   Wrapper for firebase and firebaseui authentication.
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
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
  **/

import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import {
  appUserAndData,      
  firebaseConfig,
  privacyPolicyUrl,
  termsOfServiceUrl     
}                 from 'app.config.js';
import {
  hijackEvent,
  listen,
  message,
  schedule,
  topLevelOverlayController
}                 from '@longlost/utils/utils.js';
import htmlString from './app-auth.html';
import {firebase} from '@longlost/boot/boot.js';
import 'firebase/auth';
import '@longlost/app-modal/app-modal.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-card/paper-card.js';
import './app-auth.css'; // webpack css-loader injects this file into body
// lazy loading services, firebaseui and 'firebaseui/dist/firebaseui.css' for better first paint


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
      _user: Object,
      // div in index.hmtl used as a container for firebaseui
      _authOverlay: Object, 
      // firebaseui instance
      _firebaseUi: Object,
      // firebaseui-web config
      // https://github.com/firebase/firebaseui-web
      _firebaseUIConfig: Object

    };
  }


  connectedCallback() {
    super.connectedCallback();

    this.__initFirebase();
  }


  __getFirebaseUiConfig(ui) {
    return {
      // Whether to upgrade anonymous users should be explicitly provided.
      // The user must already be signed in anonymously before FirebaseUI is
      // rendered.
      // imperitively set to true if _user.isAnonymous is true in __startFirebaseUI
      autoUpgradeAnonymousUsers: false,

      callbacks: {
        signInSuccessWithAuthResult: () => {
          // Return type determines whether we (return false) continue the redirect automatically
          // or whether we (return true) leave that to developer to handle.
          return false;
        },
        // signInFailure callback must be provided to handle merge conflicts which
        // occur when an existing credential is linked to an anonymous user.
        signInFailure: async error => {
          try {
            // For merge conflicts, the error.code will be
            // 'firebaseui/anonymous-upgrade-merge-conflict'.
            if (error.code !== 'firebaseui/anonymous-upgrade-merge-conflict') {
              return;
            }
            // The credential the user tried to sign in with.
            const cred = error.credential;
            // The anonymous user data has to be copied to the non-anonymous user.
            // Save anonymous user data first.
            const coll = 'users';
            const {default: services} = await import(
              /* webpackChunkName: 'services' */ 
              '@longlost/services/services.js'
            );
            // parameters === {coll, doc}
            const anonymousUserData = await services.get({coll, doc: this._user.uid});
            // This will trigger onAuthStateChanged listener which
            // could trigger a redirect to another page.
            // Ensure the upgrade flow is not interrupted by that callback
            // and that this is given enough time to complete before
            // redirection.
            const newUser = await firebase.auth().signInWithCredential(cred);
            // Original Anonymous Auth instance now has the new user.
            // parameters === {coll, doc, data}
            await services.set({coll, doc: newUser.uid, data: anonymousUserData});
            // Delete anonymnous user.
            await this._user.delete();
            this._user = newUser;
            // FirebaseUI will reset and the UI cleared when this promise
            // resolves.
            // signInSuccess will not run. Successful sign-in logic has to be
            // run explicitly.
          }
          catch (error) {
            console.warn('signInFailure anonymous-upgrade-merge-conflict error: ', error);
          }
        }
      },


      // account chooser does not work in ios standalone/pwa mode
      // if you logout then try to log back in, 
      // as of 1/9/2019 "firebaseui": "^3.5.1" CB
      // credentialHelper: ui.auth.CredentialHelper.ACCOUNT_CHOOSER_COM,
      credentialHelper: ui.auth.CredentialHelper.NONE,



      signInFlow: 'redirect', // or 'popup', must use redirect for single page apps

      signInOptions: [
        // Leave the lines as is for the providers you want to offer your users.
        {
          provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
          // Whether the display name should be displayed in the Sign Up page.
          requireDisplayName: true
        }//,


        // google oauth is currenly inop on iOS PWA modes
        // it causes all sorts of issues even if we test 
        // for ios standalone mode in js and only use email signup
        // until it is fixed, DO NOT USE! 
        // as of 1/9/2019 "firebaseui": "^3.5.1" CB        
        // firebase.auth.GoogleAuthProvider.PROVIDER_ID,


        // TODO:
        //      Signup for fb, twitter and github auth


        // firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
        // firebase.auth.GithubAuthProvider.PROVIDER_ID
      ],
      // Terms of service url
      tosUrl: termsOfServiceUrl,
      privacyPolicyUrl
    };
  }


  async __setupFirebaseUI() {
    // this file has huge impact on first paint if loaded during bootup
    await import(
      /* webpackChunkName: 'firebaseui-css' */ 
      'firebaseui/dist/firebaseui.css'
    );
    const firebaseui = await import(
      /* webpackChunkName: 'firebaseui' */ 
      'firebaseui'
    );
    this._firebaseUIConfig = this.__getFirebaseUiConfig(firebaseui);
    this._firebaseUi       = new firebaseui.auth.AuthUI(firebase.auth());
  }


  __firebaseAuthChanged() {
    firebase.auth().onAuthStateChanged(async user => {
      if (user === null) {


        // needed for redirected auth types like signin with google 
        // commented for testing for smaller bundle sizes


        // if (!this._firebaseUi) {
        //   await this.__setupFirebaseUI();
        // }
        // if (this._firebaseUi.isPendingRedirect() || !appUserAndData.anonymous) {
        //   this.__openFirebaseAuthUI();
        // }

        // needed for redirected auth types like signin with google 
        // testing for smaller bundle sizes
        if ((this._firebaseUi && this._firebaseUi.isPendingRedirect()) || !appUserAndData.anonymous) {
          this.__openFirebaseAuthUI();
        }
      } 
      else {
        const {displayName} = user;
        const name          = displayName ? ` ${displayName}` : '';
        message(`Welcome${name}!`);

        if (this._authOverlay && this._authOverlay.isOpen()) {
          await this._authOverlay.close();
          this._firebaseUi.reset();
        }
      }
      this._user = user;
      this.fire('auth-userchanged', {user});
    }, error => console.error(error));
  }


  async __initFirebase() {
    const persistenceType = () => {
      // local:   user and data reset only when signed out explicitly, 
      // session: user and data persisted for current session or tab, 
      // none:    user and data cleared on window refresh
      if (appUserAndData.trustedDevice) {
        return firebase.auth.Auth.Persistence.LOCAL;
      }
      return firebase.auth.Auth.Persistence.SESSION;
    };
    firebase.auth().useDeviceLanguage();
    await firebase.auth().setPersistence(persistenceType());
    this.__firebaseAuthChanged();
  }

  // ignore card clicks
  __cardClicked(event) {
    hijackEvent(event);
  }


  __startFirebaseUI() {
    if (this._user && this._user.isAnonymous) {
      this._firebaseUIConfig.autoUpgradeAnonymousUsers = true;
    }
    // #firebaseuiAuthContainer found in index.html
    // The start method will wait until the DOM is loaded.
    this._firebaseUi.start('#firebaseuiAuthContainer', this._firebaseUIConfig);
  }


  async __openFirebaseAuthUI() {
    if (!this._authOverlay) {
      document.body.insertBefore(this.$.firebaseuiAuthOverlay, null);
      this._authOverlay = topLevelOverlayController('#firebaseuiAuthOverlay');
      listen(this.$.firebaseuiAuthContainer, 'click', this.__cardClicked.bind(this));
    }
    await this._authOverlay.open();    
    if (!this._firebaseUi) {
      await this.__setupFirebaseUI();
    }
    if (!this._firebaseUi.isPendingRedirect()) {
      // close and reset overlay if user clicks outside of chooser buttons
      listen(this._authOverlay, 'click', this.__authOverlayClicked.bind(this));
    }
    // widget sometimes doesnt appear unless we wait another animation cycle
    await schedule();
    this.__startFirebaseUI();
  }


  async __openLogoutModal() {
    await schedule();
    return this.$.modal.open();
  }


  async __authOverlayClicked() {
    try {
      await this.clicked();
      await this._authOverlay.close();
      this._firebaseUi.reset();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  __close() {
    return this.$.modal.close();
  }


  async __logoutModalClicked() {
    try {
      await this.clicked();
      return this.__close();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __accountButtonClicked() {
    try {
      await this.clicked();
      await this.__close();
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
      return this.__close();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  showAuthUI() {
    if (this._user) {
      return this.__openLogoutModal();
    }
    return this.__openFirebaseAuthUI();
  }


  async signOut() {
    try {
      const {default: services} = await import(
        /* webpackChunkName: 'services' */ 
        '@longlost/services/services.js'
      );
      await firebase.auth().signOut();
      if (this._firebaseUi) {
        this._firebaseUi.reset();
      }
      message('You are signed out.');
    }
    catch (error) {
      console.error(error);
    }
  }

}

window.customElements.define(AppAuth.is, AppAuth);
