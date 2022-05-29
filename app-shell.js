
/**
  * `app-shell`
  *
  *   App level element that includes core competencies that are vital to any PWA.
  *
  *   It includes quick rendering by utilizing the 'App Shell' architecture model.
  *   Essencial elements are initially rendered with minimum styles before being
  *   hydrated with their JS definitions and being upgraded to Custom Elements.
  *   This defers expensive DOM work until after the inital fast render.
  *
  *   This element also handles Url Routing for Views and controlling Overlays.
  *
  *   Several common app necessities are build into `app-shell`, such as complete 
  *   User Auth and Account workflows, as well as a Settings panel that features
  *   Light/Dark mode theme controls, and User Data Persistence options.
  *
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  **/


import {appUserAndData} from 'config.js';

import {AppElement} from '@longlost/app-core/app-element.js';

import {
  hijackEvent,
  listenOnce,
  schedule,
  message,
  wait,
  warn
} from '@longlost/app-core/utils.js';

import {waitForLoaded}          from './shell/utils.js';
import {OverlayControlMixin}    from './shell/overlay-control-mixin.js';
import {ThemeMixin}             from './shell/theme-mixin.js';
import firebaseReady            from '@longlost/app-core/firebase.js';
import {setEnableDbPersistence} from '@longlost/app-core/services/settings.js';
import template                 from './app-shell.html';


// All custom element definitions imported after window 
// 'load' for improved perceived initial load performance 
// (Lighthouse Performance Score).

// `app-account`, 'services', `app-settings`, `app-auth` 
// overlays are imported dynamically.



const hydrateCustomElements = () => 
  import(/* webpackChunkName: 'view-404' */ './shell/app-shell-imports.js');


const builtInLazyImports = {
  view404:  () => import(
    /* webpackChunkName: 'view-404' */
    './views/view-404.js'
  ),
  account:  () => import(
    /* webpackChunkName: 'app-account' */
    './account/app-account.js'
  ),
  settings: () => import(
    /* webpackChunkName: 'app-settings' */
    './settings/app-settings.js'
  ),
  auth:     () => import(
    /* webpackChunkName: 'app-auth' */
    './auth/app-auth.js'
  ),
};

const builtInLazyImport = name => builtInLazyImports[name]();


class AppShell extends ThemeMixin(OverlayControlMixin(AppElement)) {

  static get is() { return 'app-shell'; }

  static get template() {
    return template;
  }


  static get properties() {
    return {

      // Must be from webpack responsive-loader.
      accountHeaderImage: Object,

      // Number of account header toolbars (64px tall each).
      accountHeaderSize: {
        type: Number,
        value: 4
      },

      // For whitelisted apps such as CMS.
      accountRequired: Boolean,

      // Menu drawer divider between views and overlays.
      divider: Boolean,

      drawerAlign: {
        type: String,
        value: 'start' // Or 'end' to put it on the right side of the screen.
      },

      fixedHeader: Boolean,

      headerSize: {
        type: Number,
        value: 1
      },
      
      hideMenu: {
        type: Boolean,
        value: false,
      },

      // Webpack dynamic imports from parent.
      // Used for lazy loading views and overlays 
      // that have a nav menu entry.
      imports: Object,

      noUsers: {
        type: Boolean,
        value: false
      },

      // Routing.
      page: String,

      revealHeader: Boolean,
      
      //  [polymer-root-path]
      //
      //  By default, we set `Polymer.rootPath` to the server root path (`/`).
      //
      //  Leave this line unchanged if you intend to serve your app from the root
      //  path (e.g., with URLs like `my.domain/` and `my.domain/view1`).
      //
      //  If you intend to serve your app from a non-root path (e.g., with URLs
      //  like `my.domain/app-main/` and `my.domain/app-main/view1`), edit this line
      //  to indicate the path from which you'll be serving, including leading
      //  and trailing slashes (e.g., `/app-main/`).
      rootPath: {
        type: String,
        value: '/'
      },

      // Use in conjunction with app-main _overlayImports.
      // Add overlay ids to this object if you intend
      // on the overlay's content being important to SEO.
      // The expected route should be added to sitemap.xml file
      // for googlebot to pickup
      //
      // WARNING!!
      //
      // The overlays will be opened when routed to from 
      // a direct link (ie. "www.my-app.com/my-overlay"), so
      // be sure that the overlay can be opened as a standalone
      // workflow without any preconditions
      //
      // Object consists of expected route as key and overlay id as val.
      //
      // ie. {my-overlay: 'myOverlay'} 
      //
      seoOverlayIds: Object,

      // Read Only.
      // This boolean becomes true AFTER the window 'load' event,
      // and AFTER all `app-shell` custom elements have been
      // imported/upgraded.
      shellReady: Boolean,

      stickyBottomToolbar: Boolean,

      threshold: {
        type: Number,
        value: 0
      },

      title: {
        type: String,
        value: 'Title Goes Here'
      },

      viewChangedScroll: {
        type: String,
        value: 'none' // Or 'instant', 'smooth'.
      },

      // Fired from 'app-account' when user has updated their avatar photo.
      _accountAvatarItem: Object,

      // Show 'person-outline' icon when no user is logged in.
      // Show 'account-circle' icon when user is logged in.
      _accountIcon: {
        type: String,
        computed: '__computeAccountIcon(_user)'
      },

      // User's profile avatar photo.
      //
      // Favors the '_accountAvatarItem', which contains the most up-to-date
      // data coming from 'app-account' when the user updates their photo, 
      // using 'account-photo-picker'. 
      //
      // This mamual method was chosen, instead of simply keeping a live 
      // subscription for the entire duration of a user session, in an 
      // attempt to reduce user and app owner data charges at scale.
      _avatar: {
        type: Object,
        computed: '__computeAvatar(_user, _accountAvatarItem)'
      },

      _bottomViewDrawerItems: Array,

      _descriptionMeta: Object,

      _jsonLdScript: Object,

      _menuOverlaysSlotNodes: Array,

      // The current state of the main menu drawer and layout.
      _narrow: Boolean,

      _overlayDrawerItems: Array,

      _persistence: Boolean,

      _quickStartPage: {
        type: String,
        value: 'welcome'
      },

      _routerPage: String,

      _subroute: String,

      // Drives 'dom-if' template that wraps 'app-settings'
      _stampSettings: Boolean,

      // Drives 'dom-if' template that wraps 'app-quick-start'
      _stampQuickStart: Boolean,

      _user: { 
        type: Object,
        value: null
      },

      _userDataUnsub: Object,

      _viewDrawerItems: Array

    };
  }


  static get observers() {
    return [
      '__drawerAlignChanged(drawerAlign)',
      '__fixedHeaderChanged(fixedHeader)',
      '__pageChanged(page)',
      '__persistenceChanged(_persistence)',
      '__shellReadyChanged(shellReady)',
      '__revealHeaderChanged(revealHeader)',
      '__routerPageChanged(_routerPage)',
      '__stickyBottomToolbarChanged(stickyBottomToolbar)'
    ];
  }


  constructor() {

    super();

    this.__showAuthUIHandler = this.__showAuthUIHandler.bind(this);
  }


  async connectedCallback() {

    super.connectedCallback();

    // Wait to load custom element imports to improve 
    // perceived initial loading performance.
    await waitForLoaded(); 

    this._descriptionMeta = document.head.querySelector('[name~=description]');
    this._jsonLdScript    = document.head.querySelector('[id~=pageJsonLd]');

    await hydrateCustomElements();

    this.__initializePersistence();

    await schedule();

    this.__removeNotLoadedClasses();

    if (!this.noUsers) {

      this.addEventListener('show-user-ui', this.__showAuthUIHandler);

      await builtInLazyImport('auth');
    }

    this.shellReady = true;
  }


  disconnectedCallback() {

    super.disconnectedCallback();

    this.removeEventListener('show-user-ui', this.__showAuthUIHandler);
  }
  

  __computeAccountIcon(user) {

    if (!user) { return 'app-shell-icons:person-outline'; }

    return 'app-shell-icons:account-circle';
  }


  __computeAvatar(user, avatarItem) {

    if (!user) { return; }

    // 'avatarItem' is null when user chooses to remove their avatar.
    if (avatarItem === undefined) { return user.photoURL; }

    return avatarItem;
  }


  __computeBottomToolbarHidden(headerSize) {

    if (headerSize < 2) { return true; }

    return false;
  }


  __computeMiddleToolbars(headerSize) {

    if (headerSize < 3) { return []; }

    const middleToobarCount = headerSize - 2;
    const slots             = [];

    for (let i = 0; i < middleToobarCount; i += 1) {
      slots.push({slotName: `middle-toolbar-${i}`});
    }

    return slots;
  }


  __drawerAlignChanged(drawerAlign) {

    if (drawerAlign === 'end') {
      this.$.drawer.classList.add('drawer-align-end');
      this.$.mainPanel.classList.add('drawer-align-end');
    }
    else {
      this.$.drawer.classList.remove('drawer-align-end');
      this.$.mainPanel.classList.remove('drawer-align-end');
    }
  }


  __setHeaderAttribute(bool, attr) {

    if (bool === undefined) { return; }

    if (bool) {
      this.$.header.setAttribute(attr, true);
    }
    else {
      this.$.header.removeAttribute(attr);
    }
  }


  __fixedHeaderChanged(bool) {

    this.__setHeaderAttribute(bool, 'fixed');
  }


  __pageChanged(page) {

    this.fire('app-shell-page-changed', {value: page});
  }


  async __persistenceChanged(persistence) {

    if (persistence) {

      setEnableDbPersistence();
    }
  }


  __revealHeaderChanged(bool) {

    this.__setHeaderAttribute(bool, 'reveals');
  }


  __stickyBottomToolbarChanged(sticky) {

    if (sticky) {
      this.__setHeaderAttribute(true, 'fixed');
      this.$.topToolbar.removeAttribute('sticky');
      this.$.bottomToolbar.setAttribute('sticky', true);
    }
    else {
      this.__setHeaderAttribute(false, 'fixed');
      this.$.topToolbar.setAttribute('sticky', true);
      this.$.bottomToolbar.removeAttribute('sticky');
    }
  }


  async __initializePersistence() {

    // One time initialization to default to app.config setting.
    await this.$.persistenceStorage.transactionsComplete;

    const storedVal = this.$.persistenceStorage.data;

    if (storedVal === undefined) {

      // Cannot set this._persistence here, will not trigger data-changed event.
      this.$.persistenceStorage.data = appUserAndData.trustedDevice;
    }
  }


  __removeNotLoadedClasses() {

    const elements = this.selectAll('.not-loaded');

    elements.forEach(el => {
      el.classList.remove('not-loaded');
    });
  }


  __getPage(page) {

    if (page) { return page; }

    return this._viewDrawerItems[0].page.value; // ie. 'home'.
  }


  async __switchView(page) {

    // Polymer 2.0 will call with `undefined` on initialization.
    // Ignore until we are properly called with a string.
    if (page === undefined) { return; }

    try {

      // If no page was found in the route data, page will be an empty string.
      // Deault to the first view element in that case.
      this.page           = this.__getPage(page);
      const dynamicImport = this.imports[this.page];

      await dynamicImport();
    }
    catch (_) {

      // Check for available seo ready overlays for web crawler.
      if (this.seoOverlayIds && this.seoOverlayIds[page]) {

        try {
          const id = this.seoOverlayIds[page];

          await this.debounce('seo-overlay-debounce', 100);

          this.fire('open-overlay', {id});
        }
        catch (error) {
          if (error === 'debounced') { return; }
          console.error(error);
        }
      }
      else { // If no seo overlays, fallback to view-404.
        this.page = 'view404';
        await builtInLazyImport('view404');
      }
    } 
    finally {

      // Close a non-persistent drawer when the page & route are changed.
      if (!this.$.drawer.persistent) {
        this.$.drawer.close();
      }
    }
  }

  
  async __updateSEOMeta(page) {

    try { 
      const {default: seo} = await import(/* webpackChunkName: 'seo' */ 'seo.json');  

      const defaultPage      = this.__getPage(page);
      const selectedPageData = seo[defaultPage];

      if (!selectedPageData) {
        console.warn(`The ${defaultPage} page does not have data in seo.json file.`); 
        return;
      }

      const {description, pageJson, title} = selectedPageData;

      this._descriptionMeta.setAttribute('content', description);
      document.title = title;

      if (this._jsonLdScript) {      
        this._jsonLdScript.innerHTML = JSON.stringify(pageJson);
      }
      else {
        console.warn('No json-ld script tag with id="pageJsonLd" found in document head.');
      }
    }
    catch (error) {
      console.error(error);
    }
  }


  async __routerPageChanged(page) {

    await this.__switchView(page);
    await this.__updateSEOMeta(page);

    const behavior = this.viewChangedScroll === 'instant' ? 'auto' : 'smooth';

    window.scrollTo({top: 0, behavior});
  }

  // This one time event fires AFTER the window 'load' event,
  // and AFTER all `app-shell` custom elements have been
  // imported/upgraded.
  __shellReadyChanged(ready) {

    if (!ready) { return; }

    this.fire('app-shell-ready-changed', {value: true});
  }


  __waitForDrawerToClose() {

    // Only close drawer in narrow layouts (ie. mobile portrait).
    if (this._narrow && this.$.drawer.opened) {

      this.$.drawer.close();

      return listenOnce(this, 'app-drawer-transitioned');
    }
  }


  __waitForTemplateToStamp(stampIf, domIfId) {

    if (this[stampIf]) { return; }

    const template = this.select(`#${domIfId}`);

    this[stampIf] = true;

    return listenOnce(template, 'dom-change');
  }


  async __prepToOpenOverlay({domIfId, id, page, stampIf}) {

    try {

      await this.clicked();
      await this.__waitForDrawerToClose();

      const getOverlay = async () => {

        if (page) {

          const dynamicImport = this.imports[page];

          await dynamicImport();

          return this._menuOverlaysSlotNodes.find(node => node.id === id);
        }

        await builtInLazyImport(id);

        if (domIfId) {
          await this.__waitForTemplateToStamp(stampIf, domIfId);
        }

        return this.select(`#${id}`);
      };
      
      const overlay = await getOverlay();
      overlay.open();
    }
    catch (error) {
      if (error === 'click debounced') { return; }

      if (window.navigator.onLine) {
        console.error(error);
        warn('The page you requested failed to load.');
      }
      else {
        warn('The page you requested failed to load. Please check your internet connection.');
      }
    }
  }


  async __showAccountRequiredOverlay() {

    try {
      this.$.accountRequiredOverlay.style.display = 'flex';

      await schedule();

      this.$.accountRequiredOverlay.classList.add('show-account-required');

      return wait(200);
    }
    catch (error) {
      console.error(error);
    }
  }


  async __hideAccountRequiredOverlay() {

    try {
      this.$.accountRequiredOverlay.classList.remove('show-account-required');

      await wait(200);

      this.$.accountRequiredOverlay.style.display = 'none';
    }
    catch (error) {
      console.error(error);
    }
  }


  __drawerAccountSelected(event) {

    hijackEvent(event);

    if (this._user) {
      this.__prepToOpenOverlay({id: 'account'});
    }
    else {
      this.showAuthUI();
    }
  }


  __drawerSettingsSelected(event) {

    hijackEvent(event);

    this.__prepToOpenOverlay({
      id:      'settings', 
      domIfId: 'settingsTemplate',
      stampIf: '_stampSettings'
    });
  }


  __drawerOverlayItemSelected(event) {

    hijackEvent(event);

    this.__prepToOpenOverlay(event.detail.selected);
  }


  async __confirmToastUndoButtonClicked() {

    try {
      await this.clicked();
      this.$.confirmToast.cancel()
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __fsToastRenameButtonClicked() {

    try {
      await this.clicked();
      this.$.fsToast.cancel();      
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __fsToastGoButtonClicked() {

    try {
      await this.clicked();
      this.$.fsToast.close();      
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __swToastDismissButtonClicked() {

    try {
      await this.clicked();
      this.$.swToast.cancel();      
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __swToastRefreshButtonClicked() {

    try {
      await this.clicked();
      this.$.swToast.close();      
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  __signOut() {

    return this.$.auth.signOut();
  }


  __unsubFromUserData() {

    if (this._userDataUnsub) {
      this._userDataUnsub();
      this._userDataUnsub = undefined;
    }
  }


  async __openQuickStart() {

    await import(
      /* webpackChunkName: 'app-quick-start' */ 
      './guide/app-quick-start.js'
    );

    await this.__waitForTemplateToStamp('_stampQuickStart', 'qsTemplate');

    return this.select('#quickStart').open();
  }

  // Subscribe to user data, which is created by
  // a cloud function which is triggered by the 
  // Firebase Auth onCreate event.
  async __welcomeUser(user) {

    if (!user) { 

      this.__unsubFromUserData();

      return; 
    }

    const {set, subscribe} = await import(
      /* webpackChunkName: 'services' */ 
      '@longlost/app-core/services/services.js'
    );

    const callback = async data => {

      if (!this._user) { 

        this.__unsubFromUserData();

        return; 
      }

      if (!data) { return; }      

      const verifiedOrVerificationSent = (user.emailVerified || data.verificationEmailSent); 

      if (verifiedOrVerificationSent && data.onboarded) {

        this.__unsubFromUserData();
        
        const {displayName} = user;
        const name          = displayName ? ` ${displayName}` : '';

        message(`Welcome${name}!`);
      }

      if (!verifiedOrVerificationSent) {

        const {loadAuth}              = await firebaseReady();
        const {sendEmailVerification} = await loadAuth();

        await sendEmailVerification(this._user);

        set({
          coll: 'users',
          doc:   this._user.uid,
          data: {verificationEmailSent: true}
        });
      }

      // Wait until AFTER 'verificationEmailSent' has been set
      // from the previous invocation, to avoid jank that
      // breaks the quickstart overlay animation.
      if (verifiedOrVerificationSent && !data.onboarded) {

        this.__openQuickStart();
      }
    };

    const errorCallback = error => {
      console.error(error);
    };
 
    this._userDataUnsub = await subscribe({
      callback,
      coll: 'users',
      doc:   user.uid,
      errorCallback
    });
  }


  __accountAvatarChangedHandler(event) {

    hijackEvent(event);

    this._accountAvatarItem = event.detail.value;
  }


  async __accountReauthNeededHandler(event) {

    try {
      hijackEvent(event);

      await this.__signOut();      

      this.showAuthUI();
    }
    catch (error) {
      console.warn('__accountReauthNeededHandler error: ', error);
    }
  }


  __accountSignoutClickedHandler(event) {

    hijackEvent(event);

    this.__signOut();
  }


  __accountUserDeletedHandler(event) {

    hijackEvent(event);

    this._autoColorMode  = true;
    this._persistence    = appUserAndData.trustedDevice;
    this._quickStartPage = 'welcome';
  }


  __authAccountBtnHandler(event) {

    hijackEvent(event);

    this.__prepToOpenOverlay({id: 'account'});
  }


  __authUserHandler(event) {

    hijackEvent(event);

    const {user} = event.detail;
    this._user   = user;

    if (this.accountRequired) { // Whitelist apps.

      if (!user) {
        this.__showAccountRequiredOverlay();
      }
      else {
        this.__hideAccountRequiredOverlay();
      }
    }

    this.__welcomeUser(user);

    this.fire('app-shell-user-changed', {value: user});
  }


  __avatarClickedHandler(event) {

    hijackEvent(event);

    this.showAuthUI();
  }


  __drawerLayoutNarrowChangedHandler(event) {

    hijackEvent(event);

    this._narrow = event.detail.value;
  }


  __headerThresholdHandler(event) {

    hijackEvent(event);

    this.fire('app-shell-threshold-triggered-changed', event.detail);
  }

  // Pull out data from slotted view elements to use in routing/lazy-loading.
  __overlaysSlotchangeHandler() {

    const nodes = this.slotNodes('#overlaysSlot');

    // Filter out overlays that don't need a menu item.
    this._menuOverlaysSlotNodes = nodes.filter(({attributes}) => 
                                    (attributes.label && attributes.page));

    this._overlayDrawerItems = this._menuOverlaysSlotNodes.map(node => 
                                 node.attributes);
  }


  __settingsClosedHandler(event) {

    hijackEvent(event);

    this._stampSettings = false;
  }


  async __persistenceHandler(event) {

    hijackEvent(event);

    // Pass to app-localstorage-document and app-settings.
    this._persistence = event.detail.value;

    if (event.type === 'offline-persistence-selector-persistence-changed') {

      await import(
        /* webpackChunkName: 'app-shell-refresh-required-modal' */
        './shell/app-shell-refresh-required-modal.js'
      );

      this.$.refreshRequiredModal.open();
    }
  }


  async __quickStartClosedHandler(event) {

    hijackEvent(event);

    this._stampQuickStart = false;

    const {set} = await import(
      /* webpackChunkName: 'services' */ 
      '@longlost/app-core/services/services.js'
    );

    set({
      coll: 'users',
      doc:   this._user.uid,
      data: {onboarded: true}
    });
  }


  __quickStartPageHandler(event) {

    hijackEvent(event);

    this._quickStartPage = event.detail.value;
  }


  __routerPageChangedHandler(event) {

    hijackEvent(event);

    this._routerPage = event.detail.value;
  }


  __showAuthUIHandler(event) {

    hijackEvent(event);

    this.showAuthUI();
  }

  // Pull out data from slotted view elements to use in routing/lazy-loading.
  __viewsBottomSlotchangeHandler() {

    const nodes = this.slotNodes('#viewsBottomSlot');

    this._bottomViewDrawerItems = nodes.map(node => node.attributes);
  }

  // Pull out data from slotted view elements to use in routing/lazy-loading.
  __viewsSlotchangeHandler() {

    const nodes = this.slotNodes('#viewsSlot');

    this._viewDrawerItems = nodes.map(node => node.attributes);
  }


  resetUnderlays() {
    
    // overlay-control-mixin.js
    this.__resetUnderlays();
  }


  showAuthUI() {

    return this.$.auth.showAuthUI();
  }

}

window.customElements.define(AppShell.is, AppShell);
