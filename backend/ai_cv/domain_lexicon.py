"""
domain_lexicon.py

Bổ sung từ khóa cho các ngành CNTT ngoài lập trình (mạng, bảo mật, hệ thống,
đám mây, DBA, QA, BA, UI/UX, dữ liệu/AI, mobile).

Vì sao cần: từ điển gốc (nlp_processor.skill_taxonomy) và CONCEPT_MAP
(career_intelligence) được xây chủ yếu cho lập trình web/backend. CV của người
làm mạng, bảo mật... nhận diện được 0 kỹ năng nên điểm rất thấp dù CV đầy đủ.

Có hai phần, đều CHỈ THÊM (setdefault), không ghi đè mục có sẵn:

  EXTRA_SKILL_TAXONOMY
      alias viết trong CV/JD  ->  tên kỹ năng chuẩn.
      Dùng để nhận diện kỹ năng trong mục Skills và trong JD.

  EXTRA_CONCEPT_MAP
      nhãn yêu cầu của career framework (viết thường)
      ->  danh sách từ khóa cụ thể chứng minh yêu cầu đó.
      Từ khóa trùng tên kỹ năng chuẩn (viết thường) khớp "trực tiếp" trong
      danh sách skill; từ khóa còn lại (kể cả dạng `stem*`) chỉ được tìm trong
      mô tả kinh nghiệm/dự án và cho điểm "một phần".

Quy ước khi thêm alias: tránh từ quá chung chung (vd "sketch", "room",
"precision") vì sẽ nhận diện nhầm trong văn xuôi.
"""

# ---------------------------------------------------------------------------
# 1. Kỹ năng: {Tên chuẩn: [các alias]}
#    (tên chuẩn viết thường cũng tự động là một alias)
# ---------------------------------------------------------------------------
_SKILLS = {
    # ---- Mạng ----
    "TCP/IP": ["tcp/ip", "tcp-ip", "tcp ip"],
    "DNS": ["dns"],
    "DHCP": ["dhcp"],
    "IPv4/IPv6": ["ipv4", "ipv6", "ipv4/ipv6"],
    "Subnetting": ["subnetting", "subnet", "subnets", "cidr"],
    "OSI Model": ["osi model", "osi"],
    "OSPF": ["ospf"],
    "BGP": ["bgp"],
    "EIGRP": ["eigrp"],
    "VLAN": ["vlan", "vlans", "vlan design"],
    "NAT": ["nat"],
    "ACL": ["acl", "acls"],
    "EtherChannel": ["etherchannel", "lacp", "port-channel"],
    "STP": ["stp", "spanning tree", "spanning-tree"],
    "Routing": ["routing", "static routing", "dynamic routing"],
    "Switching": ["switching", "layer 2 switching", "layer 3 switching"],
    "LAN/WAN": ["lan/wan", "lan", "wan", "lan/wi-fi"],
    "SD-WAN": ["sd-wan", "sdwan"],
    "MPLS": ["mpls"],
    "QoS": ["qos"],
    "VPN": ["vpn", "vpns", "site-to-site vpn"],
    "IPsec": ["ipsec"],
    "OpenVPN": ["openvpn"],
    "WireGuard": ["wireguard"],
    "Firewall": ["firewall", "firewalls", "firewall configuration"],
    "FortiGate": ["fortigate", "fortigate firewall", "fortios", "ftg"],
    "Fortinet": ["fortinet"],
    "Palo Alto": ["palo alto", "palo alto networks"],
    "Cisco ASA": ["cisco asa", "asa firewall"],
    "pfSense": ["pfsense"],
    "Cisco": ["cisco", "cisco ios"],
    "MikroTik": ["mikrotik", "routeros"],
    "Juniper": ["juniper", "junos"],
    "Ubiquiti": ["ubiquiti", "unifi"],
    "Wi-Fi": ["wi-fi", "wifi", "wlan", "wireless", "802.11"],
    "Access Point": ["access point", "access points", "ap management"],
    "Load Balancing": ["load balancing", "load balancer", "load balancers"],
    "HAProxy": ["haproxy"],
    "F5": ["f5", "f5 big-ip", "big-ip"],
    "Wireshark": ["wireshark"],
    "Packet Tracer": ["packet tracer"],
    "GNS3": ["gns3"],
    "EVE-NG": ["eve-ng", "eve ng"],
    "SNMP": ["snmp"],
    "NetFlow": ["netflow", "sflow"],
    "Zabbix": ["zabbix"],
    "Nagios": ["nagios"],
    "PRTG": ["prtg"],
    "SolarWinds": ["solarwinds"],
    "Network Monitoring": ["network monitoring"],
    "Network Security": ["network security"],
    "Network Troubleshooting": ["network troubleshooting"],
    "Network Design": ["network design", "network topology"],

    # ---- Bảo mật ----
    "SIEM": ["siem"],
    "Splunk": ["splunk"],
    "Wazuh": ["wazuh"],
    "QRadar": ["qradar"],
    "IDS/IPS": ["ids/ips", "intrusion detection", "intrusion prevention"],
    "Penetration Testing": [
        "penetration testing", "pentest", "pen test", "pentesting",
    ],
    "Vulnerability Assessment": [
        "vulnerability assessment", "vulnerability scanning",
        "vulnerability management",
    ],
    "Nessus": ["nessus"],
    "OpenVAS": ["openvas"],
    "Nmap": ["nmap"],
    "Burp Suite": ["burp suite", "burpsuite"],
    "Metasploit": ["metasploit"],
    "Kali Linux": ["kali linux", "kali"],
    "OWASP": ["owasp", "owasp top 10"],
    "Incident Response": ["incident response", "incident handling"],
    "Threat Hunting": ["threat hunting"],
    "Digital Forensics": ["digital forensics", "dfir"],
    "IAM": ["iam", "identity and access management"],
    "RBAC": ["rbac"],
    "MFA": ["mfa", "2fa", "multi-factor authentication"],
    "SSO": ["sso", "single sign-on"],
    "OAuth": ["oauth", "oauth2"],
    "EDR": ["edr", "crowdstrike"],
    "Encryption": ["encryption", "cryptography"],
    "ISO 27001": ["iso 27001", "iso27001"],
    "NIST": ["nist"],
    "Risk Assessment": ["risk assessment", "risk analysis", "risk management"],
    "Security Monitoring": ["security monitoring"],
    "Access Control": ["access control"],

    # ---- Hệ thống / hạ tầng ----
    "Windows Server": ["windows server"],
    "Active Directory": ["active directory", "ad ds"],
    "Group Policy": ["group policy", "gpo"],
    "PowerShell": ["powershell"],
    "Bash": ["bash", "shell scripting", "shell script"],
    "IIS": ["iis"],
    "VMware": ["vmware", "vsphere", "esxi"],
    "Hyper-V": ["hyper-v", "hyperv"],
    "Proxmox": ["proxmox"],
    "KVM": ["kvm"],
    "VirtualBox": ["virtualbox"],
    "Virtualization": ["virtualization", "virtualisation"],
    "Veeam": ["veeam"],
    "Backup & Recovery": [
        "backup & recovery", "backup and recovery", "backup/restore",
    ],
    "Disaster Recovery": ["disaster recovery"],
    "WSUS": ["wsus"],
    "SCCM": ["sccm", "configmgr"],
    "Intune": ["intune"],
    "Patch Management": ["patch management"],
    "Microsoft 365": ["microsoft 365", "office 365", "o365", "m365"],
    "Exchange Server": ["exchange server"],
    "RAID": ["raid"],
    "LDAP": ["ldap"],
    "Prometheus": ["prometheus"],
    "Grafana": ["grafana"],
    "System Monitoring": ["system monitoring"],

    # ---- DevOps / Cloud ----
    "Terraform": ["terraform"],
    "Ansible": ["ansible"],
    "Jenkins": ["jenkins"],
    "GitHub Actions": ["github actions"],
    "GitLab CI": ["gitlab ci", "gitlab-ci"],
    "ArgoCD": ["argocd", "argo cd"],
    "Helm": ["helm"],
    "CI/CD": ["ci/cd", "cicd"],
    "CloudFormation": ["cloudformation"],
    "CloudWatch": ["cloudwatch"],
    "Datadog": ["datadog"],
    "VPC": ["vpc"],
    "EC2": ["ec2"],
    "S3": ["s3"],
    "Lambda": ["aws lambda"],
    "Auto Scaling": ["auto scaling", "auto-scaling", "autoscaling"],
    "CDN": ["cdn"],
    "Cloudflare": ["cloudflare"],
    "FinOps": ["finops", "cost optimization", "cost optimisation"],

    # ---- Cơ sở dữ liệu ----
    "Replication": ["replication", "database replication"],
    "Sharding": ["sharding"],
    "High Availability": ["high availability", "ha cluster"],
    "Query Optimization": [
        "query optimization", "query optimisation", "query tuning",
    ],
    "Performance Tuning": ["performance tuning", "database tuning"],
    "Indexing": ["indexing"],
    "PL/SQL": ["pl/sql", "plsql"],
    "T-SQL": ["t-sql", "tsql"],
    "Stored Procedures": ["stored procedure", "stored procedures"],
    "ETL": ["etl"],
    "Data Migration": ["data migration"],
    "Database Security": ["database security"],

    # ---- QA ----
    "Selenium": ["selenium"],
    "Cypress": ["cypress"],
    "Playwright": ["playwright"],
    "JMeter": ["jmeter"],
    "Postman": ["postman"],
    "Appium": ["appium"],
    "TestNG": ["testng"],
    "JUnit": ["junit"],
    "pytest": ["pytest"],
    "TestRail": ["testrail"],
    "Jira": ["jira"],
    "Regression Testing": ["regression testing", "regression test"],
    "Test Case Design": ["test case design", "test design"],
    "Test Planning": ["test planning", "test plan"],
    "Automation Testing": ["automation testing", "test automation"],
    "Performance Testing": ["performance testing", "load testing"],
    "Manual Testing": ["manual testing"],
    "Bug Reporting": ["bug reporting", "bug report", "defect reporting"],
    "UAT": ["uat", "user acceptance testing"],

    # ---- BA ----
    "UML": ["uml"],
    "BPMN": ["bpmn"],
    "Use Case": ["use case", "use cases", "use-case"],
    "User Story": ["user story", "user stories"],
    "Business Process Analysis": [
        "business process analysis", "business process modeling",
    ],
    "Process Modeling": ["process modeling", "process modelling"],
    "Requirement Gathering": [
        "requirement gathering", "requirements gathering",
        "requirements elicitation",
    ],
    "BRD": ["brd"],
    "SRS": ["srs"],
    "Stakeholder Analysis": ["stakeholder analysis", "stakeholder management"],
    "Wireframe": ["wireframe", "wireframes", "wireframing"],
    "Confluence": ["confluence"],
    "Visio": ["visio"],
    "draw.io": ["draw.io", "diagrams.net"],
    "Power BI": ["power bi", "powerbi"],
    "Tableau": ["tableau"],

    # ---- UI/UX ----
    "Figma": ["figma"],
    "Adobe XD": ["adobe xd"],
    "Photoshop": ["photoshop"],
    "Illustrator": ["illustrator"],
    "Prototyping": ["prototyping"],
    "User Research": ["user research", "ux research"],
    "Usability Testing": ["usability testing", "usability test"],
    "Design System": ["design system", "design systems"],
    "Information Architecture": ["information architecture"],
    "Interaction Design": ["interaction design"],
    "Accessibility": ["accessibility", "wcag", "a11y"],
    "User Flow": ["user flow", "user flows"],
    "Persona": ["persona", "personas"],
    "Miro": ["miro"],
    "Zeplin": ["zeplin"],

    # ---- Dữ liệu / AI ----
    "Pandas": ["pandas"],
    "NumPy": ["numpy"],
    "scikit-learn": ["scikit-learn", "sklearn"],
    "TensorFlow": ["tensorflow"],
    "PyTorch": ["pytorch"],
    "Keras": ["keras"],
    "XGBoost": ["xgboost"],
    "Spark": ["spark", "pyspark", "apache spark"],
    "Hadoop": ["hadoop"],
    "Kafka": ["kafka"],
    "Airflow": ["airflow"],
    "dbt": ["dbt"],
    "Snowflake": ["snowflake"],
    "BigQuery": ["bigquery"],
    "Databricks": ["databricks"],
    "MLflow": ["mlflow"],
    "Matplotlib": ["matplotlib"],
    "Seaborn": ["seaborn"],
    "Statistics": ["statistics", "statistical analysis"],
    "Hypothesis Testing": ["hypothesis testing"],
    "Feature Engineering": ["feature engineering"],
    "Data Cleaning": ["data cleaning", "data cleansing", "data wrangling"],
    "Data Preprocessing": ["data preprocessing"],
    "Exploratory Data Analysis": ["exploratory data analysis"],
    "Data Visualization": ["data visualization", "data visualisation"],
    "Model Training": ["model training"],
    "Model Evaluation": ["model evaluation"],
    "Model Deployment": ["model deployment", "model serving"],
    "Model Monitoring": ["model monitoring"],
    "Deep Learning": ["deep learning"],
    "Machine Learning": ["machine learning"],

    # ---- Mobile ----
    "Android": ["android"],
    "iOS": ["ios"],
    "Flutter": ["flutter"],
    "React Native": ["react native"],
    "SwiftUI": ["swiftui"],
    "Jetpack Compose": ["jetpack compose"],
    "Core Data": ["core data"],
    "Realm": ["realm database"],
    "App Store": ["app store"],
    "Google Play": ["google play", "play console"],
    "TestFlight": ["testflight"],
    "Fastlane": ["fastlane"],

    # ---- Công cụ chung ----
    "Trello": ["trello"],
    "Asana": ["asana"],
    "ClickUp": ["clickup"],
    "Azure DevOps": ["azure devops"],
    "PlantUML": ["plantuml"],
    "Lucidchart": ["lucidchart"],
}

EXTRA_SKILL_TAXONOMY = {}
for _canonical, _aliases in _SKILLS.items():
    EXTRA_SKILL_TAXONOMY[_canonical.lower()] = _canonical
    for _alias in _aliases:
        EXTRA_SKILL_TAXONOMY[_alias.lower()] = _canonical


# ---------------------------------------------------------------------------
# 2. Khái niệm: nhãn yêu cầu (viết thường) -> từ khóa chứng minh
#    (khóa là nhãn trong career_framework; dạng `stem*` chỉ dùng cho bằng
#     chứng trong mô tả kinh nghiệm/dự án)
# ---------------------------------------------------------------------------
EXTRA_CONCEPT_MAP = {
    # ---- Công cụ chung (xuất hiện ở mọi ngành) ----
    "testing tools": [
        "jest", "pytest", "junit", "selenium", "cypress", "playwright",
        "postman", "jmeter", "testng", "appium", "mocha", "testrail",
        "k6", "soapui",
    ],
    "architecture tools": [
        "draw.io", "visio", "uml", "plantuml", "lucidchart", "miro",
        "figma", "c4 model", "mermaid", "excalidraw",
    ],
    "planning tools": [
        "jira", "trello", "asana", "confluence", "clickup",
        "azure devops", "github projects", "ms project",
    ],

    # ---- Network Engineer ----
    "networking fundamentals (tcp/ip)": [
        "tcp/ip", "dns", "dhcp", "ipv4/ipv6", "subnetting", "osi model",
        "lan/wan", "routing", "switching", "vlan", "nat",
    ],
    "routing & switching": [
        "routing", "switching", "ospf", "bgp", "eigrp", "vlan", "stp",
        "etherchannel", "cisco", "juniper", "mikrotik",
        "router*", "network switch*", "layer 2", "layer 3",
    ],
    "firewall configuration": [
        "firewall", "fortigate", "fortinet", "palo alto", "cisco asa",
        "pfsense", "acl", "nat", "firewall polic*",
    ],
    "network troubleshooting": [
        "network troubleshooting", "wireshark", "traceroute",
        "packet capture", "network-related issue*", "network issue*",
        "connectivity incident*", "network connectivity",
        "troubleshooting network*",
    ],
    "vpn": ["vpn", "ipsec", "openvpn", "wireguard", "site-to-site"],
    "network security": [
        "network security", "firewall", "ids/ips", "acl", "fortigate",
        "palo alto", "cisco asa", "pfsense", "nmap", "wireshark",
        "access control",
    ],
    "network monitoring": [
        "network monitoring", "snmp", "zabbix", "nagios", "prtg",
        "solarwinds", "netflow", "grafana", "prometheus", "librenms",
    ],
    "lan/wan design": [
        "lan/wan", "vlan", "network design", "subnetting", "sd-wan",
        "mpls", "topology", "network infrastructure", "lan/wi-fi",
        "lan", "wan",
    ],
    "wireless networking": [
        "wi-fi", "access point", "ubiquiti", "wlan", "802.11",
        "wifi*", "wireless*",
    ],
    "load balancing": [
        "load balancing", "haproxy", "f5", "keepalived", "nginx",
        "load balancer*",
    ],

    # ---- Cybersecurity ----
    "risk awareness": [
        "risk assessment", "risk management", "iso 27001", "nist",
        "threat model*", "security polic*",
    ],
    "vulnerability assessment": [
        "vulnerability assessment", "nessus", "openvas", "nmap",
        "vulnerability scan*", "qualys", "cve",
    ],
    "security monitoring": [
        "security monitoring", "siem", "splunk", "wazuh", "qradar",
        "ids/ips", "log analysis", "soc",
    ],
    "incident response": [
        "incident response", "digital forensics", "threat hunting",
        "forensic*", "playbook*", "soar",
    ],
    "access control": [
        "access control", "iam", "rbac", "mfa", "sso", "oauth",
        "active directory", "ldap", "least privilege",
    ],
    "security testing": [
        "penetration testing", "owasp", "burp suite", "metasploit",
        "kali linux", "pentest*", "sast", "dast", "ctf",
    ],

    # ---- System Administrator ----
    "windows server": [
        "windows server", "active directory", "group policy",
        "powershell", "hyper-v", "iis",
    ],
    "server maintenance": [
        "windows server", "bash", "powershell", "linux", "vmware",
        "server maintenance", "server administration", "server operation*",
        "server system*", "patching",
    ],
    "backup & recovery": [
        "backup & recovery", "veeam", "disaster recovery", "backup",
        "restore", "rman", "mysqldump", "pg_dump", "pitr", "rsync",
        "snapshot*", "rto", "rpo",
    ],
    "system monitoring": [
        "system monitoring", "zabbix", "nagios", "prometheus", "grafana",
        "prtg", "datadog", "monitoring",
    ],
    "user & access management": [
        "active directory", "group policy", "ldap", "iam", "rbac", "sso",
        "microsoft 365", "intune", "user management", "access management",
    ],
    "patch management": [
        "patch management", "wsus", "sccm", "intune", "ansible",
        "patching",
    ],
    "virtualization": [
        "virtualization", "vmware", "hyper-v", "proxmox", "kvm",
        "virtualbox",
    ],

    # ---- DevOps / Cloud ----
    "deployment automation": [
        "ci/cd", "jenkins", "github actions", "gitlab ci", "argocd",
        "ansible", "terraform", "helm", "automated deploy*",
    ],
    "cloud architecture": [
        "vpc", "terraform", "cloudformation", "cloud architecture",
        "microservices", "multi-az", "well-architected",
    ],
    "cost optimization": [
        "finops", "cost optimization", "reserved instance*",
        "savings plan*", "cost explorer",
    ],
    "security & iam": [
        "iam", "rbac", "cloud security", "security group*", "kms",
        "waf", "guardduty",
    ],
    "auto-scaling": [
        "auto scaling", "autoscaling", "auto-scaling", "hpa",
        "scale set*",
    ],
    "disaster recovery": [
        "disaster recovery", "backup & recovery", "failover",
        "multi-region", "rto", "rpo", "backup",
    ],
    "cloud monitoring": [
        "cloudwatch", "datadog", "prometheus", "grafana",
        "azure monitor", "cloud monitoring", "new relic",
    ],

    # ---- Database Administrator ----
    "database security": [
        "database security", "encryption", "tde", "privilege*",
        "roles and permissions", "database audit*", "audit log*",
    ],
    "performance tuning": [
        "performance tuning", "query optimization", "indexing",
        "execution plan*", "slow quer*",
    ],
    "query optimization": [
        "query optimization", "performance tuning", "indexing",
        "execution plan*", "explain analyze", "slow quer*",
    ],
    "replication": [
        "replication", "galera", "master-slave", "primary-replica",
        "streaming replication", "mirroring",
    ],
    "high availability": [
        "high availability", "failover", "clustering", "patroni",
        "galera", "always on", "pacemaker",
    ],
    "data migration": [
        "data migration", "etl", "data migrat*", "database migrat*",
        "schema migration*", "ssis", "data import*",
    ],

    # ---- QA ----
    "test case design": [
        "test case design", "boundary value*", "equivalence partition*",
        "test scenario*", "test case*", "test design",
    ],
    "regression testing": [
        "regression testing", "selenium", "cypress", "playwright",
        "automation testing", "regression suite*",
    ],
    "bug reporting": [
        "bug reporting", "jira", "bugzilla", "defect*", "bug report*",
        "bug track*", "issue tracking",
    ],
    "test planning": [
        "test planning", "testrail", "test plan*", "test strateg*",
        "test estimation",
    ],
    "test documentation": [
        "test documentation", "testrail", "test report*", "test case*",
        "test plan*", "test result*",
    ],
    "risk-based testing": [
        "risk-based test*", "risk based test*", "test prioriti*",
        "risk assessment", "risk analysis",
    ],

    # ---- Business Analyst ----
    "business process analysis": [
        "business process analysis", "bpmn", "process improvement",
        "process mapping", "as-is", "to-be", "business process*",
    ],
    "use case": ["use case", "uml", "use case*", "use-case*"],
    "user story": [
        "user story", "acceptance criteria", "backlog", "scrum", "jira",
        "user stor*",
    ],
    "process modeling": [
        "process modeling", "bpmn", "uml", "visio", "draw.io",
        "flowchart*", "swimlane*", "activity diagram*",
    ],
    "requirement validation": [
        "uat", "requirement validation", "requirements validation",
        "acceptance test*", "traceability", "sign-off", "walkthrough*",
        "requirement review*",
    ],
    "stakeholder analysis": [
        "stakeholder analysis", "raci", "stakeholder*",
    ],

    # ---- UI/UX Designer ----
    "user research": [
        "user research", "persona", "user interview*", "survey*",
        "empathy map*", "usability stud*",
    ],
    "information architecture": [
        "information architecture", "user flow", "sitemap*",
        "site map*", "card sorting", "navigation design",
    ],
    "usability testing": [
        "usability testing", "a/b test*", "user testing",
        "heuristic evaluation", "hotjar", "maze",
    ],
    "design systems": [
        "design system", "design token*", "component librar*",
        "style guide*", "storybook", "atomic design",
    ],
    "interaction design": [
        "interaction design", "prototyping", "figma", "adobe xd",
        "micro-interaction*", "framer",
    ],
    "accessibility": ["accessibility", "wcag", "a11y", "aria"],

    # ---- Data Engineer / Data Scientist / ML Engineer ----
    "distributed processing": [
        "spark", "hadoop", "databricks", "flink", "mapreduce", "beam",
        "dask", "kafka",
    ],
    "data quality": [
        "data quality", "great expectations", "data validation",
        "data cleaning", "data profiling", "deequ", "dbt test*",
    ],
    "pipeline monitoring": [
        "airflow", "pipeline monitoring", "grafana", "datadog",
        "prometheus", "alerting", "data observability",
    ],
    "statistics": [
        "statistics", "hypothesis testing", "scipy", "statsmodels",
        "probability", "bayesian", "statistical*",
    ],
    "data cleaning": [
        "data cleaning", "data preprocessing", "pandas", "outlier*",
        "missing value*", "data wrangling",
    ],
    "exploratory data analysis": [
        "exploratory data analysis", "pandas", "matplotlib", "seaborn",
        "data visualization", "plotly", "eda",
    ],
    "hypothesis testing": [
        "hypothesis testing", "a/b test*", "t-test*", "chi-square",
        "p-value*", "anova", "statistical test*",
    ],
    "feature engineering": [
        "feature engineering", "scikit-learn", "feature selection",
        "feature extraction", "feature scaling", "feature store*",
    ],
    "model evaluation": [
        "model evaluation", "cross-validation", "cross validation",
        "confusion matrix", "f1 score", "roc", "auc", "accuracy",
    ],
    "storytelling with data": [
        "data visualization", "power bi", "tableau", "dashboard*",
        "storytelling", "looker", "presentation*",
    ],
    "data preprocessing": [
        "data preprocessing", "data cleaning", "pandas", "tokenization",
        "data augmentation", "preprocess*", "feature scaling",
    ],
    "model training": [
        "model training", "pytorch", "tensorflow", "keras",
        "scikit-learn", "xgboost", "deep learning", "machine learning",
        "fine-tun*", "neural network*", "trained model*", "train model*",
    ],
    "deployment": [
        "model deployment", "mlflow", "fastapi", "sagemaker", "bentoml",
        "onnx", "triton", "kserve", "docker", "model serving",
    ],
    "model monitoring": [
        "model monitoring", "mlflow", "evidently", "wandb", "drift",
        "data drift", "prometheus", "grafana",
    ],

    # ---- Mobile Developer ----
    "ui development": [
        "swiftui", "jetpack compose", "flutter", "react native",
        "android", "ios", "uikit", "storyboard*", "xml layout*",
    ],
    "application lifecycle": [
        "application lifecycle", "app lifecycle", "activity lifecycle",
        "lifecycle", "viewmodel", "state management", "riverpod",
    ],
    "local storage": [
        "sqlite", "core data", "realm", "sharedpreferences",
        "userdefaults", "async storage", "secure storage", "room database",
        "local storage",
    ],
    "app deployment": [
        "app store", "google play", "testflight", "fastlane",
        "app deployment", "code signing", "release build*",
        "firebase app distribution",
    ],
}
