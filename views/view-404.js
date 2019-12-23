
/**
	*
 	* `view-404`
 	*
 	* 	Simple view for 404 routes.
 	*
 	* @customElement
 	* @polymer
 	* @demo demo/index.html
 	*
 	**/

import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';


class LongLostView404 extends PolymerElement {
  static get is() { return 'view-404'; }

  
  static get template() {
    return html`
      <style>
        :host {
          display: block;
          padding: 10px 20px;
        }
      </style>

      Oops you hit a 404. <a href="[[rootPath]]">Head back to home.</a>
    `;
  }


  static get properties() {
    return {

      // This shouldn't be neccessary, but the Analyzer isn't picking up
      // Polymer.Element#rootPath.
      rootPath: String
      
    };
  }

}

window.customElements.define(LongLostView404.is, LongLostView404);
