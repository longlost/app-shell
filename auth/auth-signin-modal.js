
/**
  * 
  * `auth-signin-modal`
  *
  *   Modal wrapper for firebaseui authentication.
  *
  * 
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  **/


import {
  appUserAndData,      
  firebaseConfig,
  privacyPolicyUrl,
  termsOfServiceUrl     
} from 'config.js';

import {
  AppElement, 
  html
} from '@longlost/app-core/app-element.js';

import {
  hijackEvent, 
  schedule
} from '@longlost/app-core/utils.js';

import {
  firebaseui, 
  styles
} from '@longlost/app-core/firebaseui.js';

import {htmlLiteral} from '@polymer/polymer/lib/utils/html-tag.js';
import {initAuth}    from './auth.js';
import '@longlost/app-overlays/app-modal.js';

// 'services.js' lazy-loaded.


class AuthSigninModal extends AppElement {
  
  static get is() { return 'auth-signin-modal'; }

  static get template() {
    return html`
      <style>

        #modal {
          --modal-card-background-color: white;
          --modal-card-content-padding:  0px;
        }

        #container {
          min-height: 368px;
          width:      240px;
        }

        ${this.stylePartial}

        /* Input underlines, primary buttons. */
        /* Won't work withough !important. */
        .firebaseui-textfield.mdl-textfield .firebaseui-label::after,
        .mdl-button--raised.mdl-button--colored,
        .mdl-button.mdl-button--colored {

          /* Default color is material design dark blue. */
          background-color: var(--app-primary-color, #3f51b5) !important;
        }

        /* Secondary buttons. */
        /* Won't work withough !important. */
        .mdl-button--primary.mdl-button--primary {

          /* Default color is material design dark blue. */
          color: var(--app-primary-color, #3f51b5) !important;
        }

      </style>


      <app-modal id="modal"
                 on-overlay-reset="__overlayResetHandler">

        <div id="container" 
             slot="card-content-slot" 
             on-click="__cardClicked">
        </div>

      </app-modal>
    `;
  }


  static get stylePartial() {
    return htmlLiteral([styles.toString()]);
  }


  static get properties() {
    return {

      // Must initalize firebaseui to check for 
      // pending redirects when app boots up.
      checkedForRedirect: Boolean,

      //   user.displayName
      //   user.email
      //   user.emailVerified
      //   user.photoURL
      //   user.uid
      //   user.phoneNumber
      //   user.providerData
      //   user.getIdToken().
      //     then(accessToken => console.log('accessToken: ', accessToken));
      user: Object,

      // Firebaseui instance.
      _firebaseUi: Object,

      // firebaseui-web config.
      // https://github.com/firebase/firebaseui-web
      _firebaseUIConfig: Object

    };
  }


  static get observers() {
    return [
      '__checkForRedirectChanged(checkedForRedirect)',
      '__userFirebaseuiChanged(user, _firebaseUi)'
    ];
  }


  constructor() {

    super();

    this.__modalClicked = this.__modalClicked.bind(this);
  }


  disconnectedCallback() {

    super.disconnectedCallback();

    if (this.$.modal) {
      this.$.modal.removeEventListener('click', this.__modalClicked);
    }
  }

  // Needed for redirected federated auth types like signin with Google.
  async __checkForRedirectChanged(checked) {

    if (checked) { return; }

    const ui = await this.__setupFirebaseUI();

    if (ui.isPendingRedirect()) {
      this.open();
    }
    else {
      this.__reset();
    }       
  }


  __userFirebaseuiChanged(user, ui) {

    if (!ui) { return; }

    if (user === null) {

      // Only open if there is no pending redirect.
      if (!ui.isPendingRedirect() && !appUserAndData.anonymous) {
        this.open();
      }
    } 
    else if (typeof user === 'object') {
      this.close();
    }
  }


  async __deleteInstance() {

    if (this._firebaseUi) {

      await this._firebaseUi.delete();

      this._firebaseUi = undefined;
    }
  }


  async __reset() {

    await this.__deleteInstance();

    this.fire('signin-modal-reset');
  }


  __overlayResetHandler() {

    this.__reset();
  }

  // Ignore card clicks.
  __cardClicked(event) {

    hijackEvent(event);
  }


  __getFirebaseUiConfig(fbAuth, ui) {
 
    const {
      EmailAuthProvider,
      FacebookAuthProvider,
      GithubAuthProvider,
      GoogleAuthProvider,
      TwitterAuthProvider,
      auth,
      deleteUser,
      signInWithCredential
    } = fbAuth;

    return {

      // Whether to upgrade anonymous users should be explicitly provided.
      // The user must already be signed in anonymously before FirebaseUI is
      // rendered.
      // Imperitively set to true if user.isAnonymous is true in __startFirebaseUI.
      autoUpgradeAnonymousUsers: false,

      callbacks: {

        signInSuccessWithAuthResult: () => {

          // Return type determines whether we (return false) 
          // continue the redirect automatically or whether we 
          // (return true) leave that to developer to handle.
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

            const {get, set} = await import(
              /* webpackChunkName: 'services' */ 
              '@longlost/app-core/services/services.js'
            );

            const anonymousUserData = await get({coll, doc: this.user.uid});

            // This will trigger onAuthStateChanged listener which
            // could trigger a redirect to another page.
            // Ensure the upgrade flow is not interrupted by that callback
            // and that this is given enough time to complete before
            // redirection.
            const newUser = await signInWithCredential(auth, cred);

            // Original Anonymous Auth instance now has the new user.
            await set({coll, doc: newUser.uid, data: anonymousUserData});

            // Delete anonymnous user.
            await deleteUser(this.user);

            this.fire('signin-modal-user-upgraded', {user: newUser});

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

      

      // Use firebaseui.auth.CredentialHelper.GOOGLE_YOLO for one-tap signin.
      // credentialHelper: ui.auth.CredentialHelper.NONE,


      // Must use 'redirect' for single page apps.
      signInFlow: 'redirect', // Or 'popup'.

      signInOptions: [

        {
          provider: EmailAuthProvider.PROVIDER_ID,

          // Whether the display name should be displayed in the Sign Up page.
          requireDisplayName: true
        },
       
        GoogleAuthProvider.PROVIDER_ID,


        // TODO:
        //      Signup for apple, fb, twitter and github auth

        // apple.com,
        // FacebookAuthProvider.PROVIDER_ID,
        // TwitterAuthProvider.PROVIDER_ID,
        // GithubAuthProvider.PROVIDER_ID
      ],

      // Terms of service url.
      tosUrl: termsOfServiceUrl,
      privacyPolicyUrl
    };
  }


  async __setupFirebaseUI() {

    if (this._firebaseUi) { return this._firebaseUi; }

    const fbAuth = await initAuth();

    this._firebaseUIConfig = this.__getFirebaseUiConfig(fbAuth, firebaseui);
    this._firebaseUi       = new firebaseui.auth.AuthUI(fbAuth.auth);

    return this._firebaseUi;
  }


  __startFirebaseUI() {

    if (this.user && this.user.isAnonymous) {
      this._firebaseUIConfig.autoUpgradeAnonymousUsers = true;
    }

    // The start method will wait until the DOM is loaded.
    this._firebaseUi.start(this.$.container, this._firebaseUIConfig);
  }


  async __modalClicked() {

    try {
      await this.clicked();
      await this.close();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  close() {

    return this.$.modal.close();
  }


  async open() {

    await this.$.modal.open();

    const ui = await this.__setupFirebaseUI();

    if (!ui.isPendingRedirect()) {

      // Close and reset overlay if user clicks outside of chooser buttons.
      this.$.modal.addEventListener('click', this.__modalClicked);
    }

    // Widget sometimes doesnt appear unless we wait another animation cycle.
    await schedule();

    this.__startFirebaseUI();
  }

}

window.customElements.define(AuthSigninModal.is, AuthSigninModal);
