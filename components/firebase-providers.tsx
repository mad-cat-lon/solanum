// "use client";

// import { FC, ReactNode, useMemo } from "react";
// import {
//   AnalyticsProvider,
//   AuthProvider,
//   FirebaseAppProvider,
//   FirestoreProvider,
//   useFirebaseApp,
//   AppCheckProvider
// } from "reactfire";
// import { getAuth } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";
// import { isBrowser } from "@/lib/utils";
// import { getAnalytics } from "firebase/analytics";
// import { FirebaseOptions } from "firebase/app";
// import { initializeAppCheck, ReCaptchaV3Provider  } from "firebase/app-check";

// const config: FirebaseOptions = {
//   apiKey: "AIzaSyCBy84omqVrB-_U5gstU2OvsseuPjmm9PQ",
//   authDomain: "solanum-5865e.firebaseapp.com",
//   projectId: "solanum-5865e",
//   storageBucket: "solanum-5865e.appspot.com",
//   messagingSenderId: "885274759340",
//   appId: "1:885274759340:web:d6f6e1360168a9e0bd8f09",
//   measurementId: "G-J7TX6JNT88"
// };

// const FirebaseProviderSDKs: FC<{ children: ReactNode }> = ({ children }) => {
//   const firebase = useFirebaseApp();
//   // we have to use getters to pass to providers, children should use hooks
//   const auth = useMemo(() => getAuth(), []);
//   const firestore = useMemo(() => getFirestore(firebase), []);
//   const analytics = useMemo(() => isBrowser() && getAnalytics(firebase), []);
//   let
//   if (typeof window !== "undefined") {
//     appCheck = initializeAppCheck(getApp(), {
//       provider: new ReCaptchaV3Provider("..."),
//       isTokenAutoRefreshEnabled: true,
//     });
//   }
//   "6LeyozkqAAAAABWoX_ZHyfDrMDq5Cc3GbEHm_VNu"
//   return (
//     <>
//       {auth && appCheck && (
//         <AppCheckProvider sdk={appCheck}>
//           <AuthProvider sdk={auth}>
//             <FirestoreProvider sdk={firestore}>
//               {/* we can only use analytics in the browser */}
//               {analytics ? (
//                 <AnalyticsProvider sdk={analytics}>{children}</AnalyticsProvider>
//               ) : (
//                 <>{children}</>
//               )}
//             </FirestoreProvider>
//           </AuthProvider>
//         </AppCheckProvider>
//       )}
//     </>
//   );
// };

// export const MyFirebaseProvider: FC<{ children: ReactNode }> = ({
//   children,
// }) => {
//   return (
//     <>
//       <FirebaseAppProvider firebaseConfig={config}>
//         <FirebaseProviderSDKs>{children}</FirebaseProviderSDKs>
//       </FirebaseAppProvider>
//     </>
//   );
// };
"use client";

import { FC, ReactNode, useState, useEffect } from "react";
import {
  AnalyticsProvider,
  AuthProvider,
  FirebaseAppProvider,
  FirestoreProvider,
  useFirebaseApp,
  AppCheckProvider,
} from "reactfire";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { FirebaseOptions } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const config: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};
const FirebaseProviderSDKs: FC<{ children: ReactNode }> = ({ children }) => {
  const firebase = useFirebaseApp();
  const auth = getAuth(firebase);
  const firestore = getFirestore(firebase);
  const [appCheck, setAppCheck] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  // Initialize App Check and Analytics using useEffect to ensure they only run in the browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize App Check
      const appCheckInstance = initializeAppCheck(firebase, {
        provider: new ReCaptchaV3Provider("6LeyozkqAAAAABWoX_ZHyfDrMDq5Cc3GbEHm_VNu"),
        isTokenAutoRefreshEnabled: true,
      });
      setAppCheck(appCheckInstance);

      // Initialize Analytics
      const analyticsInstance = getAnalytics(firebase);
      setAnalytics(analyticsInstance);
    }
  }, [firebase]);

  // Only render Firebase Providers once App Check is initialized
  if (!appCheck) {
    return <p></p>;
  }

  return (
    <AppCheckProvider sdk={appCheck}>
      <AuthProvider sdk={auth}>
        <FirestoreProvider sdk={firestore}>
          {analytics ? (
            <AnalyticsProvider sdk={analytics}>{children}</AnalyticsProvider>
          ) : (
            <>{children}</>
          )}
        </FirestoreProvider>
      </AuthProvider>
    </AppCheckProvider>
  );
};

export const MyFirebaseProvider: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <FirebaseAppProvider firebaseConfig={config}>
      <FirebaseProviderSDKs>{children}</FirebaseProviderSDKs>
    </FirebaseAppProvider>
  );
};
