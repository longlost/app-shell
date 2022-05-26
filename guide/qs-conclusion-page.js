
/**
  * `qs-conclusion-page`
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
import {wait}             from '@longlost/app-core/utils.js';
import htmlString         from './qs-conclusion-page.html';
import '@longlost/app-core/app-icons.js';
import '@polymer/iron-icon/iron-icon.js';
import '../shared/app-shell-icons.js';
import './qs-page-shared-styles.css';
import './conclusion-thumbs-up.js';


class QuickStartConclusionPage extends AppElement {

  static get is() { return 'qs-conclusion-page'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      current: String,

      darkMode: Boolean,

      narrow: Boolean,

      opened: Boolean,

      page: String,

      _canPlayThumbs: {
        type: Boolean,
        computed: '__computeCanPlayThumbs(current, page, opened)'
      }

    };
  }


  static get observers() {
    return [
      '__canPlayThumbsChanged(_canPlayThumbs)'
    ];
  }


  __computeCanPlayThumbs(current, page, opened) {

    if (!current || !page || !opened) { return false; }

    return current === page;
  }


  async __canPlayThumbsChanged(canPlay) {

    if (canPlay) {

      await wait(500);

      this.$.thumbs.play();
    }
  }

}

window.customElements.define(QuickStartConclusionPage.is, QuickStartConclusionPage);
