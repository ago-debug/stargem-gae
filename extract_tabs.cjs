const fs = require('fs');

const fileContent = fs.readFileSync('client/src/pages/maschera-input-generale.tsx', 'utf8');

// The strategy is to extract the cards into components that take props
// because they depend on many state variables in the parent file.
// Or we can just build the components and then fix the types manually.

// Let's just output the boundaries to see what we are dealing with.
const lines = fileContent.split('\n');

function findCard(id) {
    const startRegex = new RegExp(`<Card id="${id}"`);
    let startIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        if (startRegex.test(lines[i])) {
            startIdx = i;
            break;
        }
    }
    if (startIdx === -1) return null;

    let endIdx = -1;
    let openTags = 0;
    for (let i = startIdx; i < lines.length; i++) {
        if (lines[i].includes('<Card')) openTags++;
        if (lines[i].includes('</Card>')) openTags--;
        if (openTags === 0) {
            endIdx = i;
            break;
        }
    }
    return { startIdx, endIdx };
}

console.log("Gift:", findCard("gift"));
console.log("Attivita:", findCard("attivita"));
console.log("Marketing:", findCard("attivita-marketing"));
console.log("Pagamenti:", findCard("pagamenti"));

