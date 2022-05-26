
/**
  *
  * `conclusion-thumbs-up`
  *
  *
  *   An animated thumbs up icon.
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
import htmlString         from './conclusion-thumbs-up.html';
import '@longlost/app-core/app-shared-styles.css';
import '@polymer/iron-icon/iron-icon.js';
import '../shared/app-shell-icons.js';


class ConclusionThumbsUp extends AppElement {

  static get is() { return 'conclusion-thumbs-up'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      darkMode: Boolean,

      mode: {
        type: String,
        value: 'light',
        reflectToAttribute: true,
        computed: '__computeMode(darkMode)'
      },

      _thumbs: Array

    };
  }


  connectedCallback() {
    
    super.connectedCallback();

    this._thumbs = this.selectAll('.thumb-icon');
  }


  __computeMode(dark) {

    return dark ? 'dark' : 'light';
  }
  

  play() {

    this._thumbs.forEach(thumb => {
      thumb.classList.add('enter');
    });
  } 
  
}

window.customElements.define(ConclusionThumbsUp.is, ConclusionThumbsUp);
