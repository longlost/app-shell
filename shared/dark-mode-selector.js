
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
  

import {AppElement} from '@longlost/app-core/app-element.js';

import {
  getRootTarget, 
  hijackEvent, 
  wait
} from '@longlost/app-core/utils.js';

import template from './dark-mode-selector.html';
import '@longlost/app-core/app-shared-styles.css';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-radio-group/paper-radio-group.js';
import '@polymer/paper-radio-button/paper-radio-button.js';
import './app-shell-icons.js';
import './dark-mode-app-model.js';


class DarkModeSelector extends AppElement {

  static get is() { return 'dark-mode-selector'; }

  static get template() {
    return template;
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

      _autoLabel: {
        type: String,
        value: 'Auto',
        computed: '__computeAutoLabel(autoColorMode)'
      },

      _icon: {
        type: String,
        computed: '__computeIcon(autoColorMode, darkMode)'
      },

      // Drives 'paper-radio-group' 'selected' attribute.
      _mode: {
        type: String,
        value: 'auto',
        computed: '__computeMode(hideAutoColorMode, autoColorMode, darkMode)'
      },

      _modeLabel: {
        type: String,
        computed: '__computeModeLabel(darkMode)'
      },

      _radioEl: Object,

      _selected: String // 'auto', 'light', 'dark'

    };
  }


  static get observers() {
    return [
      '__selectedChanged(_selected)'
    ];
  }


  __computeAutoLabel(bool) {

    return bool ? 'Auto ' : '';
  }


  __computeIcon(auto, dark) {

    if (auto) { return 'app-shell-icons:brightness-auto'; }

    return dark ? 'app-shell-icons:dark-mode' : 'app-shell-icons:light-mode';
  }


  __computeModeLabel(bool) {

    return bool ? 'Dark' : 'Light';
  }


  __computeMode(hideAuto, auto, dark) {

    const theme = dark ? 'dark' : 'light';

    if (hideAuto) { return theme; }

    return auto ? 'auto' : theme;
  }


  // Initialize '_radioEl' with the default selected radio button.
  __radioGroupItemsChangedHandler(event) {

    hijackEvent(event);

    this._radioEl = event.detail.addedNodes.find(el => 
                      el.classList?.contains('iron-selected'));
  }


  async __radioSelectedChangedHandler(event) {

    hijackEvent(event);

    this._selected = event.detail.value;

    // Fixes 'paper-radio-button' broken ripple behavior.
    this._radioEl = getRootTarget(event).selectedItem;
  }

  // Fixes issue with 'paper-radio' internal 'paper-ripple' not finishing.
  async __labelClicked() {

    try {

      // CANNOT use 'hijackEvent' here, because it 
      // prevents the radio from being selected properly.

      await this.clicked();

      if (!this._radioEl) { return; }

      await wait(100);

      this._radioEl.blur();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }

  // 'selected' values 'auto', 'light' or 'dark'.
  __selectedChanged(selected) {

    if (!selected) { return; }

    const auto = selected === 'auto';

    this.fire('dark-mode-selector-auto-color-mode-changed', {value: auto});

    if (auto) { return; }

    const dark = selected === 'dark';

    this.fire('dark-mode-selector-dark-mode-changed', {value: dark});
  }

}

window.customElements.define(DarkModeSelector.is, DarkModeSelector);
