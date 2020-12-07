

/**
  * `account-avatar`
  * 
  *   User account avatar photo.
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
import {consumeEvent}     from '@longlost/app-core/utils.js';
import htmlString         from './account-avatar.html';
import '@longlost/app-core/app-shared-styles.js';
import '@polymer/iron-a11y-keys/iron-a11y-keys.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-image/iron-image.js';
import '@polymer/paper-ripple/paper-ripple.js';
import '../app-shell-icons.js';


class AccountAvatar extends AppElement {
  static get is() { return 'account-avatar'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      selectable: {
        type: Boolean,
        value: false
      },

      src: {
        type: String,
        value: ''
      },

      _clicked: Boolean,

      _hideImg: {
        type: Boolean,
        value: true,
        computed: '__computeHideImg(src)'
      },

      _rippled: Boolean,

      _tabindex: {
        type: String,
        value: '-1',
        computed: '__computeTabindex(selectable)'
      }

    };
  }


  static get observers() {
    return [
      '__clickedRippledChanged(_clicked, _rippled)'
    ];
  }


  connectedCallback() {
    super.connectedCallback();

    this.$.a11y.target = this.$.wrapper;
  }


  __computeHideImg(src) {
    return (!src || src === '#');
  }


  __computeTabindex(selectable) {
    return selectable ? '0' : '-1';
  }


  __a11yKeysPressed(event) {
    consumeEvent(event);
    
    const {key} = event.detail.keyboardEvent;

    if (key === 'Enter') {
      this.__wrapperClicked();
    }
  }


  __clickedRippledChanged(clicked, rippled) {

    if (clicked && rippled) {
      this._clicked = false;
      this._rippled = false;

      this.fire('clicked-rippled');
    }
  }


  __rippleDoneHandler(event) {
    consumeEvent(event);

    this._rippled = true;
  }


  async __wrapperClicked() {
    try {
      await this.clicked();

      this._clicked = true;
      this._rippled = false;
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }

}

window.customElements.define(AccountAvatar.is, AccountAvatar);
