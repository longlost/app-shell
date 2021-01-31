
/**
  * `app-shell-router`
  * 
  *   This element handles url path routing.
  * 
  *
  *
  *  Properties:
  *
  *
  *   rootPath - Optional, String, Default: '/'
  *
  *     The base routing path string.
  *
  *
  *
  *
  *  Events:
  *
  *
  *   'app-shell-router-page-changed', {value: 'page'}
  *
  *     Detail value is the 'page' string property from `app-route` 'data' object.
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
import '@polymer/app-route/app-location.js';
import '@polymer/app-route/app-route.js';


class AppShellRouter extends AppElement {

  static get is() { return 'app-shell-router'; }

  static get template() {
    return html`

      <app-location route="[[_route]]" 
                    url-space-regex="^[[rootPath]]"
                    on-route-changed="__locationRouteChangedHandler">
      </app-location>

      <app-route route="[[_route]]"
                 pattern="[[rootPath]]:page"
                 on-data-changed="__routeDataChangedHandler"
                 on-route-changed="__routeRouteChangedHandler">
      </app-route>

    `;
  }


  static get properties() {
    return {

      rootPath: {
        type: String,
        value: '/'
      },

      _page: String,

      _route: Object

    };
  }


  static get observers() {
    return [
      '__pageChanged(_page)'
    ];
  }


  __pageChanged(page) {

    this.fire('app-shell-router-page-changed', {value: page});
  }


  __locationRouteChangedHandler(event) {

    this._route = event.detail.value;
  }


  __routeDataChangedHandler(event) {

    this._page = event.detail.value.page;
  }


  __routeRouteChangedHandler(event) {

    this._route = event.detail.value;
  }

}

window.customElements.define(AppShellRouter.is, AppShellRouter);
