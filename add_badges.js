const fs = require('fs');
const file = './client/src/pages/maschera-input-generale.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Definition of SectionBadge
const sectionBadgeCode = `
  const SectionBadge = ({ count }: { count: number }) => {
    if (!count || count === 0) return null;
    return (
      <span className="ml-auto bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] border border-yellow-200" title={\`\${count} iscrizioni attive\`}>
        {count}
      </span>
    );
  };
`;
// Inseriamolo sopra renderGenericEnrollmentList
content = content.replace(
  /const renderGenericEnrollmentList = \(/,
  `${sectionBadgeCode}\n  const renderGenericEnrollmentList = (`
);

// 2. Add totalActivitiesCount computation before 'return ('
// "  return (" usually is just that. We'll find the last return statement of MascheraInputGenerale
const totalActivitiesStr = `
  const totalActivitiesCount = 
    (memberEnrollments?.length || 0) +
    (memberPtEnrollments?.length || 0) +
    (memberFtEnrollments?.length || 0) +
    (memberSlEnrollments?.length || 0) +
    (memberSaEnrollments?.length || 0) +
    (memberTrEnrollments?.length || 0) +
    (memberIlEnrollments?.length || 0) +
    (memberCaEnrollments?.length || 0) +
    (memberReEnrollments?.length || 0) +
    (memberVsEnrollments?.length || 0) +
    (memberWorkshopEnrollments?.length || 0);
`;

content = content.replace(
  /(\s+)return \(\s+<TooltipProvider>/,
  `$1${totalActivitiesStr}\n$1return (\n      <TooltipProvider>`
);

// 3. Inject totalActivitiesCount in the Tab di navigazione array
content = content.replace(
  /\{\s*id:\s*"attivita",\s*label:\s*"Attività",\s*icon:\s*Activity\s*\}/,
  `{ id: "attivita", label: "Attività", icon: Activity, badgeCount: totalActivitiesCount }`
);

// also in the mapping for the nav items to render it
content = content.replace(
  /onClick=\{\(\) => scrollToSection\(item\.id\)\}\s*className="(.*?)"/g,
  `onClick={() => scrollToSection(item.id)}\n                className="$1 relative"`
);

// Add the rendering of the badge in the Button
const renderNavBadge = `
                {item.label}
                {item.badgeCount && item.badgeCount > 0 ? (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-yellow-200">
                    {item.badgeCount}
                  </span>
                ) : null}`;
content = content.replace(
  /\{\s*item\.label\s*\}/g,
  renderNavBadge
);

// 4. Inject SectionBadge in all <h3> of activities
// Replace </h3> in sections: Corsi, Prove a Pagamento, Prove Gratuite, Lezioni Singole, Workshop, Domeniche, Allenamenti, individuali, Campus, Saggi, Vacanze
const h3Injects = [
  { match: /Corsi<\/Link>[\s\S]*?<KnowledgeInfo id="corsi" \/>\s*<\/h3>/m, badge: '<SectionBadge count={memberEnrollments?.length || 0} />\n              </h3>' },
  { match: /Prove a Pagamento<\/Link>[\s\S]*?<KnowledgeInfo id="prove-a-pagamento" \/>\s*<\/h3>/m, badge: '<SectionBadge count={memberPtEnrollments?.length || 0} />\n              </h3>' },
  { match: /Prove Gratuite<\/Link>[\s\S]*?<KnowledgeInfo id="prove-gratuite" \/>\s*<\/h3>/m, badge: '<SectionBadge count={memberFtEnrollments?.length || 0} />\n              </h3>' },
  { match: /Lezioni Singole<\/Link>[\s\S]*?<KnowledgeInfo id="lezioni-singole" \/>\s*<\/h3>/m, badge: '<SectionBadge count={memberSlEnrollments?.length || 0} />\n              </h3>' },
  { match: /Workshop<\/Link>[\s\S]*?<KnowledgeInfo id="workshop" \/>\s*<\/h3>/m, badge: '<SectionBadge count={memberWorkshopEnrollments?.length || 0} />\n              </h3>' },
  { match: /Domeniche in Movimento<\/Link>[\s\S]*?<KnowledgeInfo id="domeniche-in-movimento" \/>\s*<\/h3>/m, badge: '<SectionBadge count={memberSaEnrollments?.length || 0} />\n              </h3>' },
  { match: /Allenamenti\/Affitti<\/Link>[\s\S]*?<KnowledgeInfo id="allenamenti" \/>\s*<\/h3>/m, badge: '<SectionBadge count={memberTrEnrollments?.length || 0} />\n              </h3>' },
  { match: /Campus<\/Link>[\s\S]*?<KnowledgeInfo id="campus" \/>\s*<\/h3>/m, badge: '<SectionBadge count={memberCaEnrollments?.length || 0} />\n              </h3>' },
  { match: /Saggi<\/Link>[\s\S]*?<KnowledgeInfo id="saggi" \/>\s*<\/h3>/m, badge: '<SectionBadge count={memberReEnrollments?.length || 0} />\n              </h3>' },
  { match: /Vacanze Studio<\/Link>[\s\S]*?<KnowledgeInfo id="vacanze-studio" \/>\s*<\/h3>/m, badge: '<SectionBadge count={memberVsEnrollments?.length || 0} />\n              </h3>' },
  { match: /Lezioni Individuali<\/Link>[\s\S]*?<KnowledgeInfo id="lezioni-individuali" \/>\s*<\/h3>/m, badge: '<SectionBadge count={memberIlEnrollments?.length || 0} />\n              </h3>' }
];

for (const inject of h3Injects) {
  content = content.replace(inject.match, function(matched) {
    return matched.replace('</h3>', inject.badge);
  });
}

// Write back
fs.writeFileSync(file, content);
console.log('Fatto');
