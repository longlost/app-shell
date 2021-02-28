

import htmlString from './qs-page-shared-styles.html';


const sharedStyles = document.createElement('dom-module');

sharedStyles.innerHTML = htmlString;
sharedStyles.register('qs-page-shared-styles');
