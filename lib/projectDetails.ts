export interface ProjectDetail {
  fullDesc: string[]
  skills: string[]
}

export const projectDetails: Record<string, ProjectDetail> = {
  'rc-proj-1': {
    fullDesc: [
      'An MCP server built on a RAG architecture that intelligently analyzes GitHub repositories across an organization. The system extracts knowledge from the codebase, centralizes it in a vector database, and surfaces it as living technical documentation through a Docusaurus frontend.',
      'An AI model evaluates every code push to determine whether documentation changes are needed. When a meaningful change is detected, the system generates or updates Markdown files inside the Docusaurus source tree, keeping documentation in perfect sync with the codebase — automatically and continuously.',
      'GitHub Actions orchestrates the entire workflow: on each push event, a workflow triggers the AI API to analyze the code diff, produces structured Markdown from the findings, and commits the documentation updates back to the repository. Zero manual effort required.',
    ],
    skills: [
      'LangGraph', 'Python', 'MCP (Model Context Protocol)', 'RAG Architecture',
      'Vector Search', 'LLMs', 'OpenAI API', 'Docusaurus',
      'GitHub Actions', 'PostgreSQL', 'Chroma DB', 'GitHub REST API',
      'Markdown Generation', 'CI/CD Automation', 'Document Pipeline Engineering',
    ],
  },

  'rc-proj-2': {
    fullDesc: [
      'An enterprise-scale observability intelligence platform built to serve multiple Lines of Business sharing a common Elastic Stack. High-cardinality telemetry from each LOB flows through a custom Python preprocessing layer — responsible for normalization and enrichment — before entering Elasticsearch for indexing and search.',
      'A separate Python alerting framework monitors Elasticsearch in real time, evaluating trigger conditions and dispatching actionable alerts. PANDA sits on top of this stack as an intelligence layer: using Elasticsearch\'s native ML features combined with custom-trained models, it learns the normal behavior of every alert type and predicts anomalies before they escalate into incidents.',
      'The dual-model approach pairs unsupervised clustering (for grouping unknown anomaly patterns) with predictive regression (for time-series forecasting). The result is a significant reduction in alert fatigue and false positives across a platform processing millions of events per day.',
    ],
    skills: [
      'scikit-learn', 'Python (ML Pipeline)', 'OpenTelemetry', 'Elasticsearch',
      'Kibana', 'Logstash', 'Beats', 'ELK Stack',
      'Elasticsearch ML', 'Unsupervised Clustering', 'Predictive Regression',
      'Alert Engineering', 'Feature Extraction', 'Time-Series Forecasting',
      'High-Cardinality Telemetry', 'Anomaly Detection',
    ],
  },

  'rc-proj-3': {
    fullDesc: [
      'Engineered advanced Model Context Protocol (MCP) servers that bridge Oracle AI Fusion Studio with cloud infrastructure operations. The servers expose structured context about system state — metrics, topology, and configuration — to AI agents that reason over it and take autonomous action.',
      'Two primary agent capabilities are deployed: cross-system database synchronization (keeping heterogeneous data stores consistent without manual ETL jobs) and auto-remediation (detecting anomalous infrastructure conditions and applying corrective actions through orchestrated OCI API calls).',
      'The integration embeds generative intelligence directly into observability streams, closing the loop between detection and remediation without human intervention.',
    ],
    skills: [
      'OCI (Oracle Cloud Infrastructure)', 'Oracle AI Fusion Studio',
      'MCP (Model Context Protocol)', 'Python', 'Terraform',
      'AI Agents', 'Database Synchronization', 'Auto-Remediation',
      'Observability Integration', 'Cloud Infrastructure Automation',
    ],
  },

  'rc-proj-4': {
    fullDesc: [
      'End-to-end infrastructure ownership for a mission-critical hybrid cloud environment powering all APIs of a major retail operation. The platform ran a fleet of GKE clusters — some on-premises (VMware), some on GCP — with Apigee handling API management across the entire estate.',
      'The primary engineering challenge was upgrading the production GKE clusters from Kubernetes 1.4 all the way to version 1.14 with zero downtime for the retail APIs. To achieve this safely, a full Disaster Recovery (DR) replica was provisioned in parallel. Traffic was progressively migrated to the DR environment, validated under production load, and then fully cut over — eliminating the risk of a 10-version in-place upgrade on live systems.',
      'As part of the modernization, legacy Anthos networking was replaced with Cloud Service Mesh, delivering improved observability, mTLS between services, and a consistent traffic management model across the hybrid environment. Terraform and Ansible automated the entire provisioning and configuration lifecycle.',
    ],
    skills: [
      'Google Kubernetes Engine (GKE)', 'Cloud Service Mesh',
      'Kubernetes Upgrade (1.4 → 1.14)', 'Disaster Recovery Planning',
      'Zero-Downtime Migration', 'Apigee API Management',
      'Hybrid Cloud Architecture', 'VMware (on-premises)',
      'Terraform', 'Ansible', 'High Availability', 'Traffic Management',
    ],
  },

  'rc-proj-5': {
    fullDesc: [
      'Designed and managed the complete Infrastructure-as-Code foundation using Terraform for a large-scale retail vendor center portal — a platform responsible for secure data ingestion pipelines and logistics management systems handling millions of vendor transactions.',
      'The architecture spans every layer of the GCP stack, provisioned entirely through code: compute and orchestration (Compute Engine, GKE, Cloud Run), multi-layer networking with defense-in-depth (VPC, Cloud Armor, CDN, NAT), managed relational and NoSQL databases (Cloud SQL, Spanner, Firestore, Memorystore/Redis), and a comprehensive security posture enforced through Cloud KMS, Secret Manager, VPC Service Controls, Private Service Connect, and reCAPTCHA Enterprise.',
      'API management flows through Apigee and Cloud Endpoints, event-driven integration through Pub/Sub and Eventarc. CI/CD runs on Cloud Build with Artifact Registry, while BigQuery, Dataflow, and Looker Studio form the analytics layer for operational intelligence.',
    ],
    skills: [
      // Compute
      'Compute Engine', 'GKE', 'Cloud Run',
      // Networking
      'VPC', 'Cloud Load Balancing', 'Cloud NAT', 'Cloud Armor', 'Cloud CDN',
      // Databases
      'Cloud SQL', 'Cloud Spanner', 'Firestore', 'Cloud Storage', 'Memorystore (Redis)',
      // Security
      'Cloud IAM', 'Secret Manager', 'Cloud KMS', 'Security Command Center',
      'Private Service Connect', 'VPC Service Controls', 'reCAPTCHA Enterprise',
      // APIs
      'Apigee', 'Cloud API Gateway', 'Cloud Endpoints', 'Eventarc', 'Pub/Sub', 'Application Integration',
      // DevOps
      'Cloud Build', 'Artifact Registry', 'Terraform', 'Cloud Deployment Manager',
      'Cloud Monitoring', 'Cloud Logging', 'Cloud Trace', 'Error Reporting',
      // Data
      'BigQuery', 'Dataflow', 'Looker Studio',
    ],
  },

  'rc-proj-6': {
    fullDesc: [
      'Built an enterprise financial intelligence platform with BigQuery as the central data warehouse, ingesting GCP Billing Export at full resource granularity across an organization of 200+ GCP projects. The resource-level billing table (gcp_billing_export_resource_v1) provides per-VM, per-disk, per-bucket cost attribution with labels for precise departmental chargeback.',
      'Looker dashboards surface actionable cost intelligence for platform directors: detailed usage breakdowns by team, service, and environment; resource efficiency scores; and anomaly detection for unexpected spend spikes. The analytics layer incorporates ML models trained on historical consumption data to generate spend forecasts and resource allocation projections — enabling data-driven decisions at the executive level.',
    ],
    skills: [
      'BigQuery', 'Looker', 'Looker Studio', 'FinOps',
      'GCP Billing Export (Resource-Level)', 'Cloud Analytics',
      'Python', 'Dataflow', 'ML Forecasting',
      'Cost Attribution', 'Departmental Chargeback',
      'Resource Optimization', 'Executive Dashboarding',
      '200+ GCP Projects', 'Data Pipeline Engineering',
    ],
  },
}
