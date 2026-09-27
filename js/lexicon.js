/* ============================================================
   lexicon.js — un seul nom par ingrédient, en français.

   « garlic », « 2 cloves garlic, minced » et « gousses d'ail »
   doivent devenir la même ligne d'épicerie. canon() traduit les
   termes anglais courants (l'expression la plus longue d'abord :
   « garlic powder » avant « garlic ») puis enlève ce qui ne change
   pas ce qu'on achète (« frais », « chopped », « large »…).

   Le nom canonique sert à la clé d'addition, au rayon, au
   garde-manger, aux prix et à la recherche. Le texte de la recette,
   lui, reste tel qu'on l'a écrit.
   ============================================================ */

const EN_FR = [
  /* Viandes et poissons */
  ["ground beef", "bœuf haché"], ["ground pork", "porc haché"], ["ground turkey", "dinde hachée"],
  ["ground chicken", "poulet haché"], ["chicken breast", "poitrine de poulet"],
  ["chicken thigh", "cuisse de poulet"], ["chicken wing", "ailes de poulet"], ["chicken", "poulet"],
  ["beef", "bœuf"], ["pork chop", "côtelette de porc"], ["pork tenderloin", "filet de porc"], ["pork", "porc"],
  ["ham", "jambon"], ["sausage", "saucisse"], ["turkey", "dinde"], ["lamb", "agneau"], ["veal", "veau"],
  ["salmon", "saumon"], ["shrimp", "crevettes"], ["prawn", "crevettes"], ["tuna", "thon"], ["cod", "morue"],
  ["fish", "poisson"], ["egg", "œufs"],

  /* Produits laitiers */
  ["milk", "lait"], ["heavy cream", "crème 35 %"], ["whipping cream", "crème 35 %"],
  ["cooking cream", "crème 15 %"], ["sour cream", "crème sure"], ["cream cheese", "fromage à la crème"],
  ["cream", "crème"], ["butter", "beurre"], ["cheddar cheese", "cheddar"], ["parmesan cheese", "parmesan"],
  ["parmigiano", "parmesan"], ["mozzarella cheese", "mozzarella"], ["feta cheese", "feta"],
  ["monterey jack cheese", "fromage monterey jack"], ["monterey jack", "fromage monterey jack"],
  ["cheese", "fromage"], ["greek yogurt", "yogourt grec"], ["yogurt", "yogourt"], ["yoghurt", "yogourt"],

  /* Fruits et légumes */
  ["garlic powder", "ail en poudre"], ["onion powder", "oignon en poudre"],
  ["garlic", "ail"], ["red onion", "oignon rouge"], ["yellow onion", "oignon"], ["white onion", "oignon"],
  ["green onion", "oignons verts"], ["spring onion", "oignons verts"], ["scallion", "oignons verts"],
  ["onion", "oignon"], ["shallot", "échalote"], ["leek", "poireau"], ["carrot", "carotte"],
  ["celery", "céleri"], ["cherry tomato", "tomates cerises"], ["grape tomato", "tomates cerises"],
  ["diced tomato", "tomates en dés"], ["crushed tomato", "tomates broyées"], ["canned tomato", "tomates en dés"],
  ["tomato paste", "pâte de tomate"], ["tomato sauce", "sauce tomate"], ["tomato", "tomates"],
  ["red bell pepper", "poivron rouge"], ["green bell pepper", "poivron vert"],
  ["yellow bell pepper", "poivron jaune"], ["bell pepper", "poivron"], ["jalapeno", "jalapeño"],
  ["broccoli", "brocoli"], ["cauliflower", "chou-fleur"], ["cabbage", "chou"], ["baby spinach", "épinards"],
  ["spinach", "épinards"], ["kale", "chou kale"], ["romaine lettuce", "laitue romaine"], ["romaine", "laitue romaine"],
  ["lettuce", "laitue"], ["cucumber", "concombre"], ["zucchini", "courgette"], ["mushroom", "champignons"],
  ["sweet potato", "patate douce"], ["baby potato", "pommes de terre grelots"], ["potato", "pommes de terre"],
  ["asparagus", "asperges"], ["green bean", "haricots verts"], ["snow pea", "pois mange-tout"],
  ["frozen corn", "maïs surgelé"], ["corn", "maïs"], ["frozen pea", "petits pois surgelés"], ["pea", "petits pois"],
  ["avocado", "avocat"], ["lemon", "citron"], ["apple", "pommes"], ["banana", "bananes"],
  ["strawberries", "fraises"], ["strawberry", "fraises"], ["blueberries", "bleuets"], ["blueberry", "bleuets"],
  ["raspberries", "framboises"], ["raspberry", "framboises"], ["ginger", "gingembre"],
  ["cilantro", "coriandre"], ["coriander", "coriandre"], ["parsley", "persil"], ["basil", "basilic"],
  ["mint", "menthe"], ["dill", "aneth"], ["thyme", "thym"], ["rosemary", "romarin"],

  /* Épices et condiments */
  ["extra virgin olive oil", "huile d'olive"], ["olive oil", "huile d'olive"],
  ["vegetable oil", "huile végétale"], ["canola oil", "huile de canola"], ["sesame oil", "huile de sésame"],
  ["oil", "huile"], ["salt and pepper", "sel et poivre"], ["kosher salt", "sel"], ["sea salt", "sel"], ["salt", "sel"],
  ["black pepper", "poivre"], ["red pepper flake", "flocons de piment"], ["chili flake", "flocons de piment"],
  ["pepper", "poivre"], ["smoked paprika", "paprika fumé"], ["chili powder", "assaisonnement au chili"],
  ["oregano", "origan"], ["cinnamon", "cannelle"], ["nutmeg", "muscade"], ["turmeric", "curcuma"],
  ["soy sauce", "sauce soya"], ["teriyaki sauce", "sauce teriyaki"], ["hot sauce", "sauce piquante"],
  ["fish sauce", "sauce de poisson"], ["oyster sauce", "sauce aux huîtres"], ["hoisin sauce", "sauce hoisin"],
  ["honey", "miel"], ["maple syrup", "sirop d'érable"], ["dijon mustard", "moutarde de dijon"],
  ["mustard", "moutarde"], ["mayo", "mayonnaise"], ["rice vinegar", "vinaigre de riz"], ["vinegar", "vinaigre"],
  ["vanilla extract", "vanille"], ["sesame seed", "graines de sésame"], ["curry paste", "pâte de cari"],
  ["curry powder", "cari"], ["taco seasoning", "assaisonnement à tacos"], ["italian seasoning", "fines herbes italiennes"],

  /* Épicerie */
  ["all-purpose flour", "farine"], ["flour", "farine"], ["brown sugar", "cassonade"], ["sugar", "sucre"],
  ["cornstarch", "fécule de maïs"], ["corn starch", "fécule de maïs"], ["baking powder", "poudre à pâte"],
  ["baking soda", "bicarbonate de soude"], ["chicken broth", "bouillon de poulet"],
  ["chicken stock", "bouillon de poulet"], ["beef broth", "bouillon de bœuf"], ["beef stock", "bouillon de bœuf"],
  ["vegetable broth", "bouillon de légumes"], ["vegetable stock", "bouillon de légumes"],
  ["broth", "bouillon"], ["stock", "bouillon"], ["coconut milk", "lait de coco"],
  ["black bean", "haricots noirs"], ["red kidney bean", "haricots rouges"], ["kidney bean", "haricots rouges"],
  ["chickpea", "pois chiches"], ["garbanzo bean", "pois chiches"], ["lentil", "lentilles"],
  ["jasmine rice", "riz au jasmin"], ["basmati rice", "riz basmati"], ["brown rice", "riz brun"],
  ["rice noodle", "nouilles de riz"], ["rice", "riz"], ["pasta", "pâtes"], ["noodle", "nouilles"],
  ["breadcrumb", "chapelure"], ["panko", "chapelure"], ["flour tortilla", "tortillas"], ["corn tortilla", "tortillas de maïs"], ["tortilla", "tortillas"], ["naan", "pains naan"],
  ["bread", "pain"], ["peanut butter", "beurre d'arachide"], ["oat", "gruau"],
];

/* Mots qui ne changent pas ce qu'on achète. « haché » reste pour la
   viande (bœuf haché ≠ bœuf), et « petits » reste devant « pois ». */
const STRIP = [
  /\b(fresh|freshly|large|small|medium|big|chopped|finely|roughly|minced|diced|sliced|grated|shredded|peeled|boneless|skinless|cubed|crushed|ripe|optional|divided|packed|heaping|thinly|canned|raw|cooked|uncooked|dried|dry)\b/gi,
  /(^|\s)(frais|fraîche|fraîches|fraîchement|gros|grosse|grosses|moyen|moyenne|moyennes|moyens|émincée?s?|tranchée?s?|râpée?s?|pelée?s?|finement|grossièrement|mûre?s?|facultatif|facultative|environ)(?=\s|$)/gi,
  /(^|\s)petite?s?(?!\s+pois)(?=\s|$)/gi,
  /\b(to taste|for garnish|for serving)\b/gi,
  /(^|\s)(au goût|pour garnir|pour servir)(?=\s|$)/gi,
];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const RULES = [...EN_FR]
  .sort((a, b) => b[0].length - a[0].length)
  .map(([en, fr]) => [new RegExp(`(^|[^\\p{L}])${esc(en).replace(/[- ]/g, "[- ]?")}(?:e?s)?(?![\\p{L}])`, "giu"), fr]);

const cache = new Map();

/* → { name: nom canonique en français, translated: vrai si de l'anglais a été traduit } */
export function canon(raw) {
  const key = String(raw || "");
  if (cache.has(key)) return cache.get(key);
  let s = key.toLowerCase().replace(/’/g, "'")
    .replace(/\([^)]*\)/g, " ")          // « (environ 2 tasses) »
    .split(/,|;| - | – /)[0];            // « oignon, haché » → « oignon »
  const before = s;
  for (const [re, fr] of RULES) s = s.replace(re, (_, pre) => `${pre}${fr}`);
  /* « pains naan », « chou kale » : déjà en français, le mot anglais
     reconnu ne doit pas doubler (« pains pains naan »). */
  s = s.replace(/(^|\s)(\p{L}+)\s+\2(?=\s|$)/giu, "$1$2");
  const translated = s !== before;
  /* « haché » tombe partout, sauf après une viande. */
  s = s.replace(/(^|\s)(?<!(bœuf|boeuf|porc|dinde|poulet|veau|viande)\s)hachée?s?(?=\s|$)/gi, " ");
  for (const re of STRIP) s = s.replace(re, " ");
  s = s.replace(/^(of|de|d')\s+/i, "").replace(/\s{2,}/g, " ").trim();
  const out = { name: s || key.trim().toLowerCase(), translated };
  cache.set(key, out);
  return out;
}
