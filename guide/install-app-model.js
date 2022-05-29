
/**
  * `install-app-model`
  * 
  *   
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  **/
  

import {AppElement}       from '@longlost/app-core/app-element.js';
import {hexToRGBA}        from '@longlost/app-core/lambda.js';
import {getComputedStyle} from '@longlost/app-core/utils.js';   
import template           from './install-app-model.html';


class InstallAppModel extends AppElement {

  static get is() { return 'install-app-model'; }

  static get template() {
    return template;
  }


  static get properties() {
    return {

      // Include faux browser chrome when true.
      chrome: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      }

    };
  }


  connectedCallback() {

    super.connectedCallback();

    const hex = getComputedStyle(this, '--blur-background-color-hex');

    this.updateStyles({
      '--blur-background-color-rgba': hexToRGBA(hex, 0.5)
    });
  }

}

window.customElements.define(InstallAppModel.is, InstallAppModel);
