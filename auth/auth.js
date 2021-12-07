

import {appUserAndData} from 'config.js';
import firebaseReady    from '@longlost/app-core/firebase.js';


export const initAuth = async () => {

  const {firebaseApp, loadAuth} = await firebaseReady();
  const fbAuth                  = await loadAuth();

  const {
    browserLocalPersistence,
    browserSessionPersistence,
    initializeAuth,
    useDeviceLanguage
  } = fbAuth;

  // local:   User and data reset only when signed out explicitly.
  // session: User and data persisted for current session or tab.
  // none:    User and data cleared on window refresh.
  const persistence = appUserAndData.trustedDevice ? 
                        browserLocalPersistence : 
                        browserSessionPersistence;

  // Cannot use 'getAuth' here. Does NOT work offline. 
  // Throws 'FirebaseError: auth/internal-error'.
  const auth = initializeAuth(firebaseApp, {persistence});

  useDeviceLanguage(auth);

  return {auth, ...fbAuth};
};
