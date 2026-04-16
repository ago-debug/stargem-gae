import fs from 'fs';
import path from 'path';

const routesPath = path.join(process.cwd(), 'server', 'routes.ts');
let content = fs.readFileSync(routesPath, 'utf8');

const NEW_BLOCK = `

  // ==========================================
  // AREA TESSERATI (B2C)
  // ==========================================

  const docUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Formato file non supportato. Solo PDF, JPG, PNG."));
      }
    }
  });

  app.get("/api/area-tesserati/profile", isAuthenticated, async (req, res) => {
    try {
      const allowedRoles = ["client", "admin", "super admin"];
      if (!req.user?.role || !allowedRoles.includes(req.user.role.toLowerCase())) {
        return res.status(403).json({ error: "Access denied" });
      }

      const [member] = await db.select().from(members).where(eq(members.userId, req.user.id.toString())).limit(1);
      if (!member) {
        return res.status(404).json({ error: "Profilo non collegato" });
      }

      const memberEnrollments = await db.select({
        corsoNome: courses.name,
        giorno: courses.dayOfWeek,
        orarioInizio: courses.startTime,
        orarioFine: courses.endTime,
        studio: courses.studioId,
        stato: enrollments.status
      })
      .from(enrollments)
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.memberId, member.id));

      const memberPayments = await db.select()
        .from(payments)
        .where(eq(payments.memberId, member.id))
        .orderBy(desc(payments.dueDate))
        .limit(5);

      const docs = await db.select()
        .from(memberUploads)
        .where(eq(memberUploads.memberId, member.id))
        .orderBy(desc(memberUploads.uploadedAt));
        
      const docMapped = docs.map(d => ({ tipo: d.documentType, stato: d.verifiedAt ? 'Verificato' : 'In attesa', data: d.uploadedAt }));

      const profile = {
        member: {
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          phone: member.mobile || member.phone,
          fiscalCode: member.fiscalCode
        },
        tessera: {
          numero: member.cardNumber,
          stato: member.active ? "Attiva" : "Scaduta",
          scadenza: member.cardExpiryDate,
          tipo: member.subscriptionTypeId
        },
        iscrizioni: memberEnrollments.map(e => ({
          corsoNome: e.corsoNome,
          giorno: e.giorno,
          orario: \`\${e.orarioInizio || ''} - \${e.orarioFine || ''}\`.trim(),
          studio: e.studio,
          stato: e.stato
        })),
        documenti: docMapped,
        pagamenti: memberPayments
      };

      res.json(profile);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/area-tesserati/upload-documento", isAuthenticated, docUpload.single("file"), async (req, res) => {
    try {
      const allowedRoles = ["client", "admin", "super admin"];
      if (!req.user?.role || !allowedRoles.includes(req.user.role.toLowerCase())) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (!req.file) return res.status(400).json({ error: "Nessun file inviato" });

      const [member] = await db.select().from(members).where(eq(members.userId, req.user.id.toString())).limit(1);
      if (!member) return res.status(404).json({ error: "Profilo non collegato" });

      const documentType = req.body.document_type || "altro";
      const timestamp = Date.now();
      const safeFilename = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filename = \`\${timestamp}_\${safeFilename}\`;
      const uploadDir = path.join(process.cwd(), 'uploads', 'members', member.id.toString());

      import("fs").then(fsMod => {
        if (!fsMod.existsSync(uploadDir)) {
          fsMod.mkdirSync(uploadDir, { recursive: true });
        }
        fsMod.writeFileSync(path.join(uploadDir, filename), req.file!.buffer);
      });

      const fileUrl = \`/uploads/members/\${member.id}/\${filename}\`;

      const [insertRes] = await db.insert(memberUploads).values({
        memberId: member.id,
        documentType: documentType as any,
        filename: filename,
        fileUrl: fileUrl,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      });

      res.json({
        id: insertRes.insertId,
        filename: filename,
        file_url: fileUrl
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to upload" });
    }
  });

  app.get("/api/area-tesserati/documenti", isAuthenticated, async (req, res) => {
    try {
      const allowedRoles = ["client", "admin", "super admin"];
      if (!req.user?.role || !allowedRoles.includes(req.user.role.toLowerCase())) {
        return res.status(403).json({ error: "Access denied" });
      }

      const [member] = await db.select().from(members).where(eq(members.userId, req.user.id.toString())).limit(1);
      if (!member) return res.status(404).json({ error: "Profilo non collegato" });

      const uploads = await db.select()
        .from(memberUploads)
        .where(eq(memberUploads.memberId, member.id));

      const { memberFormsSubmissions } = await import('@shared/schema');
      let forms: any[] = [];
      try {
        forms = await db.select().from(memberFormsSubmissions).where(eq(memberFormsSubmissions.memberId, member.id));
      } catch (e) {}

      const unified: any[] = [];

      for (const f of forms) {
        unified.push({
          id: f.id,
          tipo: f.formType,
          label_italiana: \`Modulo \${f.formType}\`,
          stato: "Firmato",
          data: f.submittedAt,
          download_url: f.documentUrl || \`/api/gempass/firme/download/\${f.id}\`
        });
      }

      for (const u of uploads) {
        unified.push({
          id: u.id,
          tipo: u.documentType,
          label_italiana: u.documentType.replace(/_/g, ' '),
          stato: u.verifiedAt ? "Verificato" : "In elaborazione",
          data: u.uploadedAt,
          download_url: u.fileUrl
        });
      }

      unified.sort((a, b:any) => new Date(b.data || 0).getTime() - new Date(a.data || 0).getTime());

      res.json(unified);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  });
`;

if (!content.includes('AREA TESSERATI (B2C)')) {
  content = content.replace(/\/\/ ==========================================\n\s*\/\/ GEMCHAT ROUTES\n\s*\/\/ ==========================================/g, NEW_BLOCK + '\n\n  // ==========================================\n  // GEMCHAT ROUTES\n  // ==========================================');
}

if (!content.includes("app.use('/uploads'")) {
  content = content.replace(
    /app\.use\(express\.json\({ limit: '50mb' }\)\);/g,
    "app.use(express.json({ limit: '50mb' }));\n  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));"
  );
}

fs.writeFileSync(routesPath, content, 'utf8');
console.log('Area tesserati routes patched');
