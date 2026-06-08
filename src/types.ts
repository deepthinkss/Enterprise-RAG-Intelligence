export type SecurityRole = 'Admin' | 'HR' | 'Engineering' | 'Support';

export interface UserPersona {
  id: string;
  name: string;
  email: string;
  role: SecurityRole;
  department: string;
  clearanceLevel: number; // 1 to 5
  avatar: string;
}

export type SiloType = 'Document' | 'Database' | 'JSONLogs' | 'Compliance';

export interface EnterpriseDocument {
  id: string;
  title: string;
  silo: SiloType;
  format: 'PDF' | 'SQL' | 'CSV' | 'JSON' | 'Report';
  content: string; // Plaintext content or JSON representation
  requiredRole: SecurityRole[];
  minClearanceLevel: number;
  tags: string[];
  referenceMeta: {
    author?: string;
    date?: string;
    version?: string;
    siloPath?: string;
  };
}

export interface UserSession {
  token: string;
  user: UserPersona;
  issuedAt: string;
  expiresAt: string;
}

export interface RetrievalChunk {
  documentId: string;
  title: string;
  silo: SiloType;
  format: string;
  content: string;
  relevanceScore: number;
}

export interface QueryTraceStep {
  id: string;
  label: string;
  status: 'success' | 'warning' | 'error' | 'info';
  details: string;
  timestamp: string;
}

export interface RagResponse {
  answer: string;
  confidenceScore: number; // 0.0 - 1.0 based on factual grounding
  citations: {
    id: string;
    title: string;
    silo: SiloType;
    snippet: string;
  }[];
  trace: {
    parsedKeywords: string[];
    roleEvaluated: SecurityRole;
    clearancePassed: boolean;
    sourcesEvaluatedCount: number;
    sourcesRetrievedCount: number;
    blockedSourcesCount: number;
    steps: QueryTraceStep[];
  };
}
