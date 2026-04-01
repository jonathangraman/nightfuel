// Seasonal produce by month (US-centric)
const SEASONAL = {
  1:  { month: "January",   produce: ["butternut squash", "sweet potatoes", "brussels sprouts", "kale", "citrus", "broccoli", "cauliflower", "cabbage"] },
  2:  { month: "February",  produce: ["sweet potatoes", "kale", "citrus", "cabbage", "broccoli", "cauliflower", "brussels sprouts", "beets"] },
  3:  { month: "March",     produce: ["asparagus", "spinach", "peas", "artichokes", "leeks", "broccoli", "cabbage", "kale"] },
  4:  { month: "April",     produce: ["asparagus", "peas", "spinach", "artichokes", "green onions", "radishes", "lettuce", "broccoli"] },
  5:  { month: "May",       produce: ["asparagus", "peas", "spinach", "zucchini", "green beans", "cucumber", "lettuce", "radishes"] },
  6:  { month: "June",      produce: ["zucchini", "cucumber", "green beans", "bell peppers", "corn", "tomatoes", "basil", "squash"] },
  7:  { month: "July",      produce: ["tomatoes", "zucchini", "corn", "bell peppers", "cucumber", "green beans", "basil", "eggplant"] },
  8:  { month: "August",    produce: ["tomatoes", "corn", "bell peppers", "eggplant", "zucchini", "basil", "green beans", "okra"] },
  9:  { month: "September", produce: ["butternut squash", "sweet potatoes", "bell peppers", "tomatoes", "broccoli", "cauliflower", "green beans", "corn"] },
  10: { month: "October",   produce: ["butternut squash", "sweet potatoes", "brussels sprouts", "cauliflower", "broccoli", "kale", "beets", "cabbage"] },
  11: { month: "November",  produce: ["sweet potatoes", "butternut squash", "brussels sprouts", "kale", "cauliflower", "broccoli", "beets", "cabbage"] },
  12: { month: "December",  produce: ["sweet potatoes", "butternut squash", "kale", "brussels sprouts", "citrus", "broccoli", "cauliflower", "beets"] },
};

export function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  const data = SEASONAL[month];
  return {
    month: data.month,
    produce: data.produce,
    note: `It's ${data.month} — seasonal vegetables include: ${data.produce.slice(0, 5).join(", ")} and more.`,
  };
}
