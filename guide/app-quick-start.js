
/**
  * `app-quick-start`
  * 
  *   A full screen quick start guide. 
  *
  *   Welcome and introduce the user to the key features of the app.
  *
  *
  *   The guide includes the following default pages:
  *
  *     Welcome
  *
  *     Verification email acknowledgment
  *
  *     Offline persistence setup
  *
  *     Dark mode setup
  *
  *     Installed PWA mode info with links to browser specific instructions
  *
  *     Conclusion
  *
  *  
  *
  *   
  *
  *   Api:
  *
  *
  *    
  *     Styling:
  *
  *
  *       --carousel-dot-size - default 8px.
  *
  *
  *
  *     Properties:
  *
  *
  *       user - <Object> undefined, the current app user.
  *
  *
  *
  *
  *     Methods:
  *
  *     
  *       open() - Open the quick start guide overlay.
  *
  *
  *
  *
  *     Events:
  *
  *
  *       'app-quick-start-closed', detail - {}
  *
  *         Fired each time a guide is closed.
  *
  *
  *
  *      
  *
  *       
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  **/
  

import {AppElement, html}          from '@longlost/app-core/app-element.js';
import {consumeEvent, hijackEvent} from '@longlost/app-core/utils.js';
import htmlString                  from './app-quick-start.html';
import '@longlost/app-core/app-icons.js';
import '@longlost/app-core/app-shared-styles.js';
import '@longlost/app-overlays/app-overlay.js';
import '@longlost/tab-pages/tab-pages.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-progress/paper-progress.js';
import './qs-welcome-page.js';
import './qs-verification-page.js';
import './qs-persistence-page.js';


class AppQuickStartGuide extends AppElement {

  static get is() { return 'app-quick-start'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      user: Object,

      _afterDefaultSlotPages: {
        type: Array,
        value: [
          'persistence',
          'dark',
          'installed',
          'conclusion'
        ]
      },

      _beforeDefaultSlotPages: {
        type: Array,
        value: [
          'welcome',
          'verification'
        ]
      },

      // The selected tab value AFTER tab-pages animation finishes.
      _currentPage: {
        type: String,
        value: 'welcome'
      },      

      _currentProgress: {
        type: Number,
        computed: '__computeCurrentProgress(_pages, _currentPage)'
      },

      _max: {
        type: Number,
        computed: '__computeMax(_pages)'
      },

      _pages: {
        type: Array,
        computed: '__computePages(_afterDefaultSlotPages, _beforeDefaultSlotPages, _defaultSlotPages)'
      },

      _progress: {
        type: Number,
        value: 0
      },

      // The upcomming page chosen with 'back' and 'next' buttons.
      _selectedPage: {
        type: String,
        value: 'welcome'
      },

      _showBackBtnClass: {
        type: String,
        computed: '__computeShowBackBtnClass(_currentPage)'
      },

      _showNextBtnClass: {
        type: String,
        computed: '__computeShowNextBtnClass(_currentPage)'
      },

      _defaultSlotNodes: Array,

      _defaultSlotPages: {
        type: Array,
        computed: '__computeDefaultSlotPages(_defaultSlotNodes)'
      }

    };
  }


  static get observers() {
    return [
      '__currentPageChanged(_currentPage)',
      '__selectedPageChanged(_selectedPage)',
      '__updateProgress(_currentProgress)'
    ];
  }


  __computeCurrentProgress(pages, current) {

    if (!Array.isArray(pages)) { return 0; }

    return pages.indexOf(current);
  }


  __computeMax(pages) {

    if (!Array.isArray(pages)) { return 0; }

    return pages.length - 1;
  }


  __computePages(after, before, slotted = []) {

    return [...before, ...slotted, ...after];
  }


  __computeShowBackBtnClass(page) {

    return page === 'welcome' ? '' : 'show-btn';
  }


  __computeShowNextBtnClass(page) {

    return page === 'conclusion' ? '' : 'show-btn';
  }


  __computeDefaultSlotPages(nodes = []) {

    return nodes.map(node => node.page);
  }


  __currentPageChanged(page) {

    this.fire('app-quick-start-current-page-changed', {value: page});
  }


  __selectedPageChanged(page) {

    this.fire('app-quick-start-selected-page-changed', {value: page});
  }


  __updateProgress(currentProgress = 0) {

    this._progress = Math.max(this._progress, currentProgress);
  }


  __overlayResetHandler() {

    this.fire('app-quick-start-closed');
  }


  async __closeBtnClicked() {

    try {
      await this.clicked();

      await this.$.overlay.close();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  __tabPageChangedHandler(event) {

    hijackEvent(event);

    this._currentPage = event.detail.value;
  }


  __defaultSlotChangeHandler(event) {

    consumeEvent(event); // Stops interference with `tab-pages`.

    this._defaultSlotNodes = this.slotNodes('#defaultSlot');
  }


  async __backBtnClicked() {

    try {
      await this.clicked();

      const nextIndex = Math.max(this._currentProgress - 1, 0);

      this._selectedPage = this._pages[nextIndex];
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __nextBtnClicked() {

    try {
      await this.clicked();

      const nextIndex = Math.min(this._currentProgress + 1, this._pages.length - 1);

      this._selectedPage = this._pages[nextIndex];
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  open() {

    return this.$.overlay.open();
  }

}

window.customElements.define(AppQuickStartGuide.is, AppQuickStartGuide);
