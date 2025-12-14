// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

/*export const environment = {
*  production: false
  // Remove firebase config for testing
};*/

export const environment = {
  production: false,
  firebaseConfig: {
  apiKey: "AIzaSyCyLcRW344HVannNWiyW2BZMV4M3mA5n38",
  authDomain: "chat-223cf.firebaseapp.com",
  projectId: "chat-223cf",
  storageBucket: "chat-223cf.firebasestorage.app",
  messagingSenderId: "858284079622",
  appId: "1:858284079622:web:2cd6c94b6d40bcbb05e187",
  measurementId: "G-HEX05VT4KB"
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
