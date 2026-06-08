import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { USER_PERSONAS, ENTERPRISE_DOCUMENTS } from './src/data.js';
import { EnterpriseDocument, QueryTraceStep, RagResponse } from './src/types.js';

// Setup environment and secrets
const apiKey = process.env.GEMINI_API_KEY || '';

// Lazy initialization of GoogleGenAI as required by the guidelines
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      console.warn('WARNING: GEMINI_API_KEY is not set or uses the dummy value.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Memory database for documents to support document additions during runtime
let liveDocuments: EnterpriseDocument[] = [...ENTERPRISE_DOCUMENTS];

const app = express();
app.use(express.json());

const PORT = 3000;

// --- API ROUTES ---

// 1. Get all personas
app.get('/api/personas', (req: Request, res: Response) => {
  res.json(USER_PERSONAS);
});

// 2. Get active workspace documents under active RBAC mask
app.get('/api/documents', (req: Request, res: Response) => {
  const personaId = req.query.personaId as string;
  const user = USER_PERSONAS.find(p => p.id === personaId);

  if (!user) {
    // If no persona selected, return metadata only (mask content)
    const masked = liveDocuments.map(doc => ({
      ...doc,
      content: '[MASKED - Please authenticate with a secure enterprise persona to view content]',
      isAuthorized: false,
    }));
    return res.json(masked);
  }

  // Iterate and check authorization
  const outcome = liveDocuments.map(doc => {
    const roleMatch = doc.requiredRole.includes(user.role);
    const clearanceMatch = user.clearanceLevel >= doc.minClearanceLevel;
    const isAuthorized = roleMatch && clearanceMatch;

    return {
      ...doc,
      content: isAuthorized ? doc.content : `[RESTRICTED] Level ${doc.minClearanceLevel} security clearance in department ${doc.requiredRole.join('/')} is required. Your clearance: Level ${user.clearanceLevel} (${user.role}).`,
      isAuthorized,
    };
  });

  res.json(outcome);
});

// 3. Add a synthetic document
app.post('/api/documents', (req: Request, res: Response) => {
  const { title, silo, format, content, requiredRole, minClearanceLevel, tags, author } = req.body;

  if (!title || !silo || !format || !content || !requiredRole || !minClearanceLevel) {
    return res.status(400).json({ error: 'Missing required configuration fields' });
  }

  const newDoc: EnterpriseDocument = {
    id: `doc-custom-${Date.now()}`,
    title,
    silo,
    format,
    content,
    requiredRole: Array.isArray(requiredRole) ? requiredRole : [requiredRole],
    minClearanceLevel: Number(minClearanceLevel),
    tags: Array.isArray(tags) ? tags : [],
    referenceMeta: {
      author: author || 'Enterprise Simulation Ingestion',
      date: new Date().toISOString().split('T')[0],
      version: '1.0',
      siloPath: `siles/${silo.toLowerCase()}/custom/${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${format.toLowerCase()}`,
    },
  };

  liveDocuments.push(newDoc);
  res.status(201).json(newDoc);
});

// 4. Reset document list
app.post('/api/documents/reset', (req: Request, res: Response) => {
  liveDocuments = [...ENTERPRISE_DOCUMENTS];
  res.json({ message: 'Enterprise database reset successfully', count: liveDocuments.length });
});

// Helper keyword matching
function simpleKeywordMatch(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

// Extract keywords from string
function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !['what', 'where', 'when', 'from', 'with', 'this', 'that', 'your', 'about', 'some', 'were', 'have', 'there'].includes(word));
}

// 5. Context-Aware Secure RAG Executer
app.post('/api/query', async (req: Request, res: Response) => {
  const { query, personaId } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query string is required' });
  }

  const user = USER_PERSONAS.find(p => p.id === personaId);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: User persona context must be selected' });
  }

  const timestamp = () => new Date().toISOString().slice(11, 19);
  const steps: QueryTraceStep[] = [];

  // Step 1: User Verification
  steps.push({
    id: 'step-auth',
    label: 'Authentication & Token Verification',
    status: 'success',
    details: `Context active: ${user.name} (${user.email}). Extracted cryptographic credentials: ROLE=${user.role}, DEPARTMENT=${user.department}, CLEARANCE_LEVEL=${user.clearanceLevel}.`,
    timestamp: timestamp(),
  });

  // Step 2: Query Analysis & Target Silos Routing
  const keywords = extractKeywords(query);
  steps.push({
    id: 'step-routing',
    label: 'Query Analysis & Routing',
    status: 'info',
    details: `Analyzing query: "${query}". Detected key entities: [${keywords.join(', ') || 'General'}]. Routing search pipeline to all 4 metadata silos.`,
    timestamp: timestamp(),
  });

  // Search through all live documents
  let matchingDocsList = liveDocuments;
  if (keywords.length > 0) {
    matchingDocsList = liveDocuments.filter(doc => {
      const matchTitle = simpleKeywordMatch(doc.title, keywords);
      const matchContent = simpleKeywordMatch(doc.content, keywords);
      const matchTags = doc.tags.some(t => keywords.some(kw => t.toLowerCase().includes(kw)));
      const matchSilo = keywords.some(kw => doc.silo.toLowerCase().includes(kw));
      return matchTitle || matchContent || matchTags || matchSilo;
    });
  }

  steps.push({
    id: 'step-match',
    label: 'Index Retrieval',
    status: matchingDocsList.length > 0 ? 'success' : 'warning',
    details: `Keyword index identified ${matchingDocsList.length} candidate document(s) matching enterprise records.`,
    timestamp: timestamp(),
  });

  // Step 3: RBAC Enforcement Filter
  const allowedDocs: EnterpriseDocument[] = [];
  const blockedDocs: EnterpriseDocument[] = [];

  for (const doc of matchingDocsList) {
    const roleMatch = doc.requiredRole.includes(user.role);
    const clearanceMatch = user.clearanceLevel >= doc.minClearanceLevel;

    if (roleMatch && clearanceMatch) {
      allowedDocs.push(doc);
    } else {
      blockedDocs.push(doc);
    }
  }

  if (blockedDocs.length > 0) {
    steps.push({
      id: 'step-rbac',
      label: 'Rule-Based Access Control Audit',
      status: 'warning',
      details: `Enforced strict RBAC: Blocked ${blockedDocs.length} record(s) due to insufficient clearance. Failed policies: ${blockedDocs.map(d => `${d.id} (Requires: ${d.requiredRole.join('/')} Lvl ${d.minClearanceLevel})`).join(', ')}.`,
      timestamp: timestamp(),
    });
  } else {
    steps.push({
      id: 'step-rbac',
      label: 'Rule-Based Access Control Audit',
      status: 'success',
      details: `Enforced strict RBAC: Passed clear. No unauthorized document accesses registered for query scope.`,
      timestamp: timestamp(),
    });
  }

  // Formatting allowed records for RAG context
  const contextText = allowedDocs
    .map((doc, idx) => `[Source ${idx + 1}: ${doc.id}]\nTitle: ${doc.title}\nSilo: ${doc.silo}\nFormat: ${doc.format}\nContent: ${doc.content}`)
    .join('\n\n---\n\n');

  steps.push({
    id: 'step-grounding',
    label: 'Context Selection & Framing',
    status: allowedDocs.length > 0 ? 'success' : 'warning',
    details: `Assembled ${allowedDocs.length} secure document chunks into context prompt payload. Total payload size: ~${contextText.length} characters.`,
    timestamp: timestamp(),
  });

  // Step 4: AI synthesis via Gemini API or polite fallback refusal if no access
  let answerText = '';
  let aiConfidence = 0.0;
  const citations: any[] = [];

  if (allowedDocs.length === 0) {
    // Elegant fallback warning if there is blocked content
    if (blockedDocs.length > 0) {
      answerText = `ACCESS RESTRICTED: Your request triggered an automated Security Firewall flag.

The query contains subjects residing inside highly confidential enterprise records (specifically, matching ${blockedDocs.map(d => `"${d.title}"`).join(', ')}). Under Security Governance Regulation SEC-2026, access is strictly limited to role **${blockedDocs.map(d => d.requiredRole.join(' or ')).join(', ')}** with Security Clearance **Level ${Math.max(...blockedDocs.map(d => d.minClearanceLevel))}+**.

Your current credentials:
- Role classification: **${user.role}**
- Clearance rating: **Level ${user.clearanceLevel}** (${user.department})

To query this information, please contact Chief Security Architect Alex Mercer to initiate a Clearance Level Upgrade requests ticket.`;
      aiConfidence = 1.0;
    } else {
      answerText = `No matching documents were found in the enterprise silos matching your search terms: ${keywords.join(', ') || query}. Please verify if you spelled keywords correctly or choose a broader query. You can also seed new synthetic records using the Ingestion Console above.`;
      aiConfidence = 0.5;
    }

    steps.push({
      id: 'step-synthesis',
      label: 'Grounded Answer Generation',
      status: 'success',
      details: `Generated security protection response locally. Gemini prompt invocation skipped to optimize token charges and security boundary integrity.`,
      timestamp: timestamp(),
    });
  } else {
    try {
      steps.push({
        id: 'step-gemini',
        label: 'Invoking Gemini AI Orchestrator',
        status: 'info',
        details: `Calling gemini-3.5-flash with secure context payloads to run multi-source reasoning.`,
        timestamp: timestamp(),
      });

      const ai = getAiClient();

      const systemInstruction = `You are an executive enterprise Retrieval-Augmented Generation assistant on Nexatech Cloud Systems.
Your job is to provide factual, highly precise grounded responses to employee queries using ONLY the provided verified context.

Guidelines:
1. Grounding constraint: Do NOT look up external facts or fabricate information. If the provided context does not contain enough info, state clearly what is missing and what is present.
2. Citation requirement: You must cite your sources when summarizing details. Every time you mention a fact from a source, add its official identifier in square brackets, e.g. [doc-hr-compensation] or [doc-db-employees].
3. Confidence Assessment: Evaluate the reliability of your answer based strictly on the factual coverage of the supplied documents.
4. Formatting: Keep your tone professional, concise, objective, and scannable. Use markdown bolding and lists to format tables or logs when summarizing.
5. In addition to the explanatory answer, you MUST specify a GROUNDING_CONFIDENCE score between 0.0 and 1.0 at the end of your response using the tag: "CONFIDENCE: [score]" where [score] is your estimated confidence based on grounding quality.`;

      const promptPayLoad = `USER ROLE: ${user.role} (Clearance Level: ${user.clearanceLevel})
USER QUERY: ${query}

AUTHORIZED DATASETS CONTEXT:
${contextText || 'No documents available.'}

Generate your factual response:`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: promptPayLoad,
        config: {
          systemInstruction,
          temperature: 0.2, // low temperature for high reliability and low hallucination
        },
      });

      const fullOutput = response.text || '';

      // Clean up final confidence score tag
      let parsedConfidence = 0.85; // baseline default
      const confidenceMatch = fullOutput.match(/CONFIDENCE:\s*(0\.\d+|1\.0|1)/i);
      if (confidenceMatch) {
        parsedConfidence = parseFloat(confidenceMatch[1]);
      }

      // Strip the confidence tag from visual text
      answerText = fullOutput.replace(/CONFIDENCE:\s*(0\.\d+|1\.0|1)/i, '').trim();
      aiConfidence = parsedConfidence;

      // Extract citation mapping
      allowedDocs.forEach(doc => {
        if (answerText.includes(doc.id) || query.toLowerCase().includes(doc.silo.toLowerCase())) {
          citations.push({
            id: doc.id,
            title: doc.title,
            silo: doc.silo,
            snippet: doc.content.substring(0, 150) + '...',
          });
        }
      });

      // If no explicit citation parsed but document used, auto add
      if (citations.length === 0 && allowedDocs.length > 0) {
        citations.push({
          id: allowedDocs[0].id,
          title: allowedDocs[0].title,
          silo: allowedDocs[0].silo,
          snippet: allowedDocs[0].content.substring(0, 150) + '...',
        });
      }

      steps.push({
        id: 'step-synthesis',
        label: 'Grounded Answer Generation',
        status: 'success',
        details: `Gemini generated grounded answer with ${Math.round(aiConfidence * 100)}% confidence and ${citations.length} verifyable citations. Output parsed successfully.`,
        timestamp: timestamp(),
      });

    } catch (err: any) {
      console.error('Error invoking Gemini:', err);
      // Fallback local response in case key fails
      answerText = `[GEMINI SERVICE UNAVAILABLE - LOCAL FALLBACK RESPONSE]
Based on your authorized active documents:
${allowedDocs.map(d => `- **${d.title}**: ${d.content.split('\n')[0]}`).join('\n')}

For full deep answers and citations, please make sure the GEMINI_API_KEY is configured in the Cloud Run container or AI Studio Secrets panel.`;
      aiConfidence = 0.7;

      allowedDocs.forEach(doc => {
        citations.push({
          id: doc.id,
          title: doc.title,
          silo: doc.silo,
          snippet: doc.content.substring(0, 150) + '...',
        });
      });

      steps.push({
        id: 'step-gemini-error',
        label: 'Gemini Execution Handlers',
        status: 'warning',
        details: `Gemini API call failed (${err.message}). Recovered gracefully via client-side local database fallback.`,
        timestamp: timestamp(),
      });
    }
  }

  // Return full interactive RAG payload
  const responseData: RagResponse = {
    answer: answerText,
    confidenceScore: aiConfidence,
    citations,
    trace: {
      parsedKeywords: keywords,
      roleEvaluated: user.role,
      clearancePassed: allowedDocs.length > 0,
      sourcesEvaluatedCount: matchingDocsList.length,
      sourcesRetrievedCount: allowedDocs.length,
      blockedSourcesCount: blockedDocs.length,
      steps,
    },
  };

  res.json(responseData);
});

// --- PLATFORM INJECTED DEV HOSTING AND INDEX INGRESS FALLBACK ---

async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is booted! Running on http://localhost:${PORT}`);
  });
}

bootstrap();
