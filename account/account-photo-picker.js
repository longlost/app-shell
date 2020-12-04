

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


import {AppElement, html}  from '@longlost/app-element/app-element.js';
import {hijackEvent, warn} from '@longlost/utils/utils.js';
import services            from '@longlost/app-shell/services/services.js';
import htmlString          from './account-photo-picker.html';
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

      type: {
        type: String,
        value: 'avatar' // Or 'background'
      },

      user: Object,

      _btnClass: {
        type: String,
        value: 'remove', // Or 'save'.
        computed: '__computeBtnClass(_btnText)'
      },

      _btnText: {
        type: String,
        value: 'REMOVE', // Or 'SAVE'.
        computed: '__computeBtnText(_selected)'
      },

      _hideBtn: {
        type: Boolean,
        value: true,
        computed: '__computeHideBtn(type, _userData, _selected)'
      },

      _opened: Boolean,

      // The file object that was most recently selected from either
      // camera capture, uploaded file or chosen from saved photos.
      _selected: Object,

      _src: {
        type: String,
        computed: '__computeSrc(type, _userData, _selected, _opened)'
      },

      _selectedItemUnsubscribe: Object,

      _userDataUnsubscribe: Object

    };
  }


  static get observers() {
    return [
      '__openedChanged(_opened)',
      '__openedUserChanged(_opened, user)'
    ];
  }


  __computeBtnClass(text) {
    return text.includes('REMOVE') ? 'remove' : 'save';
  }


  __computeBtnText(selected) {
    return selected ? 'SET NEW AVATAR' : 'REMOVE';
  }


  __computeHideBtn(type, data, selected) {
    return ((!data || !data[type]) && !selected);
  }


  __computeSrc(type, data, selected, opened) {
    if (!opened) { return '#'; }

    if (selected?.optimized) { return selected.optimized; }

    if (selected?.original) { return selected.original; }

    if (selected?._tempUrl) { return selected_tempUrl; }

    if (!data || !type) { return '#'; }

    const photoData = data[type];

    if (photoData?.optimized) { return photoData.optimized; }

    if (photoData?.original) { return photoData.original; }

    return '#';
  }


  __unsubFromSelectedItem() {
    if (this._selectedItemUnsubscribe) {
      this._selectedItemUnsubscribe();
      this._selectedItemUnsubscribe = undefined;
    }
  }


  __unsubFromUserData() {
    if (this._userDataUnsubscribe) {
      this._userDataUnsubscribe();
      this._userDataUnsubscribe = undefined;
    }
  }


  __openedChanged(opened) {
    if (!opened) {
      this.__unsubFromSelectedItem();
    }
  }


  __openedUserChanged(opened, user) {

    if (opened && user) {
      this.__startUserDataSub();
      return;
    }

    // Clear out user's data if they log out,
    // regardless of opened state.
    if (!user) {
      this._userData = undefined;
    }
    
    this.__unsubFromUserData();
  }


  __openedChangedHandler(event) {
    hijackEvent(event);

    this._opened = event.detail.value;
  }


  async __startSelectedItemSub() {

    if (!this._selected) { return; }

    const {coll, doc} = this._selected;

    const callback = data => {
      this._selected = data;
    };

    const errorCallback = error => {
      console.error(error);
    };
 
    this._selectedItemUnsubscribe = await services.subscribe({
      coll, 
      doc, 
      callback, 
      errorCallback
    });
  }


  async __startUserDataSub() {

    if (!this.user) { return; }

    const {uid} = this.user;

    const callback = data => {
      this._userData = data;
    };

    const errorCallback = error => {
      console.error(error);
    };
 
    this._userDataUnsubscribe = await services.subscribe({
      coll: 'users', 
      doc:   uid, 
      callback, 
      errorCallback
    });
  }


  __selectedChangedHandler(event) {
    hijackEvent(event);

    this.__unsubFromSelectedItem();

    this._selected = event.detail.value;

    const {optimized, optimizedError, thumbnail, thumbnailError} = this._selected;

    const optimizedDone = Boolean(optimized || optimizedError);
    const thumbnailDone = Boolean(thumbnail || thumbnailError);

    if (!optimizedDone || !thumbnailDone) {
      this.__startSelectedItemSub();
    }
  }

  // This button has two states which allows it to 
  // act as a remove or a save button.
  async __removeSaveBtnClicked() {
    try {

      if (!this.user) { return; }

      await this.clicked();

      // Save the recently selected photo as the new profile photo.
      if (this._selected) {

        await services.set({
          coll: `users`,
          doc:   this.user.uid,
          data: {
            [this.type]: this._selected
          }
        });
      }

      // Remove the photo from user's account profile.
      else {
        await services.deleteField({
          coll: `users`,
          doc:   this.user.uid,
          field: this.type
        });
      }

      this.__unsubFromSelectedItem();
      this._selected = undefined;
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);

      warn('Sorry, your profile could not be updated.');
    }
  }


  open() {
    return this.$.picker.open();
  }

}

window.customElements.define(AccountPhotoPicker.is, AccountPhotoPicker);
