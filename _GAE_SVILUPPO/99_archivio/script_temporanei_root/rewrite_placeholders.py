import os

def placeholder(text="Da popolare", title="Campo presente nello schema DB ma non popolato. Smistare a Chat_Analisi."):
    return f'<span className="text-muted-foreground italic" title="{title}">— {text}</span>'

def fix_file(filepath, role):
    with open(filepath, "r") as f:
        content = f.read()

    # The file has a section `return (` then `<div className="flex flex-wrap gap-3 pt-2">`
    # Let's replace the content inside the specific tags.
    # We can just write out the specific sections for each file.
    
    domenica_sections = f"""                    <div className="flex flex-wrap gap-3 pt-2">
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            Data: {{item.startDate ? new Date(item.startDate).toLocaleDateString('it-IT') : {placeholder("Da popolare")}}}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" />
                            Tipo: {{item.name || {placeholder("Da popolare")}}}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            {{/* TODO Chat_Analisi: insegnante domenica — colonna esiste ma valore NULL nei record reali */}}
                            Insegnante: {{item.instructorId || {placeholder("Insegnante da assegnare")}}} 
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />
                            {{/* TODO Chat_Analisi: sala domenica — colonna esiste ma valore NULL nei record reali */}}
                            Studio/Sala: {{item.studioId || {placeholder("Sala da assegnare")}}}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5" title="Da configurare — vedi Chat_Analisi">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Presenze: {{/* TODO Chat_Analisi: stato presenze domenica — richiede tabella attendances o struttura dedicata */}} 
                            {placeholder("Modulo presenze in attesa di configurazione (Chat_Analisi)")}
                        </Badge>
                    </div>"""
    
    li_sections = f"""                    <div className="flex flex-wrap gap-3 pt-2">
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            {{/* TODO Chat_Analisi: insegnante LI — colonna esiste ma valore NULL nei record reali */}}
                            Insegnante: {{item.instructorId || {placeholder("Configurabile da iscrizione (TODO Chat_Analisi)")}}}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {{/* TODO Chat_Analisi: orario fisso LI — colonna esiste ma valore NULL nei record reali */}}
                            Giorno/Ora: {{(item.dayOfWeek || item.startTime) ? `${{item.dayOfWeek || ''}} ${{item.startTime || ''}}` : {placeholder("Configurabile da iscrizione (TODO Chat_Analisi)")}}}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />
                            {{/* TODO Chat_Analisi: sala LI — colonna esiste ma valore NULL nei record reali */}}
                            Studio/Sala: {{item.studioId || {placeholder("Configurabile da iscrizione (TODO Chat_Analisi)")}}}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5" title="Da configurare — vedi Chat_Analisi">
                            <Tag className="w-3.5 h-3.5" />
                            Pacchetto: {{/* TODO Chat_Analisi: pacchetto LI residue — richiede tabella packages o campo enrollments dedicato */}}
                            {placeholder("Modulo pacchetti da implementare (TODO Chat_Analisi)")}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5" title="Da configurare — vedi Chat_Analisi">
                            <CalendarRange className="w-3.5 h-3.5" />
                            Prossima: {{/* TODO Chat_Analisi: prossima lezione LI — richiede enrollments.targetDate o logica custom */}}
                            {placeholder("Modulo booking lezioni da implementare (TODO Chat_Analisi)")}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5" title="Da configurare — vedi Chat_Analisi">
                            <FileText className="w-3.5 h-3.5" />
                            Storico: {{/* TODO Chat_Analisi: storico lezioni svolte LI — richiede UI tabella o modale storico attendances */}}
                            {{attendancesCount > 0 ? `${{attendancesCount}} presenze (storico strisciate)` : {placeholder("Da popolare")}}}
                        </Badge>
                    </div>"""

    campus_sections = f"""                    <div className="flex flex-wrap gap-3 pt-2">
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {{/* TODO Chat_Analisi: settimana campus — colonna esiste ma valore NULL nei record reali */}}
                            Settimana: {{(item.startDate || item.endDate) ? `${{item.startDate ? new Date(item.startDate).toLocaleDateString('it-IT') : ''}} - ${{item.endDate ? new Date(item.endDate).toLocaleDateString('it-IT') : ''}}` : {placeholder("Da popolare")}}}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" />
                            Tipo Campus: {{item.name || {placeholder("Da popolare")}}}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {{/* TODO Chat_Analisi: orari giornalieri campus — colonna esiste ma valore NULL nei record reali */}}
                            Orari: {{(item.startTime || item.endTime) ? `${{item.startTime || 'N/A'}} - ${{item.endTime || 'N/A'}}` : {placeholder("Da popolare")}}}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5" title="Da configurare — vedi Chat_Analisi">
                            <Info className="w-3.5 h-3.5" />
                            Pasti/Extra: {{/* TODO Chat_Analisi: pasti/extra Campus — richiede DB structure */}}
                            {placeholder("Modulo pasti da implementare (TODO Chat_Analisi)")}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5" title="Da configurare — vedi Chat_Analisi">
                            <Users className="w-3.5 h-3.5" />
                            Gruppo: {{/* TODO Chat_Analisi: gruppo bambino Campus — richiede DB structure o uso di courses.level */}}
                            {placeholder("Modulo gruppi da implementare (TODO Chat_Analisi)")}
                        </Badge>
                    </div>"""

    # For LI we need to add `attendancesCount` computation. Let's just find `const enrolledMembersData = ...`
    # and add a total attendances counter.
    
    import re

    # Replace the <div className="flex flex-wrap gap-3 pt-2"> ... </div> with our new section.
    # We find it by matching up to </div> from that line
    pattern = r'(<div className="flex flex-wrap gap-3 pt-2">.*?</div>\n)'
    if role == "domenica":
        new_content = re.sub(pattern, domenica_sections + "\n", content, flags=re.DOTALL)
    elif role == "li":
        new_content = re.sub(pattern, li_sections + "\n", content, flags=re.DOTALL)
        
        # We need attendancesCount definition
        if "const attendancesCount" not in new_content:
            new_content = new_content.replace(
                "const sortedEnrolledMembersData = sortItems(enrolledMembersData, getSortValue);",
                "const sortedEnrolledMembersData = sortItems(enrolledMembersData, getSortValue);\n    const attendancesCount = enrolledMembersData.reduce((acc: number, curr: any) => acc + (curr.attendances?.length || 0), 0);"
            )
            
    elif role == "campus":
        new_content = re.sub(pattern, campus_sections + "\n", content, flags=re.DOTALL)

    with open(filepath, "w") as f:
        f.write(new_content)

fix_file("client/src/pages/scheda-domenica.tsx", "domenica")
fix_file("client/src/pages/scheda-lezione-individuale.tsx", "li")
fix_file("client/src/pages/scheda-campus.tsx", "campus")

