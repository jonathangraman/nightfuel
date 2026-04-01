const MONTH = new Date().getMonth() + 1;

export const SALAD_BASES = [
  { id: "spinach",      name: "Baby Spinach",     calories: 20, protein: 2, carbs: 3,  emoji: "🌿" },
  { id: "arugula",      name: "Arugula",           calories: 15, protein: 2, carbs: 2,  emoji: "🌿" },
  { id: "romaine",      name: "Romaine",           calories: 15, protein: 1, carbs: 3,  emoji: "🥬" },
  { id: "mixed-greens", name: "Mixed Greens",      calories: 15, protein: 1, carbs: 2,  emoji: "🥗" },
  { id: "kale",         name: "Kale",              calories: 25, protein: 2, carbs: 4,  emoji: "🌿" },
  { id: "butter-lettuce",name: "Butter Lettuce",   calories: 10, protein: 1, carbs: 2,  emoji: "🥬" },
  { id: "iceberg",      name: "Iceberg",           calories: 10, protein: 1, carbs: 2,  emoji: "🥬" },
  { id: "watercress",   name: "Watercress",        calories: 12, protein: 1, carbs: 1,  emoji: "🌿" },
];

export const SALAD_TOPPING_GROUPS = [
  {
    label: "🥜 Nuts & Crunch",
    toppings: [
      { id: "candied-pecans",    name: "Candied Pecans",      calories: 85,  protein: 1, carbs: 8,  emoji: "🫘" },
      { id: "toasted-walnuts",   name: "Toasted Walnuts",     calories: 90,  protein: 2, carbs: 4,  emoji: "🫘" },
      { id: "pine-nuts",         name: "Toasted Pine Nuts",   calories: 80,  protein: 2, carbs: 2,  emoji: "🫘" },
      { id: "spiced-pepitas",    name: "Spiced Pepitas",      calories: 70,  protein: 3, carbs: 3,  emoji: "🌰" },
      { id: "crispy-chickpeas",  name: "Crispy Chickpeas",    calories: 80,  protein: 4, carbs: 11, emoji: "🫘" },
      { id: "sunflower-seeds",   name: "Sunflower Seeds",     calories: 65,  protein: 3, carbs: 3,  emoji: "🌻" },
      { id: "toasted-hazelnuts", name: "Toasted Hazelnuts",   calories: 85,  protein: 2, carbs: 4,  emoji: "🫘", season: [9,10,11] },
      { id: "dukkah",            name: "Dukkah",              calories: 60,  protein: 2, carbs: 3,  emoji: "✨" },
      { id: "crispy-wontons",    name: "Crispy Wontons",      calories: 55,  protein: 1, carbs: 8,  emoji: "🥢" },
      { id: "fried-shallots",    name: "Crispy Fried Shallots",calories: 45, protein: 1, carbs: 5,  emoji: "🧅" },
    ],
  },
  {
    label: "🧀 Cheese",
    toppings: [
      { id: "shaved-parmesan",   name: "Shaved Parmesan",     calories: 55,  protein: 5, carbs: 0,  emoji: "🧀" },
      { id: "crumbled-feta",     name: "Crumbled Feta",       calories: 50,  protein: 3, carbs: 1,  emoji: "🧀" },
      { id: "goat-cheese",       name: "Goat Cheese",         calories: 65,  protein: 4, carbs: 0,  emoji: "🧀" },
      { id: "gorgonzola",        name: "Gorgonzola",          calories: 60,  protein: 4, carbs: 0,  emoji: "🧀" },
      { id: "manchego",          name: "Shaved Manchego",     calories: 60,  protein: 4, carbs: 0,  emoji: "🧀" },
      { id: "burrata",           name: "Burrata",             calories: 90,  protein: 5, carbs: 1,  emoji: "🧀", season: [6,7,8] },
      { id: "ricotta",           name: "Fresh Ricotta",       calories: 55,  protein: 4, carbs: 2,  emoji: "🧀" },
    ],
  },
  {
    label: "🍎 Fruit",
    toppings: [
      { id: "strawberries",      name: "Fresh Strawberries",  calories: 20,  protein: 0, carbs: 5,  emoji: "🍓", season: [4,5,6] },
      { id: "sliced-peaches",    name: "Sliced Peaches",      calories: 25,  protein: 0, carbs: 6,  emoji: "🍑", season: [7,8,9] },
      { id: "watermelon-cubes",  name: "Watermelon",          calories: 25,  protein: 0, carbs: 6,  emoji: "🍉", season: [6,7,8] },
      { id: "apple-slices",      name: "Honeycrisp Apple",    calories: 25,  protein: 0, carbs: 6,  emoji: "🍎", season: [9,10,11] },
      { id: "sliced-pear",       name: "Sliced Pear",         calories: 25,  protein: 0, carbs: 6,  emoji: "🍐", season: [9,10,11] },
      { id: "mango-cubes",       name: "Fresh Mango",         calories: 30,  protein: 0, carbs: 7,  emoji: "🥭", season: [5,6,7,8] },
      { id: "pomegranate-seeds", name: "Pomegranate Seeds",   calories: 25,  protein: 0, carbs: 6,  emoji: "💎", season: [10,11,12,1] },
      { id: "dried-cranberries", name: "Dried Cranberries",   calories: 40,  protein: 0, carbs: 10, emoji: "🔴", season: [10,11,12] },
      { id: "dried-cherries",    name: "Dried Cherries",      calories: 40,  protein: 0, carbs: 10, emoji: "🍒", season: [9,10,11] },
      { id: "blood-orange",      name: "Blood Orange Segments",calories: 25, protein: 0, carbs: 6,  emoji: "🍊", season: [1,2,3,12] },
      { id: "grapes",            name: "Halved Grapes",       calories: 30,  protein: 0, carbs: 7,  emoji: "🍇", season: [8,9,10] },
      { id: "citrus-segments",   name: "Citrus Segments",     calories: 25,  protein: 0, carbs: 6,  emoji: "🍋", season: [1,2,3,12] },
    ],
  },
  {
    label: "🥕 Vegetables",
    toppings: [
      { id: "roasted-beets",     name: "Roasted Beets",       calories: 35,  protein: 1, carbs: 8,  emoji: "🫀", season: [10,11,12,1,2] },
      { id: "shaved-fennel",     name: "Shaved Fennel",       calories: 20,  protein: 1, carbs: 4,  emoji: "🌿", season: [3,4,5,10,11] },
      { id: "roasted-squash",    name: "Roasted Butternut Squash",calories: 40,protein:1,carbs:10, emoji: "🎃", season: [9,10,11,12] },
      { id: "pickled-red-onion", name: "Pickled Red Onion",   calories: 10,  protein: 0, carbs: 2,  emoji: "🧅" },
      { id: "cherry-tomatoes",   name: "Cherry Tomatoes",     calories: 15,  protein: 1, carbs: 3,  emoji: "🍅", season: [6,7,8,9] },
      { id: "heirloom-tomatoes", name: "Heirloom Tomatoes",   calories: 15,  protein: 1, carbs: 3,  emoji: "🍅", season: [7,8,9] },
      { id: "shaved-asparagus",  name: "Shaved Asparagus",    calories: 15,  protein: 2, carbs: 3,  emoji: "🌿", season: [3,4,5] },
      { id: "snap-peas",         name: "Snap Peas",           calories: 20,  protein: 1, carbs: 4,  emoji: "🫛", season: [4,5,6] },
      { id: "radishes",          name: "Sliced Radishes",     calories: 10,  protein: 0, carbs: 2,  emoji: "🔴", season: [3,4,5] },
      { id: "cucumber",          name: "Cucumber",            calories: 10,  protein: 0, carbs: 2,  emoji: "🥒" },
      { id: "roasted-corn",      name: "Roasted Corn",        calories: 50,  protein: 2, carbs: 10, emoji: "🌽", season: [6,7,8,9] },
      { id: "artichoke-hearts",  name: "Artichoke Hearts",    calories: 30,  protein: 2, carbs: 5,  emoji: "🌿" },
      { id: "sun-dried-tomatoes",name: "Sun-Dried Tomatoes",  calories: 35,  protein: 1, carbs: 5,  emoji: "🍅" },
      { id: "roasted-garlic",    name: "Roasted Garlic",      calories: 20,  protein: 1, carbs: 4,  emoji: "🧄" },
      { id: "charred-scallions", name: "Charred Scallions",   calories: 15,  protein: 1, carbs: 3,  emoji: "🌿", season: [4,5,6] },
      { id: "fresh-corn",        name: "Fresh Corn Off Cob",  calories: 45,  protein: 2, carbs: 10, emoji: "🌽", season: [7,8,9] },
    ],
  },
  {
    label: "✨ Special Toppings",
    toppings: [
      { id: "crispy-prosciutto", name: "Crispy Prosciutto",   calories: 55,  protein: 4, carbs: 0,  emoji: "🥓" },
      { id: "bacon-bits",        name: "Bacon Bits",          calories: 60,  protein: 5, carbs: 0,  emoji: "🥓" },
      { id: "hard-boiled-egg",   name: "Hard Boiled Egg",     calories: 70,  protein: 6, carbs: 0,  emoji: "🥚" },
      { id: "capers",            name: "Capers",              calories: 5,   protein: 0, carbs: 1,  emoji: "🫙" },
      { id: "olives",            name: "Kalamata Olives",     calories: 35,  protein: 0, carbs: 2,  emoji: "🫒" },
      { id: "pepperoncini",      name: "Pepperoncini",        calories: 10,  protein: 0, carbs: 2,  emoji: "🌶️" },
      { id: "furikake",          name: "Furikake",            calories: 15,  protein: 1, carbs: 2,  emoji: "🌊" },
      { id: "croutons",          name: "Garlic Croutons",     calories: 60,  protein: 2, carbs: 9,  emoji: "🍞" },
      { id: "zaatar-pita-chips", name: "Za'atar Pita Chips",  calories: 65,  protein: 2, carbs: 10, emoji: "🫓" },
      { id: "pickled-daikon",    name: "Pickled Daikon",      calories: 10,  protein: 0, carbs: 2,  emoji: "🥢" },
      { id: "avocado",           name: "Sliced Avocado",      calories: 80,  protein: 1, carbs: 4,  emoji: "🥑" },
      { id: "hemp-seeds",        name: "Hemp Seeds",          calories: 55,  protein: 3, carbs: 1,  emoji: "🌱" },
    ],
  },
];

// Dressings from sauces.js that work as salad dressings
export const SALAD_DRESSINGS = [
  { id: "strawberry-balsamic",   name: "Strawberry Balsamic",     calories: 45, emoji: "🍓", season: [4,5,6] },
  { id: "apple-cider",           name: "Apple Cider Vinaigrette", calories: 65, emoji: "🍎", season: [9,10,11,12] },
  { id: "mango-lime",            name: "Mango Lime",              calories: 40, emoji: "🥭", season: [5,6,7,8] },
  { id: "honey-poppy-seed",      name: "Honey Poppy Seed",        calories: 70, emoji: "🍯" },
  { id: "citrus-tahini",         name: "Citrus Tahini",           calories: 80, emoji: "🍋", season: [1,2,3,12] },
  { id: "raspberry-champagne",   name: "Raspberry Champagne",     calories: 50, emoji: "🫐", season: [6,7,8] },
  { id: "lemon-herb",            name: "Lemon Herb",              calories: 90, emoji: "🫒" },
  { id: "greek-ladolemono",      name: "Greek Lemon-Oil",         calories: 100, emoji: "🫒" },
  { id: "balsamic-reduction",    name: "Balsamic Glaze",          calories: 50, emoji: "🍷" },
  { id: "italian-salsa-verde",   name: "Italian Salsa Verde",     calories: 70, emoji: "🌿" },
  { id: "tzatziki",              name: "Tzatziki",                calories: 30, emoji: "🫒" },
  { id: "garlic-ginger-soy",     name: "Garlic Ginger Soy",       calories: 45, emoji: "🥢" },
  { id: "thai-peanut",           name: "Thai Peanut",             calories: 90, emoji: "🥜" },
  { id: "nuoc-cham",             name: "Vietnamese Nuoc Cham",    calories: 20, emoji: "🍋" },
  { id: "chipotle-lime",         name: "Chipotle Lime",           calories: 35, emoji: "🌶️" },
  { id: "lightened-pesto",       name: "Basil Pesto",             calories: 80, emoji: "🌿" },
];

export function getInSeasonToppings() {
  const month = new Date().getMonth() + 1;
  return SALAD_TOPPING_GROUPS.flatMap(g => g.toppings).filter(t => t.season?.includes(month));
}
