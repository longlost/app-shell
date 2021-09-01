
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


import {
  appUserAndData, 
  webpackConfig
} from 'config.js';

import {
  AppElement, 
  html
} from '@longlost/app-core/app-element.js';

import htmlString from './app-settings.html';
import '@longlost/app-core/app-shared-styles.js';
import '@longlost/app-overlays/app-header-overlay.js';
import '../shared/dark-mode-selector.js';
import '../shared/offline-persistence-selector.js';
import '../shared/pwa-install-button.js';


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

      _hidePersistence: {
        type: Boolean,
        value: false,
        computed: '__computeHidePersistence(_persistenceConfig)'
      },

      // Hide/show offline persistence section.
      _persistenceConfig: Boolean,

      _version: String

    };
  }


  constructor() {

    super();

    this._persistenceConfig = appUserAndData.trustedDevice;
    this._version           = webpackConfig.version;
  }


  __computeHidePersistence(bool) {

    return !bool;
  }


  __overlayResetHandler() {

    this.fire('app-settings-closed');
  }


  open() {

    return this.$.overlay.open();
  }

}

window.customElements.define(AppSettings.is, AppSettings);
