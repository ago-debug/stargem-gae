const fs = require('fs');

const routesPath = 'server/routes.ts';
let content = fs.readFileSync(routesPath, 'utf8');

const routeCode = `
  // NUOVA ROUTE: Export unificato con streaming ExcelJS
  app.post("/api/export", isAuthenticated, async (req, res) => {
    try {
      const { table, columns, filters, format } = req.body;
      if (!table || !columns || !Array.isArray(columns) || columns.length === 0) {
        return res.status(400).json({ error: "Tabella e colonne richieste." });
      }

      let rawData: any[] = [];
      
      switch (table) {
        case "members":
          const membersRes = await storage.getMembersWithFilters(filters || { page: 1, pageSize: 999999 });
          rawData = membersRes.members;
          break;
        case "payments":
          rawData = await storage.getPayments();
          break;
        case "enrollments":
          rawData = await storage.getEnrollments();
          break;
        case "memberships":
          rawData = await storage.getMemberships();
          break;
        case "courses":
          rawData = await storage.getCourses();
          break;
        case "workshops":
          rawData = await storage.getWorkshops();
          break;
        case "gemteam":
          // Fallback, usually gemteam uses a dedicated report
          rawData = await storage.getUsers();
          break;
        default:
          return res.status(400).json({ error: "Tabella non supportata per l'esportazione server-side." });
      }

      // Format data
      const formattedData = rawData.map(row => {
        const obj: any = {};
        columns.forEach((key: string) => {
          // Flatten standard object properties
          obj[key] = row[key];
        });
        return obj;
      });

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', \`attachment; filename="\${table}_export.csv"\`);
        
        // Use Papaparse if available, else simple fallback
        const headerRow = columns.join(",") + "\\n";
        res.write("\\ufeff" + headerRow);
        
        for (const row of formattedData) {
          const line = columns.map((col: string) => {
            let val = row[col] === null || row[col] === undefined ? "" : String(row[col]);
            if (val.includes(',') || val.includes('"') || val.includes('\\n')) {
              val = \`"\${val.replace(/"/g, '""')}"\`;
            }
            return val;
          }).join(",");
          res.write(line + "\\n");
        }
        res.end();
      } else {
        // XLSX Streaming
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', \`attachment; filename="\${table}_export.xlsx"\`);
        
        let ExcelJS;
        try { ExcelJS = (await import('exceljs')).default || await import('exceljs'); } 
        catch(e) { ExcelJS = require('exceljs'); }

        const options = {
          stream: res,
          useStyles: true,
          useSharedStrings: true
        };
        const workbook = new ExcelJS.stream.xlsx.WorkbookWriter(options);
        const worksheet = workbook.addWorksheet('Export');
        
        worksheet.columns = columns.map((col: string) => ({ header: col, key: col, width: 20 }));
        
        for (const row of formattedData) {
          worksheet.addRow(row).commit();
        }
        
        worksheet.commit();
        await workbook.commit();
        // The res is automatically ended by ExcelJS
      }
    } catch (e: any) {
      console.error("Export error:", e);
      if (!res.headersSent) {
        res.status(500).json({ error: e.message || "Internal Server Error" });
      } else {
        res.end();
      }
    }
  });

  return httpServer;
`;

content = content.replace(/return httpServer;\s*$/, routeCode);
fs.writeFileSync(routesPath, content);
