const keywords = {
  food: ["milk", "rice", "vegetables"],
  rent: ["rent"],
  utilities: ["electricity", "current"],
  internet: ["wifi"]
};

function detectCategory(title) {
  const text = title.toLowerCase();

  for (let category in keywords) {
    for (let word of keywords[category]) {
      if (text.includes(word)) {
        return category;
      }
    }
  }
  return "misc";
}

module.exports = detectCategory;