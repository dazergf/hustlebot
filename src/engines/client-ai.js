import { kiloChat, extractJson } from './kilo-client.js';

export async function classifyMessage(message, gigContext) {
  const { content } = await kiloChat([
    {
      role: 'system',
      content: 'You manage freelance client communications. Respond ONLY in JSON.',
    },
    {
      role: 'user',
      content: `Classify this message and decide the best action.

CLIENT MESSAGE:
"${message.from}: ${message.preview}"

GIG CONTEXT:
${gigContext ? `Title: ${gigContext.title}\nBudget: ${gigContext.budget}\nStatus: ${gigContext.state}` : 'No gig context available'}

Respond ONLY in JSON:
{
  "intent": "question" | "revision_request" | "approval" | "payment" | "greeting" | "scope_change" | "deadline" | "other",
  "urgency": "low" | "medium" | "high",
  "autoReplyOk": true | false,
  "suggestedReply": "<draft reply if autoReplyOk is true, or suggested reply for human review>",
  "escalate": true | false,
  "reason": "<why you made this decision>"
}`,
    },
  ], { task: 'classify', temperature: 0.2, max_tokens: 500 });

  try {
    const parsed = extractJson(content);
    if (parsed) return parsed;
  } catch {}
  return { intent: 'other', urgency: 'medium', autoReplyOk: false, suggestedReply: '', escalate: true, reason: 'Could not classify' };
}

export async function generateClientReply(message, gigContext, profile) {
  const { content } = await kiloChat([
    {
      role: 'system',
      content: 'You are a freelancer responding to a client message. Output ONLY the reply text.',
    },
    {
      role: 'user',
      content: `You are ${profile?.name || 'a freelancer'} responding to a client message on a freelance platform.

YOUR PROFILE:
- Name: ${profile?.name || 'Freelancer'}
- Title: ${profile?.title || 'Developer'}
- Skills: ${profile?.skills?.join(', ') || 'Various'}
- Preferred language: ${profile?.preferred_language || 'English'}
- Languages: ${profile?.languages?.join(', ') || 'Not specified'}

GIG: ${gigContext?.title || 'Unknown project'}
STATUS: ${gigContext?.state || 'Active'}

CLIENT MESSAGE: "${message.preview || message}"

Write a professional, helpful, concise reply. Be friendly but specific.
- If they asked a question, answer it directly
- If they want a status update, give a brief progress report
- If they need clarification, ask a specific question
- Keep it under 100 words
- Sound human, not robotic

Output ONLY the reply text, nothing else.`,
    },
  ], { task: 'clientReply', temperature: 0.6, max_tokens: 300 });

  return content.trim();
}

export async function reviewDelivery(deliverables, gigContext) {
  const { content } = await kiloChat([
    {
      role: 'system',
      content: 'You are a senior QA reviewer. Respond ONLY in JSON.',
    },
    {
      role: 'user',
      content: `Review these deliverables before sending to a client.

GIG: ${gigContext.title}
DESCRIPTION: ${gigContext.description?.substring(0, 500)}
DELIVERABLES: ${JSON.stringify(deliverables).substring(0, 2000)}

Review and respond in JSON:
{
  "quality": "ready" | "needs_fixes" | "major_issues",
  "score": <0-100>,
  "issues": ["<issue1>", "<issue2>"],
  "fixes_needed": ["<fix1>", "<fix2>"],
  "client_message": "<suggested delivery message to client>"
}`,
    },
  ], { task: 'review', temperature: 0.2, max_tokens: 800 });

  try {
    const parsed = extractJson(content);
    if (parsed) return parsed;
  } catch {}
  return { quality: 'needs_fixes', score: 50, issues: ['Could not review'], fixes_needed: [], client_message: '' };
}
