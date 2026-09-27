/* ============================================================
   lexicon-data.js — le dictionnaire des ingrédients.

   Format : « anglais|français », séparés par des « ; ». Plusieurs
   façons de le dire en anglais : « scallion/green onion|oignons verts »
   (la première sert de nom anglais affiché). Écrire au singulier en
   anglais : les pluriels (-s, -es) sont reconnus tout seuls. Le
   français s'écrit comme on veut le voir dans la liste d'épicerie.

   Chaque bloc = un rayon. Pour ajouter un ingrédient, une entrée
   dans le bon bloc suffit — ou l'apprendre directement dans l'app.
   ============================================================ */

export const DICT = {
  fruits: `
    garlic/garlic clove|ail; onion|oignon; yellow onion|oignon jaune; white onion|oignon blanc;
    red onion/purple onion|oignon rouge; sweet onion/vidalia onion|oignon doux;
    green onion/scallion/spring onion|oignons verts; shallot|échalote française; leek|poireau;
    chive|ciboulette; carrot|carottes; baby carrot|mini-carottes; celery/celery stalk|céleri;
    celery root/celeriac|céleri-rave; tomato|tomates; cherry tomato|tomates cerises;
    grape tomato|tomates raisins; roma tomato/plum tomato|tomates italiennes;
    heirloom tomato|tomates ancestrales; bell pepper|poivron; red bell pepper/red pepper|poivron rouge;
    green bell pepper/green pepper|poivron vert; yellow bell pepper/yellow pepper|poivron jaune;
    orange bell pepper|poivron orange; mini pepper/sweet mini pepper|mini-poivrons;
    jalapeno/jalapeno pepper|piment jalapeño; serrano/serrano pepper|piment serrano;
    poblano/poblano pepper|piment poblano; habanero|piment habanero; thai chili/bird's eye chili|piment thaï;
    chili pepper/hot pepper/fresh chili|piment fort; broccoli|brocoli; broccoli floret|fleurons de brocoli;
    broccolini|brocolini; cauliflower|chou-fleur; cabbage/green cabbage|chou; red cabbage/purple cabbage|chou rouge;
    napa cabbage|chou nappa; savoy cabbage|chou de savoie; coleslaw mix|mélange pour salade de chou;
    bok choy/baby bok choy/pak choi|bok choy; brussels sprout|choux de bruxelles; spinach/baby spinach|épinards;
    kale/lacinato kale/tuscan kale|chou kale; swiss chard/chard|bette à carde; collard green|chou cavalier;
    arugula/rocket|roquette; lettuce|laitue; romaine/romaine lettuce/romaine heart|laitue romaine;
    iceberg/iceberg lettuce|laitue iceberg; boston lettuce/butter lettuce/bibb lettuce|laitue boston;
    mixed greens/spring mix/salad greens|mesclun; watercress|cresson; cucumber|concombre;
    english cucumber|concombre anglais; persian cucumber/mini cucumber|mini-concombres; zucchini/courgette|zucchini;
    yellow squash/summer squash|courge jaune; eggplant/aubergine|aubergine; japanese eggplant|aubergine japonaise;
    mushroom|champignons; white mushroom/button mushroom|champignons blancs; cremini/cremini mushroom/baby bella|champignons café;
    portobello/portobello mushroom|champignons portobello; shiitake/shiitake mushroom|champignons shiitake;
    oyster mushroom|pleurotes; enoki|champignons enoki; potato|pommes de terre; russet/russet potato|pommes de terre russet;
    yukon gold/yukon gold potato|pommes de terre yukon gold; red potato|pommes de terre rouges;
    baby potato/new potato/little potato/fingerling|pommes de terre grelots; sweet potato/yam|patates douces;
    asparagus/asparagus spear|asperges; green bean/string bean|haricots verts; yellow bean/wax bean|haricots jaunes;
    snow pea|pois mange-tout; sugar snap pea/snap pea|pois sucrés; corn on the cob/ear of corn|épis de maïs;
    fresh corn|maïs frais; butternut squash|courge butternut; spaghetti squash|courge spaghetti; acorn squash|courge poivrée;
    squash|courge; pumpkin|citrouille; beet/beetroot|betteraves; radish|radis; daikon|radis daikon; turnip|navet;
    rutabaga|rutabaga; parsnip|panais; fennel/fennel bulb|fenouil; artichoke|artichauts; okra|gombo;
    bean sprout|germes de haricot; alfalfa sprout|pousses de luzerne; avocado|avocat; lemon|citron; lime|lime;
    orange|oranges; navel orange|oranges navel; blood orange|oranges sanguines; mandarin/tangerine|mandarines;
    clementine|clémentines; grapefruit|pamplemousse; apple|pommes; granny smith/granny smith apple|pommes granny smith;
    honeycrisp|pommes honeycrisp; pear|poires; banana|bananes; plantain|plantains; strawberry/strawberries|fraises;
    blueberry/blueberries|bleuets; raspberry/raspberries|framboises; blackberry/blackberries|mûres;
    cranberry/cranberries|canneberges; berry/berries/mixed berries|petits fruits; grape/red grape/green grape|raisins;
    mango|mangue; pineapple|ananas; peach|pêches; nectarine|nectarines; plum|prunes; cherry/cherries|cerises;
    apricot|abricots; kiwi|kiwis; watermelon|melon d'eau; cantaloupe|cantaloup; honeydew|melon miel;
    pomegranate|grenade; pomegranate seed/pomegranate aril|graines de grenade; papaya|papaye; passion fruit|fruit de la passion;
    lemon juice/juice of lemon/lemon zest|citron; lime juice/juice of lime/lime zest|lime; orange zest|oranges;
    fig|figues; rhubarb|rhubarbe; ginger/ginger root/fresh ginger|gingembre; lemongrass|citronnelle; galangal|galanga;
    turmeric root/fresh turmeric|curcuma frais; horseradish|raifort; cilantro/coriander leaf/fresh coriander|coriandre;
    parsley|persil; flat-leaf parsley/italian parsley|persil italien; curly parsley|persil frisé; basil/basil leaf|basilic;
    thai basil|basilic thaï; mint/mint leaf|menthe; dill|aneth; thyme/thyme sprig|thym; rosemary/rosemary sprig|romarin;
    sage/sage leaf|sauge; tarragon|estragon; oregano leaf/fresh oregano|origan frais; chervil|cerfeuil;
    fresh herbs/mixed herbs|fines herbes; tofu|tofu; firm tofu|tofu ferme; extra firm tofu/extra-firm tofu|tofu extra-ferme;
    silken tofu/soft tofu|tofu soyeux; tempeh|tempeh; seitan|seitan; hummus|hoummos; guacamole|guacamole;
    pico de gallo|pico de gallo; kimchi|kimchi; sauerkraut|choucroute`,

  viande: `
    ground beef/minced beef|bœuf haché; lean ground beef|bœuf haché maigre; extra lean ground beef|bœuf haché extra-maigre;
    ground pork|porc haché; ground turkey|dinde hachée; ground chicken|poulet haché; ground veal|veau haché;
    ground lamb|agneau haché; chicken breast/boneless chicken breast|poitrines de poulet;
    chicken thigh/boneless chicken thigh|cuisses de poulet; chicken drumstick/drumstick|pilons de poulet;
    chicken wing/wing|ailes de poulet; chicken tender/chicken tenderloin|lanières de poulet;
    whole chicken|poulet entier; rotisserie chicken|poulet rôti; shredded chicken|poulet effiloché; chicken|poulet;
    beef|bœuf; stewing beef/stew meat/beef stew meat|bœuf à ragoût; flank steak|bavette de bœuf;
    skirt steak|hampe de bœuf; sirloin/sirloin steak|surlonge; ribeye/rib eye/ribeye steak|faux-filet;
    striploin/new york strip|contre-filet; beef tenderloin/filet mignon|filet de bœuf; brisket|poitrine de bœuf;
    short rib/beef short rib|côtes courtes de bœuf; chuck roast/pot roast|rôti de palette; roast beef|rôti de bœuf;
    steak|steak; beef strip/stir-fry beef|lanières de bœuf; pork chop|côtelettes de porc;
    pork tenderloin|filet de porc; pork loin|longe de porc; pork shoulder/pork butt|épaule de porc;
    pork belly|flanc de porc; pork rib/baby back rib/spare rib|côtes levées; pulled pork|porc effiloché;
    pork|porc; ham|jambon; deli ham|jambon tranché; prosciutto|prosciutto; bacon|bacon; turkey bacon|bacon de dinde;
    pancetta|pancetta; chorizo|chorizo; italian sausage|saucisses italiennes; breakfast sausage|saucisses déjeuner;
    kielbasa|kielbasa; sausage|saucisses; hot dog/wiener|saucisses à hot-dog; pepperoni|pepperoni; salami|salami;
    turkey|dinde; turkey breast|poitrine de dinde; deli turkey|dinde tranchée; duck|canard; duck breast|magret de canard;
    lamb|agneau; lamb chop|côtelettes d'agneau; rack of lamb|carré d'agneau; leg of lamb|gigot d'agneau; veal|veau;
    salmon|saumon; salmon fillet|filets de saumon; smoked salmon/lox|saumon fumé; shrimp/prawn|crevettes;
    jumbo shrimp/tiger shrimp|grosses crevettes; cooked shrimp|crevettes cuites; scallop|pétoncles; mussel|moules;
    clam|palourdes; lobster|homard; crab/crab meat|crabe; imitation crab|goberge; tuna steak/ahi tuna|steak de thon;
    cod|morue; haddock|aiglefin; halibut|flétan; tilapia|tilapia; trout|truite; arctic char|omble chevalier;
    sole|sole; mahi mahi|mahi-mahi; sea bass|bar; swordfish|espadon; catfish|poisson-chat;
    white fish/whitefish|poisson blanc; fish fillet|filets de poisson; fish|poisson; octopus|pieuvre; squid/calamari|calmars`,

  laitier: `
    milk/2% milk/1% milk/partly skimmed milk|lait; whole milk/homo milk|lait 3,25 %; skim milk|lait écrémé; buttermilk|babeurre; evaporated milk|lait évaporé;
    condensed milk/sweetened condensed milk|lait concentré sucré; heavy cream/whipping cream/heavy whipping cream|crème 35 %;
    half and half/half-and-half|crème 10 %; light cream/cooking cream/table cream|crème 15 %; sour cream|crème sure;
    creme fraiche|crème fraîche; whipped cream|crème fouettée; cream cheese|fromage à la crème; cream|crème;
    butter|beurre; unsalted butter|beurre non salé; salted butter|beurre salé; ghee|ghee; margarine|margarine;
    egg/large egg|œufs; egg white|blancs d'œufs; egg yolk|jaunes d'œufs; yogurt/yoghurt|yogourt;
    plain yogurt|yogourt nature; greek yogurt|yogourt grec; vanilla yogurt|yogourt à la vanille;
    cottage cheese|fromage cottage; ricotta|ricotta; mascarpone|mascarpone; cheddar/cheddar cheese|cheddar;
    sharp cheddar/old cheddar/aged cheddar|cheddar fort; white cheddar|cheddar blanc; mozzarella/mozzarella cheese|mozzarella;
    fresh mozzarella|mozzarella fraîche; bocconcini|bocconcini; burrata|burrata; parmesan/parmesan cheese/parmigiano/parmigiano reggiano|parmesan;
    pecorino/pecorino romano|pecorino; grana padano|grana padano; feta/feta cheese|feta; goat cheese/chevre|fromage de chèvre;
    swiss cheese/swiss|fromage suisse; gruyere|gruyère; emmental|emmental; havarti|havarti; gouda|gouda; brie|brie;
    camembert|camembert; monterey jack/monterey jack cheese|fromage monterey jack; pepper jack|monterey jack aux piments;
    provolone|provolone; blue cheese|fromage bleu; gorgonzola|gorgonzola; halloumi|halloumi; paneer|paneer;
    cheese curd|fromage en grains; queso fresco|queso fresco; cotija|cotija; american cheese|fromage fondu tranché;
    mexican cheese/mexican blend/mexican cheese blend|mélange de fromages mexicain; italian cheese blend|mélange de fromages italien;
    shredded cheese/cheese|fromage; almond milk|boisson d'amande; oat milk|boisson d'avoine; soy milk|boisson de soya;
    coconut yogurt|yogourt de coco; plant-based butter/vegan butter|beurre végétal; miso/white miso/miso paste|miso;
    fresh pasta|pâtes fraîches; pizza dough|pâte à pizza; orange juice|jus d'orange`,

  boulangerie: `
    bread|pain; sandwich bread/sliced bread|pain tranché; white bread|pain blanc; whole wheat bread|pain de blé entier;
    sourdough/sourdough bread|pain au levain; rye bread|pain de seigle; french bread/baguette|baguette; ciabatta|ciabatta;
    focaccia|focaccia; bun/hamburger bun/burger bun|pains à hamburger; brioche bun|pains briochés;
    hot dog bun|pains à hot-dog; slider bun/dinner roll|petits pains; kaiser|pains kaiser; pita/pita bread|pitas;
    naan|pains naan; flatbread|pains plats; flour tortilla/tortilla/wrap|tortillas; large tortilla|grandes tortillas;
    corn tortilla|tortillas de maïs; bagel|bagels; english muffin|muffins anglais; croissant|croissants;
    texas toast|pain texan; garlic bread|pain à l'ail; breadstick|gressins; tortilla wrap|tortillas`,

  sec: `
    flour/all-purpose flour/ap flour|farine tout usage; whole wheat flour|farine de blé entier; bread flour|farine à pain;
    cake flour|farine à pâtisserie; almond flour|farine d'amande; rice flour|farine de riz; sugar/white sugar/granulated sugar|sucre;
    brown sugar/light brown sugar/dark brown sugar|cassonade; powdered sugar/icing sugar/confectioners sugar/confectioners' sugar|sucre à glacer;
    cornstarch/corn starch/cornflour|fécule de maïs; baking powder|poudre à pâte; baking soda|bicarbonate de soude;
    yeast/active dry yeast/instant yeast|levure; cocoa/cocoa powder/unsweetened cocoa|cacao;
    chocolate chip|pépites de chocolat; dark chocolate|chocolat noir; milk chocolate|chocolat au lait;
    white chocolate|chocolat blanc; chocolate|chocolat; oat/rolled oat/old-fashioned oat/quick oat|flocons d'avoine;
    steel cut oat|avoine concassée; granola|granola; cereal|céréales; quinoa|quinoa; couscous|couscous; bulgur|boulgour;
    barley|orge; farro|farro; rice|riz; white rice/long grain rice|riz blanc; jasmine rice|riz au jasmin;
    basmati rice|riz basmati; brown rice|riz brun; arborio/arborio rice|riz arborio; sushi rice|riz à sushi;
    wild rice|riz sauvage; instant rice/minute rice|riz instantané; pasta|pâtes; spaghetti|spaghetti; linguine|linguine;
    fettuccine/fettuccini|fettuccine; penne|penne; rigatoni|rigatoni; fusilli/rotini|fusilli; farfalle/bow tie pasta|farfalle;
    macaroni/elbow macaroni|macaroni; orzo|orzo; shell pasta/pasta shell/conchiglie|coquilles; angel hair|cheveux d'ange;
    lasagna/lasagna noodle/lasagne|pâtes à lasagne; egg noodle|nouilles aux œufs; ramen/ramen noodle|nouilles ramen;
    udon/udon noodle|nouilles udon; soba/soba noodle|nouilles soba; rice noodle/pad thai noodle|nouilles de riz;
    vermicelli/rice vermicelli|vermicelles de riz; glass noodle|nouilles de verre; noodle|nouilles; gnocchi|gnocchis;
    tortellini|tortellinis; ravioli|raviolis; breadcrumb/bread crumb|chapelure; panko|chapelure panko; crouton|croûtons;
    cracker|craquelins; tortilla chip|croustilles de maïs; chip/potato chip|croustilles; taco shell|coquilles à tacos;
    popcorn|maïs soufflé; black bean|haricots noirs; kidney bean/red kidney bean/red bean|haricots rouges;
    white bean/navy bean|haricots blancs; cannellini/cannellini bean|haricots cannellini; pinto bean|haricots pinto;
    refried bean|haricots frits; baked bean|fèves au lard; chickpea/garbanzo/garbanzo bean|pois chiches;
    lentil|lentilles; red lentil|lentilles rouges; green lentil|lentilles vertes; brown lentil|lentilles brunes;
    split pea|pois cassés; diced tomato/canned diced tomato|tomates en dés; crushed tomato|tomates broyées;
    whole peeled tomato/whole tomato/san marzano tomato|tomates entières; canned tomato|tomates en conserve;
    tomato paste|pâte de tomate; tomato sauce|sauce tomate; marinara/marinara sauce|sauce marinara;
    pasta sauce/spaghetti sauce|sauce pour pâtes; passata|coulis de tomates; alfredo sauce|sauce alfredo;
    coconut milk|lait de coco; light coconut milk|lait de coco léger; coconut cream|crème de coco;
    chicken broth/chicken stock|bouillon de poulet; beef broth/beef stock|bouillon de bœuf;
    vegetable broth/vegetable stock/veggie broth|bouillon de légumes; broth/stock|bouillon;
    bouillon cube/stock cube|cubes de bouillon; peanut butter|beurre d'arachide; almond butter|beurre d'amande;
    jam/jelly|confiture; nutella/chocolate hazelnut spread|tartinade chocolat-noisettes; tahini|tahini;
    olive|olives; kalamata/kalamata olive|olives kalamata; black olive|olives noires; green olive|olives vertes;
    pickle/dill pickle|cornichons; caper|câpres; roasted red pepper|poivrons rôtis; artichoke heart|cœurs d'artichaut;
    sun-dried tomato/sundried tomato|tomates séchées; canned tuna/tuna/tuna can|thon en conserve; anchovy|anchois;
    sardine|sardines; canned salmon|saumon en conserve; nut|noix; walnut|noix de grenoble; almond|amandes;
    cashew|noix de cajou; peanut|arachides; pecan|pacanes; pistachio|pistaches; pine nut|noix de pin;
    hazelnut|noisettes; macadamia|noix de macadamia; sunflower seed|graines de tournesol;
    pumpkin seed/pepita|graines de citrouille; chia/chia seed|graines de chia; flax/flaxseed/flax seed/ground flax|graines de lin;
    hemp heart/hemp seed|cœurs de chanvre; coconut/shredded coconut/desiccated coconut|noix de coco râpée;
    dried cranberry/craisin|canneberges séchées; date/medjool date|dattes; dried apricot|abricots séchés;
    dried fruit|fruits séchés; coffee|café; tea|thé; protein powder|protéine en poudre; gelatin|gélatine;
    graham cracker|biscuits graham; marshmallow|guimauves; sprinkle|vermicelles de sucre; corn syrup|sirop de maïs;
    rice paper|feuilles de riz; nori/seaweed|algues nori; wonton wrapper|pâtes à wonton;
    water chestnut|châtaignes d'eau; bamboo shoot|pousses de bambou; salsa verde|salsa verde; enchilada sauce|sauce enchilada;
    red wine|vin rouge; white wine/dry white wine|vin blanc; beer|bière; sake|saké; mirin|mirin; rum|rhum`,

  epices: `
    salt|sel; kosher salt|sel casher; sea salt|sel de mer; flaky salt/flaky sea salt/maldon salt|fleur de sel;
    salt and pepper/salt & pepper|sel et poivre; pepper/black pepper/ground black pepper|poivre;
    white pepper|poivre blanc; red pepper flake/chili flake/crushed red pepper/chilli flake|flocons de piment;
    cayenne/cayenne pepper|poivre de cayenne; paprika|paprika; smoked paprika|paprika fumé; sweet paprika|paprika doux;
    chili powder|assaisonnement au chili; chipotle powder|piment chipotle moulu; cumin/ground cumin|cumin;
    cumin seed|graines de cumin; ground coriander/coriander powder|coriandre moulue; coriander seed|graines de coriandre;
    turmeric/ground turmeric|curcuma; curry powder|poudre de cari; garam masala|garam masala; cinnamon/ground cinnamon|cannelle;
    cinnamon stick|bâtons de cannelle; nutmeg|muscade; ground clove/clove powder|clou de girofle moulu;
    whole clove|clous de girofle; allspice|piment de la jamaïque; ground ginger/ginger powder|gingembre moulu;
    garlic powder|ail en poudre; garlic salt|sel d'ail; onion powder|oignon en poudre; dried oregano/oregano|origan;
    dried basil|basilic séché; dried thyme|thym séché; dried rosemary|romarin séché; dried parsley|persil séché;
    dried dill/dill weed|aneth séché; italian seasoning|assaisonnement italien; herbes de provence|herbes de provence;
    bay leaf|feuilles de laurier; cajun seasoning/cajun spice|épices cajun; creole seasoning|épices créoles;
    taco seasoning|assaisonnement à tacos; fajita seasoning|assaisonnement à fajitas;
    montreal steak spice/steak spice|épices à steak; everything bagel seasoning|assaisonnement everything bagel;
    old bay|épices old bay; lemon pepper|poivre citronné; five spice/chinese five spice|cinq épices;
    star anise|anis étoilé; cardamom|cardamome; fennel seed|graines de fenouil; mustard seed|graines de moutarde;
    dry mustard/mustard powder|moutarde sèche; saffron|safran; sumac|sumac; za'atar/zaatar|za'atar;
    vanilla/vanilla extract/pure vanilla extract|extrait de vanille; vanilla bean|gousse de vanille;
    almond extract|extrait d'amande; msg|glutamate monosodique; nutritional yeast|levure alimentaire;
    oil/cooking oil|huile; olive oil/extra virgin olive oil/evoo|huile d'olive; vegetable oil|huile végétale;
    canola oil|huile de canola; avocado oil|huile d'avocat; coconut oil|huile de coco;
    sesame oil/toasted sesame oil|huile de sésame; peanut oil|huile d'arachide; chili oil/chili crisp|huile pimentée;
    cooking spray/nonstick spray|enduit à cuisson; vinegar|vinaigre; white vinegar|vinaigre blanc;
    apple cider vinegar|vinaigre de cidre; red wine vinegar|vinaigre de vin rouge; white wine vinegar|vinaigre de vin blanc;
    balsamic/balsamic vinegar|vinaigre balsamique; balsamic glaze|réduction balsamique; rice vinegar/rice wine vinegar|vinaigre de riz;
    soy sauce/low sodium soy sauce/light soy sauce|sauce soya; dark soy sauce|sauce soya foncée; tamari|tamari;
    coconut aminos|aminos de coco; teriyaki/teriyaki sauce|sauce teriyaki; hoisin/hoisin sauce|sauce hoisin;
    oyster sauce|sauce aux huîtres; fish sauce|sauce de poisson; sriracha|sriracha; hot sauce|sauce piquante;
    frank's/frank's redhot|sauce frank's redhot; buffalo sauce|sauce buffalo; chili garlic sauce/sambal oelek|sauce chili à l'ail;
    sweet chili sauce/thai sweet chili sauce|sauce chili douce; gochujang|gochujang; worcestershire/worcestershire sauce|sauce worcestershire;
    bbq sauce/barbecue sauce|sauce bbq; ketchup|ketchup; mustard/yellow mustard|moutarde; dijon/dijon mustard|moutarde de dijon;
    whole grain mustard/grainy mustard|moutarde à l'ancienne; honey mustard|moutarde au miel; mayo/mayonnaise|mayonnaise;
    kewpie/kewpie mayo|mayonnaise kewpie; ranch/ranch dressing|vinaigrette ranch; caesar dressing|vinaigrette césar;
    italian dressing|vinaigrette italienne; dressing/salad dressing|vinaigrette; honey|miel; maple syrup|sirop d'érable;
    agave/agave syrup|sirop d'agave; molasses|mélasse; salsa|salsa; pesto/basil pesto|pesto; relish|relish;
    tabasco|tabasco; curry paste|pâte de cari; red curry paste|pâte de cari rouge; green curry paste|pâte de cari vert;
    yellow curry paste|pâte de cari jaune; harissa|harissa; chipotle/chipotle in adobo/chipotle pepper in adobo|piments chipotle en sauce adobo;
    tzatziki|tzatziki; sesame seed/sesame|graines de sésame; black sesame|sésame noir; everything seasoning|assaisonnement everything bagel;
    liquid smoke|fumée liquide; bouillon powder|bouillon en poudre; stevia|stévia`,

  surgeles: `
    frozen corn|maïs surgelé; frozen pea/frozen green pea|petits pois surgelés; frozen spinach|épinards surgelés;
    frozen berry/frozen berries/frozen mixed berries|petits fruits surgelés; frozen fruit|fruits surgelés;
    frozen mango|mangue surgelée; frozen vegetable/frozen mixed vegetable/frozen veggies|légumes surgelés;
    frozen broccoli|brocoli surgelé; frozen shrimp|crevettes surgelées; frozen fries/french fries|frites surgelées;
    ice cream|crème glacée; puff pastry|pâte feuilletée; pie crust/pie shell|croûte à tarte; phyllo/filo|pâte phyllo;
    edamame|edamames; frozen edamame|edamames surgelés; frozen hash brown/hash brown|galettes de pommes de terre;
    frozen dumpling/dumpling/potsticker|dumplings; frozen pizza|pizza surgelée; pea|petits pois; green pea|petits pois;
    corn|maïs; corn kernel|maïs en grains`,

  autre: `
    water|eau; ice/ice cube|glaçons; sparkling water|eau pétillante; parchment paper|papier parchemin;
    aluminum foil/foil|papier d'aluminium; plastic wrap|pellicule plastique; skewer|brochettes`,
};

/* Variantes françaises (souvent québécoises) → nom de référence.
   « variante>référence » : la référence doit exister ci-dessus. */
export const SYNONYMS = `
  patate>pommes de terre; patates grelots>pommes de terre grelots; pomme de terre grelot>pommes de terre grelots;
  échalote verte>oignons verts; oignon vert>oignons verts; échalote>échalote française; ail frais>ail;
  gousse d'ail>ail; blé d'inde>maïs; maïs en grains surgelé>maïs surgelé; fèves germées>germes de haricot;
  fèves rouges>haricots rouges; fèves noires>haricots noirs; fèves blanches>haricots blancs; haricots rouges en conserve>haricots rouges;
  sucre brun>cassonade; sucre blanc>sucre; sucre glace>sucre à glacer; yaourt>yogourt; yogourt nature>yogourt nature;
  crème 35%>crème 35 %; crème à fouetter>crème 35 %; crème 15%>crème 15 %; crème à cuisson>crème 15 %; crème 10%>crème 10 %;
  crème champêtre>crème 15 %; crème sûre>crème sure; lait 2%>lait; lait 2 %>lait; lait écrémé>lait écrémé;
  huile d'olive extra vierge>huile d'olive; poivre noir>poivre; poivre noir moulu>poivre; poivre moulu>poivre;
  sel casher>sel casher; gros sel>sel de mer; pois verts>petits pois; pois>petits pois; courgette>zucchini;
  chou frisé>chou kale; kale>chou kale; pak-choï>bok choy; pak choï>bok choy; persil plat>persil italien;
  champignons de paris>champignons blancs; melon>cantaloup; pastèque>melon d'eau; fèves au lard>fèves au lard;
  sauce soja>sauce soya; sauce de soja>sauce soya; sauce soya légère>sauce soya; maïzena>fécule de maïs;
  fécule>fécule de maïs; bicarbonate de sodium>bicarbonate de soude; levure chimique>poudre à pâte;
  farine>farine tout usage; farine blanche>farine tout usage; chapelure panko>chapelure panko; panko>chapelure panko;
  noix de grenoble>noix de grenoble; arachides>arachides; cacahuètes>arachides; beurre de cacahuète>beurre d'arachide;
  fromage râpé>fromage; cheddar râpé>cheddar; mozzarella râpée>mozzarella; parmesan râpé>parmesan;
  fromage monterey jack>fromage monterey jack; monterey jack>fromage monterey jack; fromage bleu>fromage bleu;
  bouillon de volaille>bouillon de poulet; cube de bouillon>cubes de bouillon; pâte de tomates>pâte de tomate;
  tomates en conserve>tomates en conserve; tomates concassées>tomates broyées; coulis de tomate>coulis de tomates;
  sauce tomate>sauce tomate; poitrine de poulet>poitrines de poulet; hauts de cuisse>cuisses de poulet;
  cuisse de poulet>cuisses de poulet; pilon>pilons de poulet; poulet effiloché>poulet effiloché; steak haché>bœuf haché;
  viande hachée>bœuf haché; filet de saumon>filets de saumon; saumon atlantique>saumon; crevette>crevettes;
  grosses crevettes>grosses crevettes; œuf>œufs; oeuf>œufs; oeufs>œufs; blanc d'œuf>blancs d'œufs; jaune d'œuf>jaunes d'œufs;
  pain naan>pains naan; naans>pains naan; pita>pitas; tortilla>tortillas; tortillas de blé>tortillas;
  coriandre fraîche>coriandre; cilantro>coriandre; basilic frais>basilic; menthe fraîche>menthe; aneth frais>aneth;
  gingembre frais>gingembre; lime>lime; citron vert>lime; jus de citron>citron; jus de lime>lime; zeste de citron>citron;
  zeste de lime>lime; mesclun>mesclun; laitue frisée>laitue; roquette>roquette; haricots verts>haricots verts;
  pois sucrés>pois sucrés; pois mange-tout>pois mange-tout; épinards>épinards; bébés épinards>épinards;
  poivron>poivron; piment>piment fort; piment fort>piment fort; flocons de piment>flocons de piment;
  piment de cayenne>poivre de cayenne; cari>poudre de cari; curry>poudre de cari; pâte de curry>pâte de cari;
  sauce sriracha>sriracha; sirop d'érable>sirop d'érable; vinaigre balsamique>vinaigre balsamique;
  sésame>graines de sésame; graines de sésame>graines de sésame; huile de sésame grillé>huile de sésame;
  nouilles de riz>nouilles de riz; vermicelles de riz>vermicelles de riz; riz à grains longs>riz blanc;
  riz jasmin>riz au jasmin; origan séché>origan; thym frais>thym; romarin frais>romarin; lait 1%>lait;
  lait partiellement écrémé>lait; lait entier>lait 3,25 %; lait homo>lait 3,25 %; flocons d'avoine>flocons d'avoine; gruau>flocons d'avoine; avoine>flocons d'avoine`;
