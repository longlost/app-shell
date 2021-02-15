
/**
  * `offline-persistence-selector`
  * 
  *   
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  **/

  
// Must use module resolution in webpack config and include app.config.js file in root
// of src folder (ie. resolve: {modules: [path.resolve(__dirname, 'src'), 'node_modules'],})
import {appUserAndData}   from 'config.js';
import {AppElement, html} from '@longlost/app-core/app-element.js';
import htmlString         from './offline-persistence-selector.html';
import '@longlost/app-core/app-shared-styles.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-toggle-button/paper-toggle-button.js';
import '../shared/app-shell-icons.js';


class OfflinePersistenceSelector extends AppElement {

  static get is() { return 'offline-persistence-selector'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      hidden: {
        type: Boolean,
        value: false,
        computed: '__computeHidden(_trustedConfig)',
        reflectToAttribute: true
      },

      persistence: Boolean,

      _label: {
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


  __computeHidden(bool) {

    return !bool;
  }
  

  __computeHighlightedClass(bool) {

    return bool ? 'highlighted' : '';
  }


  __computeLabel(bool) {

    return bool ? 'On' : 'Off';
  }


  async __checkedChangedHandler(event) {

    try {
      await this.clicked();

      const {value: checked} = event.detail;

      // Ignore `paper-toggle` initialization values.
      if (checked === this.persistence) { return; }

      this.fire('offline-persistence-selector-persistence-changed', {value: checked});
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }

}

window.customElements.define(OfflinePersistenceSelector.is, OfflinePersistenceSelector);
