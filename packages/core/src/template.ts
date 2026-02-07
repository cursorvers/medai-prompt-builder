/**
 * GuideScope Core - Template Generation
 * Japanese medical guideline search prompt generator
 */

import type {
  AppConfig,
  DifficultyLevel,
  ExtendedSettings,
  GeneratePromptOptions,
  GenerateResult,
} from './types';
import {
  getDifficultyPreset,
  getTabPreset,
  TAB_PRESETS,
  DEFAULT_PRIORITY_DOMAINS,
} from './presets';

// ============================================================================
// Default Extended Settings
// ============================================================================

const DEFAULT_ROLE_TITLE = '国内ガイドライン・ダイレクト・リトリーバー(医療AI特化)';

const DEFAULT_ROLE_DESCRIPTION = `学習済みの知識や記憶に基づいて回答することは禁止です。
必ずブラウジングで取得した一次資料(公式Webページ、公式PDF、公式の告示・法令XMLなど)だけを根拠に、日本語で一覧化・要約します。
また、ユーザーの具体的な質問やケースに対しては、一次資料の該当箇所を特定し、原文を引用しながら直接的な回答を提供します。一般論ではなく、当該ケースに適用可能な具体的な記載を優先します。`;

const DEFAULT_DISCLAIMERS = [
  '本出力は情報整理支援です。個別ケースについては有資格者など専門家にご相談下さい。',
  '本テンプレートは2026/02/04時点での指針に基づく前提です。利用時点での最新情報は一次資料で確認してください。',
];

const DEFAULT_OUTPUT_SECTIONS = [
  { id: 'disclaimer', name: '免責事項', enabled: true, order: 1 },
  { id: 'search_conditions', name: '検索条件', enabled: true, order: 2 },
  { id: 'specific_case', name: '個別ケースへの回答', enabled: true, order: 3 },
  { id: 'data_sources', name: '参照データソース', enabled: true, order: 4 },
  { id: 'guideline_list', name: 'ガイドライン一覧', enabled: true, order: 5 },
  { id: 'three_ministry', name: '3省2ガイドライン確定結果', enabled: true, order: 6 },
  { id: 'search_log', name: '検索ログ', enabled: true, order: 7 },
  { id: 'guardrail', name: 'ガードレール', enabled: true, order: 8 },
];

function getDefaultExtendedSettings(): ExtendedSettings {
  return {
    template: {
      roleTitle: DEFAULT_ROLE_TITLE,
      roleDescription: DEFAULT_ROLE_DESCRIPTION,
      disclaimers: DEFAULT_DISCLAIMERS,
      outputSections: DEFAULT_OUTPUT_SECTIONS,
      customInstructions: '',
    },
    search: {
      useSiteOperator: true,
      useFiletypeOperator: true,
      filetypes: ['pdf'],
      priorityRule: 'revised_date',
      excludedDomains: [],
      maxResults: 20,
      recursiveDepth: 2,
    },
    output: {
      languageMode: 'japanese_only',
      includeEnglishTerms: true,
      detailLevel: 'standard',
      eGovCrossReference: false,
      includeLawExcerpts: true,
      outputFormat: 'markdown',
      includeSearchLog: true,
    },
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatList(items: string[], prefix: string = '・'): string {
  if (items.length === 0) return `${prefix}(なし)`;
  return items.map(item => `${prefix}${item}`).join('\n');
}

function filterOutputSectionsForDifficulty(
  sections: ExtendedSettings['template']['outputSections'],
  difficultyLevel: DifficultyLevel
) {
  if (difficultyLevel !== 'standard') return sections;

  // Standard: keep output lightweight and distinct.
  // Still answer the user's question concretely, but keep the rest lean.
  const allowed = new Set(['specific_case', 'guideline_list', 'three_ministry']);
  return sections.map((s) => ({
    ...s,
    enabled: s.enabled && allowed.has(s.id),
  }));
}

function getTodayDate(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

// ============================================================================
// Config Creation
// ============================================================================

export function createConfig(options: GeneratePromptOptions): AppConfig {
  const preset = getTabPreset(options.preset || 'medical-device');
  const date = options.date || getTodayDate();
  const difficulty = options.difficulty || 'standard';

  return {
    dateToday: date,
    query: options.query,
    scope: options.scope || ['医療AI', '医療情報セキュリティ', '医療データ利活用'],
    audiences: options.audiences || ['医療機関'],
    difficultyLevel: difficulty,
    vendorDocText: '',

    threeMinistryGuidelines: true,
    officialDomainPriority: true,
    siteOperator: true,
    latestVersionPriority: true,
    pdfDirectLink: true,
    includeSearchLog: difficulty === 'professional',
    // Keep OFF by default. Enable when explicitly needed for law-article excerpts.
    eGovCrossReference: false,
    proofMode: difficulty === 'professional',

    categories: preset.categories.map(name => ({ name, enabled: true })),
    keywordChips: preset.keywordChips.map(name => ({ name, enabled: true })),
    customKeywords: options.customKeywords || [],
    excludeKeywords: [],

    priorityDomains: options.priorityDomains || [...DEFAULT_PRIORITY_DOMAINS],
    activeTab: options.preset || 'medical-device',
  };
}

// ============================================================================
// Template Building
// ============================================================================

function buildBaseTemplate(extSettings: ExtendedSettings, difficultyLevel: DifficultyLevel): string {
  const { template, output, search } = extSettings;
  const isStandard = difficultyLevel === 'standard';

  // Build Role section
  const roleIntro = 'あなたは、内部知識を一切持たない「' + template.roleTitle + '」です。';
  const cleanedDescription = template.roleDescription
    .replace(/あなたは、内部知識を一切持たない「[^」]+」です。\s*/g, '')
    .trim();

  const roleSection = '# Role\n' + roleIntro + '\n' + cleanedDescription;

  // Build disclaimers section
  const disclaimerSection = `# 注意
${template.disclaimers.map(d => `- ${d}`).join('\n')}`;

  // Build proof section (conditionally included)
  const proofSectionBegin = isStandard ? '' : `PROOF_SECTION_BEGIN
# 実証
以下、実用に耐えうるか実証せよ。プロンプトの指示に従い一次資料を取得し、最後に実証結果として達成事項と制約事項を述べよ。
PROOF_SECTION_END`;

  // Build model definition
  const eGovVariables = output.eGovCrossReference
    ? `

$Law_name$: 法令名
$Law_ID$: e-Gov法令ID
$U_xml$: e-Gov API URL
$U_web$: e-Gov Web URL
$Law_xml$: 取得したXML`
    : '';

  const modelDefinition = isStandard ? '' : `# Model Definition

## Variables
$Date_today$: システムの現在日付(YYYY-MM-DD)
$Query$: ユーザーの探索テーマ
$SpecificQuestion$: ユーザーの具体的な質問やケース
$Scope$: 対象範囲
$Must_keywords$: 必須検索語
$Optional_keywords$: 追加検索語
$Candidate_docs$: 候補文書リスト
$Doc_title$: 文書タイトル
$Issuer$: 発行主体
$Published_date$: 公開日
$Revised_date$: 改定日
$Version$: 版数
$Doc_url$: 公式URL
$Doc_type$: 文書種別
$Fetched_text$: 取得した本文テキスト
$RelevantSection$: 関連する本文箇所
${eGovVariables}`;

  // Build rules section
  let rulesSection = isStandard
    ? `## Rules (Standard)
1. ゼロ知識
   ・一次資料を取得する前に、内容を断定しない
   ・一次資料に書かれていないことは「未確認」とする
   ・推測で補完しない

2. 公式優先
   ・根拠は必ず公式一次資料(公式Web/公式PDF)に限定する
   ・同名文書が複数版ある場合、${search.priorityRule === 'revised_date' ? '改定日が最も新しい最新版' : search.priorityRule === 'published_date' ? '公開日が最も新しい版' : '関連度が最も高い版'}を優先する
   ・個人情報/同意/匿名化/二次利用が論点に含まれる場合は、個人情報保護法(APPI)と個人情報保護委員会のガイドラインも一次資料で確認する
   ・優先ドメイン:
[[PRIORITY_DOMAINS_LIST]]

3. 出力
   ・重要ポイントだけを短く箇条書きでまとめる
   ・**最初の出力ブロックは必ず「■ サマリー」から開始する**
   ・URLは必ず Markdown の [表示ラベル](URL) 形式で提示する`
    : `## Rules (Strict Logic)
1. ゼロ知識
   ・一次資料を取得する前に、内容を断定しない
   ・一次資料に書かれていないことは「不明」とする
   ・推測で補完しない

2. 公式優先
   ・候補発見のために一般サイトを使ってよいが、内容の根拠は必ず公式一次資料に限る
   ・公式一次資料に到達できない場合は「公式資料未確認」と明記し、要約はしない
   ・優先ドメイン:
[[PRIORITY_DOMAINS_LIST]]`;

  if (isStandard) {
    const languagePhrase =
      output.languageMode === 'japanese_only'
        ? '日本語を基本とする'
        : output.languageMode === 'english_priority'
          ? '英語を優先'
          : '日本語を基本とし';

    rulesSection += `

4. 検索語
   ・検索語は${languagePhrase}`;

    if (search.useSiteOperator) {
      rulesSection += `
   ・site: 指定を併用する（例: site:mhlw.go.jp 医療AI ガイドライン）`;
    }

    if (search.useFiletypeOperator && search.filetypes.length > 0) {
      rulesSection += `
   ・filetype: 指定を併用する（例: filetype:${search.filetypes[0]} ガイドライン）`;
    }

    if (search.excludedDomains.length > 0) {
      rulesSection += `

5. 除外
   ・除外ドメイン:
${search.excludedDomains.map(d => `     - ${d}`).join('\n')}`;
    }
  } else {
    if (search.excludedDomains.length > 0) {
      rulesSection += `
   ・除外ドメイン:
${search.excludedDomains.map(d => `     - ${d}`).join('\n')}`;
    }

    rulesSection += `

3. 個別ケースへの対応
   ・$SpecificQuestion$ が与えられた場合、一般論ではなく当該ケースに直接適用可能な条文・記載を特定する
   ・該当箇所は「○○ガイドライン 第X章 X.X節 pXX」のように具体的に引用する

4. 版管理
   ・同名文書が複数版ある場合、${search.priorityRule === 'revised_date' ? '改定日が最も新しい最新版' : search.priorityRule === 'published_date' ? '公開日が最も新しい版' : '関連度が最も高い版'}を特定して採用する

5. 出力リンク形式
   ・出力するURLは必ず Markdown の [表示ラベル](URL) 形式で提示する
   ・最初の出力ブロックは必ず「■ サマリー」から開始する（免責や検索条件を先に書かない）

6. 再帰的参照
   ・一次資料内に別の指針、通知、Q&A等が参照されている場合、リンクを辿って同様に取得する${search.recursiveDepth > 0 ? `（最大${search.recursiveDepth}階層まで）` : ''}

7. 回答の具体性
   ・一般論や抽象的な説明を避け、ユーザーの質問に直接答える
   ・引用時は「○○ガイドライン 第X章 X.X節 pXX」のように出典を明記する`;
  }

  // e-Gov section
  const eGovSection = `EGOV_SECTION_BEGIN
8. e-Gov法令取得
   ・文書内に法令が参照されている場合、e-Govで法令IDを特定し、APIで条文を取得する${output.includeLawExcerpts ? '\n   ・該当条文の短い抜粋を含める' : ''}

   API用: https://laws.e-gov.go.jp/api/2/law_data/{$Law_ID}?applicable_date={$Date_today}
   Web用: https://laws.e-gov.go.jp/law/{$Law_ID}
EGOV_SECTION_END`;

  const lawCrossRefPhase = output.eGovCrossReference
    ? `## Phase 4: 法令クロスリファレンス(必要時)
1. 各文書で参照されている主要な法令名を抽出する
2. e-Govで法令IDを特定し、該当条文を取得する`
    : `## Phase 4: 法令クロスリファレンス(必要時)
1. 各文書で参照されている主要な法令名を抽出する
2. 公式一次資料(法令本文、官報、所管省庁の公式ページなど)で該当条文を確認できる場合は、短い抜粋を含める
3. 一次資料で確認できない場合は「一次資料未確認」と明記する`;

  // Build task section
  const taskSection = isStandard
    ? `# Task (Standard)
1. [[QUERY]] について、公式一次資料を中心に${search.maxResults}件まで候補を確認する
2. 重要な一次資料を3〜8件に絞り、要点だけを抽出する（最新版かどうかは明記）
3. 出力は「サマリー」「引用文献」「個別ケースへの回答（簡易）」「ガイドライン一覧」「3省2ガイドライン（要点）」に限定し、短く整理する
4. VendorDoc が (なし) でない場合、契約/仕様の条項を監査観点（保存/学習利用/再委託/監査権/越境移転/削除/ログ/事故対応）で確認し、「記載あり/なし/不明」を短く示す（未記載は確認事項として列挙する）`
    : `# Task

## Phase 1: 探索計画の確定
1. ユーザー入力から $Query と $Scope を整理する
2. $Must_keywords を確定する（3省2ガイドラインを必ず含める）
3. $Optional_keywords を生成する
4. ${search.useSiteOperator ? '優先ドメインに対して site: 指定も併用する' : '優先ドメインを参考に検索する'}

## Phase 2: 候補文書の収集と一次資料取得
1. 検索で見つかった候補を $Candidate_docs に記録する（最大${search.maxResults}件）
2. 各候補について $Doc_url を開き、本文を取得する
3. PDFの場合は本文を読み取り、関係する箇所を特定する

## Phase 3: 必須テーマの確定
1. 「3省2ガイドライン」を構成する文書を確定する
2. 医療AIに関する他の国内ガイドラインも、最新版と根拠URLを確定する

${lawCrossRefPhase}

## Phase 5: 個別ケース分析
1. $Query$ を分解し、直接適用可能な記載を抽出する
2. 該当箇所は原文を引用する
3. VendorDoc が (なし) でない場合（契約書/仕様書監査）:
   ・監査観点（保存/学習利用/再委託/監査権/越境移転/削除/ログ/事故対応）ごとに、契約側の記載（引用）と、対応するガイドライン要求（引用番号付き）を対比して整理する
   ・契約側に明示がない項目は「未記載」として、必要な確認質問を具体的に列挙する`;

  // Build output format section
  const enabledSections = filterOutputSectionsForDifficulty(template.outputSections, difficultyLevel)
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order);

  let outputFormatSection = `# Output Format\n`;
  outputFormatSection += `
【順序厳守】最初の出力ブロックは必ず「■ サマリー」。免責・検索条件などはサマリーの後に出力する。
`;
  const lawSourcesLine = output.eGovCrossReference
    ? '・法令は [XMLデータ(API)](U_xml) と [公式閲覧(e-Gov)](U_web)'
    : '・法令参照が必要な場合は公式一次資料(法令本文/省庁ページ等)を確認する';

  if (difficultyLevel === 'standard') {
    outputFormatSection += `
■ サマリー
結論: （1行で。違反/非違反/判断不能(要確認)のいずれかを明示）
・[[QUERY]]について、まず結論を明記し、次に重要ポイントを3〜5点で整理する
・判断不能(要確認)の場合は、足りない前提条件（例: 外部送信の有無、保存の有無、学習への利用、ログ保持、委託先、患者説明）を3〜6点で列挙する
・VendorDoc が (なし) でない場合、契約/仕様の監査観点（保存/学習利用/再委託/監査権/越境移転/削除/ログ/事故対応）について「記載あり/なし/不明」を短く示し、未記載は確認事項として列挙する
・各ポイントに「文書名 第X章 X.X節 pXX」を付記する
・一次資料未確認の事項は明確に「未確認」とする

■ 引用文献
・参照した一次資料を文書単位で列挙する
・形式: 文書名（発行主体、改定日） [公式ページ](URL) [PDF](URL)
${lawSourcesLine}
`;
  } else {
    outputFormatSection += `
■ サマリー
結論: （1行で。違反/非違反/判断不能(要確認)のいずれかを明示）
・結論と主要ポイントを3〜5点で簡潔に整理する（最初の1項目は結論）
・判断が条件分岐する場合は「分岐条件（例: 外部送信/保存/学習の有無）」を短く併記する
・各ポイントに根拠文書名・章節・ページを併記する
`;
  }

  for (const section of enabledSections) {
    switch (section.id) {
    case 'disclaimer':
      outputFormatSection += `
■ 免責
・本出力は情報整理支援です。個別ケースについては専門家にご相談下さい。
・本出力は[[DATE_TODAY]]時点の取得結果であり、更新があり得るため一次資料で確認すること。
`;
      break;
    case 'search_conditions':
      outputFormatSection += `
■ 検索条件
・日付: [[DATE_TODAY]]
・テーマ: [[QUERY]]
・範囲: [[SCOPE]]
`;
      break;
    case 'data_sources':
      outputFormatSection += `
■ 参照データソース
・各文書について [公式ページ](URL) と [PDF](URL) を列挙
${lawSourcesLine}
`;
      break;
    case 'guideline_list':
      outputFormatSection += `
■ ガイドライン一覧
カテゴリ別に、各文書を整理する
${output.detailLevel === 'concise' ? `・タイトル、発行主体、版数、公式URL` : output.detailLevel === 'detailed' ? `・タイトル、発行主体、文書種別、版数、対象者、医療AIとの関係、関連法令、実務上の重要ポイント` : `・タイトル、発行主体、文書種別、版数、対象者、医療AIとの関係、関連法令`}

カテゴリ例
[[CATEGORIES_LIST]]
`;
      break;
    case 'three_ministry':
      if (difficultyLevel === 'standard') {
        outputFormatSection += `
■ 3省2ガイドライン（要点）
・「医療機関等」向けと「提供事業者」向けの2系統があることを一次資料で確認し、最新版を特定する
・医療機関の運用上の要点（責任分界、委託先管理、クラウド利用、監査ログ）を3〜6点で整理する
`;
        break;
      }
      outputFormatSection += `
■ 3省2ガイドラインの確定結果
・構成文書の対応関係
・対象者の違い
・実務上の重要ポイント
`;
      break;
    case 'specific_case':
      outputFormatSection += difficultyLevel === 'standard'
        ? `
■ 個別ケースへの回答（簡易）
・直接適用可能な一次資料を2〜5点だけ特定し、各点について「原文の短い抜粋」と「今回ケースへの当てはめ」をセットで書く
・判断が分岐する場合は、分岐条件（例: 外部送信/保存/学習の有無）を先に列挙する

【VendorDoc がある場合（契約書/仕様書監査）】
・監査観点（保存/学習利用/再委託/監査権/越境移転/削除/ログ/事故対応）ごとに:
  1) VendorDocの該当箇所（短く引用）
  2) 記載の評価: 記載あり/未記載/曖昧
  3) 追加で確認すべき質問（具体）
`
        : `
■ 個別ケースへの回答
【直接適用可能な規制・ガイドライン】
・根拠文書、該当箇所、原文抜粋、要約

【複数解釈がある場合】
・選択肢と根拠条文

【明示的記載がない場合】
・類似規定の参照と一般原則からの推論
`;
      break;
    case 'search_log':
      if (output.includeSearchLog) {
        outputFormatSection += `
■ 検索ログ
・実際に使った検索語
・参照した公式ドメイン一覧
`;
      }
      break;
    case 'guardrail':
      outputFormatSection += `
# Guardrail
・一次資料を開けない場合は、その旨を明記して推測しない
・出力リンクは必ず [表示ラベル](URL) 形式に統一する
`;
      break;
    }
  }

  // Build input section
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

VendorDoc:
[[VENDOR_DOC]]

Instruction:
次の条件で検索と整理を実行し、SpecificQuestion に対する具体的な回答を提供せよ。`;

  // Build proof result section
  const proofResultSection = isStandard ? '' : `PROOF_SECTION_BEGIN
# 実証結果
本プロンプトが実用に耐えうるかを自己点検し、達成事項と制約事項を述べよ。
PROOF_SECTION_END`;

  // Custom instructions
  const customInstructionsSection = template.customInstructions.trim()
    ? `\n# カスタム指示\n${template.customInstructions}\n`
    : '';

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
    proofResultSection,
  ].join('\n\n');
}

// ============================================================================
// Main Generation Functions
// ============================================================================

/**
 * Generate a prompt from AppConfig
 */
export function generatePromptFromConfig(config: AppConfig, extSettings?: ExtendedSettings): string {
  const settings = extSettings || getDefaultExtendedSettings();

  // Get difficulty preset settings
  const difficultyPreset = getDifficultyPreset(config.difficultyLevel);
  const presetSettings = difficultyPreset.settings;

  // Apply difficulty preset to settings
  const isStandard = config.difficultyLevel === 'standard';
  const adjustedSettings: ExtendedSettings = {
    ...settings,
    output: {
      ...settings.output,
      detailLevel: isStandard ? presetSettings.detailLevel : settings.output.detailLevel,
      eGovCrossReference: isStandard ? presetSettings.eGovCrossReference : config.eGovCrossReference,
      includeLawExcerpts: presetSettings.includeLawExcerpts,
      includeSearchLog: isStandard ? false : config.includeSearchLog,
    },
    search: {
      ...settings.search,
      recursiveDepth: presetSettings.recursiveDepth,
      maxResults: presetSettings.maxResults,
    },
  };

  const effectiveConfig = {
    ...config,
    proofMode: isStandard ? presetSettings.proofMode : config.proofMode,
  };

  let prompt = buildBaseTemplate(adjustedSettings, config.difficultyLevel);

  // Replace placeholders
  prompt = prompt.replace(/\[\[DATE_TODAY\]\]/g, config.dateToday);
  prompt = prompt.replace(/\[\[QUERY\]\]/g, config.query || '(未入力)');

  const specificQuestion = config.query
    ? `「${config.query}」について、適用可能な具体的な条文・記載を特定し、原文を引用して回答せよ`
    : '(未入力)';
  prompt = prompt.replace(/\[\[SPECIFIC_QUESTION\]\]/g, specificQuestion);

  prompt = prompt.replace(/\[\[SCOPE\]\]/g, config.scope.join('、') || '(未指定)');
  prompt = prompt.replace('[[AUDIENCES_LIST]]', formatList(config.audiences));
  prompt = prompt.replace(/\[\[PRIORITY_DOMAINS_LIST\]\]/g, formatList(config.priorityDomains));

  const mustKeywords = ['3省2ガイドライン'];
  prompt = prompt.replace('[[MUST_KEYWORDS_LIST]]', formatList(mustKeywords));

  const optionalKeywords = [
    ...config.keywordChips.filter(k => k.enabled).map(k => k.name),
    ...config.customKeywords.filter(k => k.trim()),
  ];
  prompt = prompt.replace(/\[\[OPTIONAL_KEYWORDS_LIST\]\]/g, formatList(optionalKeywords));
  prompt = prompt.replace('[[EXCLUDE_KEYWORDS_LIST]]', formatList(config.excludeKeywords.filter(k => k.trim())));

  // User-provided document (contract/spec excerpt)
  const vendorDoc = config.vendorDocText?.trim() ? config.vendorDocText.trim() : '(なし)';
  prompt = prompt.replace(/\[\[VENDOR_DOC\]\]/g, vendorDoc);

  const enabledCategories = config.categories.filter(c => c.enabled).map(c => c.name);
  prompt = prompt.replace('[[CATEGORIES_LIST]]', formatList(enabledCategories));

  // Handle e-Gov section
  if (!adjustedSettings.output.eGovCrossReference) {
    prompt = prompt.replace(/EGOV_SECTION_BEGIN[\s\S]*?EGOV_SECTION_END/g, '');
  } else {
    prompt = prompt.replace(/EGOV_SECTION_BEGIN\n?/g, '');
    prompt = prompt.replace(/EGOV_SECTION_END\n?/g, '');
  }

  // Handle proof section
  if (!effectiveConfig.proofMode) {
    prompt = prompt.replace(/PROOF_SECTION_BEGIN[\s\S]*?PROOF_SECTION_END/g, '');
  } else {
    prompt = prompt.replace(/PROOF_SECTION_BEGIN\n?/g, '');
    prompt = prompt.replace(/PROOF_SECTION_END\n?/g, '');
  }

  // Clean up
  prompt = prompt.replace(/\n{3,}/g, '\n\n');

  return prompt.trim();
}

/**
 * Generate search queries from AppConfig
 */
export function generateSearchQueriesFromConfig(config: AppConfig, extSettings?: ExtendedSettings): string[] {
  const settings = extSettings || getDefaultExtendedSettings();
  const queries: string[] = [];

  // 1. Query with 3省2ガイドライン
  queries.push(`3省2ガイドライン ${config.query || '医療AI'} ガイドライン 最新版`);

  // 2. Query with user's search theme
  if (config.query) {
    queries.push(`${config.query} ガイドライン 国内`);
  }

  // 3. Top 5 enabled keyword chips
  const enabledChips = config.keywordChips.filter(k => k.enabled).slice(0, 5);
  enabledChips.forEach(chip => {
    queries.push(chip.name);
  });

  // 4. Site-specific queries
  if (config.officialDomainPriority && settings.search.useSiteOperator) {
    const topDomains = config.priorityDomains.slice(0, 3);
    topDomains.forEach(domain => {
      queries.push(`site:${domain} ${config.query || '医療AI'} ガイドライン`);
    });
  }

  // 5. Filetype-specific queries
  if (settings.search.useFiletypeOperator && settings.search.filetypes.length > 0) {
    const filetypeQuery = settings.search.filetypes.map(ft => `filetype:${ft}`).join(' OR ');
    queries.push(`${config.query || '医療AI'} ガイドライン (${filetypeQuery})`);
  }

  return queries.slice(0, Math.min(10, settings.search.maxResults));
}

// ============================================================================
// Simplified API
// ============================================================================

/**
 * Generate prompt and search queries from simple options
 *
 * @example
 * ```typescript
 * const result = generate({
 *   query: '医療AIの臨床導入における安全管理',
 *   preset: 'clinical-operation',
 *   difficulty: 'professional',
 * });
 *
 * console.log(result.prompt);
 * console.log(result.searchQueries);
 * ```
 */
export function generate(options: GeneratePromptOptions): GenerateResult {
  const config = createConfig(options);
  const prompt = generatePromptFromConfig(config);
  const searchQueries = generateSearchQueriesFromConfig(config);

  return {
    prompt,
    searchQueries,
    config,
  };
}

/**
 * Generate prompt only
 */
export function generatePrompt(options: GeneratePromptOptions): string {
  const config = createConfig(options);
  return generatePromptFromConfig(config);
}

/**
 * Generate search queries only
 */
export function generateSearchQueries(options: GeneratePromptOptions): string[] {
  const config = createConfig(options);
  return generateSearchQueriesFromConfig(config);
}
