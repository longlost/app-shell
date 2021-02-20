
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
import {hijackEvent}      from '@longlost/app-core/utils.js';
import htmlString         from './dark-mode-selector.html';
import '@longlost/app-core/app-icons.js';
import '@longlost/app-core/app-shared-styles.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-toggle-button/paper-toggle-button.js';
import './app-shell-icons.js';
import './dark-mode-app-model.js';


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
        computed: '__computeAutoColorLabel(autoColorMode)'
      },

      _modeLabel: {
        type: String,
        computed: '__computeModeLabel(darkMode)'
      },

      _modeIcon: {
        type: String,
        computed: '__computeModeIcon(autoColorMode)'
      }

    };
  }


  __computeAutoColorLabel(bool) {

    return bool ? 'On' : 'Off';
  }


  __computeDisabledClass(bool) {

    return bool ? 'disabled' : '';
  }


  __computeModeIcon(bool) {

    return bool ? 'app-icons:lock' : 'app-icons:lock-open';
  }


  __computeModeLabel(bool) {

    return bool ? 'Dark' : 'Light';
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


  __appModelSelectedHandler(event) {

    hijackEvent(event);

    const {selected} = event.detail;
    const darkMode   = selected === 'dark';

    this.fire('dark-mode-selector-dark-mode-changed', {value: darkMode});
  }

}

window.customElements.define(DarkModeSelector.is, DarkModeSelector);
