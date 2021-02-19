
/**
  * `dark-mode-selector`
  * 
  *   
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  **/
  

import {AppElement, html} from '@longlost/app-core/app-element.js';
import htmlString         from './dark-mode-selector.html';
import '@longlost/app-core/app-shared-styles.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-toggle-button/paper-toggle-button.js';
import './app-shell-icons.js';


class DarkModeSelector extends AppElement {

  static get is() { return 'dark-mode-selector'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // When true, the setting will follow that 
      // of the device's native dark theme setting.
      autoColorMode: Boolean,

      darkMode: Boolean,

      // Hide the auto color mode toggle
      // when the browser does not support
      // 'prefers-color-scheme' media-query.
      hideAutoColorMode: Boolean,

      _autoColorModeLabel: {
        type: String,
        value: 'On',
        computed: '__computeLabel(autoColorMode)'
      },

      _darkModeLabel: {
        type: String,
        value: 'Off',
        computed: '__computeLabel(darkMode)'
      }

    };
  }


  __computeDisabledClass(bool) {

    return bool ? 'disabled' : '';
  }


  __computeLabel(bool) {

    return bool ? 'On' : 'Off';
  }


  async __autoColorModeCheckedChangedHandler(event) {

    try {
      await this.clicked();

      const {value} = event.detail;

      this.fire('dark-mode-selector-auto-color-mode-changed', {value});        
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __darkModeCheckedChangedHandler(event) {

    try {
      await this.clicked();

      const {value} = event.detail;

      this.fire('dark-mode-selector-dark-mode-changed', {value});        
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }

}

window.customElements.define(DarkModeSelector.is, DarkModeSelector);
