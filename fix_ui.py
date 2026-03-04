import re

with open('client/src/pages/maschera-input-generale.tsx', 'r') as f:
    content = f.read()

def replace_section(name, next_name, replacement):
    global content
    
    # Regex per trovare: { /* NAME */ } ... </h3> ... (TUTTO FINO AL PROSSIMO { /* NEXT_NAME */ }
    # Ma vogliamo tenere il </div> di chiusura della section corrente
    
    if next_name:
        pattern = r"(\{\/\* " + name + r" \*\/\}\s*<div>[\s\S]*?<\/h3>\s*)([\s\S]*?)(\s*<\/div>\s*\{\/\* " + next_name + r" \*\/\})"
        match = re.search(pattern, content)
        if match:
            # Sostituiamo il gruppo 2
            content = content[:match.start(2)] + replacement + content[match.end(2):]
            print(f"Replaced {name}")
        else:
            print(f"Match not found for {name}")
    else:
        # L'ultima sezione prima della chiusura `</div></div>` del blocco o chiusura <CardContent>
        pattern = r"(\{\/\* " + name + r" \*\/\}\s*<div>[\s\S]*?<\/h3>\s*)([\s\S]*?)(<\/CardContent>)"
        match = re.search(pattern, content)
        if match:
            # Troviamo l'ultimo </div> nel gruppo 2 (il gruppo 2 chiude la sezione)
            inner_content = match.group(2)
            # Dobbiamo sostituire tutto tranne l'ultimo </div> e gli spazi. 
            # Oppure piu semplicemente, la grid 
            sub_pattern = r"(<div className=\"grid[\s\S]*?<\/div>\s*<\/div>)"
            sub_match = re.search(sub_pattern, inner_content)
            if sub_match:
                new_inner = inner_content[:sub_match.start(1)] + replacement + inner_content[sub_match.end(1):]
                content = content[:match.start(2)] + new_inner + content[match.end(2):]
                print(f"Replaced {name} (submatch)")
            else:
                print(f"Submatch non found for {name}")
        else:
            print(f"Match not found for {name}")

sections = [
    ("PROVE A PAGAMENTO", "PROVE GRATUITE", '{renderGenericEnrollmentList(memberPtEnrollments, paidTrials, removePtEnrollmentMutation, "Nessuna prova a pagamento registrata.", "Prove a Pagamento Registrate", "le prove a pagamento", "paidTrialId")}'),
    ("PROVE GRATUITE", "LEZIONI SINGOLE", '{renderGenericEnrollmentList(memberFtEnrollments, freeTrials, removeFtEnrollmentMutation, "Nessuna prova gratuita registrata.", "Prove Gratuite Registrate", "le prove gratuite", "freeTrialId")}'),
    ("LEZIONI SINGOLE", "WORKSHOP", '{renderGenericEnrollmentList(memberSlEnrollments, singleLessons, removeSlEnrollmentMutation, "Nessuna lezione singola registrata.", "Lezioni Singole Registrate", "le lezioni singole", "singleLessonId")}'),
    ("WORKSHOP", "DOMENICHE IN MOVIMENTO", '{renderGenericEnrollmentList(memberWorkshopEnrollments, workshops, removeWorkshopEnrollmentMutation, "Nessun workshop registrato.", "Workshop Registrati", "i workshop", "workshopId")}'),
    ("DOMENICHE IN MOVIMENTO", "ALLENAMENTI", '{renderGenericEnrollmentList(memberSaEnrollments, sundayActivities, removeSaEnrollmentMutation, "Nessuna domenica in movimento registrata.", "Domeniche in Movimento Registrate", "le domeniche in movimento", "sundayActivityId")}'),
    ("ALLENAMENTI", "LEZIONI INDIVIDUALI", '{renderGenericEnrollmentList(memberTrEnrollments, trainings, removeTrEnrollmentMutation, "Nessun allenamento registrato.", "Allenamenti Registrati", "gli allenamenti", "trainingId")}'),
    ("LEZIONI INDIVIDUALI", "CAMPUS", '{renderGenericEnrollmentList(memberIlEnrollments, individualLessons, removeIlEnrollmentMutation, "Nessuna lezione individuale registrata.", "Lezioni Individuali Registrate", "le lezioni individuali", "individualLessonId")}'),
    ("CAMPUS", "SAGGI", '{renderGenericEnrollmentList(memberCaEnrollments, campusActivities, removeCaEnrollmentMutation, "Nessun campus registrato.", "Campus Registrati", "i campus", "campusActivityId")}'),
    ("SAGGI", "VACANZE STUDIO", '{renderGenericEnrollmentList(memberReEnrollments, recitals, removeReEnrollmentMutation, "Nessun saggio registrato.", "Saggi Registrati", "i saggi", "recitalId")}'),
    ("VACANZE STUDIO", None, '{renderGenericEnrollmentList(memberVsEnrollments, vacationStudies, removeVsEnrollmentMutation, "Nessuna vacanza studio registrata.", "Vacanze Studio Registrate", "le vacanze studio", "vacationStudyId")}\n            </div>')
]

for name, next_name, replacement in sections:
    replace_section(name, next_name, replacement)
    
# Add SectionBadge logic to h3s if missing!
def add_badge_to_h3(name, counter_variable):
    global content
    pattern = r"(\{\/\* " + name + r" \*\/\}\s*<div>\s*<h3[\s\S]*?)(<\/h3>)"
    match = re.search(pattern, content)
    if match:
        tag_content = match.group(1)
        if 'SectionBadge' not in tag_content:
            new_tag = f"{tag_content}  <SectionBadge count={{{counter_variable}?.length || 0}} />\n              {match.group(2)}"
            content = content[:match.start(0)] + new_tag + content[match.end(0):]
            print(f"Added badge to {name}")
            
badges = [
    ("CORSI", "memberEnrollments"),
    ("PROVE A PAGAMENTO", "memberPtEnrollments"),
    ("PROVE GRATUITE", "memberFtEnrollments"),
    ("LEZIONI SINGOLE", "memberSlEnrollments"),
    ("WORKSHOP", "memberWorkshopEnrollments"),
    ("DOMENICHE IN MOVIMENTO", "memberSaEnrollments"),
    ("ALLENAMENTI", "memberTrEnrollments"),
    ("LEZIONI INDIVIDUALI", "memberIlEnrollments"),
    ("CAMPUS", "memberCaEnrollments"),
    ("SAGGI", "memberReEnrollments"),
    ("VACANZE STUDIO", "memberVsEnrollments")
]

for name, var in badges:
    add_badge_to_h3(name, var)

with open('client/src/pages/maschera-input-generale.tsx', 'w') as f:
    f.write(content)

