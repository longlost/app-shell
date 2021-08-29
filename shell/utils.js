
import {listenOnce} from '@longlost/app-core/utils.js';


export const waitForLoaded = async () => {  

  const app = document.querySelector('#app');

  // For improving Lighthouse Performance score.
  // Delay loading large modules.
  if (!app.loaded) {
    await listenOnce(app, 'app-loaded-changed');
  }
};
