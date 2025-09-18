// Simple keyword-based classifier to infer domain and categories from title/description/technologies
// Returns { domain, categories }

const KEYWORDS = [
  { domain: 'Cloud', patterns: [
    /\baws\b|amazon web services|ec2|s3|lambda|cloudfront|cloudformation/i,
    /\bazure\b|app service|aks|functions|cosmos db/i,
    /\bgcp\b|google cloud|gke|bigquery|cloud run/i,
    /kubernetes|k8s|terraform|iac|cloud/i
  ]},
  { domain: 'Cybersécurité', patterns: [
    /security|sécurité|pentest|soc|siem|soar|iam|zero trust|owasp/i,
    /forensic|red team|blue team|iso 27001|rgpd|gdpr/i
  ]},
  { domain: 'IA', patterns: [
    /machine learning|deep learning|ia|ai|pytorch|tensorflow|scikit|llm|nlp|computer vision/i,
    /mlops|model serving|rag|vector db|embedding/i
  ]},
  { domain: 'Data', patterns: [
    /data engineer|data scientist|data analyst|etl|elt|spark|hadoop|databricks|snowflake/i,
    /bi|power bi|tableau|looker|dbt|warehouse|lakehouse|kafka|airflow/i
  ]},
  { domain: 'Développement logiciel', patterns: [
    /frontend|backend|full\s*stack|mobile|android|ios|react|vue|angular|node|java|.net|php|laravel|spring|django|flask/i
  ]},
  { domain: 'DevOps/SRE', patterns: [
    /devops|sre|site reliability|observability|prometheus|grafana|argocd|helm|cicd|gitlab ci|github actions/i
  ]},
  { domain: 'Produit & Design', patterns: [
    /product manager|pm\b|product owner|po\b|ux|ui|designer|research/i
  ]},
  { domain: 'IoT/Embedded', patterns: [
    /iot|embedded|firmware|risc|stm32|arduino|esp32|ble|zigbee|rtos/i
  ]},
  { domain: 'Blockchain/Web3', patterns: [
    /blockchain|web3|solidity|smart contract|nft|defi|ethereum|evm/i
  ]},
  { domain: 'AR/VR', patterns: [
    /ar\b|vr\b|xr|unity|unreal|oculus|hololens|metaverse/i
  ]},
  { domain: 'Emergents', patterns: [
    /quantum|qubit|qiskit|green it|sustainability|edge ai/i
  ]}
];

function inferDomainAndCategories({ titre = '', description = '', technologies = '' } = {}) {
  const text = `${titre}\n${description}\n${technologies}`;
  for (const entry of KEYWORDS) {
    for (const p of entry.patterns) {
      if (p.test(text)) {
        // crude categories extraction from technologies words
        const cats = Array.from(new Set((technologies || '')
          .split(/[ ,;\n]+/)
          .filter(Boolean)
          .slice(0, 6)));
        return { domain: entry.domain, categories: cats };
      }
    }
  }
  // Fallback: if technologies present, default to Développement logiciel
  if ((technologies || '').trim()) {
    const cats = Array.from(new Set((technologies || '')
      .split(/[ ,;\n]+/)
      .filter(Boolean)
      .slice(0, 6)));
    return { domain: 'Développement logiciel', categories: cats };
  }
  return { domain: undefined, categories: [] };
}

module.exports = { inferDomainAndCategories };