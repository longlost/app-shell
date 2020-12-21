

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


import {AppElement, html} from '@longlost/app-core/app-element.js';

import {
  hijackEvent,
  message, 
  warn
} from '@longlost/app-core/utils.js';

import {allProcessingRan} from '@longlost/app-core/img-utils.js';

import services   from '@longlost/app-core/services/services.js';
import htmlString from './account-photo-picker.html';
import '@longlost/app-camera/picker/acs-picker-overlay.js';
import '@longlost/app-images/app-image.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-spinner/paper-spinner-lite.js';
import '../app-shell-icons.js';


class AccountPhotoPicker extends AppElement {
  static get is() { return 'account-photo-picker'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      darkMode: Boolean,

      // 'avatar' is a special value that also sets
      // the Firebase Auth 'user' profile 'photoURL' field.
      type: {
        type: String,
        value: 'avatar' // Or 'background'.
      },

      user: Object,

      _aspect: {
        type: String,
        computed: '__computeAspect(type)'
      },

      _disableBtns: {
        type: Boolean,
        value: true,
        computed: '__computeDisableBtns(user, _processing)'
      },

      _hideRemoveBtn: {
        type: Boolean,
        value: true,
        computed: '__computeHideRemoveBtn(type, _userData, _selected)'
      },

      _hideClearBtn: {
        type: Boolean,
        value: true,
        computed: '__computeHideClearBtn(user, _selected)'
      },

      _hideSaveBtn: {
        type: Boolean,
        value: true,
        computed: '__computeHideSaveBtn(user, _selected)'
      },

      _imgIcon: {
        type: String,
        computed: '__computeImgIcon(type)'
      },

      _opened: Boolean,

      _processing: {
        type: Boolean,
        value: false
      },

      // The file object that was most recently selected from either
      // camera capture, uploaded file or chosen from saved photos.
      _selected: Object,

      _src: {
        type: String,
        computed: '__computeSrc(type, _userData, _selected, _opened)'
      },

      _selectedItemUnsubscribe: Object,

      _title: {
        type: String,
        computed: '__computeTitle(type)'
      },

      _userDataUnsubscribe: Object

    };
  }


  static get observers() {
    return [
      '__openedChanged(_opened)',
      '__openedUserChanged(_opened, user)'
    ];
  }


  __computeAspect(type) {
    return type === 'avatar' ? 'square' : 'landscape';
  }


  __computeDisableBtns(user, processing) {
    return (!user || processing);
  }


  __computeHideRemoveBtn(type, data, selected) {
    if (!data || !data[type]) { return true; }

    return Boolean(selected);
  }


  __computeHideClearBtn(user, selected) {
    return (!user || !selected);
  }


  __computeHideSaveBtn(user, selected) {
    return (!user || !selected);
  }


  __computeImgIcon(type) {
    return type === 'avatar' ? 'app-shell-icons:account-circle' : undefined;
  }


  __computeSrc(type, data, selected, opened) {
    if (!opened) { return; }

    if (selected) { return selected; }

    if (!data || !type) { return; }

    const photoData = data[type];

    if (photoData) { return photoData; }

    return;
  }


  __computeTitle(type) {
    return type === 'avatar' ? 'Change Avatar' : 'Change Background Image';
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


  __processingChangedHandler(event) {
    hijackEvent(event);

    this._processing = event.detail.value;
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

    if (!allProcessingRan(this._selected)) {
      this.__startSelectedItemSub();
    }
  }


  __cleanupSelected() {
    this.__unsubFromSelectedItem();
    this._selected = undefined;
  }


  async __removeBtnClicked() {
    try {

      if (!this.user || this._selected) { return; }

      await this.clicked();

      // Open a confirmation modal.
      await import(
        /* webpackChunkName: 'account-remove-photo-modal' */ 
        './account-remove-photo-modal.js'
      );

      await this.$.modal.open();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);

      warn('Sorry, your profile was not updated.');
    }
  }

  
  async __clearBtnClicked() {
    try {

      if (!this._selected) { return; }

      await this.clicked();

      this.__cleanupSelected();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }

  
  async __saveBtnClicked() {
    try {

      if (!this.user || !this._selected) { return; }

      await this.clicked();

      // Set the recently selected photo as the new profile photo.
      await services.set({
        coll: `users`,
        doc:   this.user.uid,
        data: {
          [this.type]: this._selected
        }
      });

      if (this.type === 'avatar') {

        const {optimized, thumbnail} = this._selected;
        const photoURL = thumbnail || optimized;

        if (photoURL) {
          await this.user.updateProfile({photoURL});
        }
      }

      this.__cleanupSelected();

      await message('Profile photo updated.');
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);

      warn('Sorry, your profile was not updated.');
    }
  }

  // Remove the photo from user's account profile.
  async __removePhotoConfirmedHandler(event) {
    try {
      hijackEvent(event);

      await services.deleteField({
        coll: `users`,
        doc:   this.user.uid,
        field: this.type
      });

      if (this.type === 'avatar') {
        await this.user.updateProfile({photoURL: null});
      }

      this.__cleanupSelected();
    }
    catch (error) {
      console.error(error);

      warn('Sorry, your profile photo was not removed.');
    }
  }


  open() {
    return this.$.picker.open();
  }

}

window.customElements.define(AccountPhotoPicker.is, AccountPhotoPicker);
