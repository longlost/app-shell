
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


import {AppElement, html} from '@longlost/app-core/app-element.js';
import {hijackEvent}      from '@longlost/app-core/utils.js';
import htmlString         from './app-settings.html';
import '@longlost/app-core/app-shared-styles.js';
import '@longlost/app-overlays/app-header-overlay.js';
import '@longlost/app-overlays/app-modal.js';
import '@polymer/paper-button/paper-button.js';
import '../shared/app-shell-icons.js';
import '../shared/dark-mode-selector.js';
import './offline-persistence-selector.js';


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
      persistence: Boolean

    };
  }


  __autoColorModeChangedHandler(event) {

    hijackEvent(event);

    this.fire('settings-auto-color-mode-changed', event.detail);  
  }


  __darkModeChangedHandler(event) {

    hijackEvent(event);

    this.fire('settings-dark-mode-changed', event.detail);  
  }


  __persistenceChangedHandler(event) {

    hijackEvent(event);

    this.fire('settings-persistence-changed', event.detail);

    this.$.refreshModal.open();
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
