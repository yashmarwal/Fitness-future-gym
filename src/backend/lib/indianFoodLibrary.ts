import "server-only";

// A bundled, offline-first food list covering the meals Indian gym members
// actually eat day to day — searched here BEFORE ever calling the USDA API
// (see nutritionLookup.ts), for two reasons: USDA's generic dataset barely
// covers Indian home cooking at all (a "dal" or "paneer tikka" search
// mostly returns nothing useful), and every match served locally is one
// fewer request against USDA's shared-key rate limit. Values are per 100g,
// cross-checked against IFCT-derived and commonly published Indian
// nutrition references (household-portion figures converted to per-100g)
// — reasonable starting estimates, same as the USDA path, always editable
// before saving. `names` lists common English/Hindi/Hinglish spellings so
// "dal", "daal", "idli", "idly", "chana"/"channa" etc. all resolve to the
// same entry.
export type LocalFood = {
  names: string[];
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export const INDIAN_FOODS: LocalFood[] = [
  // Staples
  { names: ["roti", "chapati", "phulka", "atta roti", "wheat roti"], calories: 264, proteinG: 9, carbsG: 48, fatG: 4 },
  { names: ["naan", "tandoori naan", "plain naan"], calories: 310, proteinG: 9, carbsG: 50, fatG: 8 },
  { names: ["butter naan"], calories: 340, proteinG: 9, carbsG: 48, fatG: 12 },
  { names: ["paratha", "plain paratha", "lachha paratha"], calories: 330, proteinG: 7, carbsG: 45, fatG: 14 },
  { names: ["aloo paratha", "potato paratha"], calories: 260, proteinG: 6, carbsG: 32, fatG: 12 },
  { names: ["puri", "poori"], calories: 380, proteinG: 7, carbsG: 42, fatG: 20 },
  { names: ["rice", "white rice", "cooked rice", "chawal", "steamed rice"], calories: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3 },
  { names: ["basmati rice", "basmati chawal"], calories: 121, proteinG: 2.5, carbsG: 25, fatG: 0.4 },
  { names: ["brown rice"], calories: 112, proteinG: 2.6, carbsG: 24, fatG: 0.9 },
  { names: ["jeera rice", "cumin rice"], calories: 165, proteinG: 3, carbsG: 30, fatG: 4 },
  { names: ["bread", "white bread", "pav"], calories: 265, proteinG: 9, carbsG: 49, fatG: 3.2 },
  { names: ["bread butter"], calories: 310, proteinG: 8, carbsG: 45, fatG: 10 },

  // Dals and legumes
  { names: ["dal", "daal", "toor dal", "arhar dal", "tuvar dal", "yellow dal"], calories: 116, proteinG: 7, carbsG: 18, fatG: 2 },
  { names: ["moong dal", "mung dal", "green gram dal"], calories: 105, proteinG: 7, carbsG: 17, fatG: 1 },
  { names: ["masoor dal", "red lentil dal", "masur dal"], calories: 116, proteinG: 8, carbsG: 18, fatG: 1 },
  { names: ["chana dal", "split chickpea dal"], calories: 164, proteinG: 9, carbsG: 27, fatG: 2.5 },
  { names: ["dal makhani", "dal makhni"], calories: 150, proteinG: 6, carbsG: 15, fatG: 8 },
  { names: ["rajma", "rajma curry", "kidney bean curry"], calories: 140, proteinG: 8, carbsG: 20, fatG: 3 },
  { names: ["chole", "chana masala", "channa masala", "chickpea curry", "chole masala"], calories: 165, proteinG: 8, carbsG: 22, fatG: 4 },
  { names: ["sambar", "sambhar"], calories: 70, proteinG: 3.5, carbsG: 10, fatG: 1.5 },
  { names: ["sprouts", "moong sprouts", "ankurit moong", "sprouts salad", "sprouted moong salad"], calories: 95, proteinG: 7, carbsG: 17, fatG: 0.5 },

  // South Indian
  { names: ["idli", "idly"], calories: 132, proteinG: 4, carbsG: 26, fatG: 0.5 },
  { names: ["dosa", "plain dosa", "sada dosa"], calories: 168, proteinG: 4, carbsG: 28, fatG: 4 },
  { names: ["masala dosa"], calories: 195, proteinG: 4.5, carbsG: 28, fatG: 7 },
  { names: ["uttapam", "uthappam"], calories: 150, proteinG: 4, carbsG: 26, fatG: 3 },
  { names: ["vada", "medu vada", "urad dal vada"], calories: 245, proteinG: 6, carbsG: 22, fatG: 14 },
  { names: ["upma", "rava upma", "suji upma"], calories: 145, proteinG: 3.5, carbsG: 22, fatG: 5 },
  { names: ["poha", "flattened rice", "beaten rice"], calories: 130, proteinG: 2.5, carbsG: 24, fatG: 3 },

  // Dairy and paneer
  { names: ["paneer", "cottage cheese indian", "indian cottage cheese"], calories: 265, proteinG: 18, carbsG: 1.2, fatG: 20 },
  { names: ["paneer tikka"], calories: 220, proteinG: 16, carbsG: 6, fatG: 15 },
  { names: ["palak paneer", "saag paneer"], calories: 150, proteinG: 8, carbsG: 8, fatG: 10 },
  { names: ["matar paneer", "mutter paneer", "peas paneer"], calories: 155, proteinG: 9, carbsG: 9, fatG: 10 },
  { names: ["curd", "dahi", "yogurt indian", "plain curd"], calories: 60, proteinG: 3.5, carbsG: 4.7, fatG: 3.3 },
  { names: ["buttermilk", "chaas", "lassi salted"], calories: 25, proteinG: 1.5, carbsG: 2.5, fatG: 1 },
  { names: ["lassi", "sweet lassi"], calories: 110, proteinG: 3, carbsG: 17, fatG: 3 },
  { names: ["milk", "toned milk", "whole milk indian", "doodh"], calories: 60, proteinG: 3.2, carbsG: 4.7, fatG: 3.3 },
  { names: ["ghee", "clarified butter"], calories: 900, proteinG: 0, carbsG: 0, fatG: 100 },
  { names: ["greek yogurt", "hung curd"], calories: 59, proteinG: 10, carbsG: 3.6, fatG: 0.4 },

  // Non-veg
  { names: ["chicken curry", "murgh curry"], calories: 165, proteinG: 14, carbsG: 8, fatG: 9 },
  { names: ["chicken breast", "grilled chicken", "boiled chicken", "chicken breast boiled"], calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6 },
  { names: ["tandoori chicken"], calories: 180, proteinG: 25, carbsG: 3, fatG: 8 },
  { names: ["butter chicken", "murgh makhani"], calories: 210, proteinG: 13, carbsG: 8, fatG: 14 },
  { names: ["egg", "boiled egg", "ubla anda", "whole egg"], calories: 155, proteinG: 13, carbsG: 1.1, fatG: 11 },
  { names: ["egg white", "anda safed", "egg whites"], calories: 52, proteinG: 11, carbsG: 0.7, fatG: 0.2 },
  { names: ["egg curry", "anda curry"], calories: 155, proteinG: 9, carbsG: 6, fatG: 11 },
  { names: ["mutton curry", "lamb curry"], calories: 220, proteinG: 18, carbsG: 6, fatG: 14 },
  { names: ["fish curry", "machli curry"], calories: 130, proteinG: 15, carbsG: 5, fatG: 6 },
  { names: ["chicken sausage"], calories: 220, proteinG: 16, carbsG: 4, fatG: 15 },
  { names: ["chicken biryani"], calories: 190, proteinG: 10, carbsG: 22, fatG: 7 },

  // Vegetables / sabzi
  { names: ["aloo gobi", "potato cauliflower sabzi"], calories: 110, proteinG: 3, carbsG: 14, fatG: 5 },
  { names: ["bhindi masala", "okra sabzi", "bhindi fry"], calories: 95, proteinG: 2.5, carbsG: 10, fatG: 5.5 },
  { names: ["mixed veg", "mixed vegetable sabzi", "sabzi", "mix veg"], calories: 90, proteinG: 3, carbsG: 11, fatG: 4 },
  { names: ["baingan bharta", "eggplant bharta"], calories: 100, proteinG: 2, carbsG: 10, fatG: 6 },
  { names: ["aloo sabzi", "potato sabzi", "aloo fry", "aloo bhaji"], calories: 130, proteinG: 2.5, carbsG: 20, fatG: 5 },
  { names: ["vegetable biryani", "veg biryani"], calories: 165, proteinG: 4, carbsG: 25, fatG: 5 },
  { names: ["pulao", "veg pulao", "vegetable pulao"], calories: 155, proteinG: 3.5, carbsG: 25, fatG: 4.5 },

  // Snacks
  { names: ["samosa"], calories: 260, proteinG: 4, carbsG: 28, fatG: 15 },
  { names: ["pakora", "bhajiya", "pakoda"], calories: 315, proteinG: 6, carbsG: 28, fatG: 20 },
  { names: ["dhokla"], calories: 160, proteinG: 6, carbsG: 25, fatG: 4 },
  { names: ["bhel puri", "bhelpuri"], calories: 190, proteinG: 4, carbsG: 35, fatG: 4 },

  // Sweets / mithai (values checked against published per-piece figures
  // scaled to per-100g, e.g. kaju katli's commonly cited ~460 kcal/100g)
  { names: ["gulab jamun"], calories: 320, proteinG: 4, carbsG: 45, fatG: 14 },
  { names: ["jalebi"], calories: 350, proteinG: 2, carbsG: 60, fatG: 12 },
  { names: ["rasgulla", "roshogolla"], calories: 186, proteinG: 4, carbsG: 32, fatG: 4 },
  { names: ["kaju katli", "kaju barfi", "cashew barfi"], calories: 460, proteinG: 9, carbsG: 55, fatG: 24 },
  { names: ["besan ladoo", "besan laddu"], calories: 450, proteinG: 8, carbsG: 55, fatG: 22 },
  { names: ["motichoor ladoo", "motichoor laddu", "boondi ladoo"], calories: 430, proteinG: 6, carbsG: 58, fatG: 20 },
  { names: ["coconut ladoo", "nariyal ladoo"], calories: 450, proteinG: 5, carbsG: 50, fatG: 26 },
  { names: ["barfi", "milk barfi", "doodh barfi"], calories: 435, proteinG: 7, carbsG: 55, fatG: 20 },
  { names: ["gajar halwa", "carrot halwa", "gajrela"], calories: 215, proteinG: 4, carbsG: 28, fatG: 10 },
  { names: ["suji halwa", "sooji halwa", "rava halwa", "halwa"], calories: 220, proteinG: 3.5, carbsG: 32, fatG: 9 },
  { names: ["kheer", "rice pudding indian", "chawal ki kheer"], calories: 150, proteinG: 4, carbsG: 22, fatG: 5 },
  { names: ["rasmalai"], calories: 280, proteinG: 8, carbsG: 30, fatG: 14 },
  { names: ["peda"], calories: 460, proteinG: 9, carbsG: 55, fatG: 22 },
  { names: ["soan papdi"], calories: 490, proteinG: 5, carbsG: 65, fatG: 24 },
  { names: ["modak"], calories: 300, proteinG: 5, carbsG: 45, fatG: 12 },
  { names: ["shrikhand"], calories: 200, proteinG: 6, carbsG: 30, fatG: 6 },
  { names: ["malpua"], calories: 350, proteinG: 5, carbsG: 48, fatG: 15 },
  { names: ["sandesh"], calories: 260, proteinG: 10, carbsG: 35, fatG: 9 },
  { names: ["kulfi"], calories: 200, proteinG: 5, carbsG: 22, fatG: 10 },
  { names: ["rabri", "rabdi"], calories: 220, proteinG: 6, carbsG: 25, fatG: 11 },

  // Chaat / street food
  { names: ["pani puri", "golgappa", "puchka"], calories: 320, proteinG: 6, carbsG: 50, fatG: 10 },
  { names: ["aloo tikki"], calories: 210, proteinG: 3, carbsG: 26, fatG: 11 },
  { names: ["sev puri"], calories: 280, proteinG: 5, carbsG: 40, fatG: 11 },
  { names: ["dahi puri"], calories: 220, proteinG: 5, carbsG: 30, fatG: 9 },
  { names: ["papdi chaat"], calories: 300, proteinG: 6, carbsG: 38, fatG: 14 },
  { names: ["dahi bhalla", "dahi vada"], calories: 180, proteinG: 6, carbsG: 20, fatG: 8 },
  { names: ["kachori"], calories: 380, proteinG: 7, carbsG: 40, fatG: 21 },
  { names: ["pav bhaji"], calories: 150, proteinG: 4, carbsG: 20, fatG: 6 },
  { names: ["vada pav"], calories: 260, proteinG: 6, carbsG: 35, fatG: 10 },
  { names: ["fruit chaat"], calories: 70, proteinG: 1, carbsG: 17, fatG: 0.3 },

  // Gujarati / regional snacks
  { names: ["khakhra"], calories: 400, proteinG: 11, carbsG: 62, fatG: 12 },
  { names: ["thepla"], calories: 300, proteinG: 7, carbsG: 40, fatG: 12 },
  { names: ["khandvi"], calories: 130, proteinG: 5, carbsG: 12, fatG: 7 },
  { names: ["handvo"], calories: 220, proteinG: 6, carbsG: 28, fatG: 9 },
  { names: ["mathri"], calories: 480, proteinG: 8, carbsG: 55, fatG: 26 },
  { names: ["namkeen", "mixture", "chivda"], calories: 480, proteinG: 12, carbsG: 50, fatG: 27 },
  { names: ["murukku", "chakli"], calories: 470, proteinG: 8, carbsG: 55, fatG: 25 },

  // Millets and health grains
  { names: ["ragi roti", "finger millet roti", "nachni roti"], calories: 335, proteinG: 8, carbsG: 68, fatG: 2 },
  { names: ["bajra roti", "pearl millet roti"], calories: 360, proteinG: 11, carbsG: 67, fatG: 5 },
  { names: ["jowar roti", "sorghum roti"], calories: 340, proteinG: 10, carbsG: 68, fatG: 3 },
  { names: ["quinoa", "quinoa cooked"], calories: 120, proteinG: 4.4, carbsG: 21, fatG: 1.9 },
  { names: ["ragi dosa"], calories: 145, proteinG: 4, carbsG: 26, fatG: 3 },

  // More South Indian
  { names: ["appam"], calories: 180, proteinG: 3, carbsG: 34, fatG: 3 },
  { names: ["idiyappam", "string hoppers"], calories: 150, proteinG: 3, carbsG: 33, fatG: 0.5 },
  { names: ["curd rice", "thayir sadam"], calories: 120, proteinG: 3, carbsG: 20, fatG: 3 },
  { names: ["lemon rice", "chitranna"], calories: 165, proteinG: 3, carbsG: 28, fatG: 5 },
  { names: ["tamarind rice", "puliyodarai", "puliogare"], calories: 175, proteinG: 3, carbsG: 30, fatG: 5 },
  { names: ["khichdi", "khichri"], calories: 120, proteinG: 4, carbsG: 20, fatG: 3 },

  // More non-veg
  { names: ["chicken tikka"], calories: 190, proteinG: 27, carbsG: 3, fatG: 8 },
  { names: ["seekh kebab"], calories: 240, proteinG: 20, carbsG: 4, fatG: 16 },
  { names: ["keema", "minced meat curry", "kheema"], calories: 220, proteinG: 17, carbsG: 6, fatG: 14 },
  { names: ["prawns curry", "shrimp curry"], calories: 130, proteinG: 15, carbsG: 5, fatG: 6 },
  { names: ["fish fry"], calories: 210, proteinG: 20, carbsG: 6, fatG: 12 },

  // More vegetables / sabzi
  { names: ["lauki sabzi", "bottle gourd sabzi", "doodhi sabzi"], calories: 60, proteinG: 1.5, carbsG: 10, fatG: 1.5 },
  { names: ["karela sabzi", "bitter gourd sabzi"], calories: 85, proteinG: 2, carbsG: 8, fatG: 5 },
  { names: ["gobi matar", "cauliflower peas sabzi"], calories: 95, proteinG: 3.5, carbsG: 12, fatG: 4 },
  { names: ["dal palak", "palak dal", "spinach dal"], calories: 100, proteinG: 6, carbsG: 14, fatG: 2.5 },
  { names: ["kadai paneer", "karahi paneer"], calories: 220, proteinG: 12, carbsG: 10, fatG: 15 },
  { names: ["malai kofta"], calories: 250, proteinG: 7, carbsG: 16, fatG: 18 },
  { names: ["chana sabzi", "dry chole", "kala chana sabzi"], calories: 160, proteinG: 8, carbsG: 24, fatG: 4 },

  // Beverages
  { names: ["masala chai", "chai", "tea with milk", "indian tea"], calories: 45, proteinG: 1.2, carbsG: 6, fatG: 1.5 },
  { names: ["black tea", "tea without sugar"], calories: 2, proteinG: 0, carbsG: 0.3, fatG: 0 },
  { names: ["filter coffee", "south indian coffee"], calories: 55, proteinG: 1.5, carbsG: 8, fatG: 1.8 },
  { names: ["black coffee"], calories: 2, proteinG: 0.1, carbsG: 0.3, fatG: 0 },
  { names: ["coconut water", "nariyal pani"], calories: 19, proteinG: 0.7, carbsG: 3.7, fatG: 0.2 },
  { names: ["nimbu pani", "lemon water", "shikanji"], calories: 40, proteinG: 0, carbsG: 10, fatG: 0 },
  { names: ["sugarcane juice", "ganne ka ras"], calories: 74, proteinG: 0.3, carbsG: 18, fatG: 0.1 },

  // More gym / fitness staples
  { names: ["soya chunks", "nutrela", "meal maker"], calories: 345, proteinG: 52, carbsG: 33, fatG: 0.5 },
  { names: ["tofu"], calories: 76, proteinG: 8, carbsG: 1.9, fatG: 4.8 },
  { names: ["cottage cheese", "hung curd cottage cheese"], calories: 98, proteinG: 11, carbsG: 3.4, fatG: 4.3 },
  { names: ["protein bar"], calories: 350, proteinG: 20, carbsG: 40, fatG: 12 },
  { names: ["chia seeds"], calories: 486, proteinG: 17, carbsG: 42, fatG: 31 },
  { names: ["flax seeds", "alsi"], calories: 534, proteinG: 18, carbsG: 29, fatG: 42 },
  { names: ["papad roasted", "roasted papad"], calories: 300, proteinG: 22, carbsG: 45, fatG: 2 },
  { names: ["papad fried", "fried papad", "papad"], calories: 400, proteinG: 18, carbsG: 45, fatG: 18 },

  // Gym / fitness staples
  { names: ["whey protein", "protein powder", "whey", "whey powder"], calories: 400, proteinG: 80, carbsG: 8, fatG: 5 },
  { names: ["peanut butter"], calories: 588, proteinG: 25, carbsG: 20, fatG: 50 },
  { names: ["oats", "rolled oats", "oatmeal dry", "oats dry"], calories: 389, proteinG: 17, carbsG: 66, fatG: 7 },
  { names: ["banana", "kela"], calories: 89, proteinG: 1.1, carbsG: 23, fatG: 0.3 },
  { names: ["almonds", "badam"], calories: 579, proteinG: 21, carbsG: 22, fatG: 50 },
  { names: ["peanuts", "moongfali", "groundnuts", "peanuts roasted"], calories: 585, proteinG: 26, carbsG: 21, fatG: 49 },
  { names: ["sweet potato", "shakarkandi"], calories: 86, proteinG: 1.6, carbsG: 20, fatG: 0.1 },
];
