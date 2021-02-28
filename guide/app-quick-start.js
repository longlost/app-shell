
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
  *     - Welcome
  *
  *     - Verification email acknowledgment
  *
  *     - Dark mode setup
  *
  *     - Offline persistence setup 
  *         (only included if config.js appUserAndData.trustedDevice set to true)
  *
  *     - Installed PWA mode info with links to browser specific instructions
  *
  *     - Conclusion
  *
  * 
  *
  *   The implementation can customize the guide by including custom pages 
  *   that will be inserted between the verification and dark mode pages.
  *
  *   This is exposed as a 'quick-start' slot via `app-shell`.
  *
  *   
  *
  *   Api:
  *
  *
  *
  *     Properties:
  *
  *
  *       autoColorMode - <Boolean> undefined
  *
  *         The current state of dark mode following the device theme setting.
  *
  *
  *
  *       darkMode - <Boolean> undefined
  *
  *         The current state of the dark mode setting.
  *
  *
  *
  *       hideAutoColorMode - <Boolean> undefined
  *
  *         Hide the auto color mode option when not supported.
  *
  *
  *
  *       narrow - <Boolean> undefined
  *
  *         The current state of the main menu drawer and layout.
  *         Show "Menu" icons in nav hints when in narrow mode.
  *
  *
  *
  *       page - <String> undefined
  *
  *         The user selected page, chosen with 'back' and 'next' buttons.
  *         Also set with localstorage value from `app-shell`.
  *
  *
  *
  *       persistence - <Boolean> undefined
  *
  *         The current state of offline persistence setting.
  *
  *
  *
  *       user - <Object> undefined
  *
  *         The current app user.
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
  *       'app-quick-start-current-page-changed', detail - {value: page <String>}
  *
  *         Fired after a new page has finished animating into view.
  *
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
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  **/
  
// Must use module resolution in webpack config and include app.config.js file in root
// of src folder (ie. resolve: {modules: [path.resolve(__dirname, 'src'), 'node_modules'],})
import {appUserAndData} from 'config.js';

import {
  AppElement, 
  html
} from '@longlost/app-core/app-element.js';

import {
  consumeEvent,
  hijackEvent
} from '@longlost/app-core/utils.js';

import {mode as pwaDisplayMode} from '@longlost/app-core/boot/install.js';

import htmlString from './app-quick-start.html';
import '@longlost/app-core/app-icons.js';
import '@longlost/app-core/app-shared-styles.js';
import '@longlost/app-overlays/app-header-overlay.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-progress/paper-progress.js';
import './qs-welcome-page.js';
import './qs-verification-page.js';
import './qs-dark-mode-page.js';
import './qs-conclusion-page.js';

// `tab-pages`, `qs-persistence-page` and `qs-pwa-install-page` imported lazily.
//
//    Tab-pages must wait for dynamic `qs-persistence-page` and 
//    `qs-pwa-install-page` imports before it can take measurements.


class AppQuickStartGuide extends AppElement {

  static get is() { return 'app-quick-start'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      autoColorMode: Boolean,

      darkMode: Boolean,

      hideAutoColorMode: Boolean,

      // The current state of the main menu drawer and layout.
      // Show "Menu" icons in nav hints when in narrow mode.
      narrow: Boolean,

      // The user selected page, chosen with 'back' and 'next' buttons.
      // Also set with localstorage value from `app-shell`.
      page: String,

      persistence: Boolean,

      theme: {
        type: String,
        value: 'light',
        reflectToAttribute: true,
        computed: '__computeTheme(darkMode)'
      },

      user: Object,

      _afterDefaultSlotPages: {
        type: Array,
        computed: '__computeAfterDefaultSlotPages(_includePersistencePage, _includePWAInstallPage)'
      },

      _beforeDefaultSlotPages: {
        type: Array,
        value: [
          'welcome',
          'verification'
        ]
      },

      // The selected tab value AFTER tab-pages animation finishes.
      // Initialized at runtime from `app-shell` localstorage value.
      _currentPage: String,

      _currentProgress: {
        type: Number,
        computed: '__computeCurrentProgress(_pages, _currentPage)'
      },

      _defaultSlotNodes: Array,

      _defaultSlotPages: {
        type: Array,
        computed: '__computeDefaultSlotPages(_defaultSlotNodes)'
      },

      _headerThresholdTriggered: Boolean,

      _max: {
        type: Number,
        computed: '__computeMax(_pages)'
      },

      _opened: Boolean,

      _pages: {
        type: Array,
        computed: '__computePages(_afterDefaultSlotPages, _beforeDefaultSlotPages, _defaultSlotPages)'
      },

      // From 'config.js' appUserAndData.trustedDevice setting.
      _includePersistencePage: Boolean,

      // Hide the `qs-pwa-install-page` to those 
      // who have already installed the app.
      _includePWAInstallPage: Boolean,

      _progress: {
        type: Number,
        value: 0
      },

      _showBackBtnClass: {
        type: String,
        computed: '__computeShowBackBtnClass(_currentPage)'
      },

      _showNextBtnClass: {
        type: String,
        computed: '__computeShowNextBtnClass(_currentPage)'
      },

      // Directly drives `tab-pages`.
      _tabPage: {
        type: String,
        value: 'welcome'
      },

      _tabPagesReady: Boolean

    };
  }


  static get observers() {
    return [
      '__currentPageChanged(_currentPage)',
      '__updateProgress(_currentProgress)',
      '__updateTabPage(page, _headerThresholdTriggered, _tabPagesReady)'
    ];
  }


  constructor() {

    super();

    this._includePersistencePage = appUserAndData.trustedDevice;
    this._includePWAInstallPage  = pwaDisplayMode === 'browser';
  }


  connectedCallback() {

    super.connectedCallback();

    // Initialize value from `app-shell` localstorage value.
    this._currentPage = this.page;
  }


  __computeAfterDefaultSlotPages(includePersistence, includeInstall) {

    const base = ['dark'];

    if (includePersistence) {
      base.push('persistence');
    }

    if (includeInstall) {
      base.push('install');
    }

    return [...base, 'conclusion'];
  }


  __computeCurrentProgress(pages, current) {

    if (!Array.isArray(pages) || !current) { return 0; }

    return pages.indexOf(current);
  }


  __computeDefaultSlotPages(nodes = []) {

    return nodes.map(node => node.page);
  }


  __computeMax(pages) {

    if (!Array.isArray(pages)) { return 0; }

    return pages.length - 1;
  }


  __computePages(after, before, slotted = []) {

    if (!after || !before) { return; }

    return [...before, ...slotted, ...after];
  }


  __computeShowBackBtnClass(page) {

    return page === 'welcome' ? '' : 'show-btn';
  }


  __computeShowNextBtnClass(page) {

    return page === 'conclusion' ? '' : 'show-btn';
  }


  __computeTheme(darkMode) {

    return darkMode ? 'dark' : 'light';
  }


  __currentPageChanged(page) {

    this.fire('app-quick-start-current-page-changed', {value: page});
  }


  __updateProgress(currentProgress = 0) {

    this._progress = Math.max(this._progress, currentProgress);
  }

  // Scroll back to top before showing next page.
  __updateTabPage(page, thresholdTriggered, ready) {

    if (!page || !ready) { return; }

    if (page === this._tabPage) { return; }

    if (thresholdTriggered) {
      window.scrollTo({top: 0, behavior: 'smooth'});

      return;
    }

    this._tabPage = page;
  }


  __thresholdTriggeredHandler(event) {

    hijackEvent(event);

    this._headerThresholdTriggered = event.detail.value;
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


  __tabPagesReadyHandler(event) {

    hijackEvent(event);

    this._tabPagesReady = true;
  }


  __defaultSlotChangeHandler(event) {

    consumeEvent(event); // Stops interference with `tab-pages`.

    this._defaultSlotNodes = this.slotNodes('#defaultSlot');
  }


  async __backBtnClicked() {

    try {
      await this.clicked();

      const nextIndex = Math.max(this._currentProgress - 1, 0);

      this.page = this._pages[nextIndex];
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

      this.page = this._pages[nextIndex];
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async open() {

    if (this._includePersistencePage) {
      await import(
        /* webpackChunkName: 'app-shell-qs-persistence-page' */ 
        './qs-persistence-page.js'
      );
    }

    if (this._includePWAInstallPage) {
      await import(
        /* webpackChunkName: 'app-shell-qs-pwa-install-page' */ 
        './qs-pwa-install-page.js'
      );
    }

    // Wait for `qs-persistence-page` to 
    // load before `tab-pages` can taking 
    // measurements during initialization.
    await import(
      /* webpackChunkName: 'tab-pages' */ 
      '@longlost/tab-pages/tab-pages.js'
    );

    await this.$.overlay.open();

    this._opened = true;
  }

}

window.customElements.define(AppQuickStartGuide.is, AppQuickStartGuide);
