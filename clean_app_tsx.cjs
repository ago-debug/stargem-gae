const fs = require('fs');

let code = fs.readFileSync('client/src/App.tsx', 'utf8');

// Strip imports
const importsToStrip = [
  'FreeTrials', 'FreeTrialsCategories', 'SchedaProvaGratuita',
  'PaidTrials', 'PaidTrialsCategories', 'SchedaProvaPagamento',
  'SingleLessons', 'SingleLessonsCategories', 'SchedaLezioneSingola'
];

importsToStrip.forEach(i => {
  let reg1 = new RegExp(`.*import ${i} from .*\\n`, 'g');
  code = code.replace(reg1, '');
});

// Strip Routes
code = code.replace(/<Route path="\/prove-gratuite".*?\/>\n/g, '');
code = code.replace(/<Route path="\/prove-gratuite-categorie".*?\/>\n/g, '');
code = code.replace(/<Route path="\/scheda-prova-gratuita".*?\/>\n/g, '');
code = code.replace(/<Route path="\/prove-pagamento".*?\/>\n/g, '');
code = code.replace(/<Route path="\/prove-pagamento-categorie".*?\/>\n/g, '');
code = code.replace(/<Route path="\/scheda-prova-pagamento".*?\/>\n/g, '');
code = code.replace(/<Route path="\/lezioni-singole".*?\/>\n/g, '');
code = code.replace(/<Route path="\/lezioni-singole-categorie".*?\/>\n/g, '');
code = code.replace(/<Route path="\/scheda-lezione-singola".*?\/>\n/g, '');

fs.writeFileSync('client/src/App.tsx', code);
console.log("App.tsx cleaned!");
