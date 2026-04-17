const fs = require("fs");
let code = fs.readFileSync("server/routes.ts", "utf8");

// Patch per Dipendenti
if (!code.includes("app.patch(\"/api/gemteam/dipendenti/:id\"")) {
    const target = "app.post(\"/api/gemteam/turni/apply-template\",";
    const insertion = `  app.patch("/api/gemteam/dipendenti/:id", isAuthenticated, isMasterGuard, async (req, res) => {
    try {
      const { team, displayOrder } = req.body;
      const id = parseInt(req.params.id);
      let updateData = {};
      if (team !== undefined) updateData.team = team;
      if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
      
      if (Object.keys(updateData).length > 0) {
        await db.update(schema.teamEmployees).set(updateData).where(eq(schema.teamEmployees.id, id));
      }
      return res.json({ success: true });
    } catch(err) {
      return res.status(500).json({ error: "Errore salvataggio" });
    }
  });\n\n`;
    code = code.replace(target, insertion + target);
}

// Patch per Postazioni
code = code.replace(
  /app\.post\("\/api\/gemteam\/postazioni", isAuthenticated, isMasterGuard, async \(req, res\) => \{(?:.|\n)*?return res\.json\(\{ success: true \}\);\n  \}\);/,
  `app.post("/api/gemteam/postazioni", isAuthenticated, isMasterGuard, async (req, res) => {
    try {
      const { nome, contaOre, attiva, colore } = req.body;
      if (!nome) return res.status(400).json({ error: 'Nome obbligatorio' });
      await db.insert(schema.teamPostazioni).values({
        nome,
        contaOre: contaOre ?? true,
        attiva: attiva ?? true,
        colore: colore || 'var(--indigo-50)',
        ordine: 99
      });
      return res.json({ success: true });
    } catch(err) {
      return res.status(500).json({ error: 'Errore' });
    }
  });`
);

fs.writeFileSync("server/routes.ts", code);
