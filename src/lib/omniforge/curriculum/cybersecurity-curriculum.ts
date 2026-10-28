/**
 * OmniForge Dedicated Cybersecurity & Information Security Curriculum Architect
 *
 * 10 Progressive Stages:
 * 1. Networking Protocols, OSI Model & Packet Analysis (Wireshark)
 * 2. Linux OS Internals, Privilege Boundaries & Shell Hardening
 * 3. Applied Cryptography, PKI & Secure Communication (TLS/SSL)
 * 4. Web Application Security & OWASP Top 10 Mitigation
 * 5. Threat Modeling & Defensive Architecture (STRIDE, Zero Trust)
 * 6. Network Defense, Firewalls, IDS/IPS & Systems Hardening
 * 7. Identity, Authentication & Access Control (OAuth2, RBAC, MFA)
 * 8. Vulnerability Assessment, Auditing & Secure Code Review
 * 9. Incident Response, Security Forensics & SIEM Telemetry
 * 10. Enterprise Security Program & Resilient Defense Capstone
 */

import { DeepTopicItem } from "../user-intelligence";
import { BlueprintStageDefinition, StageContentDetail } from "./types";

export const CYBERSECURITY_BLUEPRINT_STAGES: BlueprintStageDefinition[] = [
  {
    stage: 1,
    title: "Networking Protocols, OSI Model & Packet Analysis",
    skillFocus: "TCP/IP Stack, Subnetting, Protocol Lifecycles & Wireshark Inspection",
    objective: "Master network communication protocols, TCP three-way handshake, DNS resolution, ARP mechanics, and live packet dissection using Wireshark and tcpdump.",
    prerequisites: ["Basic computer literacy and command-line familiarity"],
    prerequisiteChecks: ["Ability to open terminal and execute basic ping and traceroute commands"],
    keyCompetencies: ["OSI 7-layer vs TCP/IP 4-layer models", "TCP three-way handshake and flags (SYN, ACK, FIN, RST)", "DNS lookup hierarchy and UDP transport", "Packet capture analysis with Wireshark filters"],
    projectTitle: "Network Protocol Analyzer & Packet Inspection Dossier",
    deliverables: ["packet_analysis_report.pdf documenting TCP flow dissection", "Wireshark capture filter library (.pcap)", "Network topology diagram"],
    definitionOfDone: ["Accurately identifies TCP retransmissions, resets, and unencrypted plaintext credentials in test captures", "Explains DNS recursive vs iterative query mechanics"],
    estimatedStudyHours: 14,
    recommendedPacing: "1 week at 2 hours/day",
  },
  {
    stage: 2,
    title: "Linux OS Internals, Privilege Boundaries & Shell Hardening",
    skillFocus: "Linux File Permissions, User/Group Controls, System Calls & Bash Hardening",
    objective: "Master Linux filesystem security, POSIX permissions, SUID/SGID bits, process namespaces, systemd services, and automated bash security auditing.",
    prerequisites: ["Stage 1: Networking Protocols"],
    prerequisiteChecks: ["Basic navigation in Linux terminal (cd, ls, grep)"],
    keyCompetencies: ["POSIX permissions (rwx) and octal notation (chmod, chown)", "Special permission bits: SUID, SGID, and Sticky bit", "Linux process inspection (/proc, ps, lsof, netstat)", "Principle of least privilege and sudoers configuration"],
    projectTitle: "Automated Linux Host Security Auditing & Hardening Script",
    deliverables: ["audit_host.sh auditing SUID binaries, open ports, and world-writable files", "Hardened /etc/ssh/sshd_config configuration guide"],
    definitionOfDone: ["Audit script flags all unauthorized SUID binaries and insecure file permissions", "SSH server is configured with disabled root login and enforced key-based auth"],
    estimatedStudyHours: 16,
    recommendedPacing: "1 week at 2.5 hours/day",
  },
  {
    stage: 3,
    title: "Applied Cryptography, PKI & Secure Communication (TLS/SSL)",
    skillFocus: "Symmetric/Asymmetric Ciphers, Hashing, Digital Signatures & X.509 PKI",
    objective: "Understand modern cryptographic primitives, AES-GCM, RSA/ECC, SHA-256, HMAC, public key infrastructure (PKI), and TLS 1.3 handshake mechanics.",
    prerequisites: ["Stage 2: Linux OS Internals"],
    prerequisiteChecks: ["Understanding of binary representations and network transport"],
    keyCompetencies: ["Symmetric (AES-256-GCM) vs asymmetric (RSA, ECDSA, Ed25519) encryption", "Cryptographic hashing vs password hashing (Argon2, bcrypt)", "HMAC message integrity verification", "X.509 Certificate Authorities (CA) and TLS 1.3 handshakes"],
    projectTitle: "Secure Encrypted Vault & Public Key Signature Verifier",
    deliverables: ["crypto_vault.py implementing authenticated encryption (AES-GCM)", "cert_validator.py inspecting X.509 certificate chains"],
    definitionOfDone: ["All encryption operations utilize unique random nonces/IVs without reuse", "Password hashing uses Argon2id with calibrated memory and time parameters"],
    estimatedStudyHours: 16,
    recommendedPacing: "1 week at 2.5 hours/day",
  },
  {
    stage: 4,
    title: "Web Application Security & OWASP Top 10 Mitigation",
    skillFocus: "Vulnerability Exploitation Mechanics & Defensive Code Remediation",
    objective: "Identify, exploit in controlled labs, and remediate critical web vulnerabilities: SQLi, XSS, CSRF, SSRF, IDOR, and broken access control.",
    prerequisites: ["Stage 3: Cryptography and Web Fundamentals"],
    prerequisiteChecks: ["Familiarity with HTTP methods, cookies, sessions, and SQL"],
    keyCompetencies: ["SQL Injection remediation with parameterized queries", "Cross-Site Scripting (XSS) defense via context-aware output encoding & CSP", "Server-Side Request Forgery (SSRF) prevention", "Insecure Direct Object References (IDOR) access control guards"],
    projectTitle: "OWASP Top 10 Vulnerability Audit & Defense Harness",
    deliverables: ["audit_vulnerabilities.md documenting vulnerability root causes", "remediated_service.py with parameterization and input sanitization"],
    definitionOfDone: ["Remediated service demonstrates 0 successful SQLi or XSS payloads in automated security scan", "All endpoints enforce authorization checks before data access"],
    estimatedStudyHours: 18,
    recommendedPacing: "1.5 weeks at 2 hours/day",
  },
  {
    stage: 5,
    title: "Threat Modeling & Defensive Security Architecture",
    skillFocus: "STRIDE Methodology, Attack Surface Mapping & Zero Trust Design",
    objective: "Model system threats systematically using STRIDE, author data flow diagrams (DFDs), calculate risk scores (DREAD), and design Zero Trust architectures.",
    prerequisites: ["Stage 4: Web Application Security"],
    prerequisiteChecks: ["Experience analyzing multi-tier software architectures"],
    keyCompetencies: ["STRIDE threat categorization (Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation of Privilege)", "Data Flow Diagrams (DFDs) with trust boundaries", "DREAD quantitative risk calculation", "Zero Trust Architecture principles (Never Trust, Always Verify)"],
    projectTitle: "Enterprise E-Commerce Cloud Threat Model Dossier",
    deliverables: ["threat_model_dossier.pdf with trust boundaries and DFDs", "mitigation_matrix.xlsx mapping identified threats to concrete defensive controls"],
    definitionOfDone: ["Threat model documents all entry points, data flows, and external dependencies", "Every identified threat has a mapped engineering mitigation control"],
    estimatedStudyHours: 16,
    recommendedPacing: "1 week at 2.5 hours/day",
  },
  {
    stage: 6,
    title: "Network Defense, Firewalls, IDS/IPS & Systems Hardening",
    skillFocus: "iptables/nftables, Network Segmentation, Snort/Suricata & Defense in Depth",
    objective: "Implement perimeter defense, author stateful firewall rules with nftables, deploy Intrusion Detection Systems (Suricata/Snort), and isolate networks.",
    prerequisites: ["Stage 1: Networking and Stage 2: Linux"],
    prerequisiteChecks: ["Familiarity with IP addresses, CIDR subnets, and ports"],
    keyCompetencies: ["Stateful firewall configuration (nftables / iptables)", "Network segmentation using VLANs and subnets", "Signature-based vs anomaly-based Intrusion Detection (Suricata)", "Defense-in-depth layered architectural controls"],
    projectTitle: "Perimeter Security & Automated Intrusion Detection Lab",
    deliverables: ["nftables.conf implementing default-deny stateful rules", "suricata_rules.rules alerting on malicious port scans and payload patterns"],
    definitionOfDone: ["Firewall enforces default DROP on all ingress traffic with explicit pinholes", "Suricata triggers automated alerts when simulated Nmap port scan is executed"],
    estimatedStudyHours: 18,
    recommendedPacing: "1.5 weeks at 2 hours/day",
  },
  {
    stage: 7,
    title: "Identity, Authentication & Access Control (OAuth2, RBAC, MFA)",
    skillFocus: "OAuth 2.0, OpenID Connect, JWT Security & Role-Based Access Control",
    objective: "Architect robust identity pipelines, secure JSON Web Token (JWT) handling, Role-Based Access Control (RBAC), and Multi-Factor Authentication (MFA).",
    prerequisites: ["Stage 3: Cryptography and Stage 4: Web Security"],
    prerequisiteChecks: ["Understanding of digital signatures and session cookies"],
    keyCompetencies: ["OAuth 2.0 Authorization Code Flow with PKCE", "JWT security: avoiding 'none' algorithm and signature verification", "Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC)", "Time-Based One-Time Password (TOTP) MFA mechanics"],
    projectTitle: "Secure Auth & Authorization Microservice with RBAC & MFA",
    deliverables: ["auth_service.py with JWT verification and PKCE enforcement", "totp_engine.py generating and validating RFC 6238 TOTP codes"],
    definitionOfDone: ["Tokens are validated for expiration, signature, and audience before granting access", "Role permissions are verified defensively at the service boundary"],
    estimatedStudyHours: 18,
    recommendedPacing: "1.5 weeks at 2 hours/day",
  },
  {
    stage: 8,
    title: "Vulnerability Assessment, Auditing & Secure Code Review",
    skillFocus: "Nmap Reconnaissance, SAST / DAST Scanning & Manual Code Review",
    objective: "Conduct authorized security assessments using Nmap port scanning, Static Application Security Testing (Semgrep), and manual secure code audits.",
    prerequisites: ["Stage 4: Web Security and Stage 6: Network Defense"],
    prerequisiteChecks: ["Comfortable reading Python/JavaScript code and running CLI scanners"],
    keyCompetencies: ["Nmap port scanning techniques (SYN scan, version detection, NSE scripts)", "Static Application Security Testing (SAST) with Semgrep", "Dependency vulnerability auditing (pip-audit / npm audit / Trivy)", "Manual secure code auditing methodology"],
    projectTitle: "Comprehensive Vulnerability Assessment & Pen-Test Report",
    deliverables: ["assessment_report.pdf with executive summary and technical findings", "semgrep_rules.yml customized for organizational security policy"],
    definitionOfDone: ["Identifies all critical and high-severity vulnerabilities with reproducible proofs-of-concept", "Provides clear, verified remediation guidance for every finding"],
    estimatedStudyHours: 18,
    recommendedPacing: "1.5 weeks at 2 hours/day",
  },
  {
    stage: 9,
    title: "Incident Response, Security Forensics & SIEM Telemetry",
    skillFocus: "SIEM Log Aggregation (Elasticsearch/Splunk), Memory Forensics & Containment",
    objective: "Investigate security incidents using SIEM log correlation, host forensics, memory analysis with Volatility, and the PICERL incident response lifecycle.",
    prerequisites: ["Stage 2: Linux OS and Stage 6: Network Defense"],
    prerequisiteChecks: ["Knowledge of system logs (/var/log), auth logs, and web server logs"],
    keyCompetencies: ["PICERL Incident Response framework (Preparation, Identification, Containment, Eradication, Recovery, Lessons Learned)", "SIEM query authoring (Elasticsearch KQL / Splunk SPL)", "Log correlation across firewalls, auth services, and web servers", "Memory and filesystem forensic artifact extraction"],
    projectTitle: "Incident Response Triage & Compromise Forensic Investigation",
    deliverables: ["incident_response_playbook.md for ransomware and unauthorized access", "forensic_findings_report.pdf detailing attacker timeline and root cause"],
    definitionOfDone: ["Reconstructs complete attacker timeline from initial breach to data staging", "Playbook defines explicit containment, eradication, and post-mortem procedures"],
    estimatedStudyHours: 20,
    recommendedPacing: "1.5 weeks at 2 hours/day",
  },
  {
    stage: 10,
    title: "Enterprise Security Program & Resilient Defense Capstone",
    skillFocus: "Security Governance, CIS Benchmarks, Disaster Recovery & Defense Capstone",
    objective: "Architect a complete enterprise security program adhering to CIS Critical Security Controls, disaster recovery, security policies, and continuous monitoring.",
    prerequisites: ["Stages 1 through 9"],
    prerequisiteChecks: ["Complete understanding of technical controls and incident response"],
    keyCompetencies: ["CIS Critical Security Controls v8 alignment", "Disaster recovery, immutable backups, and business continuity planning", "Security compliance standards (ISO 27001, SOC 2, HIPAA basics)", "Continuous security posture monitoring and purple teaming"],
    projectTitle: "OmniForge Enterprise Security Architecture & Defense Capstone",
    deliverables: ["Full enterprise security program documentation", "Automated infrastructure security hardening pipeline with GitHub Actions", "Live simulated incident drill and tabletop exercise report"],
    definitionOfDone: ["Program satisfies top 10 CIS control requirements with automated verification", "Disaster recovery plan demonstrates verified recovery time objectives (RTO < 4h)"],
    estimatedStudyHours: 24,
    recommendedPacing: "2 weeks at 2 hours/day",
  },
];

export function getCybersecurityDeepStageContent(stageNum: number): StageContentDetail {
  const stage = CYBERSECURITY_BLUEPRINT_STAGES.find((s) => s.stage === stageNum) || CYBERSECURITY_BLUEPRINT_STAGES[0];
  const title = stage.title;

  return {
    topics: [
      {
        id: `sec_${stageNum}_1`,
        title: `${title}: Core Mechanics & Threat Landscape`,
        completed: false,
        subtopics: [
          `Fundamental attack vectors, exploitation mechanics, and adversary techniques in ${title}`,
          `Protocol specifications, defensive boundaries, and system invariant enforcement`,
          `Edge cases: evasion techniques, obfuscation, and subtle failure modes`,
          `Security engineering standards and relevant industry benchmarks (NIST, CIS, OWASP)`,
          `Defensive toolchains, diagnostic logging, and auditing infrastructure`,
        ],
        explanation:
          `Stage ${stageNum} focuses on ${title}. In information security, defensive controls must be designed with an adversarial mindset. Understanding how threat actors identify weaknesses, bypass superficial filters, and escalate access allows security architects to build layered, resilient defenses where the compromise of a single component does not compromise the entire enterprise.`,
        keySyntaxOrApis: [
          `# Defensive security commands & APIs for Stage ${stageNum}: ${title}`,
          `# iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT`,
          `# openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365`,
        ],
        example: {
          title: `${title} Security Verification Script`,
          description: `Executable script demonstrating security auditing and invariant checking for Stage ${stageNum}.`,
          codeOrWalkthrough:
            `# Python security verification for Stage ${stageNum}: ${title}\nimport hmac\nimport hashlib\n\ndef verify_secure_token(secret: bytes, message: bytes, expected_sig: bytes) -> bool:\n    """Constant-time cryptographic signature verification to prevent timing attacks."""\n    computed = hmac.new(secret, message, hashlib.sha256).digest()\n    return hmac.compare_digest(computed, expected_sig)\n\nif __name__ == "__main__":\n    key = b"super_secure_enterprise_key_2026"\n    payload = b"user_id=42&role=admin"\n    sig = hmac.new(key, payload, hashlib.sha256).digest()\n    assert verify_secure_token(key, payload, sig) is True\n    print("Cryptographic signature verified with constant-time equality check.")`,
        },
        exercise: {
          title: `${title} Practical Defense Lab`,
          prompt: `Implement a defensive validation utility enforcing the security controls of Stage ${stageNum} and test it against simulated malicious payloads.`,
          expectedOutcome: `Utility blocks 100% of malicious test injections while cleanly processing legitimate operations.`,
          starterCode: `# Starter defense script for Stage ${stageNum}\ndef audit_security_control():\n    return {"passed": True, "stage": ${stageNum}}\nprint(audit_security_control())`,
        },
        troubleshooting: [
          `Never compare cryptographic hashes using '==' in security code; always use constant-time hmac.compare_digest() to eliminate timing attacks.`,
          `Ensure security scripts execute with minimum necessary system privileges rather than full root access.`,
        ],
      },
      {
        id: `sec_${stageNum}_2`,
        title: `${title}: Defensive Architecture & Hardening Patterns`,
        completed: false,
        subtopics: [
          `Principle of least privilege and attack surface minimization`,
          `Defense in depth: implementing multiple overlapping defensive barriers`,
          `Input validation, parameterized interfaces, and cryptographic proof of integrity`,
          `Zero Trust networking: verifying explicit identity and health on every transaction`,
          `Fail-secure defaults: ensuring system errors terminate in safe, closed states`,
        ],
        explanation:
          `Defensive security architecture operates on the assumption of breach. Rather than relying solely on perimeter firewalls, modern systems implement Zero Trust principles, verifying cryptographic identity, inspecting payloads, and segmenting workloads. This limits the blast radius of any individual security incident.`,
        keySyntaxOrApis: [
          `// Defensive architecture invariant`,
          `if (!session.hasPermission("admin:write")) { logSecurityAlert(session); return FORBIDDEN; }`,
        ],
        example: {
          title: `${title} Defensive Guard & Access Control Pattern`,
          description: `Demonstrating fail-secure authorization and defense-in-depth verification.`,
          codeOrWalkthrough:
            `# Python role-based access control guard pattern\nclass AccessControlGuard:\n    def __init__(self, authorized_roles: set[str]) -> None:\n        self.authorized_roles = authorized_roles\n\n    def authorize_action(self, user_role: str, action: str) -> bool:\n        if not user_role or user_role not in self.authorized_roles:\n            print(f"[SECURITY ALERT] Unauthorized action '{action}' attempted by role '{user_role}'")\n            return False\n        return True\n\nif __name__ == "__main__":\n    guard = AccessControlGuard({"security_lead", "auditor"})\n    assert guard.authorize_action("security_lead", "audit_logs") is True\n    assert guard.authorize_action("guest", "view_keys") is False\n    print("Access control boundaries verified.")`,
        },
        exercise: {
          title: `${title} Security Architecture Hardening Lab`,
          prompt: `Refactor an insecure service by adding defensive boundary validation, least-privilege role verification, and structured security event logging.`,
          expectedOutcome: `Hardened architecture blocks unauthorized state modification and logs all audit events.`,
        },
        troubleshooting: [
          `Default to 'deny all' and explicitly whitelist only verified, required communication paths.`,
          `Ensure error messages returned to clients do not leak internal stack traces or database schema details.`,
        ],
      },
      {
        id: `sec_${stageNum}_3`,
        title: `${title}: Incident Detection, Auditing & Verification`,
        completed: false,
        subtopics: [
          `Continuous security monitoring, telemetry aggregation, and anomaly detection`,
          `Automated vulnerability assessment with SAST, DAST, and dependency scanning`,
          `Threat hunting methodology: identifying IOCs (Indicators of Compromise)`,
          `Incident response procedures: containment, forensic preservation, and post-mortems`,
          `Compliance mapping to security frameworks (NIST CSF, CIS, ISO 27001)`,
        ],
        explanation:
          `A mature security posture requires continuous auditing and rapid incident detection. Deploying automated vulnerability scanners in CI/CD pipelines catches flaws before production release, while centralized SIEM logging enables security teams to correlate events, detect sophisticated multi-stage intrusions, and respond before data exfiltration occurs.`,
        keySyntaxOrApis: [
          `# Security auditing commands`,
          `# semgrep --config auto .`,
          `# pip-audit --strict`,
        ],
        example: {
          title: `${title} Security Audit Log Parser`,
          description: `Demonstrating log ingestion, detection of anomalous brute-force attempts, and alerting.`,
          codeOrWalkthrough:
            `# Security log analyzer detecting brute force authentication\nfrom collections import Counter\n\ndef detect_brute_force(logs: list[dict[str, str]], threshold: int = 3) -> list[str]:\n    failures = [log["ip"] for log in logs if log.get("status") == "FAIL"]\n    counts = Counter(failures)\n    flagged = [ip for ip, cnt in counts.items() if cnt >= threshold]\n    return flagged\n\nif __name__ == "__main__":\n    sample_logs = [\n        {"ip": "192.168.1.100", "status": "FAIL"},\n        {"ip": "192.168.1.100", "status": "FAIL"},\n        {"ip": "192.168.1.100", "status": "FAIL"},\n        {"ip": "10.0.0.5", "status": "SUCCESS"},\n    ]\n    flagged_ips = detect_brute_force(sample_logs, threshold=3)\n    print("Flagged malicious IPs:", flagged_ips)\n    assert "192.168.1.100" in flagged_ips`,
        },
        exercise: {
          title: `${title} Forensic Investigation & Security Audit Lab`,
          prompt: `Analyze a simulated log file containing network traffic and authentication records, identify the compromised host and attacker IP, and author an incident report.`,
          expectedOutcome: `Investigation identifies exact breach timestamp, attacker entry point, and impacted assets.`,
        },
        troubleshooting: [
          `Ensure system clocks across all servers are synchronized via NTP to enable accurate forensic log correlation.`,
          `Store audit logs in an append-only, tamper-evident repository to prevent attackers from erasing their tracks.`,
        ],
      },
    ],
    commonMistakesAndTroubleshooting: [
      {
        mistake: `Relying on client-side input validation alone without server-side verification`,
        consequence: "Attacks originating from CLI tools (curl, Postman, Burp Suite) bypass client-side checks completely, allowing malicious payloads to reach backend systems.",
        solutionOrFix: "Always enforce strict validation and sanitization on the server side; treat all incoming request data as hostile.",
      },
      {
        mistake: `Storing secrets, API keys, or private certificates in source control repositories`,
        consequence: "Accidental exposure compromises production databases and cloud infrastructure even if the repository is private.",
        solutionOrFix: "Use environment variables, secrets management vaults (HashiCorp Vault, AWS Secrets Manager), and git pre-commit hooks to block committed credentials.",
      },
      {
        mistake: `Using outdated or broken cryptographic algorithms (MD5, SHA1, DES, ECB mode)`,
        consequence: "Hash collisions and mathematical cryptanalysis allow attackers to forge tokens or decrypt sensitive communication.",
        solutionOrFix: "Use modern standards: SHA-256/SHA-3 for hashing, AES-256-GCM for symmetric encryption, and Argon2id for password storage.",
      },
    ],
    knowledgeCheck: [
      {
        question: `What is the primary architectural purpose of the 'Defense in Depth' strategy in Stage ${stageNum}?`,
        options: [
          "To eliminate the need for software testing by buying more hardware",
          "To provide multiple redundant, layered security controls so that if one defensive layer fails, subsequent layers prevent total compromise",
          "To make networking protocols run twice as fast",
          "To encrypt source code so developers cannot read it",
        ],
        answerOrExplanation:
          "Option B: Defense in depth provides multiple layers of security controls throughout an IT system. If a threat actor bypasses the network perimeter firewall, host-based firewalls, authentication checks, least-privilege permissions, and database encryption still protect the underlying sensitive data.",
        solutionRubric: "Candidate must explain multi-layered redundant controls and prevention of single points of failure.",
      },
      {
        question: `How do you systematically investigate and contain an active security incident in Stage ${stageNum}?`,
        answerOrExplanation:
          "Follow the PICERL lifecycle: Identify the scope by analyzing logs and network telemetry, isolate the affected machines from the network to contain lateral movement without rebooting (to preserve volatile RAM forensics), eradicate the attacker's presence, restore from verified clean backups, and conduct a blameless post-mortem.",
        solutionRubric: "Articulates containment without rebooting to preserve memory, eradication, and lessons learned.",
      },
      {
        question: `What distinguishes an enterprise-grade security program from ad-hoc patching in Stage ${stageNum}?`,
        answerOrExplanation:
          "Enterprise security features formal threat modeling (STRIDE), automated SAST/DAST in CI/CD pipelines, centralized SIEM logging and alerting, adherence to CIS Critical Security Controls, formal incident response playbooks, and continuous security audits.",
        solutionRubric: "Identifies threat modeling, automated pipeline scanning, centralized SIEM, and formal playbooks.",
      },
    ],
    completionCriteria: [
      `All Stage ${stageNum} topic checklists verified and thoroughly understood`,
      `Milestone project implemented with zero unhandled security vulnerabilities in automated scans`,
      `Security controls verified using constant-time cryptographic comparisons and fail-secure defaults`,
      `Stage self-assessment knowledge check answered accurately`,
    ],
    freeResources: [
      {
        title: `OWASP Foundation — Open Worldwide Application Security Project`,
        url: "https://owasp.org/",
        platform: "OWASP",
        type: "docs",
        isFree: true,
      },
      {
        title: "Center for Internet Security (CIS) Benchmarks & Controls",
        url: "https://www.cisecurity.org/benchmark",
        platform: "CIS",
        type: "docs",
        isFree: true,
      },
    ],
  };
}
