import xlsx from 'xlsx';

function checkCol(file) {
    const wb = xlsx.readFile(file, { cellStyles: true });
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    
    // Column AD is index 29 (0-based)
    const adCell = sheet['AD1'];
    console.log(`\nFile: ${file}`);
    console.log(`Header AD: ${adCell ? adCell.v : 'undefined'}`);
    
    // Let's also print some headers around AD
    const range = xlsx.utils.decode_range(sheet['!ref']);
    for(let c = 25; c <= 35; c++) {
        let cellAddr = xlsx.utils.encode_cell({r:0, c:c});
        let cell = sheet[cellAddr];
        console.log(`Col ${xlsx.utils.encode_col(c)}: ${cell ? cell.v : 'undefined'}`);
    }
}

checkCol('temp_import/estrap_20260415_ElencoIscrizioni.xlsx');
checkCol('temp_import/estrap_20260417_estrapolazione_Master_per_importazione_Bitrix.xlsx');
