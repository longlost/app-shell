

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
import {hijackEvent}      from '@longlost/utils/utils.js';
import htmlString         from './account-photo-picker.html';
import '@longlost/app-camera/picker/acs-picker-overlay.js';
import '@polymer/paper-button/paper-button.js';
import './account-avatar.js';


class AccountPhotoPicker extends AppElement {
  static get is() { return 'account-photo-picker'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      darkMode: Boolean,

      user: Object,

      _btnClass: {
        type: String,
        value: 'remove', // Or 'save'.
        computed: '__computeBtnClass(_btnText)'
      },

      _btnText: {
        type: String,
        value: 'REMOVE', // Or 'SAVE'.
        computed: '__computeBtnText(_selected.thumbnail)'
      },

      _hideBtn: {
        type: Boolean,
        value: true,
        computed: '__computeHideBtn(user.photoURL, _selected.thumbnail)'
      },

      _opened: Boolean,

      // The file object that was most recently selected from either
      // camera capture, uploaded file or chosen from saved photos.
      _selected: Object,

      _src: {
        type: String,
        computed: '__computeSrc(user.photoURL, _selected.thumbnail, _opened)'
      }

    };
  }


  __computeBtnClass(text) {
    return text.toLowerCase();
  }


  __computeBtnText(thumbnail) {
    return thumbnail ? 'SAVE' : 'REMOVE';
  }


  __computeHideBtn(url, thumbnail) {
    return (!url && !thumbnail);
  }


  __computeSrc(url, thumbnail, opened) {
    if (!opened) { return '#'; }

    if (thumbnail) { return thumbnail; }

    if (url) { return url; }

    return '#';
  }


  __openedChangedHandler(event) {
    hijackEvent(event);

    this._opened = event.detail.value;
  }


  async __saveBtnClicked() {
    try {
      await this.clicked();

      console.log('saved button clicked');
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  open() {
    return this.$.picker.open();
  }

}

window.customElements.define(AccountPhotoPicker.is, AccountPhotoPicker);
