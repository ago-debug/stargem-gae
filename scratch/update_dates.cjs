const fs = require('fs');
const path = require('path');

const dir = './_GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

const now = new Date();
const dateString = "01 Maggio 2026, 15:20"; // Hardcoded for consistency with the user's request context

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove existing "Ultimo Aggiornamento" lines (case insensitive, allowing some variations)
    content = content.replace(/.*Ultimo Aggiornamento.*/gi, '').replace(/\n{3,}/g, '\n\n');
    
    // Split into lines
    let lines = content.split('\n');
    
    // Find the first line that is a header (starts with #)
    let headerIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('#')) {
            headerIndex = i;
            break;
        }
    }
    
    const updateLine = `> **Ultimo Aggiornamento:** ${dateString}`;
    
    if (headerIndex !== -1) {
        // Insert after header
        lines.splice(headerIndex + 1, 0, '', updateLine, '');
    } else {
        // Insert at very top
        lines.unshift(updateLine, '');
    }
    
    // Clean up multiple blank lines that might have been created
    let newContent = lines.join('\n').replace(/\n{3,}/g, '\n\n');
    
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated ${file}`);
});

