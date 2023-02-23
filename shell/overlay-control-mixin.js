
/**
  * `overlay-control-mixin`
  *
  *   Overlay state is handled here, including a 
  *   complex fix for Safari scroll fallthrough
  *   as well as a brower history cache that allows
  *   browser and device back buttons to control overlays.
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  **/


import {schedule} from '@longlost/app-core/utils.js';


export const OverlayControlMixin = superClass => {

  return class OverlayControlMixin extends superClass {
    
    static get properties() {
      return {

        // Keep track of all overlays and their scroll positions
        // since we are only using one scroller (Thanks Safari ☹️ ).
        _overlayRegistry: {
          type: Object,
          value: () => ({})
        },

        // Browser/device back button routing.
        // App shell overides this property.
        page: String

      };
    }
    

    connectedCallback() {

      super.connectedCallback();

      // Setup overlay controller with app-shell as the first element.
      const symbol = Symbol();

      this._overlayRegistry = {
        sequence: [symbol],
        [symbol]: {
          header:         this.$.header,
          content:        this.$.pages,
          contentPos:     0,
          headerPos:      0,
          layout:         this.$.layout,
          panel:          this.$.mainPanel,
          scrollTravel:   0,
          underlaySymbol: null
        }
      };

      this.__overlayPreparingToOpen = this.__overlayPreparingToOpen.bind(this);
      this.__overlayOpened          = this.__overlayOpened.bind(this);
      this.__overlayPreparingToExit = this.__overlayPreparingToExit.bind(this);
      this.__overlayExiting         = this.__overlayExiting.bind(this);
      this.__overlayReset           = this.__overlayReset.bind(this);
      this.__resetUnderlays         = this.__resetUnderlays.bind(this);
      this.__browserBackPushed      = this.__browserBackPushed.bind(this);


      this.addEventListener('overlay-preparing-to-open',          this.__overlayPreparingToOpen);
      this.addEventListener('overlay-opened',                     this.__overlayOpened);
      this.addEventListener('overlay-preparing-to-exit',          this.__overlayPreparingToExit);
      this.addEventListener('overlay-exiting',                    this.__overlayExiting);
      this.addEventListener('overlay-reset',                      this.__overlayReset);
      this.addEventListener('overlay-controller-reset-underlays', this.__resetUnderlays);
      window.addEventListener('popstate',                         this.__browserBackPushed);
    }


    disconnectedCallback() {

      super.disconnectedCallback();

      this.removeEventListener('overlay-preparing-to-open',          this.__overlayPreparingToOpen);
      this.removeEventListener('overlay-opened',                     this.__overlayOpened);
      this.removeEventListener('overlay-preparing-to-exit',          this.__overlayPreparingToExit);
      this.removeEventListener('overlay-exiting',                    this.__overlayExiting);
      this.removeEventListener('overlay-reset',                      this.__overlayReset);
      this.removeEventListener('overlay-controller-reset-underlays', this.__resetUnderlays);
      window.removeEventListener('popstate',                         this.__browserBackPushed);
    }


    __addItemToRegistrySequence(symbol) {

      const existing = this.__itemRegistered(symbol);

      if (existing) { return; }

      this._overlayRegistry.sequence.push(symbol);
    }


    __getUnderlaySymbolFromRegistry(symbol) {

      const {sequence}   = this._overlayRegistry;
      const overlayIndex = sequence.indexOf(symbol);

      // Not found.
      if (overlayIndex === -1) { return null; } 

      // Bottom overlay. No underlay.
      if (overlayIndex === 0) { return null; } 

      const underlayIndex  = overlayIndex - 1;
      const underlaySymbol = sequence.at(underlayIndex);

      return underlaySymbol;
    }


    __getItemFromRegistry(symbol) {

      return this._overlayRegistry[symbol];
    }


    __itemRegistered(symbol) {

      return Boolean(this.__getItemFromRegistry(symbol));
    }


    __makeRegistryItem(event) {

      const {node}                    = event.detail;
      const {content, header, symbol} = node;

      const underlaySymbol = this.__getUnderlaySymbolFromRegistry(symbol);

      const item = {
        content,
        contentPos:  0,
        firstOpen:   true,
        header, 
        headerPos:   0,
        layout:      node.$.layout, 
        panel:       node,
        resetScroll: node.resetScroll,
        symbol,
        underlaySymbol
      };

      return item;
    }


    __addItemToRegistry(event) {

      const item = this.__makeRegistryItem(event);
      
      this._overlayRegistry[item.symbol] = item;
    }


    __updateItemInRegistry(symbol) {

      const underlaySymbol = this.__getUnderlaySymbolFromRegistry(symbol);
      const overlay        = this.__getItemFromRegistry(symbol);

      overlay.underlaySymbol = underlaySymbol;
    }


    __getOverlays(event) {

      const {symbol, header} = event.detail.node;

      if (!header) { return; } // Not an event from a header overlay.

      if (this.__itemRegistered(symbol)) {

        this.__updateItemInRegistry(symbol);
      }
      else {

        this.__addItemToRegistry(event);
      }
      
      const overlay  = this.__getItemFromRegistry(symbol);
      const underlay = this.__getItemFromRegistry(overlay.underlaySymbol);

      return {overlay, underlay};
    }


    __removeOverlayFromRegistry(overlay) {

      delete this._overlayRegistry[overlay.symbol];
    }


    __removeOverlayFromRegistrySequence(overlay) {

      const {sequence} = this._overlayRegistry;
      const start      = sequence.indexOf(overlay.symbol);

      if (start === -1) { return; }

      sequence.splice(start, 1); // Delete 1 item at start position.
    }


    __cacheHeaderAndContentPositions(element) {

      const {top} = element.header.getScrollState();

      element.headerPos  = top;
      element.contentPos = window.pageYOffset;

      return element;
    }


    __disableHeader(element) {

      element.header.disabled = true;
      element.header.toggleScrollListener(false);

      return element;
    }


    __setupAndPlaceOverlay(overlay, underlay) {

      overlay.content.style.display = 'block';
      overlay.header.style.opacity  = '1';
      overlay.content.style.opacity = '0';
      overlay.panel.style.top       = `${underlay.contentPos}px`;

      return overlay;
    }


    __prepForResetScroll(overlay) {

      const toolbars = this.selectAll('app-toolbar', overlay.header);

      toolbars.forEach(toolbar => {
        toolbar.style.opacity = '0';
      });

      overlay.header.style.transform = '';
      overlay.panel.resetHeaderParallaxContainer();
    }


    __placeHeaderAndContent(overlay) {

      overlay.header.style.transform  = `translateY(${-overlay.headerPos}px)`;
      overlay.content.style.transform = `translateY(${-overlay.contentPos}px)`;
    }


    __resetOverlayScrollPosition(overlay) {

      overlay.panel.resetHeaderParallaxContainer();
      overlay.header.resetLayout();
      overlay.header.notifyResize();
      overlay.header.scroll({
        left:      0, 
        top:       0, 
        behavior: 'silent' // Polymer specific app header val.
      });
    }


    __setLayoutElToPreviousScrollPosition(element) {

      element.content.style.transform = '';
      element.header.style.transform  = 
        `translateY(${-element.headerPos}px)`; // Cached scroll pos correction.

      element.header.scroll({
        left:      0, 
        top:       element.contentPos, 
        behavior: 'silent'
      });
    }


    __hideLayoutElement(element) {

      element.header.style.opacity  = '0';      
      element.content.style.opacity = '0'; // iOS flicker workaround.
      element.content.style.display = 'none';
    }


    __resetOverlayToTop(overlay) {  

      overlay.panel.style.top = '0px';
    }


    __iosContentFix(overlay) {
          
      // Safari content pos fix IMPORTANT!!
      // The bug appears when you scroll current content down all the way
      // then open an overlay, content is not where it should be without this fix.
      overlay.layout.resetLayout(); 
    }


    __showResetToolbars(overlay) {

      const toolbars = this.selectAll('app-toolbar', overlay.header);

      toolbars.forEach(toolbar => {
        toolbar.style.transition = 'opacity 0.2s ease-in';
        toolbar.style.opacity    = '1';
      });
    }


    __readyLayoutElement(element) {

      element.content.style.opacity = '1'; // Safari workaround.
      element.header.disabled       = false;
      element.header.toggleScrollListener(true);
    }


    __showUnderlay(underlay) {

      underlay.content.style.display = 'block';
      underlay.header.style.opacity  = '1';
    }


    __setupUnderlayForDisplay(underlay, overlay) {

      this.__showUnderlay(underlay);

      underlay.content.style.transform = 
        `translateY(${overlay.contentPos - underlay.contentPos}px)`;
    }


    async __counteractAnimationHeaderPlacement(overlay) {

      overlay.header.style.transform = 
        `translateY(${-overlay.headerPos}px)`;

      await schedule();

      overlay.header.style.transform = 
        `translateY(${overlay.contentPos - overlay.headerPos}px)`;
    }


    async __overlayPreparingToOpen(event) {  

      const {header, symbol} = event.detail.node;

      if (!header) { return; } // Not an event from a header overlay.

      this.__addItemToRegistrySequence(symbol);   
      this.__setBrowserHistory();

      const {overlay, underlay} = this.__getOverlays(event);
      const cachedUnderlay      = this.__cacheHeaderAndContentPositions(underlay);
      const disabledUnderlay    = this.__disableHeader(cachedUnderlay);
      const disabledOverlay     = this.__disableHeader(overlay);
      const placedOverlay       = this.__setupAndPlaceOverlay(disabledOverlay, disabledUnderlay);

      await schedule();

      if (placedOverlay.firstOpen || placedOverlay.resetScroll) {
        placedOverlay.header.resetLayout();
        placedOverlay.header.notifyResize();
        placedOverlay.firstOpen = false;
      }

      await schedule();

      if (placedOverlay.resetScroll) {
        this.__prepForResetScroll(placedOverlay);
      }
      else {
        this.__placeHeaderAndContent(placedOverlay);
      }
    }

    // Browser history for user to use browser and device back button.
    __setBrowserHistory() {

      window.history.pushState(
        {title: this.page}, 
        'overlay', 
        this.page
      );
    }
    

    async __overlayOpened(event) {

      const overlays = this.__getOverlays(event);

      if (!overlays) { return; } // Not a header overlay.

      const {overlay, underlay} = overlays;

      if (overlay.resetScroll) {
        this.__resetOverlayScrollPosition(overlay);
      }
      else {
        this.__setLayoutElToPreviousScrollPosition(overlay);
      }    

      this.__hideLayoutElement(underlay);
      this.__resetOverlayToTop(overlay);
      this.__iosContentFix(overlay);

      await schedule();

      if (overlay.resetScroll) {
        this.__showResetToolbars(overlay);
      }
      this.__readyLayoutElement(overlay);
    }


    __overlayPreparingToExit(event) {

      const overlays = this.__getOverlays(event);

      if (!overlays) { return; } // Not a header overlay.

      const {overlay, underlay} = overlays;
      const cachedOverlay = this.__cacheHeaderAndContentPositions(overlay);

      this.__disableHeader(cachedOverlay);
      this.__setupUnderlayForDisplay(underlay, overlay);      
    }


    __overlayExiting(event) {

      const overlays = this.__getOverlays(event);

      if (!overlays) { return; } // Not a header overlay.

      const {overlay} = overlays;

      if (overlay.resetScroll && overlay.contentPos === 0) { return; }

      this.__counteractAnimationHeaderPlacement(overlay);
    }
    

    async __overlayReset(event) {

      if (event.detail.type === 'controller-reset') { return; }

      const overlays = this.__getOverlays(event);

      if (!overlays) { return; } // Not a header overlay.

      const {overlay, underlay} = overlays;

      this.__hideLayoutElement(overlay);

      if (underlay) {  

        this.__setLayoutElToPreviousScrollPosition(underlay);

        // This method is only needed when overlay.reset method is used.
        // Otherwise, these styles area already set.
        this.__showUnderlay(underlay);
      }

      await schedule();

      if (underlay) {

        this.__readyLayoutElement(underlay);
      }

      this.__removeOverlayFromRegistry(overlay);
      this.__removeOverlayFromRegistrySequence(overlay);
    }


    __browserBackPushed() {

      const {sequence} = this._overlayRegistry;
      const lastIndex  = sequence.length - 1;
      const symbol     = sequence[lastIndex];

      this._overlayRegistry[symbol].panel.back();
    }

    // For use when a workflow should end and start user off at beginning
    // instead of forcing user to maually back out off the workflow.
    // ie. 'continue shopping' circumstance.
    __resetUnderlays() {

      // Reset all overlays back to app-shell.
      // Get all symbols besides the one for app-shell's header.
      const {sequence}      = this._overlayRegistry;
      const lastIndex       = sequence.length - 1;
      const underlaySymbols = sequence.slice(1, lastIndex);
      const underlays       = underlaySymbols.map(symbol => 
                                this.__getItemFromRegistry(symbol));

      // Reset underlays that are between base view and uppermost overlay.
      underlays.forEach(underlay => {
        underlay.panel.reset('controller-reset');
      });

      // Reset sequence to include only the 
      // base view and uppermost overlay symbols.
      if (lastIndex > 0) {
        const newSequence = [sequence[0], sequence[lastIndex]];

        this._overlayRegistry.sequence = newSequence;
      }
    }

  };
};
