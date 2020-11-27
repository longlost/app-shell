

/**
  * `account-photo-picker`
  * 
  *   This ui presents the user with several options for adding/changing their account photos.
  *
  *
  *
  *  Properties:
  *
  *
  *    
  *
  *
  *
  *  Events:
  *
  *
  *   
  *  
  *  Methods:
  *
  *
  *    open()
  *
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  *
  **/


import {AppElement, html} from '@longlost/app-element/app-element.js';
import {hijackEvent} 			from '@longlost/utils/utils.js';
import htmlString 	 			from './account-photo-picker.html';
import '@longlost/app-camera/picker/acs-picker-overlay.js';


class AccountPhotoPicker extends AppElement {
  static get is() { return 'account-photo-picker'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      user: Object

    };
  }


  open() {
    return this.$.picker.open();
  }

}

window.customElements.define(AccountPhotoPicker.is, AccountPhotoPicker);
