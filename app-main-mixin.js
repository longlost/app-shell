
/**
  * `app-main-mixin`
  *
  *   Common top-level app logic.
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  **/

import './boot/boot.js';


import {AppElement}       from '@longlost/app-element/app-element.js';
import {listenOnce, warn} from '@longlost/utils/utils.js';
import '@longlost/app-icons/app-icons.js';
import './app-shell.js';


export const AppMainMixin = () => {
  return class AppMainMixin extends AppElement {


    static get properties() {
      return {

        // From app-shell-dark-mode-changed event.
        _darkMode: Boolean,

        // Set true on window's 'load' event.
        _loaded: {
          type: Boolean,
          value: false
        },

        // An object containing a group of functions that import overlay files.
        // To be overwritten by app-main implementation.
        _overlayImports: Object,

        // From app-shell-page-changed event.
        _page: String,

        // From app-shell via app-auth.
        _user: Object

      };
    }

    // These MUST be in constructor, as opposed to connectedCallback
    // in order to catch app-shell.js initializations, including page routing.
    constructor() {
      super();

      this.__windowLoadHandler();

      this.__pageChanged        = this.__pageChanged.bind(this);
      this.__darkModeChanged    = this.__darkModeChanged.bind(this);
      this.__userChanged        = this.__userChanged.bind(this);
      this.__openOverlayHandler = this.__openOverlayHandler.bind(this);

      this.addEventListener('app-shell-page-changed',      this.__pageChanged);
      this.addEventListener('app-shell-dark-mode-changed', this.__darkModeChanged);
      this.addEventListener('auth-userchanged',            this.__userChanged);
      this.addEventListener('open-overlay',                this.__openOverlayHandler);  
    }


    disconnectedCallback() {
      super.disconnectedCallback();

      this.removeEventListener('app-shell-page-changed',      this.__pageChanged);
      this.removeEventListener('app-shell-dark-mode-changed', this.__darkModeChanged);
      this.removeEventListener('auth-userchanged',            this.__userChanged);
      this.removeEventListener('open-overlay',                this.__openOverlayHandler); 
    }


    __pageChanged(event) {
      this._page = event.detail.value;
    }


    __darkModeChanged(event) {
      this._darkMode = event.detail.value;
    }


    __userChanged(event) {
      this._user = event.detail.user;
    }

    // May be called directly by implementation.
    async __openOverlay(id, detail) {
      try {
            
        if (!id) { 
          throw new Error('You must provide an id argument to the __openOverlay method.');
        }

        if (!this._overlayImports || !this._overlayImports[id]) { 
          throw new Error(`The _overlayImports class property must be an object
           with keys that match the id you pass into the __openOverlay method.`);
        }

        await this._overlayImports[id]();
        const overlay = this.$[id];

        if (!overlay) {
          throw new Error(`Could not find the overlay, check id's.`);
        }

        if (!overlay.open || typeof overlay.open !== 'function') {
          throw new Error('The overlay must have an open method.');
        }

        await overlay.open(detail); // Await here to catch errors here.
      }
      catch (error) {
        console.error(error);     
        warn('Sorry, we could not open the overlay.');
      }
    }


    async __openOverlayHandler(event) {
      try {
        if (!this._overlayImports) { return; } 

        const {id} = event.detail;

        if (!id || !this._overlayImports[id]) { 
          throw new Error(`The 'open-overlay' event must contain a detail object with an 'id' property.
            The 'id' property must match the id of the overlay element in dom and the correct key in _overlayImports`);
        }

        await this.__openOverlay(id, event.detail); // Await here to catch errors here.
      }
      catch (error) {
        console.error(error);     
        warn('Sorry, we could not open the overlay.');
      }
    }


    async __windowLoadHandler() {
      await listenOnce(window, 'load');

      this._loaded = true;
    }

  };
};
