
/**
  * `qs-verification-page`
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
import htmlString         from './qs-verification-page.html';
import '@polymer/iron-icon/iron-icon.js';
import '../app-shell-icons.js';


class QuickStartVerificationPage extends AppElement {

  static get is() { return 'qs-verification-page'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      current: String,

      page: String,

      user: Object,

      _animateIconClass: {
        type: String,
        computed: '__computeAnimateIconClass(current, page)'
      }

    };
  }


  __computeAnimateIconClass(current, page) {

    if (!current || !page) { return ''; }

    return current === page ? 'animate-send' : ''; 
  }

}

window.customElements.define(QuickStartVerificationPage.is, QuickStartVerificationPage);
