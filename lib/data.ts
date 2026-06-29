export const logos = [
  { name: 'Oracle',           src: '/images/svglogos/Oracle.svg' },
  { name: 'SAP',              src: '/images/svglogos/SAP.svg' },
  { name: 'Google Cloud',     src: '/images/svglogos/GCP.svg' },
  { name: 'Kubernetes',       src: '/images/svglogos/KubernetesLogo.svg' },
  { name: 'Terraform',        src: '/images/svglogos/Terraform.svg' },
  { name: 'Microsoft Azure',  src: '/images/svglogos/AzureLogo.svg' },
  { name: 'Python',           src: '/images/svglogos/Python.svg' },
  { name: 'Liverpool',        src: '/images/svglogos/LiverPoolLogo.svg' },
]

export const competencies = [
  {
    n: '01',
    title: 'AI-Powered Operations',
    desc: 'Anomaly-detection models and LLM insights that trigger automated remediation on OCI — cutting mean time to resolution for enterprise customers.',
  },
  {
    n: '02',
    title: 'Agentic RAG Workflows',
    desc: 'Multi-agent LangGraph pipelines that read code changes across repositories and keep technical documentation current through self-reflection loops.',
  },
  {
    n: '03',
    title: 'Infrastructure as Code',
    desc: 'Terraform and Ansible provisioning for OKE clusters, API gateways, and streams across secure, multi-tenant cloud environments.',
  },
  {
    n: '04',
    title: 'Observability & MLOps',
    desc: 'Prometheus, Grafana, and the Elastic stack wired into ML pipelines for real-time anomaly detection and predictive alerting.',
  },
]

export const timeline = [
  {
    role: 'Senior AI Cloud Engineer',
    org: 'Oracle · Remote',
    dates: '2026 — Present',
    points: [
      'Designing AI-driven automation on OCI — anomaly detection plus LLM insights that trigger automated remediation.',
      'Provisioning OKE clusters, API Gateway, OCI Streams and LBaaS with Terraform and Ansible.',
      'Building Python automation for deployment, monitoring and incident response across multi-tenant environments.',
    ],
  },
  {
    role: 'Software Engineer — Observability & ML Infrastructure',
    org: 'SAP · Monterrey, MX',
    dates: '2024 — 2026',
    points: [
      'Architected a production multi-agent RAG pipeline in LangGraph spanning 5 repositories.',
      'Engineered the high-throughput ETL backbone for the PANDA ML anomaly-detection system at sub-second latency.',
      'Operated ElasticSearch/Kibana/Logstash and MemGraph at scale; held 99.9% alerting availability.',
    ],
  },
  {
    role: 'Cloud Infrastructure Engineer — GCP & Azure',
    org: 'El Puerto de Liverpool · Mexico City',
    dates: '2022 — 2024',
    points: [
      'Bridged on-prem VMware with GKE via Anthos for mission-critical, high-availability workloads.',
      'Automated provisioning with Terraform and Ansible — cutting deployment lead times by 40%.',
      'Built Dataflow + Cloud Composer ETL into BigQuery, surfaced through Looker dashboards.',
    ],
  },
  {
    role: 'Full-Stack Developer / Database Administrator',
    org: 'UYSEEI & Jardines Vida · Cuernavaca',
    dates: '2018 — 2020',
    points: [
      'Built RESTful APIs and microservices in Python (Django / Flask).',
      'Led PostgreSQL schema design and query optimization for high-throughput reporting.',
    ],
  },
]

export const projects = [
  {
    id: 'rc-proj-1',
    title: 'Agentic Doc-Sync Pipeline',
    desc: 'Multi-agent LangGraph system architected as a fully functional MCP server. Automates codebase analysis across distributed repositories using self-reflective LLM workflows to continuously synchronize technical documentation.',
    tech: ['LangGraph', 'Python', 'MCP', 'Vector Search', 'LLMs'],
    href: 'https://github.com/rubenalejandrocalderoncorona',
    image: '/images/AIRepoMultisync.jpeg',
    gradient: null,
  },
  {
    id: 'rc-proj-2',
    title: 'PANDA: Intelligence Layer for Distributed Observability',
    desc: 'End-to-end MLOps pipeline executing real-time anomaly detection on high-cardinality telemetry data. Dual-model approach (unsupervised clustering + predictive regression) with automated feature extraction and low-latency inference.',
    tech: ['scikit-learn', 'Python', 'OpenTelemetry', 'ELK Stack'],
    href: 'https://github.com/rubenalejandrocalderoncorona',
    image: '/images/PANDADiagram.png',
    gradient: null,
  },
  {
    id: 'rc-proj-3',
    title: 'OCI AI Fusion Integration',
    desc: 'Engineered advanced MCP servers and integrated Oracle AI Fusion Studio to embed generative intelligence directly into cloud infrastructure operations and observability streams.',
    tech: ['OCI', 'AI Fusion Studio', 'MCP', 'Python', 'Terraform'],
    href: 'https://github.com/rubenalejandrocalderoncorona',
    image: '/images/OCIAIFusion.jpeg',
    gradient: null,
  },
  {
    id: 'rc-proj-4',
    title: 'Hybrid Cloud on Cloud Service Mesh & GKE',
    desc: 'End-to-end infrastructure owner for deployment, patching, lifecycle upgrades, and configuration management of a resilient hybrid cloud bridging on-prem VMware with GKE via Cloud Service Mesh.',
    tech: ['GKE', 'Cloud Service Mesh', 'Terraform', 'Ansible', 'VMware'],
    href: 'https://github.com/rubenalejandrocalderoncorona',
    image: '/images/HybridCloudAnthos.jpeg',
    gradient: null,
  },
  {
    id: 'rc-proj-5',
    title: 'Enterprise Vendor Infrastructure (Liverpool)',
    desc: "Designed and managed foundational IaC architecture using Terraform for Liverpool's vendor center portal, securing data ingestion pipelines and logistics management systems at massive retail scale.",
    tech: ['Terraform', 'Cloud Infrastructure', 'Security Automation', 'Logistics Systems'],
    href: 'https://github.com/rubenalejandrocalderoncorona',
    image: '/images/VendorCenterIaC.png',
    gradient: null,
  },
  {
    id: 'rc-proj-6',
    title: 'FinOps Cloud Intelligence',
    desc: 'Advanced financial intelligence framework deploying custom data pipelines and interactive Looker dashboards to analyze, forecast, and optimize resource spend across enterprise GCP Cloud architecture.',
    tech: ['GCP', 'Looker', 'FinOps', 'Cloud Analytics', 'Python'],
    href: 'https://github.com/rubenalejandrocalderoncorona',
    image: '/images/ProjectBillingonLocker.png',
    gradient: null,
  },
]

export const certs = [
  {
    title: 'Professional Machine Learning Engineer',
    issuer: 'Google Cloud',
    date: 'May 2026',
    href: 'https://www.credly.com/badges/0b9b3d1c-5d79-44fd-8cf0-57ea006b30b6',
    logo: '/images/certlogos/GCPMLCert.svg',
  },
  {
    title: 'GitHub Actions',
    issuer: 'GitHub',
    date: 'Sep 2025',
    href: 'https://learn.microsoft.com/api/credentials/share/es-mx/RubnAlejandroCaldernCorona-6174/86155CEB8E02D077?sharingId=366AE2B7D633F484',
    logo: '/images/certlogos/GithubActionsCert.svg',
  },
  {
    title: 'Professional Cloud Architect',
    issuer: 'Google Cloud',
    date: 'Oct 2023',
    href: 'https://www.credly.com/badges/9a2e0b48-5183-4162-b613-b42ab3f7af68',
    logo: '/images/certlogos/GCPArchitectCert.svg',
  },
  {
    title: 'Professional Cloud DevOps Engineer',
    issuer: 'Google Cloud',
    date: 'Jul 2024',
    href: 'https://www.credly.com/badges/777b69a7-eba8-47f1-b26d-142671521dd2',
    logo: '/images/certlogos/GCPDevOpsCert.svg',
  },
  {
    title: 'Certified Kubernetes Administrator',
    issuer: 'CNCF',
    date: 'May 2024',
    href: 'https://www.credly.com/badges/c8666c36-6b00-4db8-a3d6-4d328e603383',
    logo: '/images/certlogos/CKACert.svg',
  },
  {
    title: 'Azure Administrator Associate',
    issuer: 'Microsoft',
    date: 'Jun 2025',
    href: 'https://learn.microsoft.com/api/credentials/share/es-mx/RubnAlejandroCaldernCorona-6174/38A0B1B23F77FA01?sharingId=366AE2B7D633F484',
    logo: '/images/certlogos/AzureAdminCert2.svg',
  },
  {
    title: 'Azure AI Engineer Associate',
    issuer: 'Microsoft',
    date: 'Jul 2025',
    href: 'https://learn.microsoft.com/api/credentials/share/es-mx/RubnAlejandroCaldernCorona-6174/CA2D4DBD9C373870?sharingId=366AE2B7D633F484',
    logo: '/images/certlogos/AzureAIEngineer.svg',
  },
]

export const skillGroups = [
  {
    title: 'Cloud',
    tags: ['OCI', 'GCP', 'GKE', 'Dataflow', 'BigQuery', 'Vertex AI', 'Anthos', 'Azure'],
  },
  {
    title: 'IaC & Automation',
    tags: ['Terraform', 'Ansible', 'Kubernetes', 'Docker', 'GitHub Actions', 'Jenkins'],
  },
  {
    title: 'AI / ML & Agents',
    tags: ['Agentic RAG', 'LangGraph', 'LLM Integration', 'MLOps', 'Vector Search', 'Anomaly Detection'],
  },
  {
    title: 'Observability',
    tags: ['ElasticSearch / ELK', 'Prometheus', 'Grafana', 'OpenTelemetry', 'OCI Monitoring'],
  },
  {
    title: 'Languages',
    tags: ['Python', 'Bash', 'Java', 'JavaScript', 'SQL', 'GraphQL'],
  },
  {
    title: 'DevOps',
    tags: ['CI/CD Pipelines', 'Linux Admin', 'REST APIs', 'Git'],
  },
]
