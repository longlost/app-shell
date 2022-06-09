

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


import {AppElement} from '@longlost/app-core/app-element.js';

import {
  hijackEvent,
  listenOnce,
  message, 
  warn
} from '@longlost/app-core/utils.js';

import {allProcessingRan} from '@longlost/app-core/img-utils.js';

import {
  set, 
  subscribe
} from '@longlost/app-core/services/services.js';

import template from './account-photo-picker.html';
import '@longlost/app-camera/picker/acs-picker-overlay.js';
import '@longlost/app-images/app-image.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-spinner/paper-spinner-lite.js';
import '../shared/app-shell-icons.js';


class AccountPhotoPicker extends AppElement {

  static get is() { return 'account-photo-picker'; }

  static get template() {
    return template;
  }


  static get properties() {
    return {

      darkMode: Boolean,

      // User's db data.
      data: Object,

      // 'avatar' is a special value that also sets
      // the Firebase Auth 'user' profile 'photoURL' field.
      type: {
        type: String,
        value: 'avatar' // Or 'background'.
      },

      user: Object,

      _appImageIsButton: {
        type: Boolean,
        computed: '__computeAppImageIsButton(_src)'
      },

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
        computed: '__computeHideRemoveBtn(type, data, _selected)'
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

      _saveBtnText: {
        type: String,
        computed: '__computeSaveBtnText(type)'
      },

      // The file object that was most recently selected from either
      // camera capture, uploaded file or chosen from saved photos.
      _selected: Object,

      _selectedItemUnsubscribe: Object,

      _src: {
        type: String,
        computed: '__computeSrc(type, data, _selected, _opened)'
      },

      _stampContent: Boolean,

      _stampModal: Boolean,

      _title: {
        type: String,
        computed: '__computeTitle(type)'
      }

    };
  }


  static get observers() {
    return [
      '__openedChanged(_opened)'
    ];
  }


  __computeAppImageIsButton(src) {

    return Boolean(src);
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

    return type === 'avatar' ? 'app-shell-icons:account-circle' : 'app-image-icons:image';
  }


  __computeSaveBtnText(type) {

    return type === 'avatar' ? 'SET AVATAR' : 'SET BACKGROUND';
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


  __openedChanged(opened) {

    if (!opened) {
      this.__unsubFromSelectedItem();

      this._stampContent = false;
      this._stampModal   = false;
    }

    this.fire('account-photo-picker-opened-changed', {value: opened});
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
 
    this._selectedItemUnsubscribe = await subscribe({
      coll, 
      doc, 
      callback, 
      errorCallback
    });
  }


  __selectedChangedHandler(event) {

    hijackEvent(event);

    this.__unsubFromSelectedItem();

    this._selected = event.detail.value;

    if (this._selected && !allProcessingRan(this._selected)) {
      this.__startSelectedItemSub();
    }
  }


  __cleanupSelected() {

    this.__unsubFromSelectedItem();
    this._selected = undefined;
  }


  __appImageClickedHandler(event) {

    hijackEvent(event);

    if (!this._src) { return; }

    this.$.picker.openEditor(this._src);
  }


  async __removeBtnClicked() {

    try {

      if (!this.user || this._selected) { return; }

      await this.clicked();

      if (!this._stampModal) {

        // Open a confirmation modal.
        await import(
          /* webpackChunkName: 'account-remove-photo-modal' */ 
          './account-remove-photo-modal.js'
        );
        
        this._stampModal = true;

        await listenOnce(this.$.modalStamper, 'dom-change');
      }

      await this.select('#modal').open();
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
      //
      // The 'core-updateProfilePhotos' cloud function will be
      // triggerd by this change. It will add any missing photo 
      // data once the image is fully processed.
      //
      //    See cloud.js file in the '@longlost/app-core' package
      //    for more details.
      //
      // This architecture allows the user to continue their experience
      // without having to wait for further cloud image processing steps.
      await set({
        coll: `users`,
        doc:   this.user.uid,
        data: {
          [this.type]: this._selected
        }
      });

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

      // The 'core-updateProfilePhotos' cloud function will handle
      // removing the photoURL from the user profile data.
      //
      //    See 'cloud.js' file in the '@longlost/app-core' package
      //    for more details.
      await set({
        coll: `users`,
        doc:   this.user.uid,
        data: {
          [this.type]: null // MUST be 'null' for cloud function.
        }
      });

      this.__cleanupSelected();

      await message('Profile photo removed.');
    }
    catch (error) {
      console.error(error);

      warn('Sorry, your profile photo was not removed.');
    }
  }


  async open() {

    this._stampContent = true;

    await listenOnce(this.$.contentStamper, 'dom-change');
    
    return this.$.picker.open();
  }

}

window.customElements.define(AccountPhotoPicker.is, AccountPhotoPicker);
