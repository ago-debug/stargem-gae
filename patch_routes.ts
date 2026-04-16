import fs from 'fs';
import path from 'path';

const routesPath = path.join(process.cwd(), 'server', 'routes.ts');
let content = fs.readFileSync(routesPath, 'utf8');

// 1. Add schemas to imports if missing
if (!content.includes('gemConversations')) {
  // Find first import from "@shared/schema"
  content = content.replace(
    /import\s+{([^}]+)}\s+from\s+["']@shared\/schema["'];/,
    (match, p1) => `import { gemConversations, gemMessages, memberUploads, ${p1.trim()} } from "@shared/schema";`
  );
}

// 2. Add AI Provider chunk inside routes
const AI_ROUTES = `
  // ==========================================
  // GEMCHAT ROUTES
  // ==========================================

  app.get("/api/gemchat/unread-counts", isAuthenticated, async (req, res) => {
    try {
      const allowedRoles = ["admin", "super admin", "operator", "direttivo", "back-office", "front-desk"];
      if (!req.user?.role || !allowedRoles.includes(req.user.role.toLowerCase())) {
        return res.status(403).json({ error: "Access denied" });
      }
      const [memberUnread] = await db.select({ count: sql<number>\`SUM(unread_team)\` })
        .from(gemConversations).where(eq(gemConversations.channel, "member"));
      const [staffUnread] = await db.select({ count: sql<number>\`SUM(unread_team)\` })
        .from(gemConversations).where(eq(gemConversations.channel, "staff"));
      
      res.json({ 
        member: Number(memberUnread?.count) || 0, 
        staff: Number(staffUnread?.count) || 0 
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch unread counts" });
    }
  });

  app.get("/api/gemchat/conversations", isAuthenticated, async (req, res) => {
    try {
      const allowedRoles = ["admin", "super admin", "operator", "direttivo", "back-office", "front-desk"];
      if (!req.user?.role || !allowedRoles.includes(req.user.role.toLowerCase())) {
        return res.status(403).json({ error: "Access denied" });
      }
      const { channel, status } = req.query;
      
      let conditions = [];
      if (channel) conditions.push(eq(gemConversations.channel, channel as "member" | "staff"));
      if (status) conditions.push(eq(gemConversations.status, status as "bot" | "human" | "closed"));
      
      const convs = await db.select({
        conversation: gemConversations,
        memberInfo: {
          id: members.id,
          firstName: members.firstName,
          lastName: members.lastName,
          cardNumber: members.cardNumber
        }
      })
      .from(gemConversations)
      .leftJoin(members, eq(gemConversations.participantId, members.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(gemConversations.lastMessageAt));
      
      res.json(convs);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/gemchat/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      await db.update(gemMessages)
        .set({ isRead: 1 })
        .where(
          and(
            eq(gemMessages.conversationId, id),
            sql\`sender_type != 'team'\`
          )
        );
        
      await db.update(gemConversations)
        .set({ unreadTeam: 0 })
        .where(eq(gemConversations.id, id));
        
      const msgs = await db.select()
        .from(gemMessages)
        .where(eq(gemMessages.conversationId, id))
        .orderBy(gemMessages.createdAt);
        
      res.json(msgs);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/gemchat/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const allowedRoles = ["admin", "super admin", "operator", "direttivo", "back-office", "front-desk"];
      if (!req.user?.role || !allowedRoles.includes(req.user.role.toLowerCase())) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const { content, attachment_url, attachment_name, attachment_size, quick_link_type, quick_link_id } = req.body;
      
      await db.insert(gemMessages).values({
        conversationId: id,
        senderType: "team",
        senderId: req.user.id.toString(),
        content,
        attachmentUrl: attachment_url,
        attachmentName: attachment_name,
        attachmentSize: attachment_size,
        quickLinkType: quick_link_type,
        quickLinkId: quick_link_id
      });
      
      const conv = await db.select().from(gemConversations).where(eq(gemConversations.id, id)).limit(1);
      if (conv[0]) {
        let newStatus = conv[0].status;
        let newAssignedTo = conv[0].assignedTo;
        
        if (newStatus === "bot") {
          newStatus = "human";
          newAssignedTo = req.user.id.toString();
        }
        
        await db.update(gemConversations).set({
          unreadParticipant: (conv[0].unreadParticipant || 0) + 1,
          lastMessageAt: new Date(),
          status: newStatus,
          assignedTo: newAssignedTo
        }).where(eq(gemConversations.id, id));
      }
      
      res.status(201).json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.post("/api/gemchat/bot-reply", isAuthenticated, async (req, res) => {
    try {
      const { conversation_id, member_message } = req.body;
      const conv = await db.select().from(gemConversations).where(eq(gemConversations.id, conversation_id)).limit(1);
      if (!conv.length) return res.status(404).json({ error: "Conversation not found" });
      
      const mbId = conv[0].participantId;
      const [memberRecord] = await db.select().from(members).where(eq(members.id, mbId)).limit(1);
      
      const memberContext = {
        memberId: mbId,
        name: \`\${memberRecord?.firstName || ''} \${memberRecord?.lastName || ''}\`.trim(),
        cardNumber: memberRecord?.cardNumber,
        cardStatus: memberRecord?.membershipStatus,
        cardExpiry: memberRecord?.membershipExpiryDate,
        activeEnrollments: [] 
      };
      
      const botContext = (conv[0].botContext as any[]) || [];
      
      const { generateTeobotReply } = await import("./utils/aiProvider.js");
      const { reply, handoff } = await generateTeobotReply(memberContext, botContext, member_message);
      
      await db.insert(gemMessages).values({
        conversationId: conversation_id,
        senderType: "bot",
        content: reply
      });
      
      botContext.push(
        { sender_type: 'member', content: member_message },
        { sender_type: 'bot', content: reply }
      );
      if (botContext.length > 10) botContext.splice(0, botContext.length - 10);
      
      let finalStatus = conv[0].status;
      if (handoff) {
         finalStatus = "human";
         const operators = await db.select().from(users).where(sql\`last_seen_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)\`);
         for (let op of operators) {
            await db.insert(teamNotifications).values({
               userId: op.id,
               title: "Nuova chat passata a operatore",
               message: \`Il tesserato \${memberContext.name} ha richiesto assistenza umana.\`,
               type: "chat_handoff",
               isRead: false
            });
         }
      }
      
      await db.update(gemConversations).set({
        botContext: botContext,
        status: finalStatus,
        lastMessageAt: new Date()
      }).where(eq(gemConversations.id, conversation_id));
      
      res.json({ reply, handoff });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Bot reply failed" });
    }
  });

  app.post("/api/gemchat/conversations", async (req, res) => {
    try {
      const { member_id, first_message } = req.body;
      const mems = await db.select().from(members).where(eq(members.id, member_id)).limit(1);
      if (!mems.length) return res.status(404).json({ error: "Member not found" });
      
      let [conv] = await db.select().from(gemConversations).where(
        and(eq(gemConversations.participantId, member_id), eq(gemConversations.channel, "member"))
      ).limit(1);
      
      let conversationId = conv?.id;
      if (!conv) {
        const [insertRes] = await db.insert(gemConversations).values({
           channel: "member",
           participantId: member_id,
           status: "bot",
           botContext: []
        });
        conversationId = insertRes.insertId;
        conv = { id: conversationId, status: "bot", botContext: [] } as any;
      }
      
      await db.insert(gemMessages).values({
        conversationId: conversationId,
        senderType: "member",
        content: first_message
      });
      
      let bot_reply = "Mi dispiace, non sono momentaneamente disponibile.";
      let handoff = false;
      try {
        const { generateTeobotReply } = await import("./utils/aiProvider.js");
        const memberContext = {
          memberId: member_id,
          name: \`\${mems[0].firstName} \${mems[0].lastName}\`.trim(),
          cardNumber: mems[0].cardNumber,
          cardStatus: mems[0].membershipStatus,
          cardExpiry: mems[0].membershipExpiryDate
        };
        const botContext = (conv.botContext as any[]) || [];
        const result = await generateTeobotReply(memberContext, botContext, first_message);
        bot_reply = result.reply;
        handoff = result.handoff;
        
        await db.insert(gemMessages).values({
          conversationId: conversationId,
          senderType: "bot",
          content: bot_reply
        });
        
        botContext.push(
          { sender_type: 'member', content: first_message },
          { sender_type: 'bot', content: bot_reply }
        );
        if (botContext.length > 10) botContext.splice(0, botContext.length - 10);
        
        if (handoff) {
           await db.update(gemConversations).set({ status: "human", botContext, lastMessageAt: new Date() }).where(eq(gemConversations.id, conversationId));
           const operators = await db.select().from(users).where(sql\`last_seen_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)\`);
           for (let op of operators) {
              await db.insert(teamNotifications).values({
                 userId: op.id,
                 title: "Handoff Chat", message: "Assistenza richiesta.", type: "chat_handoff", isRead: false
              });
           }
        } else {
           await db.update(gemConversations).set({ botContext, lastMessageAt: new Date() }).where(eq(gemConversations.id, conversationId));
        }
      } catch (e) {
         console.error("bot fail", e);
      }
      
      res.json({ conversationId, bot_reply, handoff });
    } catch (err) {
       console.error(err);
       res.status(500).json({ error: "Failed" });
    }
  });

  app.post("/api/gemchat/conversations/:id/messages/member", async (req, res) => {
     try {
        const id = parseInt(req.params.id);
        const { member_id, content, attachment_url, attachment_name } = req.body;
        
        const [conv] = await db.select().from(gemConversations).where(
           and(eq(gemConversations.id, id), eq(gemConversations.participantId, member_id))
        ).limit(1);
        if (!conv) return res.status(404).json({ error: "Conversation not found or mismatch" });
        
        const [insertRes] = await db.insert(gemMessages).values({
           conversationId: id,
           senderType: "member",
           content,
           attachmentUrl: attachment_url,
           attachmentName: attachment_name
        });
        
        const message_id = insertRes.insertId;
        
        if (conv.status === "human") {
           await db.update(gemConversations).set({
              unreadTeam: (conv.unreadTeam || 0) + 1,
              lastMessageAt: new Date()
           }).where(eq(gemConversations.id, id));
           return res.json({ message_id });
        }
        
        let bot_reply;
        try {
           const { generateTeobotReply } = await import("./utils/aiProvider.js");
           const [mems] = await db.select().from(members).where(eq(members.id, member_id)).limit(1);
           const memberContext = {
             memberId: member_id, name: \`\${mems.firstName} \${mems.lastName}\`, cardNumber: mems.cardNumber, cardStatus: mems.membershipStatus, cardExpiry: mems.membershipExpiryDate
           };
           const botContext = (conv.botContext as any[]) || [];
           const result = await generateTeobotReply(memberContext, botContext, content);
           bot_reply = result.reply;
           const handoff = result.handoff;
           
           await db.insert(gemMessages).values({ conversationId: id, senderType: "bot", content: bot_reply });
           botContext.push(
             { sender_type: 'member', content },
             { sender_type: 'bot', content: bot_reply }
           );
           if (botContext.length > 10) botContext.splice(0, botContext.length - 10);
           
           if (handoff) {
              await db.update(gemConversations).set({ status: "human", botContext, lastMessageAt: new Date(), unreadTeam: (conv.unreadTeam || 0) + 1 }).where(eq(gemConversations.id, id));
           } else {
              await db.update(gemConversations).set({ botContext, lastMessageAt: new Date() }).where(eq(gemConversations.id, id));
           }
        } catch(e) {}
        
        res.json({ message_id, bot_reply });
     } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed" });
     }
  });
`;

// Replace the COPILOT part
const oldRegex = /\/\/\s*==========================================\n\s*\/\/\s*COPILOT AI STUB\n\s*\/\/\s*==========================================\n\s*app\.post\("\/api\/copilot\/generate-note"[\s\S]*?(?=\n\s*\/\/ ==========================================|\n\s*app\.(get|post|delete|patch))/;

if (oldRegex.test(content)) {
  content = content.replace(oldRegex, AI_ROUTES);
  fs.writeFileSync(routesPath, content, 'utf8');
  console.log("Routes injected successfully!");
} else {
  // Se non trovato, proviamo a un append in fondo prima di EOF o prima di createServer.
  content = content + "\n" + AI_ROUTES;
  fs.writeFileSync(routesPath, content, 'utf8');
  console.log("Could not find COPILOT STUB! Appended at EOF instead.");
}
