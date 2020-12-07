
import '@polymer/iron-iconset-svg/iron-iconset-svg.js';
import htmlString from './app-shell-icons.html';

const appShellIcons 		= document.createElement('div');
appShellIcons.innerHTML = htmlString;
appShellIcons.setAttribute('style', 'display: none;');
document.head.appendChild(appShellIcons);
