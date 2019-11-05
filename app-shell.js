/**
 * `app-shell`
 * app level element that handles switching between views and overlays
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
import {
  AppElement,
  html
}                                from '@longlost/app-element/app-element.js';
import {
  OverlayControlMixin
}                                from '@longlost/overlay-control-mixin/overlay-control-mixin.js';
import {
  listen,
  listenOnce,
  schedule,
  wait,
  warn
}                                from '@longlost/utils/utils.js';
import {setPassiveTouchGestures} from '@polymer/polymer/lib/utils/settings.js';
import {appUserAndData, theme}   from 'app.config.js';
import htmlString                from './app-shell.html';
import '@longlost/app-icons/app-icons.js';
import '@polymer/app-route/app-location.js';
import '@polymer/app-route/app-route.js';
import '@polymer/app-storage/app-localstorage/app-localstorage-document.js';
import '@polymer/app-layout/app-drawer/app-drawer.js';
import '@polymer/app-layout/app-drawer-layout/app-drawer-layout.js';
import '@polymer/app-layout/app-header-layout/app-header-layout.js';
import '@polymer/app-layout/app-scroll-effects/app-scroll-effects.js';
import '@polymer/app-layout/app-header/app-header.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-image/iron-image.js';
import '@polymer/iron-pages/iron-pages.js';
import '@polymer/iron-selector/iron-selector.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-toast/paper-toast.js';
// account, services, settings, auth overlays are imported dynamically


setPassiveTouchGestures(true); // polymer

const builtInLazyImports = {
  view404:  () => import(
    /* webpackChunkName: 'view-404' */
    '@longlost/view-404/view-404.js'
  ),
  account:  () => import(
    /* webpackChunkName: 'app-account' */
    '@longlost/app-account/app-account.js'
  ),
  settings: () => import(
    /* webpackChunkName: 'app-settings' */
    '@longlost/app-settings/app-settings.js'
  ),
  auth:     () => import(
    /* webpackChunkName: 'app-auth' */
    '@longlost/app-auth/app-auth.js'
  ),
};

const builtInLazyImport = name => builtInLazyImports[name]();


class AppShell extends OverlayControlMixin(AppElement) {
  static get is() { return 'app-shell'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {
      // must be from webpack responsive-loader
      accountHeaderImage: Object,
      // number of account header toolbars (64px tall each)
      accountHeaderSize: {
        type: Number,
        value: 4
      },
      // for whitelisted apps such as CMS
      accountRequired: Boolean,

      currentUser: { // important for first paint
        type: Object,
        value: null
      },

      darkModeDefault: Boolean,
      // menu divider between views and overlays
      divider: Boolean,

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
      // routing
      page: String,

      revealHeader: Boolean,
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
        value: 'none' // or 'instant', 'smooth'
      },

      _darkMode: Boolean,

      _descriptionMeta: Object,

      _jsonLdScript: Object,

      _menuOverlaysSlotNodes: Array,

      _persistence: Boolean,

      _routeData: Object,
      /**
      * [polymer-root-path]
      *
      * By default, we set `Polymer.rootPath` to the server root path (`/`).
      * Leave this line unchanged if you intend to serve your app from the root
      * path (e.g., with URLs like `my.domain/` and `my.domain/view1`).
      *
      * If you intend to serve your app from a non-root path (e.g., with URLs
      * like `my.domain/app-main/` and `my.domain/app-main/view1`), edit this line
      * to indicate the path from which you'll be serving, including leading
      * and trailing slashes (e.g., `/app-main/`).
      */
      _rootPath: {
        type: String,
        value: '/'
      },

      _showDivider: {
        type: Boolean,
        computed: '__computeDivider(divider)'
      },

      _slottedOverlayElementData: Array,

      _slottedViewElementData: Array,

      _subroute: String

    };
  }


  static get observers() {
    return [
      '__routePageChanged(_routeData.page)',
      '__fixedHeaderChanged(fixedHeader)',
      '__revealHeaderChanged(revealHeader)',
      '__stickyBottomToolbarChanged(stickyBottomToolbar)',
      '__pageChanged(page)'
    ];
  }


  async connectedCallback() {
    super.connectedCallback();

    listen(
      this.$.header, 
      'threshold-triggered-changed', 
      this.__headerThresholdChanged.bind(this)
    );    
    this.__slotListeners();
    this.__addSettingsListeners();    
    this.__setupMenuItems();
    this.__initializePersistence();
    // update view since connectedCallback runs after the router is done
    this.__switchView(this._routeData.page);
    this.$.layout.classList.remove('layout-unresolved');
    this._descriptionMeta = document.head.querySelector('[name~=description]');
    this._jsonLdScript    = document.head.querySelector('[id~=pageJsonLd]');
    // localstorage overrides this is user has changed the setting previously
    this.__setDarkMode(this.darkModeDefault); 

    if (this.noUsers) { return; }

    this.__addUserAccountListeners();
    this.__fixAccountBtnForSafari();
    await schedule();
    builtInLazyImport('auth');
  }


  __createMiddleToolbars(headerSize) {
    if (headerSize < 3) { return []; }

    const middleToobarCount = headerSize - 2;
    const slots             = [];

    for (let i = 0; i < middleToobarCount; i += 1) {
      slots.push({slotName: `middle-toolbar-${i}-slot`});
    }

    return slots;
  }


  __computeBottomToolbarHidden(headerSize) {
    if (headerSize < 2) { return true; }
    return false;
  }
  

  __computeAccountButtonIcon(user) {
    if (!user) { return 'app-icons:account-circle'; }
    return 'app-icons:face'
  }


  __computeAccountIconButtonImgClass(user) {
    return user && user.photoURL ? '' : 'hide-account-img';
  }


  __computeAccountIconButtonSrc(user) {
    return user ? user.photoURL : '';
  }

  
  __computeDivider(divider) {
    return divider ? 'show-divider' : '';
  }

  
  __computeHideIcon(icon) {
    return !icon;
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


  __headerThresholdChanged(event) {
    this.fire('app-shell-threshold-triggered-changed', event.detail);
  }

  // pick up dynamic changes to views
  __slotListeners() {
    listen(this.$.viewsSlot,       'slotchange', this.__setupMenuItems.bind(this));
    listen(this.$.overlaysSlot,    'slotchange', this.__setupMenuItems.bind(this));
    listen(this.$.viewsBottomSlot, 'slotchange', this.__setupMenuItems.bind(this));
  }


  __addSettingsListeners() {
    listen(
      this.$.darkModeStorage,
      'data-changed',
      this.__darkModeChanged.bind(this)
    );
    listen(
      this.$.persistenceStorage,
      'data-changed',
      this.__setPersistence.bind(this)
    );
    listen(
      this.$.settings,
      'settings-dark-mode-changed',
      this.__darkModeChanged.bind(this)
    );
    listen(
      this.$.settings,
      'settings-persistence-changed',
      this.__setPersistence.bind(this)
    );
  }


  async __initializePersistence() {    
    // one time initialization to default to app.config setting
    await this.$.persistenceStorage.transactionsComplete;
    const storedVal = this.$.persistenceStorage.data;
    if (storedVal === undefined) {
      // cannot set this._persistence here, will not trigger data-changed event
      this.$.persistenceStorage.data = appUserAndData.trustedDevice;
    }
  }


  __setDarkMode(dark) {
    if (dark) {
      ShadyCSS.styleDocument({
        '--app-body-color':       theme.darkBodyColor,
        '--app-background-color': theme.darkBackground,
        '--dark-text-color':      theme.darkText,
        '--light-text-color':     theme.lightText,
        '--text-truncate-fade':   theme.darkTextTruncate
      });
    }
    else {
      ShadyCSS.styleDocument({
        '--app-body-color':       theme.lightBodyColor,
        '--app-background-color': theme.lightBackground,
        '--dark-text-color':      theme.lightText,
        '--light-text-color':     theme.darkText,
        '--text-truncate-fade':   theme.lightTextTruncate
      });
    }    
    // sets app-localstorage-document data val
    this._darkMode = dark;
    // use this event for all changes including localstorage cache updates
    this.fire('app-shell-dark-mode-changed', {value: dark});
  }

  // fired from dark mode app-localstorage-document and app-settings
  __darkModeChanged(event) {
    this.__setDarkMode(event.detail.value);
  }


  async __setPersistence(event) {
    const {value}     = event.detail;
    // pass to app-localstorage-document and app-settings
    this._persistence = value; 
    if (value) {
      const {default: services} = await import(
        /* webpackChunkName: 'services' */ 
        '@longlost/services/services.js'
      );
      services.enablePersistence();
    }
  }


  __setupMenuItems() {
    // pull out data from slotted view elements to use in routing/lazy-loading
    const viewsSlotNodes        = this.slotNodes('#viewsSlot');
    const allOverlaySlotNodes   = this.slotNodes('#overlaysSlot');
    const viewsBottomSlotNodes  = this.slotNodes('#viewsBottomSlot');
    // filter out overlays that dont need a menu item
    this._menuOverlaysSlotNodes = allOverlaySlotNodes.
      filter(({attributes}) => (attributes.label && attributes.page));
    const nodesAttributes = nodes => nodes.map(node => node.attributes);
    this._slottedViewElementData       = nodesAttributes(viewsSlotNodes);
    this._slottedOverlayElementData    = nodesAttributes(this._menuOverlaysSlotNodes);
    this._slottedBottomViewElementData = nodesAttributes(viewsBottomSlotNodes);
  }


  __addUserAccountListeners() {
    listen(this, 'account-signout-button', this.__signOut.bind(this));
    listen(this, 'account-reauth-needed',  this.__reauthNeeded.bind(this));
    listen(this, 'auth-userchanged',       this.__userChanged.bind(this));
    listen(this, 'auth-account-button',    this.__userAccount.bind(this));      
    listen(this, 'show-user-ui',           this.showAuthUI.bind(this));
  }


  __fixAccountBtnForSafari() {
    const accountImg = this.select('#sizedImgDiv', this.$.accountIconBtnImg);
    accountImg.style.borderRadius = '50%';
  }


  __userChanged(event) {
    const {user}     = event.detail;
    this.currentUser = user;
    if (this.accountRequired) { // whitelist apps
      if (!user) {
        this.__showAccountRequiredOverlay();
      }
      else {
        this.__hideAccountRequiredOverlay();
      }
    }    
  }


  __getPage(page) {
    if (page) {
      return page;
    }
    return this._slottedViewElementData[0].page.value; // ie. 'home'
  }

  
  async __updateSEOMeta(page) {
    try {      
      const defaultPage      = this.__getPage(page);
      const {default: seo}   = await import('seo.json');
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
      // If no seo overlays, fallback to view-404
      else {
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


  async __routePageChanged(page) {
    this.__updateSEOMeta(page);
    await this.__switchView(page);

    if (this.viewChangedScroll === 'instant') {
      window.scrollTo({top: 0, behavior: 'auto'});
    }
    else if (this.viewChangedScroll === 'smooth') {
      window.scrollTo({top: 0, behavior: 'smooth'});
    }
  }


  __pageChanged(page) {
    this.fire('app-shell-page-changed', {value: page});
  }


  __waitForDrawerToClose() {
    if (this.narrow && this.$.drawer.opened) { // only close drawer in narrow layouts (ie. mobile portrait)
      this.$.drawer.close();
      return listenOnce(this, 'app-drawer-transitioned');
    }
  }


  async __prepToOpenOverlay(id, page) {
    try {
      await this.clicked();
      await this.__waitForDrawerToClose();

      const getOverlay = async () => {
        if (page) {
          const dynamicImport = this.imports[page];
          await dynamicImport();
          return this._menuOverlaysSlotNodes.find(node => node.id === id);
        }
        else {
          await builtInLazyImport(id);
          return this.$[id];
        }
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


  showAuthUI() {
    return this.$.auth.showAuthUI();
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


  __drawerAccountClicked() {
    if (this.currentUser) {
      this.__prepToOpenOverlay('account');
    }
    else {
      this.showAuthUI();
    }
  }


  __drawerSettingsClicked() {
    this.__prepToOpenOverlay('settings');
  }


  __slottedDrawerElementClicked(event) {
    const {id, page} = event.model.item;
    this.__prepToOpenOverlay(id.value, page.value);
  }


  async __userButtonClicked() {
    try {
      await this.clicked();
      this.showAuthUI();
    } 
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
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


  __signOut() {
    return this.$.auth.signOut();
  }


  __userAccount() {
    this.__prepToOpenOverlay('account');
  }


  async __reauthNeeded() {
    try {
      await this.__signOut();
      this.showAuthUI();
    }
    catch (error) {
      console.warn('__reauthNeeded error: ', error);
    }
  }


  resetUnderlays() {
    // overlay-control-mixin.js
    this.__resetUnderlays();
  }

}

window.customElements.define(AppShell.is, AppShell);
