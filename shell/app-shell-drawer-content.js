
/**
  * `app-shell-drawer-content`
  * 
  *   The content section of the `app-drawer` menu located in `app-shell`.
  *   
  *   It consists of clickable nav items that control top level
  *   view and overlay pages.  
  * 
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  *
  **/


import {AppElement, html} from '@longlost/app-core/app-element.js';
import htmlString         from './app-shell-drawer-content.html';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import '@polymer/iron-selector/iron-selector.js';
import './app-shell-drawer-item.js';


class AppShellDrawerContent extends AppElement {

  static get is() { return 'app-shell-drawer-content'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      accountIcon: String,

      bottomItems: Array,

      divider: Boolean,

      noUsers: Boolean,

      overlayItems: Array,

      page: String,

      rootPath: String,

      viewItems: Array,

      _dividerClass: {
        type: Boolean,
        computed: '__computeDividerClass(divider)'
      }

    };
  }

  
  __computeDividerClass(divider) {

    return divider ? 'show-divider' : '';
  }


  async __accountItemClicked() {

    try {
      await this.clicked();

      this.fire('app-shell-drawer-content-account-selected');
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __overlayItemClicked(event) {

    try {
      await this.clicked();

      const {id, page} = event.model.item;

      this.fire('app-shell-drawer-content-overlay-selected', {
        selected: {
          id:   id.value, 
          page: page.value
        }
      });
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __settingsItemClicked() {

    try {
      await this.clicked();

      this.fire('app-shell-drawer-content-settings-selected');
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }

}

window.customElements.define(AppShellDrawerContent.is, AppShellDrawerContent);
