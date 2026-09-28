/* Configuration Firebase — à coller depuis la console Firebase :
   Paramètres du projet → Général → Vos applications → Config.

   Ces valeurs ne sont PAS des secrets : elles identifient le
   projet, c'est tout. Ce qui protège les données, ce sont les
   règles de firestore.rules et le code secret du foyer.

   Tant que c'est null, l'app fonctionne en solo (localStorage). */

export const firebaseConfig = {
  apiKey: "AIzaSyB8B29kz8242s2hNvEV2B9K495tF5mM3fA",
  authDomain: "popote-62a15.firebaseapp.com",
  projectId: "popote-62a15",
  storageBucket: "popote-62a15.firebasestorage.app",
  messagingSenderId: "286968988815",
  appId: "1:286968988815:web:b3ac5618d58776e9bcdcfa",
};
/* measurementId (Analytics) volontairement absent : l'app ne charge
   pas Analytics, rien n'est suivi. */
