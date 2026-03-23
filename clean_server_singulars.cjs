const fs = require('fs');
let code = fs.readFileSync('server/storage.ts', 'utf8');

const blocks = [
  'PaidTrial', 'FreeTrial', 'SingleLesson',
  'PaidTrialEnrollment', 'FreeTrialEnrollment', 'SingleLessonEnrollment'
];

blocks.forEach(b => {
  // interface
  let rxIf = new RegExp(`\\s*get${b}\\(id: number\\): Promise<${b} \\| undefined>;`, 'g');
  code = code.replace(rxIf, '');
  
  // class
  let rxCls = new RegExp(`[ \\t]*async get${b}\\(id: number\\): Promise<${b} \\| undefined> \\{[\\s\\S]*?\\n[ \\t]*\\}`, 'g');
  code = code.replace(rxCls, '');
});

fs.writeFileSync('server/storage.ts', code);
console.log("Singulars removed!");
