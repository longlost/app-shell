
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


import '@longlost/app-core/boot/boot.js';

import {AppElement} from '@longlost/app-core/app-element.js';

import {
  hijackEvent, 
  listenOnce, 
  warn
} from '@longlost/app-core/utils.js';

import './app-shell.js';


export const AppMainMixin = () => {

  return class AppMainMixin extends AppElement {


    static get properties() {
      return {

        // From app-shell-dark-mode-changed event.
        darkMode: Boolean,

        // Set true on window's 'load' event.
        loaded: {
          type: Boolean,
          value: false
        },

        // From app-shell-page-changed event.
        page: String,

        // From app-shell via app-auth.
        user: Object,

        // An object containing a group of functions that import overlay files.
        // To be overwritten by app-main implementation.
        _overlayImports: Object

      };
    }


    static get observers() {
      return [
        '__darkModeChanged(darkMode)',
        '__loadedChanged(loaded)',
        '__pageChanged(page)',
        '__userChanged(user)'
      ];
    }

    // These MUST be in constructor, as opposed to connectedCallback
    // in order to catch app-shell.js initializations, including page routing.
    constructor() {

      super();

      this.__windowLoadHandler();

      this.__darkModeChangedHandler = this.__darkModeChangedHandler.bind(this);
      this.__pageChangedHandler     = this.__pageChangedHandler.bind(this);
      this.__userChangedHandler     = this.__userChangedHandler.bind(this);
      this.__openOverlayHandler     = this.__openOverlayHandler.bind(this);

      this.addEventListener('app-shell-dark-mode-changed', this.__darkModeChangedHandler);
      this.addEventListener('app-shell-page-changed',      this.__pageChangedHandler);
      this.addEventListener('auth-userchanged',            this.__userChangedHandler);
      this.addEventListener('open-overlay',                this.__openOverlayHandler);  
    }


    disconnectedCallback() {

      super.disconnectedCallback();

      this.removeEventListener('app-shell-dark-mode-changed', this.__darkModeChangedHandler);
      this.removeEventListener('app-shell-page-changed',      this.__pageChangedHandler);
      this.removeEventListener('auth-userchanged',            this.__userChangedHandler);
      this.removeEventListener('open-overlay',                this.__openOverlayHandler); 
    }


    __pageChangedHandler(event) {

      hijackEvent(event);

      this.page = event.detail.value;
    }


    __darkModeChangedHandler(event) {

      hijackEvent(event);

      this.darkMode = event.detail.value;
    }


    __userChangedHandler(event) {

      hijackEvent(event);

      this.user = event.detail.user;
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

      this.loaded = true;
    }


    __darkModeChanged(dark) {

      this.fire('app-dark-mode-changed', {value: dark});
    }


    __loadedChanged(loaded) {

      if (!loaded) { return; } // Only fire once, when true.
      
      this.fire('app-loaded-changed', {value: loaded});
    }


    __pageChanged(page) {
      
      this.fire('app-page-changed', {value: page});
    }


    __userChanged(user) {
      
      this.fire('app-user-changed', {value: user});
    }

  };
};
