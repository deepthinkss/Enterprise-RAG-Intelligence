import { UserPersona, EnterpriseDocument } from './types';

export const USER_PERSONAS: UserPersona[] = [
  {
    id: 'user-01',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@nexatech.cloud',
    role: 'HR',
    department: 'People Operations',
    clearanceLevel: 4,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    id: 'user-02',
    name: 'Alex Mercer',
    email: 'alex.mercer@nexatech.cloud',
    role: 'Admin',
    department: 'Chief Security Office (CSO)',
    clearanceLevel: 5,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    id: 'user-03',
    name: 'David Chen',
    email: 'david.chen@nexatech.cloud',
    role: 'Engineering',
    department: 'Core Infrastructure Team',
    clearanceLevel: 3,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    id: 'user-04',
    name: 'Emily Patel',
    email: 'emily.patel@nexatech.cloud',
    role: 'Support',
    department: 'Global Customer Experience',
    clearanceLevel: 2,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
];

export const ENTERPRISE_DOCUMENTS: EnterpriseDocument[] = [
  // --- HR & Compensation Silo (Cleared: HR [L4+], Admin [L5]) ---
  {
    id: 'doc-hr-compensation',
    title: 'Q3 Executive Redefined Compensation & Equity Strategy Guidelines.pdf',
    silo: 'Document',
    format: 'PDF',
    tags: ['HR', 'Compensation', 'Equity', 'Strictly-Confidential'],
    requiredRole: ['HR', 'Admin'],
    minClearanceLevel: 4,
    content: `Nexatech Cloud Systems - Executive Compensation & Equity Framework (FY2026-Q3).
Author: Board of Directors Compensation Committee.
Distribution: Executive Leadership & HR Operations Directors only.

Key Executive Pay Bands:
- Band 9 (VP & above): Base $280,000 to $450,000. Annual target bonus is 40% of base. Equity grant target is 15,000 RSUs vesting over a 48-month schedules with 1-year cliff.
- Band 8 (Senior Directors): Base $190,000 to $275,000. Annual bonus 25%. Equity grant 8,000 RSUs.
- Band 7 (Engineering & Product Leads): Base $160,000 to $220,000. Under current guidance, base salaries are strictly capped at $225,000 to avoid departmental margin inflation.

Severance & Termination Policies:
Standard VP package includes 6 months of severance, fully paid COBRA health coverage, and an accelerated vesting period of three months. Exceptions must be approved in writing by either the Chief People Officer (Sarah Jenkins) or Chief Financial Officer (Marcus Vance).
Under current fiscal rules, executive discretionary cash bonuses are subject to a performance multiplier ranging between 0.5x and 1.5x based directly on Nexatech ARR growth goals.`,
    referenceMeta: {
      author: 'Compensation Board',
      date: '2026-04-15',
      version: '4.2',
      siloPath: 'siles/hr/confidential/compensation_2026_q3.pdf',
    },
  },
  {
    id: 'doc-hr-performance',
    title: 'FY2026 Performance Appraisal & Performance Improvement Plan Protocols.pdf',
    silo: 'Document',
    format: 'PDF',
    tags: ['HR', 'Appraisal', 'PIP', 'Legal'],
    requiredRole: ['HR', 'Admin'],
    minClearanceLevel: 4,
    content: `Nexatech Cloud Systems Internal Regulations - Protocol for Performance Improvement Plans (PIP) & Legal Escapes.
Document ID: Nexa-POL-HR-982.

Whenever an employee is placed on a PIP:
1. HR must be notified prior to any written warning or documentation being sent to the employee.
2. The PIP must extend over a minimum duration of 45 calendar days, ending on a scheduled biweekly review.
3. Criteria for failure or success must be quantified with objective key performance indicators (KPIs) such as bug closure rates, support SLA targets, or sales pipeline generation metrics.
4. If an employee fails a PIP, severance payouts are standardly set to 2 weeks of base salary, unless there's an active non-disclosure or general release agreement signed, which elevates this to 4 weeks.
5. High-risk employees in regions with strict employment legislation (e.g., California, EMEA) must be reviewed by outside corporate legal counsel before termination.`,
    referenceMeta: {
      author: 'Legal & HR Policy Team',
      date: '2026-02-10',
      version: '2.1',
      siloPath: 'siles/hr/protocols/performance_pip_standards.pdf',
    },
  },

  // --- SQL Database Tables Silo (Cleared: Admin [L5], Engineering [L3+], HR [L4+]) ---
  {
    id: 'doc-db-employees',
    title: 'Database Export - schema: public, table: employees.csv',
    silo: 'Database',
    format: 'CSV',
    tags: ['SQL', 'Staff-Records', 'Active-Roster'],
    requiredRole: ['Admin', 'HR', 'Engineering'], // Developer can see employees but maybe not salaries or infrastructure secrets
    minClearanceLevel: 3,
    content: `EMPLOYEE DATABASE EXPORT [public.employees]
Total Records: 4. Export type: CSV.
Fields: [emp_id | full_name | department | role_classification | email | base_salary | is_active]

"emp-001","Sarah Jenkins","People Operations","HR Director","sarah.jenkins@nexatech.cloud",165000,true
"emp-002","Alex Mercer","Chief Security Office (CSO)","Principal Security Architect","alex.mercer@nexatech.cloud",210000,true
"emp-003","David Chen","Engineering","Principal Infrastructure Engineer","david.chen@nexatech.cloud",185000,true
"emp-004","Emily Patel","Global Customer Experience","Support Engineer III","emily.patel@nexatech.cloud",92000,true`,
    referenceMeta: {
      author: 'Db_Backup_Service',
      date: '2026-06-01',
      version: '6.0.4',
      siloPath: 'siles/database/dumps/public_employees.csv',
    },
  },
  {
    id: 'doc-db-infrastructure',
    title: 'Database Export - schema: infrastructure, table: config_secrets.sql',
    silo: 'Database',
    format: 'SQL',
    tags: ['SQL', 'Engineering-Keys', 'Infra', 'Strictly-Confidential'],
    requiredRole: ['Engineering', 'Admin'],
    minClearanceLevel: 3,
    content: `INFRASTRUCTURE DATABASE DUMP [infrastructure.config_secrets]
Fields: [secret_id | service_key | api_endpoint | credentials_hash | encryption_algorithm | rot_period]

"sec-aws-prod","AWS_PRODUCTION_API_KEY","https://sts.us-east-1.amazonaws.com","sha256:8f4ca67eeddc0029b9f9","AES-256-GCM","90 days"
"sec-db-conn","POSTGRESQL_DB_CONN_STR","postgresql://db_master_prod:pAssw0rd_9821@db-internals-prod.nexatech.cloud:5432/nexa_records","sha256:7fbcb41cde00a8910ebf","AES-256-GCM","180 days"
"sec-gemini-key","GEMINI_OFFICIAL_GATEWAY_KEY","https://generativelanguage.googleapis.com/v1beta","sha256:ee4129b87fc11c910e9f","AES-256-CBC","30 days"
"sec-slack-webhook","SLACK_INCIDENT_ALERT_URI","https://hooks.slack.com/services/T000/B000/X1293817","sha256:3ab4b5cc2298e72dbfef","Plaintext","Never"`,
    referenceMeta: {
      author: 'Infra_Db_Admin',
      date: '2026-05-28',
      version: '1.0.12',
      siloPath: 'siles/database/secrets/infrastructure_config_secrets.sql',
    },
  },

  // --- JSON Logs & Alerts Silo (Cleared: Admin [L5], Engineering [L3+], Support [L2+]) ---
  {
    id: 'doc-json-security-logs',
    title: 'Silo Container JSON - logs: internal-firewall-denials.json',
    silo: 'JSONLogs',
    format: 'JSON',
    tags: ['Logs', 'SecOps', 'Firewall', 'Alerts'],
    requiredRole: ['Admin', 'Engineering', 'Support'],
    minClearanceLevel: 2,
    content: `[
  {
    "timestamp": "2026-06-08T01:12:45Z",
    "event_id": "FW-DENY-9821",
    "source_ip": "194.13.41.22",
    "destination_port": 5432,
    "destination_service": "PostgreSQL Internal Production database",
    "threat_score": 9.2,
    "action": "BLOCK_CONNECTION",
    "triggered_rule": "external-postgres-access-attempt",
    "mitigation": "Temporary IP ban in Cloudflare WAF"
  },
  {
    "timestamp": "2026-06-08T01:14:02Z",
    "event_id": "FW-DENY-9822",
    "source_ip": "194.13.41.22",
    "destination_port": 22,
    "destination_service": "SSH Bastion Host Cluster",
    "threat_score": 9.8,
    "action": "BLOCK_CONNECTION",
    "triggered_rule": "bastion-ssh-failed-retries-limit",
    "mitigation": "Route traffic through enterprise VPN tunnel only"
  },
  {
    "timestamp": "2026-06-08T02:00:10Z",
    "event_id": "AUTH-ALERT-044",
    "source_ip": "12.98.112.44",
    "user_identity": "employee_test_9@nexatech.cloud",
    "action": "MFA_SENT_REJECTED",
    "threat_score": 4.5,
    "action_taken": "Force log out and trigger security code refresh"
  }
]`,
    referenceMeta: {
      author: 'Firewall_Agent_N01',
      date: '2026-06-08',
      version: '7.94-patch3',
      siloPath: 'siles/json_logs/firewall/firewall_denials_daily.json',
    },
  },
  {
    id: 'doc-json-application-logs',
    title: 'Silo Container JSON - logs: microservices-auth-errors.json',
    silo: 'JSONLogs',
    format: 'JSON',
    tags: ['Logs', 'App-Errors', 'Authentication'],
    requiredRole: ['Admin', 'Engineering', 'Support'],
    minClearanceLevel: 2,
    content: `[
  {
    "timestamp": "2026-06-08T00:01:23Z",
    "service_name": "gateway-auth-service",
    "level": "ERROR",
    "message": "Token verification failed on route /v2/billing/invoice. Reason: Signature has expired.",
    "context": { "user_id": "user_billing_882a", "auth_mechanism": "JWT_RSA256" },
    "latency_ms": 12.4
  },
  {
    "timestamp": "2026-06-08T01:30:15Z",
    "service_name": "user-directory-sync",
    "level": "WARNING",
    "message": "LDAP synchronization with active directory took too long: 4500ms exceeding threshold 2000ms. Retrying connection...",
    "context": { "active_servers": 2, "pending_records": 149 },
    "latency_ms": 4502.1
  },
  {
    "timestamp": "2026-06-08T02:45:00Z",
    "service_name": "microservices-billing-engine",
    "level": "CRITICAL",
    "message": "Database write timeout. Billing state remains pending for invoice INVC-2026-098.",
    "context": { "retry_count": 5, "last_db_error": "Connection timed out in db-pool-4" },
    "latency_ms": 10000.0
  }
]`,
    referenceMeta: {
      author: 'Sync_Monitoring_Daemon',
      date: '2026-06-08',
      version: '1.2.0',
      siloPath: 'siles/json_logs/microservices/auth_errors_sync.json',
    },
  },

  // --- Compliance & Security Reports (Cleared: Admin [L5], Engineering [L3+], HR [L4+]) ---
  {
    id: 'doc-compliance-report',
    title: 'Nexa-2026-SecOps Internal GDPR & SOC2 Compliance Audit Report.pdf',
    silo: 'Compliance',
    format: 'Report',
    tags: ['Compliance', 'GDPR', 'SOC2', 'Audit'],
    requiredRole: ['Admin', 'Engineering', 'HR'],
    minClearanceLevel: 3,
    content: `Nexatech Cloud Systems SOC2 Type II & GDPR Compliance Evaluation (Completed May 2026).
Author: AbsoluteTrust Audit Group LLP.
Status: Remediation Phase.

Found Weaknesses / High Priority Concerns:
1. Employee PII Storage: Audit discovered that Employee data was cached in CSV spreadsheets within public-facing S3 staging buckets (specifically nexa-staging-temp-98). This is a direct GDPR Article 32 infringement. The ticket DEVA-988 is assigned to David Chen to automate continuous rotation.
2. Production DB Encryption: Production DB holds AES-256 credentials in the infrastructure schema, which is compliant, but database connection strings contain explicit passwords in plain character string. Database connection secrets must immediately be migrated to HashiCorp Vault or AWS Secrets Manager.
3. Access Control Gaps: Support personnel have read permissions to parts of active user billing records without active MFA sessions. Remediation requires MFA verification enforcement for all roles below Level 3.
4. Retention Standards: Backup tapes are retained for 7 years, matching the statutory requirements, but lack a cryptographically secure shredding protocol at End of Life (EOL).`,
    referenceMeta: {
      author: 'AbsoluteTrust Auditors',
      date: '2026-05-18',
      version: '1.0',
      siloPath: 'siles/compliance/soc2/GDPR_SOC2_Audit_2026.pdf',
    },
  },
  {
    id: 'doc-security-manual',
    title: 'Nexatech Cloud Incident Response and Disaster Recovery Playbook.pdf',
    silo: 'Compliance',
    format: 'Report',
    tags: ['Security', 'Incident-Response', 'Disaster-Recovery', 'Playbook'],
    requiredRole: ['Admin', 'Engineering', 'Support'],
    minClearanceLevel: 2,
    content: `Nexatech Cloud Incident Response and Disaster Recovery Playbook.
Classification: Internal Operations Standard.

In the event of a Severity 1 Security Breach (e.g., Data Leak, Active Network Intrusion):
1. **Containment Phase (First 15 Minutes)**: The on-duty Security Engineer is authorized to rotate the infrastructure passwords. They must block any compromised external IP addresses via Cloudflare's WAF and flag all relevant user account passwords for instant reset.
2. **Escalation**: Alert the Principal Security Architect (Alex Mercer) and open an emergency Slack room: #incident-crisis-sec1.
3. **Communication Boundary**: No internal developer or employee should comment to media sources. All statements must parse through the Legal PR division led by Marcus Vance.
4. **Data Restoration (DR)**: Recovery Point Objective (RPO) is 4 hours. Backups are stored in redundant hot-swappable SAN disks at our Primary Dallas DC and cold archive in AWS S3 Glacier. Recovery Time Objective (RTO) is 12 hours.`,
    referenceMeta: {
      author: 'Chief Information Security Office',
      date: '2026-03-30',
      version: '3.4',
      siloPath: 'siles/compliance/playbook/dr_incident_response.pdf',
    },
  }
];
