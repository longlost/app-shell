
/**
  * `pwa-install-button`
  * 
  *   
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  **/

  
import {
  AppElement, 
  html
} from '@longlost/app-core/app-element.js';

import {
  installable,
  installed, 
  prompt
} from '@longlost/app-core/boot/install.js';

import safariShareIcon from '../images/safari-share-icon.png';
import htmlString      from './pwa-install-button.html';
import '@longlost/app-core/app-icons.js';
import '@longlost/app-core/app-shared-styles.js';
import '@longlost/app-images/responsive-image.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';
import '../shared/app-shell-icons.js';


class PWAInstallButton extends AppElement {

  static get is() { return 'pwa-install-button'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      darkMode: Boolean,

      iconMode: {
        type: String,
        value: 'light',
        reflectToAttribute: true,
        computed: '__computeIconMode(darkMode)'
      },

      _disableBtn: {
        type: Boolean,
        value: true,
        computed: '__computeDisableBtn(_installable, _prompted)'
      },

      _installable: {
        type: Boolean,
        value: false
      },

      _installed: {
        type: Boolean,
        value: false
      },

      _prompted: Boolean,

      _safariShareIcon: Object

    };
  }


  async connectedCallback() {

    super.connectedCallback();

    this._safariShareIcon = safariShareIcon;

    await installable;

    this._installable = true;

    await installed;

    this._installed = true;
  }


  __computeDisableBtn(installable, prompted) {

    return (!installable || prompted);
  }


  __computeIconMode(darkMode) {

    return darkMode ? 'dark' : 'light';
  }


  async __btnClicked() {

    try {

      if (this._prompted) { return; }

      this._prompted = true;

      await prompt();

      this._prompted = false;
    }
    catch (error) {

      this._prompted = false;

      console.error(error);
    }
  }

}

window.customElements.define(PWAInstallButton.is, PWAInstallButton);
