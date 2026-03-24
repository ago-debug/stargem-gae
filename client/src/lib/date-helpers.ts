// Extract of shared date utility functions for CourseManager

export const isItalianHoliday = (date: Date): string | null => {
    const d = date.getDate();
    const m = date.getMonth(); // 0 is January
    
    if (m === 0 && d === 1) return "Capodanno";
    if (m === 0 && d === 6) return "Epifania";
    if (m === 3 && d === 25) return "Liberazione";
    if (m === 4 && d === 1) return "Festa del Lavoro";
    if (m === 5 && d === 2) return "Festa della Repubblica";
    if (m === 7 && d === 15) return "Ferragosto";
    if (m === 10 && d === 1) return "Tutti i Santi";
    if (m === 11 && d === 8) return "Immacolata";
    if (m === 11 && d === 25) return "Natale";
    if (m === 11 && d === 26) return "Santo Stefano";
    
    // Pasquetta and Pasqua calculation can be added here if needed, 
    // but fixed statutory holidays are covered.
    return null;
};
