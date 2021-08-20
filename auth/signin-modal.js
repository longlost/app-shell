
/**
  * 
  * `signin-modal`
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

import firebaseReady from '@longlost/app-core/firebase.js';

import {
  hijackEvent, 
  schedule
} from '@longlost/app-core/utils.js';

import {htmlLiteral} from '@polymer/polymer/lib/utils/html-tag.js';

import styles          from 'firebaseui/dist/firebaseui.css';
import * as firebaseui from 'firebaseui';


import '@longlost/app-overlays/app-modal.js';
// 'services.js' lazy-loaded.


class SigninModal extends AppElement {
  
  static get is() { return 'signin-modal'; }

  static get template() {
    return html`
      <style>

        #modal {
          --modal-card-background-color: white;
          --modal-card-content-padding:  0px;
        }

        #firebaseuiAuthContainer {
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
                 on-overlay-reset="reset">

        <div id="firebaseuiAuthContainer" 
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
      '__userChanged(user)'
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


  __userChanged(user) {

    if (user === null) {

      // Needed for redirected auth types like signin with Google.
      if (
        (this._firebaseUi && this._firebaseUi.isPendingRedirect()) || 
        !appUserAndData.anonymous
      ) {
        this.open();
      }
    } 
    else {
      this.close();
    }
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
              '@longlost/app-core/services/services.js'
            );

            const anonymousUserData = await services.get({coll, doc: this.user.uid});

            // This will trigger onAuthStateChanged listener which
            // could trigger a redirect to another page.
            // Ensure the upgrade flow is not interrupted by that callback
            // and that this is given enough time to complete before
            // redirection.
            const newUser = await signInWithCredential(auth, cred);

            // Original Anonymous Auth instance now has the new user.
            await services.set({coll, doc: newUser.uid, data: anonymousUserData});

            // Delete anonymnous user.
            await this.user.delete();

            this.fire('user-upgraded', {user: newUser});

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



      signInFlow: 'redirect', // Or 'popup', must use redirect for single page apps.

      signInOptions: [

        // Leave the lines as is for the providers you want to offer your users.
        {
          provider: EmailAuthProvider.PROVIDER_ID,

          // Whether the display name should be displayed in the Sign Up page.
          requireDisplayName: true
        }//,


        // Google oauth is currenly inop on iOS PWA modes.
        // It causes all sorts of issues even if we test 
        // for ios standalone mode in js and only use email signup
        // until it is fixed, DO NOT USE! 
        // as of 1/9/2019 "firebaseui": "^3.5.1" CB        
        // GoogleAuthProvider.PROVIDER_ID,


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

    const {loadAuth} = await firebaseReady();
    const fbAuth     = await loadAuth();

    this._firebaseUIConfig = this.__getFirebaseUiConfig(fbAuth, firebaseui);
    this._firebaseUi       = new firebaseui.auth.AuthUI(fbAuth.auth);
  }


  __startFirebaseUI() {

    if (this.user && this.user.isAnonymous) {
      this._firebaseUIConfig.autoUpgradeAnonymousUsers = true;
    }

    // #firebaseuiAuthContainer found in Light DOM.
    // The start method will wait until the DOM is loaded.
    this._firebaseUi.start(this.$.firebaseuiAuthContainer, this._firebaseUIConfig);
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

    if (!this._firebaseUi) {
      await this.__setupFirebaseUI();
    }

    if (!this._firebaseUi.isPendingRedirect()) {

      // Close and reset overlay if user clicks outside of chooser buttons.
      this.$.modal.addEventListener('click', this.__modalClicked);
    }

    // Widget sometimes doesnt appear unless we wait another animation cycle.
    await schedule();

    this.__startFirebaseUI();
  }


  reset() {

    if (this._firebaseUi) {
      this._firebaseUi.reset();
    }
  }

}

window.customElements.define(SigninModal.is, SigninModal);
