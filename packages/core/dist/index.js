// src/presets.ts
var DIFFICULTY_PRESETS = [
  {
    id: "standard",
    name: "\u30B9\u30BF\u30F3\u30C0\u30FC\u30C9",
    description: "\u57FA\u672C\u7684\u306A\u60C5\u5831\u53CE\u96C6\u306B\u6700\u9069",
    features: [
      "\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3\u4E00\u89A7\u306E\u53D6\u5F97",
      "\u6700\u65B0\u7248\u306E\u78BA\u8A8D",
      "\u57FA\u672C\u7684\u306A\u691C\u7D22\uFF0810\u4EF6\u307E\u3067\uFF09"
    ],
    settings: {
      detailLevel: "standard",
      eGovCrossReference: false,
      includeLawExcerpts: false,
      recursiveDepth: 0,
      maxResults: 10,
      proofMode: false
    }
  },
  {
    id: "professional",
    name: "\u30D7\u30ED\u30D5\u30A7\u30C3\u30B7\u30E7\u30CA\u30EB",
    description: "\u8A73\u7D30\u306A\u5206\u6790\u3068\u6CD5\u4EE4\u53C2\u7167",
    features: [
      "e-Gov\u6CD5\u4EE4\u30AF\u30ED\u30B9\u30EA\u30D5\u30A1\u30EC\u30F3\u30B9",
      "\u95A2\u9023\u6587\u66F8\u306E\u518D\u5E30\u7684\u53D6\u5F97\uFF082\u968E\u5C64\uFF09",
      "\u8A73\u7D30\u306A\u6761\u6587\u629C\u7C8B",
      "\u62E1\u5F35\u691C\u7D22\uFF0820\u4EF6\u307E\u3067\uFF09",
      "\u5B9F\u8A3C\u30E2\u30FC\u30C9"
    ],
    settings: {
      detailLevel: "detailed",
      eGovCrossReference: true,
      includeLawExcerpts: true,
      recursiveDepth: 2,
      maxResults: 20,
      proofMode: true
    }
  }
];
function getDifficultyPreset(level) {
  return DIFFICULTY_PRESETS.find((p) => p.id === level) || DIFFICULTY_PRESETS[0];
}
var TAB_PRESETS = [
  {
    id: "medical-device",
    name: "\u533B\u7642\u6A5F\u5668\u958B\u767A\u5BC4\u308A",
    categories: [
      "\u533B\u7642\u6A5F\u5668\u898F\u5236\u3068SaMD\u3001AI\u533B\u7642\u6A5F\u5668",
      "\u81E8\u5E8A\u8A55\u4FA1\u3068\u6027\u80FD\u8A55\u4FA1",
      "\u54C1\u8CEA\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8\u3068\u30EA\u30B9\u30AF\u7BA1\u7406",
      "\u5E02\u8CA9\u5F8C\u3068\u5909\u66F4\u7BA1\u7406",
      "\u6A2A\u65AD\u7684AI\u30AC\u30D0\u30CA\u30F3\u30B9"
    ],
    keywordChips: [
      "\u533B\u7642AI \u30AC\u30A4\u30C9\u30E9\u30A4\u30F3 \u56FD\u5185",
      "AI \u533B\u7642\u6A5F\u5668 \u30AC\u30A4\u30C9\u30E9\u30A4\u30F3",
      "\u30D7\u30ED\u30B0\u30E9\u30E0\u306E\u533B\u7642\u6A5F\u5668\u8A72\u5F53\u6027\u306B\u95A2\u3059\u308B\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3",
      "SaMD \u627F\u8A8D\u7533\u8ACB \u624B\u5F15\u304D",
      "PMDA \u30D7\u30ED\u30B0\u30E9\u30E0\u533B\u7642\u6A5F\u5668 \u5BE9\u67FB \u624B\u5F15\u304D"
    ]
  },
  {
    id: "clinical-operation",
    name: "\u81E8\u5E8A\u904B\u7528\u5BC4\u308A",
    categories: [
      "\u533B\u7642\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3(3\u77012\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3\u7B49)",
      "\u30AF\u30E9\u30A6\u30C9\u5229\u7528\u3068\u59D4\u8A17\u7BA1\u7406",
      "\u30A2\u30AF\u30BB\u30B9\u5236\u5FA1\u3068\u76E3\u67FB\u30ED\u30B0",
      "\u4E8B\u6545\u5BFE\u5FDC\u3068\u7D99\u7D9A\u904B\u7528",
      "\u6A2A\u65AD\u7684AI\u30AC\u30D0\u30CA\u30F3\u30B9"
    ],
    keywordChips: [
      "\u533B\u7642\u60C5\u5831\u30B7\u30B9\u30C6\u30E0\u306E\u5B89\u5168\u7BA1\u7406\u306B\u95A2\u3059\u308B\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3",
      "\u533B\u7642\u60C5\u5831\u3092\u53D6\u308A\u6271\u3046\u60C5\u5831\u30B7\u30B9\u30C6\u30E0\u30FB\u30B5\u30FC\u30D3\u30B9\u306E\u63D0\u4F9B\u4E8B\u696D\u8005\u306B\u304A\u3051\u308B\u5B89\u5168\u7BA1\u7406\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3",
      "\u533B\u7642 \u751F\u6210AI \u5229\u7528 \u30AC\u30A4\u30C9\u30E9\u30A4\u30F3",
      "\u533B\u7642AI \u30AC\u30A4\u30C9\u30E9\u30A4\u30F3 \u56FD\u5185"
    ]
  },
  {
    id: "research-ethics",
    name: "\u7814\u7A76\u502B\u7406\u5BC4\u308A",
    categories: [
      "\u7814\u7A76\u502B\u7406",
      "\u533B\u7642\u30C7\u30FC\u30BF\u5229\u6D3B\u7528\u3068\u500B\u4EBA\u60C5\u5831\u4FDD\u8B77",
      "\u540C\u610F\u3068\u4E8C\u6B21\u5229\u7528",
      "\u30C7\u30FC\u30BF\u7BA1\u7406\u3068\u533F\u540D\u5316",
      "\u6A2A\u65AD\u7684AI\u30AC\u30D0\u30CA\u30F3\u30B9"
    ],
    keywordChips: [
      "\u533B\u7642\u30C7\u30B8\u30BF\u30EB\u30C7\u30FC\u30BF AI \u7814\u7A76\u958B\u767A \u5229\u6D3B\u7528 \u30AC\u30A4\u30C9\u30E9\u30A4\u30F3",
      "\u533B\u7642AI \u502B\u7406 \u6307\u91DD",
      "\u4EBA\u3092\u5BFE\u8C61\u3068\u3059\u308B\u751F\u547D\u79D1\u5B66\u30FB\u533B\u5B66\u7CFB\u7814\u7A76\u306B\u95A2\u3059\u308B\u502B\u7406\u6307\u91DD",
      "\u500B\u4EBA\u60C5\u5831\u4FDD\u8B77 \u533B\u7642 AI \u4EEE\u540D\u52A0\u5DE5"
    ]
  },
  {
    id: "generative-ai",
    name: "\u751F\u6210AI\u5BC4\u308A",
    categories: [
      "\u751F\u6210AI\u306E\u5229\u7528",
      "\u60C5\u5831\u6F0F\u3048\u3044\u3068\u30C7\u30FC\u30BF\u6301\u3061\u51FA\u3057",
      "\u8AA4\u60C5\u5831\u3068\u8AAC\u660E\u8CAC\u4EFB",
      "\u51FA\u529B\u7269\u306E\u53D6\u6271\u3044",
      "\u6A2A\u65AD\u7684AI\u30AC\u30D0\u30CA\u30F3\u30B9"
    ],
    keywordChips: [
      "\u533B\u7642 \u751F\u6210AI \u5229\u7528 \u30AC\u30A4\u30C9\u30E9\u30A4\u30F3",
      "\u751F\u6210AI \u533B\u7642 \u6587\u66F8 \u4F5C\u6210 \u652F\u63F4 \u6307\u91DD",
      "\u533B\u7642 \u751F\u6210AI \u500B\u4EBA\u60C5\u5831 \u6F0F\u3048\u3044 \u5BFE\u7B56",
      "\u533B\u7642AI \u30AC\u30A4\u30C9\u30E9\u30A4\u30F3 \u56FD\u5185"
    ]
  }
];
function getTabPreset(id) {
  return TAB_PRESETS.find((p) => p.id === id) || TAB_PRESETS[0];
}
var DEFAULT_PRIORITY_DOMAINS = [
  "mhlw.go.jp",
  "meti.go.jp",
  "soumu.go.jp",
  "pmda.go.jp",
  "ipa.go.jp",
  "cas.go.jp",
  "e-gov.go.jp",
  "mext.go.jp",
  "nii.ac.jp"
];
var DEFAULT_SCOPE_OPTIONS = [
  "\u533B\u7642AI",
  "\u751F\u6210AI",
  "SaMD",
  "\u533B\u7642\u60C5\u5831\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3",
  "\u533B\u7642\u30C7\u30FC\u30BF\u5229\u6D3B\u7528",
  "\u7814\u7A76\u502B\u7406"
];
var DEFAULT_AUDIENCE_OPTIONS = [
  "\u533B\u7642\u6A5F\u95A2",
  "\u63D0\u4F9B\u4E8B\u696D\u8005",
  "\u958B\u767A\u4F01\u696D",
  "\u7814\u7A76\u8005",
  "\u5BE9\u67FB\u5BFE\u5FDC"
];

// src/template.ts
var DEFAULT_ROLE_TITLE = "\u56FD\u5185\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3\u30FB\u30C0\u30A4\u30EC\u30AF\u30C8\u30FB\u30EA\u30C8\u30EA\u30FC\u30D0\u30FC(\u533B\u7642AI\u7279\u5316)";
var DEFAULT_ROLE_DESCRIPTION = `\u5B66\u7FD2\u6E08\u307F\u306E\u77E5\u8B58\u3084\u8A18\u61B6\u306B\u57FA\u3065\u3044\u3066\u56DE\u7B54\u3059\u308B\u3053\u3068\u306F\u7981\u6B62\u3067\u3059\u3002
\u5FC5\u305A\u30D6\u30E9\u30A6\u30B8\u30F3\u30B0\u3067\u53D6\u5F97\u3057\u305F\u4E00\u6B21\u8CC7\u6599(\u516C\u5F0FWeb\u30DA\u30FC\u30B8\u3001\u516C\u5F0FPDF\u3001\u516C\u5F0F\u306E\u544A\u793A\u30FB\u6CD5\u4EE4XML\u306A\u3069)\u3060\u3051\u3092\u6839\u62E0\u306B\u3001\u65E5\u672C\u8A9E\u3067\u4E00\u89A7\u5316\u30FB\u8981\u7D04\u3057\u307E\u3059\u3002
\u307E\u305F\u3001\u30E6\u30FC\u30B6\u30FC\u306E\u5177\u4F53\u7684\u306A\u8CEA\u554F\u3084\u30B1\u30FC\u30B9\u306B\u5BFE\u3057\u3066\u306F\u3001\u4E00\u6B21\u8CC7\u6599\u306E\u8A72\u5F53\u7B87\u6240\u3092\u7279\u5B9A\u3057\u3001\u539F\u6587\u3092\u5F15\u7528\u3057\u306A\u304C\u3089\u76F4\u63A5\u7684\u306A\u56DE\u7B54\u3092\u63D0\u4F9B\u3057\u307E\u3059\u3002\u4E00\u822C\u8AD6\u3067\u306F\u306A\u304F\u3001\u5F53\u8A72\u30B1\u30FC\u30B9\u306B\u9069\u7528\u53EF\u80FD\u306A\u5177\u4F53\u7684\u306A\u8A18\u8F09\u3092\u512A\u5148\u3057\u307E\u3059\u3002`;
var DEFAULT_DISCLAIMERS = [
  "\u672C\u51FA\u529B\u306F\u60C5\u5831\u6574\u7406\u652F\u63F4\u3067\u3059\u3002\u500B\u5225\u30B1\u30FC\u30B9\u306B\u3064\u3044\u3066\u306F\u6709\u8CC7\u683C\u8005\u306A\u3069\u5C02\u9580\u5BB6\u306B\u3054\u76F8\u8AC7\u4E0B\u3055\u3044\u3002",
  "\u672C\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u306F2026/02/04\u6642\u70B9\u3067\u306E\u6307\u91DD\u306B\u57FA\u3065\u304F\u524D\u63D0\u3067\u3059\u3002\u5229\u7528\u6642\u70B9\u3067\u306E\u6700\u65B0\u60C5\u5831\u306F\u4E00\u6B21\u8CC7\u6599\u3067\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002"
];
var DEFAULT_OUTPUT_SECTIONS = [
  { id: "disclaimer", name: "\u514D\u8CAC\u4E8B\u9805", enabled: true, order: 1 },
  { id: "search_conditions", name: "\u691C\u7D22\u6761\u4EF6", enabled: true, order: 2 },
  { id: "specific_case", name: "\u500B\u5225\u30B1\u30FC\u30B9\u3078\u306E\u56DE\u7B54", enabled: true, order: 3 },
  { id: "data_sources", name: "\u53C2\u7167\u30C7\u30FC\u30BF\u30BD\u30FC\u30B9", enabled: true, order: 4 },
  { id: "guideline_list", name: "\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3\u4E00\u89A7", enabled: true, order: 5 },
  { id: "three_ministry", name: "3\u77012\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3\u78BA\u5B9A\u7D50\u679C", enabled: true, order: 6 },
  { id: "search_log", name: "\u691C\u7D22\u30ED\u30B0", enabled: true, order: 7 },
  { id: "guardrail", name: "\u30AC\u30FC\u30C9\u30EC\u30FC\u30EB", enabled: true, order: 8 }
];
function getDefaultExtendedSettings() {
  return {
    template: {
      roleTitle: DEFAULT_ROLE_TITLE,
      roleDescription: DEFAULT_ROLE_DESCRIPTION,
      disclaimers: DEFAULT_DISCLAIMERS,
      outputSections: DEFAULT_OUTPUT_SECTIONS,
      customInstructions: ""
    },
    search: {
      useSiteOperator: true,
      useFiletypeOperator: true,
      filetypes: ["pdf"],
      priorityRule: "revised_date",
      excludedDomains: [],
      maxResults: 20,
      recursiveDepth: 2
    },
    output: {
      languageMode: "japanese_only",
      includeEnglishTerms: true,
      detailLevel: "standard",
      eGovCrossReference: false,
      includeLawExcerpts: true,
      outputFormat: "markdown",
      includeSearchLog: true
    }
  };
}
function formatList(items, prefix = "\u30FB") {
  if (items.length === 0) return `${prefix}(\u306A\u3057)`;
  return items.map((item) => `${prefix}${item}`).join("\n");
}
function getTodayDate() {
  const today = /* @__PURE__ */ new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}
function createConfig(options) {
  const preset = getTabPreset(options.preset || "medical-device");
  const date = options.date || getTodayDate();
  return {
    dateToday: date,
    query: options.query,
    scope: options.scope || ["\u533B\u7642AI"],
    audiences: options.audiences || ["\u533B\u7642\u6A5F\u95A2", "\u958B\u767A\u4F01\u696D"],
    difficultyLevel: options.difficulty || "standard",
    threeMinistryGuidelines: true,
    officialDomainPriority: true,
    siteOperator: true,
    latestVersionPriority: true,
    pdfDirectLink: true,
    includeSearchLog: true,
    eGovCrossReference: false,
    proofMode: false,
    categories: preset.categories.map((name) => ({ name, enabled: true })),
    keywordChips: preset.keywordChips.map((name) => ({ name, enabled: true })),
    customKeywords: options.customKeywords || [],
    excludeKeywords: [],
    priorityDomains: options.priorityDomains || [...DEFAULT_PRIORITY_DOMAINS],
    activeTab: options.preset || "medical-device"
  };
}
function buildBaseTemplate(extSettings) {
  const { template, output, search } = extSettings;
  const roleIntro = "\u3042\u306A\u305F\u306F\u3001\u5185\u90E8\u77E5\u8B58\u3092\u4E00\u5207\u6301\u305F\u306A\u3044\u300C" + template.roleTitle + "\u300D\u3067\u3059\u3002";
  const cleanedDescription = template.roleDescription.replace(/あなたは、内部知識を一切持たない「[^」]+」です。\s*/g, "").trim();
  const roleSection = "# Role\n" + roleIntro + "\n" + cleanedDescription;
  const disclaimerSection = `# \u6CE8\u610F
${template.disclaimers.map((d) => `- ${d}`).join("\n")}`;
  const proofSectionBegin = `PROOF_SECTION_BEGIN
# \u5B9F\u8A3C
\u4EE5\u4E0B\u3001\u5B9F\u7528\u306B\u8010\u3048\u3046\u308B\u304B\u5B9F\u8A3C\u305B\u3088\u3002\u30D7\u30ED\u30F3\u30D7\u30C8\u306E\u6307\u793A\u306B\u5F93\u3044\u4E00\u6B21\u8CC7\u6599\u3092\u53D6\u5F97\u3057\u3001\u6700\u5F8C\u306B\u5B9F\u8A3C\u7D50\u679C\u3068\u3057\u3066\u9054\u6210\u4E8B\u9805\u3068\u5236\u7D04\u4E8B\u9805\u3092\u8FF0\u3079\u3088\u3002
PROOF_SECTION_END`;
  const modelDefinition = `# Model Definition

## Variables
$Date_today$: \u30B7\u30B9\u30C6\u30E0\u306E\u73FE\u5728\u65E5\u4ED8(YYYY-MM-DD)
$Query$: \u30E6\u30FC\u30B6\u30FC\u306E\u63A2\u7D22\u30C6\u30FC\u30DE
$SpecificQuestion$: \u30E6\u30FC\u30B6\u30FC\u306E\u5177\u4F53\u7684\u306A\u8CEA\u554F\u3084\u30B1\u30FC\u30B9
$Scope$: \u5BFE\u8C61\u7BC4\u56F2
$Must_keywords$: \u5FC5\u9808\u691C\u7D22\u8A9E
$Optional_keywords$: \u8FFD\u52A0\u691C\u7D22\u8A9E
$Candidate_docs$: \u5019\u88DC\u6587\u66F8\u30EA\u30B9\u30C8
$Doc_title$: \u6587\u66F8\u30BF\u30A4\u30C8\u30EB
$Issuer$: \u767A\u884C\u4E3B\u4F53
$Published_date$: \u516C\u958B\u65E5
$Revised_date$: \u6539\u5B9A\u65E5
$Version$: \u7248\u6570
$Doc_url$: \u516C\u5F0FURL
$Doc_type$: \u6587\u66F8\u7A2E\u5225
$Fetched_text$: \u53D6\u5F97\u3057\u305F\u672C\u6587\u30C6\u30AD\u30B9\u30C8
$RelevantSection$: \u95A2\u9023\u3059\u308B\u672C\u6587\u7B87\u6240

$Law_name$: \u6CD5\u4EE4\u540D
$Law_ID$: e-Gov\u6CD5\u4EE4ID
$U_xml$: e-Gov API URL
$U_web$: e-Gov Web URL
$Law_xml$: \u53D6\u5F97\u3057\u305FXML`;
  let rulesSection = `## Rules (Strict Logic)
1. \u30BC\u30ED\u77E5\u8B58
   \u30FB\u4E00\u6B21\u8CC7\u6599\u3092\u53D6\u5F97\u3059\u308B\u524D\u306B\u3001\u5185\u5BB9\u3092\u65AD\u5B9A\u3057\u306A\u3044
   \u30FB\u4E00\u6B21\u8CC7\u6599\u306B\u66F8\u304B\u308C\u3066\u3044\u306A\u3044\u3053\u3068\u306F\u300C\u4E0D\u660E\u300D\u3068\u3059\u308B
   \u30FB\u63A8\u6E2C\u3067\u88DC\u5B8C\u3057\u306A\u3044

2. \u516C\u5F0F\u512A\u5148
   \u30FB\u5019\u88DC\u767A\u898B\u306E\u305F\u3081\u306B\u4E00\u822C\u30B5\u30A4\u30C8\u3092\u4F7F\u3063\u3066\u3088\u3044\u304C\u3001\u5185\u5BB9\u306E\u6839\u62E0\u306F\u5FC5\u305A\u516C\u5F0F\u4E00\u6B21\u8CC7\u6599\u306B\u9650\u308B
   \u30FB\u516C\u5F0F\u4E00\u6B21\u8CC7\u6599\u306B\u5230\u9054\u3067\u304D\u306A\u3044\u5834\u5408\u306F\u300C\u516C\u5F0F\u8CC7\u6599\u672A\u78BA\u8A8D\u300D\u3068\u660E\u8A18\u3057\u3001\u8981\u7D04\u306F\u3057\u306A\u3044
   \u30FB\u512A\u5148\u30C9\u30E1\u30A4\u30F3:
[[PRIORITY_DOMAINS_LIST]]`;
  if (search.excludedDomains.length > 0) {
    rulesSection += `
   \u30FB\u9664\u5916\u30C9\u30E1\u30A4\u30F3:
${search.excludedDomains.map((d) => `     - ${d}`).join("\n")}`;
  }
  rulesSection += `

3. \u500B\u5225\u30B1\u30FC\u30B9\u3078\u306E\u5BFE\u5FDC
   \u30FB$SpecificQuestion$ \u304C\u4E0E\u3048\u3089\u308C\u305F\u5834\u5408\u3001\u4E00\u822C\u8AD6\u3067\u306F\u306A\u304F\u5F53\u8A72\u30B1\u30FC\u30B9\u306B\u76F4\u63A5\u9069\u7528\u53EF\u80FD\u306A\u6761\u6587\u30FB\u8A18\u8F09\u3092\u7279\u5B9A\u3059\u308B
   \u30FB\u8A72\u5F53\u7B87\u6240\u306F\u300C\u25CB\u25CB\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3 \u7B2CX\u7AE0 X.X\u7BC0 pXX\u300D\u306E\u3088\u3046\u306B\u5177\u4F53\u7684\u306B\u5F15\u7528\u3059\u308B

4. \u7248\u7BA1\u7406
   \u30FB\u540C\u540D\u6587\u66F8\u304C\u8907\u6570\u7248\u3042\u308B\u5834\u5408\u3001${search.priorityRule === "revised_date" ? "\u6539\u5B9A\u65E5\u304C\u6700\u3082\u65B0\u3057\u3044\u6700\u65B0\u7248" : search.priorityRule === "published_date" ? "\u516C\u958B\u65E5\u304C\u6700\u3082\u65B0\u3057\u3044\u7248" : "\u95A2\u9023\u5EA6\u304C\u6700\u3082\u9AD8\u3044\u7248"}\u3092\u7279\u5B9A\u3057\u3066\u63A1\u7528\u3059\u308B

5. \u51FA\u529B\u30EA\u30F3\u30AF\u5F62\u5F0F
   \u30FB\u51FA\u529B\u3059\u308BURL\u306F\u5FC5\u305A Markdown \u306E [\u8868\u793A\u30E9\u30D9\u30EB](URL) \u5F62\u5F0F\u3067\u63D0\u793A\u3059\u308B

6. \u518D\u5E30\u7684\u53C2\u7167
   \u30FB\u4E00\u6B21\u8CC7\u6599\u5185\u306B\u5225\u306E\u6307\u91DD\u3001\u901A\u77E5\u3001Q&A\u7B49\u304C\u53C2\u7167\u3055\u308C\u3066\u3044\u308B\u5834\u5408\u3001\u30EA\u30F3\u30AF\u3092\u8FBF\u3063\u3066\u540C\u69D8\u306B\u53D6\u5F97\u3059\u308B${search.recursiveDepth > 0 ? `\uFF08\u6700\u5927${search.recursiveDepth}\u968E\u5C64\u307E\u3067\uFF09` : ""}

7. \u56DE\u7B54\u306E\u5177\u4F53\u6027
   \u30FB\u4E00\u822C\u8AD6\u3084\u62BD\u8C61\u7684\u306A\u8AAC\u660E\u3092\u907F\u3051\u3001\u30E6\u30FC\u30B6\u30FC\u306E\u8CEA\u554F\u306B\u76F4\u63A5\u7B54\u3048\u308B
   \u30FB\u5F15\u7528\u6642\u306F\u300C\u25CB\u25CB\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3 \u7B2CX\u7AE0 X.X\u7BC0 pXX\u300D\u306E\u3088\u3046\u306B\u51FA\u5178\u3092\u660E\u8A18\u3059\u308B`;
  const eGovSection = `EGOV_SECTION_BEGIN
8. e-Gov\u6CD5\u4EE4\u53D6\u5F97
   \u30FB\u6587\u66F8\u5185\u306B\u6CD5\u4EE4\u304C\u53C2\u7167\u3055\u308C\u3066\u3044\u308B\u5834\u5408\u3001e-Gov\u3067\u6CD5\u4EE4ID\u3092\u7279\u5B9A\u3057\u3001API\u3067\u6761\u6587\u3092\u53D6\u5F97\u3059\u308B${output.includeLawExcerpts ? "\n   \u30FB\u8A72\u5F53\u6761\u6587\u306E\u77ED\u3044\u629C\u7C8B\u3092\u542B\u3081\u308B" : ""}

   API\u7528: https://laws.e-gov.go.jp/api/2/law_data/{$Law_ID}?applicable_date={$Date_today}
   Web\u7528: https://laws.e-gov.go.jp/law/{$Law_ID}
EGOV_SECTION_END`;
  const taskSection = `# Task

## Phase 1: \u63A2\u7D22\u8A08\u753B\u306E\u78BA\u5B9A
1. \u30E6\u30FC\u30B6\u30FC\u5165\u529B\u304B\u3089 $Query \u3068 $Scope \u3092\u6574\u7406\u3059\u308B
2. $Must_keywords \u3092\u78BA\u5B9A\u3059\u308B\uFF083\u77012\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3\u3092\u5FC5\u305A\u542B\u3081\u308B\uFF09
3. $Optional_keywords \u3092\u751F\u6210\u3059\u308B
4. ${search.useSiteOperator ? "\u512A\u5148\u30C9\u30E1\u30A4\u30F3\u306B\u5BFE\u3057\u3066 site: \u6307\u5B9A\u3082\u4F75\u7528\u3059\u308B" : "\u512A\u5148\u30C9\u30E1\u30A4\u30F3\u3092\u53C2\u8003\u306B\u691C\u7D22\u3059\u308B"}

## Phase 2: \u5019\u88DC\u6587\u66F8\u306E\u53CE\u96C6\u3068\u4E00\u6B21\u8CC7\u6599\u53D6\u5F97
1. \u691C\u7D22\u3067\u898B\u3064\u304B\u3063\u305F\u5019\u88DC\u3092 $Candidate_docs \u306B\u8A18\u9332\u3059\u308B\uFF08\u6700\u5927${search.maxResults}\u4EF6\uFF09
2. \u5404\u5019\u88DC\u306B\u3064\u3044\u3066 $Doc_url \u3092\u958B\u304D\u3001\u672C\u6587\u3092\u53D6\u5F97\u3059\u308B
3. PDF\u306E\u5834\u5408\u306F\u672C\u6587\u3092\u8AAD\u307F\u53D6\u308A\u3001\u95A2\u4FC2\u3059\u308B\u7B87\u6240\u3092\u7279\u5B9A\u3059\u308B

## Phase 3: \u5FC5\u9808\u30C6\u30FC\u30DE\u306E\u78BA\u5B9A
1. \u300C3\u77012\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3\u300D\u3092\u69CB\u6210\u3059\u308B\u6587\u66F8\u3092\u78BA\u5B9A\u3059\u308B
2. \u533B\u7642AI\u306B\u95A2\u3059\u308B\u4ED6\u306E\u56FD\u5185\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3\u3082\u3001\u6700\u65B0\u7248\u3068\u6839\u62E0URL\u3092\u78BA\u5B9A\u3059\u308B

## Phase 4: \u6CD5\u4EE4\u30AF\u30ED\u30B9\u30EA\u30D5\u30A1\u30EC\u30F3\u30B9(\u5FC5\u8981\u6642)
1. \u5404\u6587\u66F8\u3067\u53C2\u7167\u3055\u308C\u3066\u3044\u308B\u4E3B\u8981\u306A\u6CD5\u4EE4\u540D\u3092\u62BD\u51FA\u3059\u308B
2. e-Gov\u3067\u6CD5\u4EE4ID\u3092\u7279\u5B9A\u3057\u3001\u8A72\u5F53\u6761\u6587\u3092\u53D6\u5F97\u3059\u308B

## Phase 5: \u500B\u5225\u30B1\u30FC\u30B9\u5206\u6790
1. $Query$ \u3092\u5206\u89E3\u3057\u3001\u76F4\u63A5\u9069\u7528\u53EF\u80FD\u306A\u8A18\u8F09\u3092\u62BD\u51FA\u3059\u308B
2. \u8A72\u5F53\u7B87\u6240\u306F\u539F\u6587\u3092\u5F15\u7528\u3059\u308B`;
  const enabledSections = template.outputSections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);
  let outputFormatSection = `# Output Format
`;
  for (const section of enabledSections) {
    switch (section.id) {
      case "disclaimer":
        outputFormatSection += `
\u25A0 \u514D\u8CAC
\u30FB\u672C\u51FA\u529B\u306F\u60C5\u5831\u6574\u7406\u652F\u63F4\u3067\u3059\u3002\u500B\u5225\u30B1\u30FC\u30B9\u306B\u3064\u3044\u3066\u306F\u5C02\u9580\u5BB6\u306B\u3054\u76F8\u8AC7\u4E0B\u3055\u3044\u3002
\u30FB\u672C\u51FA\u529B\u306F[[DATE_TODAY]]\u6642\u70B9\u306E\u53D6\u5F97\u7D50\u679C\u3067\u3042\u308A\u3001\u66F4\u65B0\u304C\u3042\u308A\u5F97\u308B\u305F\u3081\u4E00\u6B21\u8CC7\u6599\u3067\u78BA\u8A8D\u3059\u308B\u3053\u3068\u3002
`;
        break;
      case "search_conditions":
        outputFormatSection += `
\u25A0 \u691C\u7D22\u6761\u4EF6
\u30FB\u65E5\u4ED8: [[DATE_TODAY]]
\u30FB\u30C6\u30FC\u30DE: [[QUERY]]
\u30FB\u7BC4\u56F2: [[SCOPE]]
`;
        break;
      case "data_sources":
        outputFormatSection += `
\u25A0 \u53C2\u7167\u30C7\u30FC\u30BF\u30BD\u30FC\u30B9
\u30FB\u5404\u6587\u66F8\u306B\u3064\u3044\u3066 [\u516C\u5F0F\u30DA\u30FC\u30B8](URL) \u3068 [PDF](URL) \u3092\u5217\u6319
\u30FB\u6CD5\u4EE4\u306F [XML\u30C7\u30FC\u30BF(API)](U_xml) \u3068 [\u516C\u5F0F\u95B2\u89A7(e-Gov)](U_web)
`;
        break;
      case "guideline_list":
        outputFormatSection += `
\u25A0 \u30AC\u30A4\u30C9\u30E9\u30A4\u30F3\u4E00\u89A7
\u30AB\u30C6\u30B4\u30EA\u5225\u306B\u3001\u5404\u6587\u66F8\u3092\u6574\u7406\u3059\u308B
${output.detailLevel === "concise" ? `\u30FB\u30BF\u30A4\u30C8\u30EB\u3001\u767A\u884C\u4E3B\u4F53\u3001\u7248\u6570\u3001\u516C\u5F0FURL` : output.detailLevel === "detailed" ? `\u30FB\u30BF\u30A4\u30C8\u30EB\u3001\u767A\u884C\u4E3B\u4F53\u3001\u6587\u66F8\u7A2E\u5225\u3001\u7248\u6570\u3001\u5BFE\u8C61\u8005\u3001\u533B\u7642AI\u3068\u306E\u95A2\u4FC2\u3001\u95A2\u9023\u6CD5\u4EE4\u3001\u5B9F\u52D9\u4E0A\u306E\u91CD\u8981\u30DD\u30A4\u30F3\u30C8` : `\u30FB\u30BF\u30A4\u30C8\u30EB\u3001\u767A\u884C\u4E3B\u4F53\u3001\u6587\u66F8\u7A2E\u5225\u3001\u7248\u6570\u3001\u5BFE\u8C61\u8005\u3001\u533B\u7642AI\u3068\u306E\u95A2\u4FC2\u3001\u95A2\u9023\u6CD5\u4EE4`}

\u30AB\u30C6\u30B4\u30EA\u4F8B
[[CATEGORIES_LIST]]
`;
        break;
      case "three_ministry":
        outputFormatSection += `
\u25A0 3\u77012\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3\u306E\u78BA\u5B9A\u7D50\u679C
\u30FB\u69CB\u6210\u6587\u66F8\u306E\u5BFE\u5FDC\u95A2\u4FC2
\u30FB\u5BFE\u8C61\u8005\u306E\u9055\u3044
\u30FB\u5B9F\u52D9\u4E0A\u306E\u91CD\u8981\u30DD\u30A4\u30F3\u30C8
`;
        break;
      case "specific_case":
        outputFormatSection += `
\u25A0 \u500B\u5225\u30B1\u30FC\u30B9\u3078\u306E\u56DE\u7B54
\u3010\u76F4\u63A5\u9069\u7528\u53EF\u80FD\u306A\u898F\u5236\u30FB\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3\u3011
\u30FB\u6839\u62E0\u6587\u66F8\u3001\u8A72\u5F53\u7B87\u6240\u3001\u539F\u6587\u629C\u7C8B\u3001\u8981\u7D04

\u3010\u8907\u6570\u89E3\u91C8\u304C\u3042\u308B\u5834\u5408\u3011
\u30FB\u9078\u629E\u80A2\u3068\u6839\u62E0\u6761\u6587

\u3010\u660E\u793A\u7684\u8A18\u8F09\u304C\u306A\u3044\u5834\u5408\u3011
\u30FB\u985E\u4F3C\u898F\u5B9A\u306E\u53C2\u7167\u3068\u4E00\u822C\u539F\u5247\u304B\u3089\u306E\u63A8\u8AD6
`;
        break;
      case "search_log":
        if (output.includeSearchLog) {
          outputFormatSection += `
\u25A0 \u691C\u7D22\u30ED\u30B0
\u30FB\u5B9F\u969B\u306B\u4F7F\u3063\u305F\u691C\u7D22\u8A9E
\u30FB\u53C2\u7167\u3057\u305F\u516C\u5F0F\u30C9\u30E1\u30A4\u30F3\u4E00\u89A7
`;
        }
        break;
      case "guardrail":
        outputFormatSection += `
# Guardrail
\u30FB\u4E00\u6B21\u8CC7\u6599\u3092\u958B\u3051\u306A\u3044\u5834\u5408\u306F\u3001\u305D\u306E\u65E8\u3092\u660E\u8A18\u3057\u3066\u63A8\u6E2C\u3057\u306A\u3044
\u30FB\u51FA\u529B\u30EA\u30F3\u30AF\u306F\u5FC5\u305A [\u8868\u793A\u30E9\u30D9\u30EB](URL) \u5F62\u5F0F\u306B\u7D71\u4E00\u3059\u308B
`;
        break;
    }
  }
  const inputSection = `# Input
Date_today: [[DATE_TODAY]]
Query: [[QUERY]]
SpecificQuestion: [[SPECIFIC_QUESTION]]
Scope: [[SCOPE]]

Audiences:
[[AUDIENCES_LIST]]

PriorityDomains:
[[PRIORITY_DOMAINS_LIST]]

Must_keywords:
[[MUST_KEYWORDS_LIST]]

Optional_keywords:
[[OPTIONAL_KEYWORDS_LIST]]

Exclude_keywords:
[[EXCLUDE_KEYWORDS_LIST]]

Instruction:
\u6B21\u306E\u6761\u4EF6\u3067\u691C\u7D22\u3068\u6574\u7406\u3092\u5B9F\u884C\u3057\u3001SpecificQuestion \u306B\u5BFE\u3059\u308B\u5177\u4F53\u7684\u306A\u56DE\u7B54\u3092\u63D0\u4F9B\u305B\u3088\u3002`;
  const proofResultSection = `PROOF_SECTION_BEGIN
# \u5B9F\u8A3C\u7D50\u679C
\u672C\u30D7\u30ED\u30F3\u30D7\u30C8\u304C\u5B9F\u7528\u306B\u8010\u3048\u3046\u308B\u304B\u3092\u81EA\u5DF1\u70B9\u691C\u3057\u3001\u9054\u6210\u4E8B\u9805\u3068\u5236\u7D04\u4E8B\u9805\u3092\u8FF0\u3079\u3088\u3002
PROOF_SECTION_END`;
  const customInstructionsSection = template.customInstructions.trim() ? `
# \u30AB\u30B9\u30BF\u30E0\u6307\u793A
${template.customInstructions}
` : "";
  return [
    roleSection,
    disclaimerSection,
    proofSectionBegin,
    modelDefinition,
    rulesSection,
    eGovSection,
    taskSection,
    outputFormatSection,
    inputSection,
    customInstructionsSection,
    proofResultSection
  ].join("\n\n");
}
function generatePromptFromConfig(config, extSettings) {
  const settings = extSettings || getDefaultExtendedSettings();
  const difficultyPreset = getDifficultyPreset(config.difficultyLevel);
  const presetSettings = difficultyPreset.settings;
  const adjustedSettings = {
    ...settings,
    output: {
      ...settings.output,
      detailLevel: presetSettings.detailLevel,
      eGovCrossReference: presetSettings.eGovCrossReference || config.eGovCrossReference,
      includeLawExcerpts: presetSettings.includeLawExcerpts
    },
    search: {
      ...settings.search,
      recursiveDepth: presetSettings.recursiveDepth,
      maxResults: presetSettings.maxResults
    }
  };
  const effectiveConfig = {
    ...config,
    proofMode: presetSettings.proofMode || config.proofMode
  };
  let prompt = buildBaseTemplate(adjustedSettings);
  prompt = prompt.replace(/\[\[DATE_TODAY\]\]/g, config.dateToday);
  prompt = prompt.replace(/\[\[QUERY\]\]/g, config.query || "(\u672A\u5165\u529B)");
  const specificQuestion = config.query ? `\u300C${config.query}\u300D\u306B\u3064\u3044\u3066\u3001\u9069\u7528\u53EF\u80FD\u306A\u5177\u4F53\u7684\u306A\u6761\u6587\u30FB\u8A18\u8F09\u3092\u7279\u5B9A\u3057\u3001\u539F\u6587\u3092\u5F15\u7528\u3057\u3066\u56DE\u7B54\u305B\u3088` : "(\u672A\u5165\u529B)";
  prompt = prompt.replace(/\[\[SPECIFIC_QUESTION\]\]/g, specificQuestion);
  prompt = prompt.replace(/\[\[SCOPE\]\]/g, config.scope.join("\u3001") || "(\u672A\u6307\u5B9A)");
  prompt = prompt.replace("[[AUDIENCES_LIST]]", formatList(config.audiences));
  prompt = prompt.replace(/\[\[PRIORITY_DOMAINS_LIST\]\]/g, formatList(config.priorityDomains));
  const mustKeywords = ["3\u77012\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3"];
  prompt = prompt.replace("[[MUST_KEYWORDS_LIST]]", formatList(mustKeywords));
  const optionalKeywords = [
    ...config.keywordChips.filter((k) => k.enabled).map((k) => k.name),
    ...config.customKeywords.filter((k) => k.trim())
  ];
  prompt = prompt.replace(/\[\[OPTIONAL_KEYWORDS_LIST\]\]/g, formatList(optionalKeywords));
  prompt = prompt.replace("[[EXCLUDE_KEYWORDS_LIST]]", formatList(config.excludeKeywords.filter((k) => k.trim())));
  const enabledCategories = config.categories.filter((c) => c.enabled).map((c) => c.name);
  prompt = prompt.replace("[[CATEGORIES_LIST]]", formatList(enabledCategories));
  if (!adjustedSettings.output.eGovCrossReference) {
    prompt = prompt.replace(/EGOV_SECTION_BEGIN[\s\S]*?EGOV_SECTION_END/g, "");
  } else {
    prompt = prompt.replace(/EGOV_SECTION_BEGIN\n?/g, "");
    prompt = prompt.replace(/EGOV_SECTION_END\n?/g, "");
  }
  if (!effectiveConfig.proofMode) {
    prompt = prompt.replace(/PROOF_SECTION_BEGIN[\s\S]*?PROOF_SECTION_END/g, "");
  } else {
    prompt = prompt.replace(/PROOF_SECTION_BEGIN\n?/g, "");
    prompt = prompt.replace(/PROOF_SECTION_END\n?/g, "");
  }
  prompt = prompt.replace(/\n{3,}/g, "\n\n");
  return prompt.trim();
}
function generateSearchQueriesFromConfig(config, extSettings) {
  const settings = extSettings || getDefaultExtendedSettings();
  const queries = [];
  queries.push(`3\u77012\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3 ${config.query || "\u533B\u7642AI"} \u30AC\u30A4\u30C9\u30E9\u30A4\u30F3 \u6700\u65B0\u7248`);
  if (config.query) {
    queries.push(`${config.query} \u30AC\u30A4\u30C9\u30E9\u30A4\u30F3 \u56FD\u5185`);
  }
  const enabledChips = config.keywordChips.filter((k) => k.enabled).slice(0, 5);
  enabledChips.forEach((chip) => {
    queries.push(chip.name);
  });
  if (config.officialDomainPriority && settings.search.useSiteOperator) {
    const topDomains = config.priorityDomains.slice(0, 3);
    topDomains.forEach((domain) => {
      queries.push(`site:${domain} ${config.query || "\u533B\u7642AI"} \u30AC\u30A4\u30C9\u30E9\u30A4\u30F3`);
    });
  }
  if (settings.search.useFiletypeOperator && settings.search.filetypes.length > 0) {
    const filetypeQuery = settings.search.filetypes.map((ft) => `filetype:${ft}`).join(" OR ");
    queries.push(`${config.query || "\u533B\u7642AI"} \u30AC\u30A4\u30C9\u30E9\u30A4\u30F3 (${filetypeQuery})`);
  }
  return queries.slice(0, Math.min(10, settings.search.maxResults));
}
function generate(options) {
  const config = createConfig(options);
  const prompt = generatePromptFromConfig(config);
  const searchQueries = generateSearchQueriesFromConfig(config);
  return {
    prompt,
    searchQueries,
    config
  };
}
function generatePrompt(options) {
  const config = createConfig(options);
  return generatePromptFromConfig(config);
}
function generateSearchQueries(options) {
  const config = createConfig(options);
  return generateSearchQueriesFromConfig(config);
}
export {
  DEFAULT_AUDIENCE_OPTIONS,
  DEFAULT_PRIORITY_DOMAINS,
  DEFAULT_SCOPE_OPTIONS,
  DIFFICULTY_PRESETS,
  TAB_PRESETS,
  createConfig,
  generate,
  generatePrompt,
  generatePromptFromConfig,
  generateSearchQueries,
  generateSearchQueriesFromConfig,
  getDifficultyPreset,
  getTabPreset
};
//# sourceMappingURL=index.js.map