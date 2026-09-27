/* Configuration Firebase — à coller depuis la console Firebase :
   Paramètres du projet → Général → Vos applications → Config.

   Ces valeurs ne sont PAS des secrets : elles identifient le
   projet, c'est tout. Ce qui protège les données, ce sont les
   règles de firestore.rules et le code secret du foyer.

   Tant que c'est null, l'app fonctionne en solo (localStorage). */

export const firebaseConfig = null;

/* Exemple :
export const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "popote-xxxx.firebaseapp.com",
  projectId: "popote-xxxx",
  storageBucket: "popote-xxxx.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef",
};
*/
