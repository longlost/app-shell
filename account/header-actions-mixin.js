
/**
  * `HeaderActionsMixin`
  *
  *   Logic involving the account header's buttons, dropdown menu and images.
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  **/


import {
  hijackEvent, 
  schedule, 
  warn
} from '@longlost/app-core/utils.js';

import '@longlost/app-core/app-icons.js';
import '@longlost/app-images/app-image.js';
import '@longlost/app-images/avatar-image.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '../shared/app-shell-icons.js';
import './account-actions-dropdown.js';


export const HeaderActionsMixin = superClass => {

  return class HeaderActionsMixin extends superClass {


    static get properties() {
      return {

        // From a live subscription to the user's database collection.
        data: Object,

        // Should be a webpack responsive-loader image object.
        //
        // This is used as a branded placeholder, used only when the user 
        // has not provided a personalized profile background photo.
        headerImage: Object,

        // From `app-auth`.
        user: Object,

        // The most current user avatar photo item.
        _avatar: {
          type: Object,
          computed: '__computeAvatar(_opened, user, data)'
        },

        _photoPickerType: {
          type: String,
          value: 'avatar' // Or 'background'.
        },

        _profileBackground: {
          type: Object,
          computed: '__computeProfileBackground(_opened, data, headerImage)'
        }        

      };
    }


    __computeAvatar(opened, user, data) {

      if (!opened || !user) { return; }

      if (data) { return data.avatar; }

      return user.photoURL;
    }


    __computeProfileBackground(opened, data, img) {

      if (!opened) { return; }

      // If user removes the background, display the default img.
      if (data) { 
        return data.background ? data.background : img; 
      }

      return img;
    }


    async __actionsQuickStartHandler(event) {

      hijackEvent(event);

      await this.select('#overlay').close();

      this.fire('app-account-open-quick-start');
    }


    async __actionsResendHandler(event) {

      hijackEvent(event);

      await import(
        /* webpackChunkName: 'account-resend-verification-modal' */ 
        './account-resend-verification-modal.js'
      );

      this.select('#resendVerificationModal').open();
    }


    async __actionsSignOutHandler(event) {

      hijackEvent(event);

      await this.select('#overlay').close();

      this.fire('app-account-signout-clicked');
    }


    async __openPhotoPicker() {

      try {

        if (!this.user) {
          throw new Error('User is not logged in before attempting to add/edit the profile avatar.');
        }

        await import(
          /* webpackChunkName: 'account-photo-picker' */ 
          './account-photo-picker.js'
        );

        await schedule();

        await this.$.picker.open();
      }
      catch (error) {
        console.error(error); 

        warn('Sorry, the photo picker failed to load.');
      }
    }


    async __changeBackgroundButtonClicked() {

      try {
        await this.clicked();

        this._photoPickerType = 'background';
        this.__openPhotoPicker();
      }
      catch (error) { 
        if (error === 'click debounced') { return; }
        console.error(error); 
      }
    }
    

    async __moreBtnClicked() {

      try {
        await this.clicked();

        this.select('#actions').open();
      }
      catch (error) {
        if (error === 'click debounced') { return; }
        console.error(error);
      }
    }


    __avatarClicked(event) {

      hijackEvent(event);

      this._photoPickerType = 'avatar';
      this.__openPhotoPicker();
    } 

  };
};
