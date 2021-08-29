
/**
  * `ThemeMixin`
  *
  *   App-wide theming state is handled here. Auto, light and dark modes.
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  **/

import {hijackEvent}   from '@longlost/app-core/utils.js';
import {waitForLoaded} from './utils.js';


export const ThemeMixin = superClass => {

  return class ThemeMixin extends superClass {
    
    static get properties() {
      return {        

        // When dev sets this prop, dark mode is
        // defaulted when browser does not support
        // the 'prefers-color-scheme' media-query.
        darkModeDefault: Boolean,

        // If true, app color theme mode will
        // follow the device's color theme setting.
        // When false, user can manually change
        // the theme.
        _autoColorMode: {
          type: Boolean,
          value: true
        },

        // Dark/Light mode state.
        _darkMode: Boolean,

        // Hide 'dark-mode-selector' 'auto' radio-button when
        // browser does not support the 
        // 'prefers-color-scheme' media query.
        _hideAutoColorMode: Boolean,

      };
    }

    
    static get observers() {
      return [
        '__autoColorModeChanged(_autoColorMode)'
      ];
    }


    constructor() {

      super();

      this.__darkModeMediaQueryHandler  = this.__darkModeMediaQueryHandler.bind(this);
      this.__lightModeMediaQueryHandler = this.__lightModeMediaQueryHandler.bind(this);
    }


    async __autoColorModeChanged() {

      await waitForLoaded();      
      await this.$.autoModeStorage.transactionsComplete;

      this.__setupAutoColorModeMediaQueries();
    }


    __setDarkMode(dark) {

      if (dark) {
        ShadyCSS.styleDocument({
          '--app-background-color':   'var(--dark-mode-background)',
          '--app-body-color':         'var(--dark-mode-body)',
          '--app-dark-text':          'var(--dark-mode-dark-text)',
          '--app-light-text':         'var(--dark-mode-light-text)',
          '--app-text-truncate-fade': 'var(--dark-mode-truncate)'
        });
      }
      else {
        ShadyCSS.styleDocument({
          '--app-background-color':   'var(--light-mode-background)',
          '--app-body-color':         'var(--light-mode-body)',
          '--app-dark-text':          'var(--light-mode-dark-text)',
          '--app-light-text':         'var(--light-mode-light-text)',
          '--app-text-truncate-fade': 'var(--light-mode-truncate)'
        });
      }

      // Sets app-localstorage-document data val.
      this._darkMode = dark;

      // Use this event for all changes including localstorage cache updates.
      this.fire('app-shell-dark-mode-changed', {value: dark});
    }


    __darkModeMediaQueryHandler(event) {

      if (!this._autoColorMode) { return; }

      if (event.matches) {
        this.__setDarkMode(true);
      }
    }

    __lightModeMediaQueryHandler(event) {
      
      if (!this._autoColorMode) { return; }

      if (event.matches) {
        this.__setDarkMode(false);
      }
    }

    // Follow device color theme unless user 
    // has turned this off in <app-settings>
    // via _autoColorMode toggle.
    // If browser supports 'prefers-color-scheme'
    // it will respect the setting for light or dark mode.
    __setupAutoColorModeMediaQueries() {

      const mediaQuery = window.matchMedia;

      // Bail if user has set the 'Auto Color Mode' toggle off.
      if (!this._autoColorMode) {
        mediaQuery('(prefers-color-scheme: dark)').removeListener(this.__darkModeMediaQueryHandler);
        mediaQuery('(prefers-color-scheme: light)').removeListener(this.__lightModeMediaQueryHandler);

        return; 
      }

      // Take immediate readings.   
      const isDarkMode     = mediaQuery('(prefers-color-scheme: dark)').matches
      const isLightMode    = mediaQuery('(prefers-color-scheme: light)').matches
      const isNotSpecified = mediaQuery('(prefers-color-scheme: no-preference)').matches
      const hasNoSupport   = !isDarkMode && !isLightMode && !isNotSpecified;

      // Start listening for device changes while app is open.
      mediaQuery('(prefers-color-scheme: dark)').addListener(this.__darkModeMediaQueryHandler);
      mediaQuery('(prefers-color-scheme: light)').addListener(this.__lightModeMediaQueryHandler);

      if (isDarkMode) {
        this.__setDarkMode(true);
      }
      else if (isLightMode) {
        this.__setDarkMode(false);
      }
      else if (isNotSpecified) {
        this.__setDarkMode(this.darkModeDefault);
      }
      else if (hasNoSupport) {  
        this._autoColorMode = false;

        // Hide the toggle in <app-settings> when not supported.
        this._hideAutoColorMode = true;   
        this.__setDarkMode(this.darkModeDefault);
      }
    }

    // Fired from auto color mode app-localstorage-document and app-settings.
    __autoColorModeHandler(event) {

      hijackEvent(event);

      this._autoColorMode = event.detail.value;
    }

    // Fired from dark mode app-localstorage-document and app-settings.
    __darkModeHandler(event) {

      hijackEvent(event);

      if (this._autoColorMode) { return; }

      this.__setDarkMode(event.detail.value);
    }

  };
};
