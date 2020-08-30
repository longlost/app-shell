
/**
  * `app-settings`
  *
  *   Common app settings ui.
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  **/

import {AppElement, html} from '@longlost/app-element/app-element.js';

// Must use module resolution in webpack config and include app.config.js file in root
// of src folder (ie. resolve: {modules: [path.resolve(__dirname, 'src'), 'node_modules'],})
import {appUserAndData} from 'app.config.js';
import htmlString       from './app-settings.html';
import '@longlost/app-overlays/app-header-overlay.js';
import '@longlost/app-overlays/app-modal.js';
import '@longlost/app-icons/app-icons.js';
import '@polymer/paper-toggle-button/paper-toggle-button.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/iron-icon/iron-icon.js';


class AppSettings extends AppElement {
  static get is() { return 'app-settings'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // <app-shell>.
      autoColorMode: Boolean,

      // <app-shell>.
      darkMode: Boolean,

      // <app-shell>.
      // Hide the auto color mode toggle
      // when the browser does not support
      // 'prefers-color-scheme' media-query.
      hideAutoColorMode: Boolean,

      // <app-shell>.
      persistence: Boolean,

      _autoColorModeLabel: {
        type: String,
        value: 'On',
        computed: '__computeLabel(autoColorMode)'
      },

      _darkModeLabel: {
        type: String,
        value: 'Off',
        computed: '__computeLabel(darkMode)'
      },

      _persistenceLabel: {
        type: String,
        value: 'On',
        computed: '__computeLabel(persistence)'
      },

      // Hide/show trusted device toggle button.
      _trustedConfig: {
        type: Boolean,
        value: appUserAndData.trustedDevice
      }

    };
  }


  __computeLabel(bool) {
    return bool ? 'On' : 'Off';
  }
  

  __computeHighlightedToggleClass(bool) {
    return bool ? 'highlighted' : '';
  }


  __computeDisabledClass(bool) {
    return bool ? 'disabled' : '';
  }


  __computeTrustedToggleHidden(bool) {
    return !bool;
  }


  async __toggleAutoColorMode(event) {
    try {
      await this.clicked();

      const {value} = event.detail;

      this.fire('settings-auto-color-mode-changed', {value});        
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __toggleDarkMode(event) {
    try {
      await this.clicked();

      const {value} = event.detail;

      this.fire('settings-dark-mode-changed', {value});        
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __toggleTrusted(event) {
    try {
      await this.clicked();

      const {value} = event.detail;

      this.fire('settings-persistence-changed', {value});
      this.$.refreshModal.open();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __modalDismissButtonClicked() {
    try {
      await this.clicked();

      this.$.refreshModal.close();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __modalRefreshButtonClicked() {
    try {
      await this.clicked();
      
      window.location.reload();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  open() {
    return this.$.overlay.open();
  }

}

window.customElements.define(AppSettings.is, AppSettings);
