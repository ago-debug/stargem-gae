function toTitleCase(str) {
  if (!str) return str;
  let titleCased = str.split(/(\s+|-)/).map(word => {
    if (word.trim() === '' || word === '-') return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join('');
  
  let result = '';
  for (let i = 0; i < titleCased.length; i++) {
    const char = titleCased[i];
    if (i > 0) {
      const prevChar = titleCased[i - 1];
      if ((/[0-9\/]/.test(prevChar)) && /[a-z]/.test(char)) {
        result += char.toUpperCase();
        continue;
      }
    }
    result += char;
  }
  return result;
}

console.log(toTitleCase("via dei pini 10/b")); // "Via Dei Pini 10/B"
console.log(toTitleCase("Viale Stelvio 58a")); // "Viale Stelvio 58A"
console.log(toTitleCase("Via Cavour 58/g")); // "Via Cavour 58/G"
console.log(toTitleCase("Via Roma 12b")); // "Via Roma 12B"
