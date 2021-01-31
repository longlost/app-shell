
/**
  * `app-shell-drawer-item`
  *   
  *   A nav menu item with an optional icon and a label.  
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
import '@longlost/app-core/app-icons.js';
import '@polymer/iron-icon/iron-icon.js';


class AppShellDrawerItem extends AppElement {

  static get is() { return 'app-shell-drawer-item'; }

  static get template() {
    return html`

      <style>

        :host {
          display:         block;
          padding:         0px 16px;
          text-decoration: none;
          color:           var(--app-secondary-text);
          line-height:     40px;
        }

        iron-icon {
          top: -2px;
        }

        span {
          cursor: pointer;
        }

      </style>


      <iron-icon hidden="[[__computeHideIcon(icon)]]"
                 icon="[[icon]]">
      </iron-icon>

      <span>[[label]]</span>

    `;
  }


  static get properties() {
    return {

      icon: {
        type: String,
        value: ''
      },

      label: String

    };
  }


  __computeHideIcon(icon) {

    return !Boolean(icon);
  }

}

window.customElements.define(AppShellDrawerItem.is, AppShellDrawerItem);
