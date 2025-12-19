// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
   baseUrl: 'http://localhost:5190',
  // baseUrl: 'https://portal.dms.org:82/api',
  //baseUrl: 'https://api.dms.org/api',
  // baseUrl: 'https://dms-api.azurewebsites.net/api',
  // paymentRedirectURI: 'http://localhost:4200/admin',
  paymentRedirectURI: 'https://dmshost-dev.azureedge.net/admin',
  firebase: {
    apiKey: "3",
    authDomain: "atco-dms.firebaseapp.com",
    projectId: "DMSHost-Dev",
    storageBucket: "atco-dms.appspot.com",
    messagingSenderId: "167786454063",
    appId: "1:167786454063:web:0048ca09fba96b636afada",
    measurementId: "G-TPS0BXJD1Z"
    
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
