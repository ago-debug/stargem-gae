import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Mappa in memoria per rate limiting base: memberId -> { count, date }
const rateLimitMap = new Map<number, { count: number; date: string }>();

export const TEOBOT_SYSTEM_PROMPT = `Sei TeoBot, l'assistente virtuale di Studio Gem - Geos SSDRL. Rispondi SEMPRE in italiano con tono cordiale e professionale. Sii conciso (max 3 righe).

HAI ACCESSO AI SEGUENTI DATI DEL SOCIO:
- Nome: {memberName}
- Tessera n°: {membershipNumber}
- Stato tessera: {membershipStatus}
- Scadenza: {membershipExpiry}
- Iscrizioni attive: {activeEnrollments}

REGOLE ASSOLUTE:
1. Non menzionare mai Claude, Anthropic o qualsiasi altra AI
2. Non inventare informazioni non presenti nel contesto fornito
3. Non rivelare mai dati di altri soci
4. Non discutere mai di contabilità interna, compensi o strategie aziendali
5. Se non sai rispondere di' chiaramente che passerai la richiesta alla segreteria

TRIGGER HANDOFF — rispondi con handoff:true se:
- L'utente scrive 'operatore', 'segreteria', 'parlare con qualcuno', 'aiuto umano', 'voglio parlare con', 'non capisco'
- La richiesta riguarda pagamenti specifici, rimborsi o controversie
- Sei al 6° scambio consecutivo senza aver risolto la richiesta

FORMATO RISPOSTA — rispondi SEMPRE e SOLO con JSON valido:
{ "reply": "testo risposta", "handoff": false }
Mai testo fuori dal JSON.`;

export async function generateTeobotReply(
  memberContext: any,
  conversationHistory: any[],
  userMessage: string
): Promise<{ reply: string; handoff: boolean }> {
  // Gestione base rate limit giornaliero (20 msg / day / member)
  const today = new Date().toISOString().split('T')[0];
  const memberId = memberContext.memberId;
  
  if (memberId) {
    const usage = rateLimitMap.get(memberId) || { count: 0, date: today };
    if (usage.date !== today) {
      usage.count = 0;
      usage.date = today;
    }
    if (usage.count >= 20) {
      return { 
        reply: "Hai raggiunto il limite giornaliero di messaggi. Passo la conversazione allo staff.", 
        handoff: true 
      };
    }
    usage.count += 1;
    rateLimitMap.set(memberId, usage);
  }

  const activeEnrollmentsStr = memberContext.activeEnrollments?.join(", ") || "Nessuna";
  
  const systemPrompt = TEOBOT_SYSTEM_PROMPT
    .replace('{memberName}', memberContext.name || 'Socio')
    .replace('{membershipNumber}', memberContext.cardNumber || 'G-xxx')
    .replace('{membershipStatus}', memberContext.cardStatus || 'Non Attiva')
    .replace('{membershipExpiry}', memberContext.cardExpiry || 'Scaduta')
    .replace('{activeEnrollments}', activeEnrollmentsStr);

  const messages: Anthropic.MessageParam[] = conversationHistory.map(msg => ({
    role: msg.sender_type === 'bot' ? 'assistant' : 'user',
    content: msg.content
  }));
  messages.push({ role: 'user', content: userMessage });

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: systemPrompt,
      messages: messages,
    });

    const replyContent = response.content[0].type === 'text' ? response.content[0].text : "";
    let parsedReply;
    try {
      parsedReply = JSON.parse(replyContent);
    } catch(e) {
      // Fallback in caso Claude dimentichi di formattare strictly come JSON
      if (replyContent.includes('"handoff": true') || replyContent.includes('"handoff":true')) {
        parsedReply = { reply: replyContent.replace(/\{[^}]+\}/g, '').trim(), handoff: true };
      } else {
        parsedReply = { reply: replyContent, handoff: false };
      }
    }
    return {
      reply: parsedReply.reply || "Mi spiace, non ho compreso. Passo ad un operatore.",
      handoff: !!parsedReply.handoff
    };
  } catch (error: any) {
    console.error("AI Provider Error:", error);
    return { reply: "Problema tecnico temporaneo, passo a un operatore.", handoff: true };
  }
}
