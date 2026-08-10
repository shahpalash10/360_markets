export type Language = "EN" | "JA" | "ZH";
export type Currency = "USD" | "JPY" | "CNY";

export interface TranslationDictionary {
  // Global Header & Footer Nav
  navMarketplace: string;
  navProTrading: string;
  navCourses: string;
  navMaterials: string;
  navWebinars: string;
  navTraders: string;
  navTerminal: string;
  navTraderHub: string;
  navCreate: string;
  navAdmin: string;

  // Footer
  footerTagline: string;
  footerStatus: string;
  footerRights: string;
  footerSecNotice: string;
  footerQuickLinks: string;
  footerPlatform: string;
  footerLegal: string;
  footerPrivacy: string;
  footerTerms: string;
  footerDisclaimers: string;

  // Hero Headlines (Pure Stock Focus)
  heroTag: string;
  heroLine1: string;
  heroLine2: string;
  heroLine3: string;
  heroLine4: string;
  heroSub: string;
  btnExploreCourses: string;
  btnBecomeTrader: string;
  btnEnterProMode: string;

  // Key Metrics
  statVerifiedTraders: string;
  statPayoutsToEducators: string;
  statVerificationRate: string;
  statActiveInvestors: string;
  statVerifiedCourses: string;
  statLiveWebinars: string;
  statPlatformSplit: string;

  // Section Headers
  featuredCoursesTitle: string;
  featuredCoursesSub: string;
  materialsTitle: string;
  materialsSub: string;
  webinarsTitle: string;
  webinarsSub: string;
  tradersTitle: string;
  tradersSub: string;
  stockVerificationTitle: string;
  stockVerificationSub: string;

  // PRO Masterclass
  proTitle: string;
  proSub: string;
  proHeroTitle: string;
  proHeroSub: string;
  proTicketPrice: string;
  btnReserveProSeat: string;
  btnEnterProLiveRoom: string;
  proIncludesTitle: string;
  proInc1: string;
  proInc2: string;
  proInc3: string;
  proInc4: string;

  // Marketplace Filters & Labels
  filterAll: string;
  filterCourses: string;
  filterMaterials: string;
  filterWebinars: string;
  filterCategoryAll: string;
  filterLevelAll: string;
  showingItems: string;

  // Stock Courses Data
  course1Title: string;
  course1Sub: string;
  course2Title: string;
  course2Sub: string;
  course3Title: string;
  course3Sub: string;
  course4Title: string;
  course4Sub: string;

  // Stock Material Data
  mat1Title: string;
  mat1Sub: string;
  mat2Title: string;
  mat2Sub: string;
  mat3Title: string;
  mat3Sub: string;
  mat4Title: string;
  mat4Sub: string;

  // Stock Webinars Data
  web1Title: string;
  web1Sub: string;
  web2Title: string;
  web2Sub: string;
  web3Title: string;
  web3Sub: string;

  // Stock Traders Data
  trader1Title: string;
  trader1Bio: string;
  trader2Title: string;
  trader2Bio: string;
  trader3Title: string;
  trader3Bio: string;
  traderInvestorsLabel: string;
  traderCoursesLabel: string;
  traderRatingLabel: string;
  traderCertifiedBadge: string;
  btnViewProfile: string;

  // Investor Terminal
  investorTitle: string;
  investorActiveCourses: string;
  investorProgress: string;
  investorHoursLearned: string;
  investorCertificates: string;
  investorContinueLearning: string;
  investorViewAll: string;

  // Trader Dashboard
  traderTitle: string;
  traderGrossRevenue: string;
  traderSubscribers: string;
  traderSales: string;
  traderAttendees: string;
  traderChartTitle: string;
  traderChartSub: string;

  // Common UI Controls
  btnViewCourse: string;
  btnBuyMaterial: string;
  btnJoinStream: string;
  btnReserveSeat: string;
  searchPlaceholder: string;
  cmdKPlaceholder: string;
}

export const TRANSLATIONS: Record<Language, TranslationDictionary> = {
  EN: {
    navMarketplace: "Marketplace",
    navProTrading: "Pro Live",
    navCourses: "Courses",
    navMaterials: "Code & Models",
    navWebinars: "Webinars",
    navTraders: "Traders",
    navTerminal: "Trader Terminal",
    navTraderHub: "Educator Hub",
    navCreate: "Create Course",
    navAdmin: "Admin",

    footerTagline: "The institutional stock trading knowledge exchange connecting verified quants with stock investors worldwide.",
    footerStatus: "STOCK MARKET DATA FEED: OPERATIONAL",
    footerRights: "ALL RIGHTS RESERVED. FINRA / SEC COMPLIANT PLATFORM.",
    footerSecNotice: "Trading stocks and options carries risk. Past performance does not guarantee future stock returns.",
    footerQuickLinks: "Stock Navigation",
    footerPlatform: "Trading Engine",
    footerLegal: "Compliance & Risk",
    footerPrivacy: "Privacy Policy",
    footerTerms: "Terms of Service",
    footerDisclaimers: "Risk Disclaimers",

    heroTag: "INSTITUTIONAL STOCK TRADING KNOWLEDGE EXCHANGE",
    heroLine1: "THE",
    heroLine2: "MARKETPLACE",
    heroLine3: "FOR",
    heroLine4: "STOCKS & TRADING.",
    heroSub: "Learn stock trading from verified quantitative traders. Access institutional options pricing models, stock backtesting Python scripts, and live US market open sessions.",
    btnExploreCourses: "Explore Stock Courses",
    btnBecomeTrader: "Become a Stock Trader",
    btnEnterProMode: "Enter PRO Live Trading Mode",

    statVerifiedTraders: "Certified Stock Traders",
    statPayoutsToEducators: "Payouts to Stock Educators",
    statVerificationRate: "Verification Rate",
    statActiveInvestors: "Active Stock Investors",
    statVerifiedCourses: "Verified Stock Courses",
    statLiveWebinars: "Live Stock Streams",
    statPlatformSplit: "Trader Revenue Share (80/20)",

    featuredCoursesTitle: "FEATURED STOCK COURSES",
    featuredCoursesSub: "Institutional Stock Curriculum",
    materialsTitle: "TRADING CODE & MODELS MARKETPLACE",
    materialsSub: "Python Engines & Excel Models",
    webinarsTitle: "LIVE US STOCK MARKET STREAMS",
    webinarsSub: "Real-Time Stock Trading Portal",
    tradersTitle: "CERTIFIED STOCK TRADERS",
    tradersSub: "Platform Certified Equity Educators",
    stockVerificationTitle: "LEARN FROM CERTIFIED STOCK TRADERS. VERIFIED ON-CHAIN.",
    stockVerificationSub: "Every stock educator undergoes strict trading record auditing, FINRA/SEC credential verification, and portfolio review.",

    proTitle: "PRO LIVE TRADING MASTERCLASS",
    proSub: "High-Ticket Institutional Cohort Trading",
    proHeroTitle: "REAL-TIME LIVE STOCK TRADING MASTERCLASS.",
    proHeroSub: "Trade live US stock market opens alongside verified quantitative traders. Institutional order book execution, voice Q&A, and live Level-2 depth.",
    proTicketPrice: "$995 / Seat",
    btnReserveProSeat: "Reserve Masterclass Seat — $995",
    btnEnterProLiveRoom: "Enter PRO Live Trading Room →",
    proIncludesTitle: "MASTERCLASS INCLUSIONS",
    proInc1: "Live US Market Open Order Execution",
    proInc2: "Direct Voice Q&A & Raised Hand Queue",
    proInc3: "Institutional Options Volatility Flow",
    proInc4: "Automated Python Backtest Scripts Included",

    filterAll: "ALL STOCK PRODUCTS",
    filterCourses: "STOCK COURSES",
    filterMaterials: "TRADING MODELS",
    filterWebinars: "LIVE STREAMS",
    filterCategoryAll: "All Categories",
    filterLevelAll: "All Skill Levels",
    showingItems: "Showing stock items",

    course1Title: "QUANTITATIVE STOCK TRADING & ALGORITHMS",
    course1Sub: "Learn how to build automated stock trading algorithms from scratch. Covers market microstructure, Level-2 order book execution, and Python backtesting.",
    course2Title: "OPTIONS STRATEGIES & VOLATILITY SURFACES",
    course2Sub: "Master institutional options pricing, Greeks, volatility arbitrage, and risk-neutral hedging strategies.",
    course3Title: "EQUITY RESEARCH & FINANCIAL MODELING (DCF)",
    course3Sub: "Step-by-step masterclass on Wall Street DCF financial valuation, LBO models, and quarterly earnings analysis.",
    course4Title: "HIGH-FREQUENCY STOCK EXECUTION SYSTEMS",
    course4Sub: "Architecting ultra-low latency C++ order matching engines, FIX protocol gateways, and Level-2 stock data processing.",

    mat1Title: "Stock Market Backtesting Python Engine & Order Book Code",
    mat1Sub: "Institutional-grade Python framework featuring Monte Carlo stock simulations, Sharpe ratio calculators, and Level-2 order book execution scripts.",
    mat2Title: "Options Pricing & Black-Scholes Model Excel Workbook",
    mat2Sub: "Complete options valuation spreadsheet with dynamic volatility surface charts, Delta/Gamma risk meters, and earnings straddle models.",
    mat3Title: "Wall Street Equity Valuation & DCF Financial Model (XLSX)",
    mat3Sub: "Institutional financial spreadsheet used by hedge funds to value S&P 500 stocks, build 3-statement forecasts, and model M&A transactions.",
    mat4Title: "Institutional Stock Screening & Technical Setup Guide",
    mat4Sub: "Comprehensive guide detailing momentum stock filters, breakout volume confirmation, and risk management parameters.",

    web1Title: "Live US Stock Market Open Trading Session",
    web1Sub: "Watch Alex Morgan trade the US stock market open live. Real-time order book execution, equity breakouts, and voice Q&A.",
    web2Title: "Stock Volatility & Options Execution Masterclass",
    web2Sub: "Analyzing S&P 500 options order flow, market maker gamma positioning, and automated execution strategies.",
    web3Title: "Equity Earnings Season Trading Playbook",
    web3Sub: "How to trade stock price gaps around quarterly corporate earnings announcements using options straddles.",

    trader1Title: "Ex-Hedge Fund Stock Quant",
    trader1Bio: "Ex-Hedge Fund Quantitative Stock Trader specializing in US equity order execution, algorithmic momentum strategies, and market microstructure.",
    trader2Title: "High-Frequency Equity Strategist",
    trader2Bio: "High-frequency stock trading architect with 12+ years experience in C++ order matching engines and options volatility arbitrage.",
    trader3Title: "Equity Portfolio Manager",
    trader3Bio: "Equity Portfolio Manager & Financial Analyst who has managed over $120M in tech stocks and equity derivatives.",
    traderInvestorsLabel: "INVESTORS",
    traderCoursesLabel: "COURSES",
    traderRatingLabel: "RATING",
    traderCertifiedBadge: "✓ CERTIFIED TRADER",
    btnViewProfile: "View Profile & Courses →",

    investorTitle: "INVESTOR STOCK TERMINAL",
    investorActiveCourses: "Active Stock Courses",
    investorProgress: "Learning Progress",
    investorHoursLearned: "Hours Learned",
    investorCertificates: "Certificates Earned",
    investorContinueLearning: "CONTINUE STOCK LEARNING",
    investorViewAll: "View All Stock Courses →",

    traderTitle: "STOCK TRADER DASHBOARD",
    traderGrossRevenue: "Gross Stock Revenue",
    traderSubscribers: "Stock Subscribers",
    traderSales: "Course Sales",
    traderAttendees: "Live Attendees",
    traderChartTitle: "STOCK REVENUE OVER TIME",
    traderChartSub: "Monthly earnings breakdown after 80/20 platform revenue split.",

    btnViewCourse: "View Course →",
    btnBuyMaterial: "Buy Model →",
    btnJoinStream: "Join Stream →",
    btnReserveSeat: "Reserve Seat →",
    searchPlaceholder: "Search stock courses, traders, models...",
    cmdKPlaceholder: "Search stocks or command (⌘K)...",
  },

  JA: {
    navMarketplace: "マーケット",
    navProTrading: "PRO ライブ",
    navCourses: "コース",
    navMaterials: "モデル・コード",
    navWebinars: "ウェビナー",
    navTraders: "トレーダー",
    navTerminal: "受講生ターミナル",
    navTraderHub: "トレーダーハブ",
    navCreate: "コース作成",
    navAdmin: "管理者",

    footerTagline: "検証されたプロクオンツと世界中の株式投資家を繋ぐ機関投資家レベルの株式トレード知識取引所。",
    footerStatus: "株式市場データフィード: 正常稼働中",
    footerRights: "ALL RIGHTS RESERVED. FINRA / SEC 準拠プラットフォーム。",
    footerSecNotice: "株式およびオプション取引にはリスクが伴います。過去の実績は将来の株式リターンを保証するものではありません。",
    footerQuickLinks: "株式ナビゲーション",
    footerPlatform: "トレードエンジン",
    footerLegal: "コンプライアンス・リスク",
    footerPrivacy: "プライバシーポリシー",
    footerTerms: "利用規約",
    footerDisclaimers: "リスク免責事項",

    heroTag: "次世代株式トレードナレッジプラットフォーム",
    heroLine1: "株式取引と",
    heroLine2: "投資知識の",
    heroLine3: "究極の",
    heroLine4: "分散型市場。",
    heroSub: "検証されたプロクオンツから株式投資を学ぶ。機関投資家レベルのオプション価格モデル、株式バックテストPythonコード、米株寄り付きライブ配信に参加。",
    btnExploreCourses: "株式コースを探す",
    btnBecomeTrader: "株式トレーダーになる",
    btnEnterProMode: "PRO ライブトレード起動",

    statVerifiedTraders: "公認株式トレーダー",
    statPayoutsToEducators: "トレーダーへの総支払額",
    statVerificationRate: "トラックレコード認証率",
    statActiveInvestors: "アクティブ株式投資家",
    statVerifiedCourses: "認証済み株式コース",
    statLiveWebinars: "ライブ株式配信",
    statPlatformSplit: "収益配分 (80/20)",

    featuredCoursesTitle: "注目株式コース一覧",
    featuredCoursesSub: "機関投資家レベルのカリキュラム",
    materialsTitle: "トレードコード・金融モデル市場",
    materialsSub: "Pythonエンジン＆Excelモデル",
    webinarsTitle: "米国株式市場ライブ配信",
    webinarsSub: "リアルタイム株式取引ポータル",
    tradersTitle: "公認株式トレーダーディレクトリ",
    tradersSub: "実績認証済みの株式投資教育家",
    stockVerificationTitle: "検証された公認株式トレーダーから学ぶ。オンチェーン証明付き。",
    stockVerificationSub: "すべての株式講師は厳格な取引履歴の監査、金融ライセンス確認、ポートフォリオ審査をクリアしています。",

    proTitle: "PRO 株式ライブトレード・マスタークラス",
    proSub: "機関投資家向けハイチケット配信",
    proHeroTitle: "リアルタイム株式ライブトレード・マスタークラス。",
    proHeroSub: "プロクオンツとともに米株寄り付きをリアルタイムでトレード。板情報執行、音声質疑応答、Level-2板情報を体験。",
    proTicketPrice: "995ドル / 席",
    btnReserveProSeat: "マスタークラスの席を予約 — 995ドル",
    btnEnterProLiveRoom: "PRO ライブトレードルームに入る →",
    proIncludesTitle: "マスタークラス特典",
    proInc1: "米国株式市場寄り付き実況トレード執行",
    proInc2: "音声質疑応答＆挙手キュー機能",
    proInc3: "機関投資家向けオプション・ボラティリティ・フロー",
    proInc4: "自動株式バックテストPythonスクリプト付属",

    filterAll: "すべての株式商品",
    filterCourses: "株式コース",
    filterMaterials: "トレードモデル",
    filterWebinars: "ライブ配信",
    filterCategoryAll: "全カテゴリー",
    filterLevelAll: "全スキルレベル",
    showingItems: "表示中の株式コンテンツ",

    course1Title: "クオンツ株式投資＆アルゴリズム取引",
    course1Sub: "自動株式トレードアルゴリズムをゼロから構築。板情報（Level-2）、注文執行、Pythonバックテストを網羅。",
    course2Title: "オプション取引戦略＆ボラティリティ曲面",
    course2Sub: "機関投資家水準のオプション価格決定、Greeks、ボラティリティ・アービトラージ、リスク中立ヘッジ戦略をマスター。",
    course3Title: "株式リサーチ＆企業価値評価（金融モデリング）",
    course3Sub: "ウォール街スタイルのDCFモデル、LBOモデル、四半期決算分析を学ぶステップ・バイ・ステップのマスタークラス。",
    course4Title: "高頻度株式トレード執行システム（HFT）",
    course4Sub: "超低遅延C++注文マッチングエンジン、FIXプロトコル・ゲートウェイ、Level-2株式データ処理の設計。",

    mat1Title: "株式トレードPythonバックテストエンジン＆板情報コード",
    mat1Sub: "モンテカルロ株式シミュレーション、シャープレシオ計算機、Level-2板情報執行スクリプトを搭載したプロ仕様フレームワーク。",
    mat2Title: "オプション価格決定＆ブラック・ショールズExcelモデル",
    mat2Sub: "動的ボラティリティ曲面グラフ、Delta/Gammaリスクメーター、決算跨ぎストラドルモデルを含む完全ワークシート。",
    mat3Title: "ウォール街株式評価＆DCF財務モデル（XLSX）",
    mat3Sub: "ヘッジファンドがS&P 500構成銘柄の評価やM&Aモデリングに使用する実践的なExcel財務モデル。",
    mat4Title: "機関投資家仕様の株式スクリーニング＆テクニカルガイド",
    mat4Sub: "モメンタム株フィルター、ブレイクアウト出来高確認、リスク管理パラメータを解説した総合ガイド。",

    web1Title: "米国株式市場寄り付きライブトレード実況",
    web1Sub: "アレックス・モーガンによる米株寄り付きの実況生配信。リアルタイム板情報執行、銘柄ブレイクアウト、音声Q&A。",
    web2Title: "株式ボラティリティ＆オプション執行マスタークラス",
    web2Sub: "S&P 500オプションの注文フロー、マーケットメーカーのガンマポジショニング、自動執行戦略の分析。",
    web3Title: "決算発表シーズン株式トレード攻略法",
    web3Sub: "四半期決算発表前後の株価ギャップをオプションストラドル戦略で取引する実践プレイブック。",

    trader1Title: "元ヘッジファンド株クオンツトレーダー",
    trader1Bio: "米株注文執行、アルゴリズム・モメンタム戦略、板情報ミクロ構造を専門とする元ヘッジファンド・クオンツ。",
    trader2Title: "高頻度株式トレード（HFT）ストラテジスト",
    trader2Bio: "C++注文マッチングエンジンとオプション・ボラティリティ・アービトラージで12年以上の実績を持つHFTアーキテクト。",
    trader3Title: "株式ポートフォリオマネージャー",
    trader3Bio: "1億2000万ドル以上のテック株および株式デリバティブを運用した実績を持つ株式ポートフォリオマネージャー。",
    traderInvestorsLabel: "受講生数",
    traderCoursesLabel: "公開コース",
    traderRatingLabel: "評価",
    traderCertifiedBadge: "✓ 公認株式トレーダー",
    btnViewProfile: "プロフィールとコースを見る →",

    investorTitle: "株式投資家ターミナル",
    investorActiveCourses: "受講中の株式コース",
    investorProgress: "学習進捗率",
    investorHoursLearned: "総学習時間",
    investorCertificates: "獲得済み修了証",
    investorContinueLearning: "株式学習を続ける",
    investorViewAll: "すべての株式コースを見る →",

    traderTitle: "株式トレーダーダッシュボード",
    traderGrossRevenue: "株式売上総額",
    traderSubscribers: "購読受講生数",
    traderSales: "コース販売数",
    traderAttendees: "ライブ参加者数",
    traderChartTitle: "株式売上推移",
    traderChartSub: "プラットフォーム手数料（20%）控除後の月間純利益の内訳。",

    btnViewCourse: "コースを見る →",
    btnBuyMaterial: "モデルを購入 →",
    btnJoinStream: "配信に参加 →",
    btnReserveSeat: "席を予約 →",
    searchPlaceholder: "株式コース、トレーダー、モデルを検索...",
    cmdKPlaceholder: "株式検索またはコマンド (⌘K)...",
  },

  ZH: {
    navMarketplace: "市场",
    navProTrading: "PRO 实盘",
    navCourses: "课程",
    navMaterials: "代码与模型",
    navWebinars: "研讨会",
    navTraders: "导师",
    navTerminal: "学员终端",
    navTraderHub: "导师中心",
    navCreate: "创建课程",
    navAdmin: "管理后台",

    footerTagline: "连接经过验证的机构级量化交易员与全球股票投资者的去中心化知识交易所。",
    footerStatus: "股票市场数据实时行情: 正常运行中",
    footerRights: "版权所有。符合 FINRA / SEC 合规标准平台。",
    footerSecNotice: "股票及期权交易具有风险。过往业绩不代表对未来股票收益的保证。",
    footerQuickLinks: "股票导航",
    footerPlatform: "交易引擎",
    footerLegal: "合规与风险",
    footerPrivacy: "隐私政策",
    footerTerms: "服务条款",
    footerDisclaimers: "风险免责声明",

    heroTag: "下一代股票交易与投资知识交易所",
    heroLine1: "股票交易与",
    heroLine2: "投资智慧的",
    heroLine3: "去中心化",
    heroLine4: "交易市场。",
    heroSub: "向经过交割单验证的量化交易员学习。获取机构级期权定价模型、股票回测Python代码库，并参与美股开盘实盘直播。",
    btnExploreCourses: "探索股票课程",
    btnBecomeTrader: "成为股票导师",
    btnEnterProMode: "进入 PRO 实盘交易",

    statVerifiedTraders: "认证股票导师",
    statPayoutsToEducators: "已给导师分红",
    statVerificationRate: "实盘验证率",
    statActiveInvestors: "活跃股票投资者",
    statVerifiedCourses: "已上线股票课程",
    statLiveWebinars: "实时股票直播",
    statPlatformSplit: "导师分成 (80/20)",

    featuredCoursesTitle: "精选股票课程",
    featuredCoursesSub: "机构级股票交易体系",
    materialsTitle: "交易代码与金融模型市场",
    materialsSub: "Python引擎与Excel模型",
    webinarsTitle: "美股开盘实盘直播",
    webinarsSub: "实时股票交易门户",
    tradersTitle: "官方认证股票导师目录",
    tradersSub: "实盘战绩认证教育家",
    stockVerificationTitle: "向经过验证的认证股票导师学习。区块链存证。",
    stockVerificationSub: "所有股票导师均经过严格的实盘交割单审计、金融从业资质核验与持仓组合审查。",

    proTitle: "PRO 股票实盘交易大师课",
    proSub: "机构级高客单价小班直播",
    proHeroTitle: "实时美股开盘实盘交易大师课。",
    proHeroSub: "与经过认证的量化交易员同步实盘交易美股开盘。观看机构级订单簿挂单、进行语音实时答疑并接入Level-2盘口行情。",
    proTicketPrice: "995美元 / 席位",
    btnReserveProSeat: "预订大师课席位 — 995美元",
    btnEnterProLiveRoom: "进入 PRO 实盘交易室 →",
    proIncludesTitle: "大师课专属权益",
    proInc1: "美股开盘实盘挂单与平仓执行",
    proInc2: "连麦语音实时答疑与举手队列",
    proInc3: "机构级期权波动率暗盘资金流",
    proInc4: "附赠自动化股票回测Python代码",

    filterAll: "所有股票产品",
    filterCourses: "股票课程",
    filterMaterials: "交易模型",
    filterWebinars: "实盘直播",
    filterCategoryAll: "全部分类",
    filterLevelAll: "全部难度",
    showingItems: "显示股票项目",

    course1Title: "量化股票交易与算法策略",
    course1Sub: "从零构建自动化股票交易算法。涵盖市场微观结构、订单簿匹配、与Python策略回测。",
    course2Title: "期权交易策略与波动率曲面",
    course2Sub: "精通机构级期权定价、Greeks希腊字母、波动率套利与风险中性对冲策略。",
    course3Title: "股票研究与估值金融建模（DCF）",
    course3Sub: "华尔街级别的DCF折现现金流估值、LBO杠杆收购模型与财报分析实战大师课。",
    course4Title: "高频股票交易执行系统（HFT）",
    course4Sub: "架构超低延迟C++订单匹配引擎、FIX协议网关与Level-2股票行情数据处理。",

    mat1Title: "股票市场回测Python引擎与订单簿代码库",
    mat1Sub: "包含蒙特卡洛股票模拟、夏普比率计算器与Level-2订单簿执行脚本的机构级Python框架。",
    mat2Title: "期权定价与Black-Scholes模型Excel工作簿",
    mat2Sub: "包含动态波动率曲面图表、Delta/Gamma风险仪表盘与财报跨式套利模型的完整期权估值表。",
    mat3Title: "华尔街股票估值与DCF财务模型（XLSX）",
    mat3Sub: "对冲基金用于评估标普500成分股、构建三张表预测及并购建模的实操Excel财务模型。",
    mat4Title: "机构级股票选股选股与技术面突破指南",
    mat4Sub: "详细讲解动量股筛选器、突破成交量确认与风险控制参数的综合指南。",

    web1Title: "美股开盘实盘交易直播",
    web1Sub: "观摩 Alex Morgan 实盘交易美股开盘。实时订单簿挂单、股票突破信号与语音实时答疑。",
    web2Title: "股票波动率与期权执行大师课",
    web2Sub: "深度剖析标普500期权订单流、做市商Gamma持仓分布与自动化执行策略。",
    web3Title: "美股财报季交易策略指南",
    web3Sub: "如何使用期权跨式组合套利财报发布前后股票价格跳空的实战剧本。",

    trader1Title: "前对冲基金股票量化交易员",
    trader1Bio: "专注于美股订单执行、算法动量策略与市场微观结构的前对冲基金量化交易员。",
    trader2Title: "高频股票交易（HFT）策略专家",
    trader2Bio: "拥有12年以上C++订单匹配引擎与期权波动率套利经验的高频交易架构师。",
    trader3Title: "股票组合基金经理",
    trader3Bio: "管理过超过1.20亿美元科技股及股票衍生品资产的股票组合基金经理与分析师。",
    traderInvestorsLabel: "学员人数",
    traderCoursesLabel: "上线课程",
    traderRatingLabel: "学员评分",
    traderCertifiedBadge: "✓ 官方认证股票导师",
    btnViewProfile: "查看导师主页与课程 →",

    investorTitle: "投资者股票终端",
    investorActiveCourses: "进行中的股票课程",
    investorProgress: "学习总进度",
    investorHoursLearned: "已学习时长",
    investorCertificates: "已获得证书",
    investorContinueLearning: "继续股票学习",
    investorViewAll: "查看所有股票课程 →",

    traderTitle: "股票导师工作台",
    traderGrossRevenue: "股票总收入",
    traderSubscribers: "订阅学员数",
    traderSales: "课程销量",
    traderAttendees: "直播观看人数",
    traderChartTitle: "股票收益趋势",
    traderChartSub: "扣除平台20%分成后的每月净收益明细。",

    btnViewCourse: "查看课程 →",
    btnBuyMaterial: "购买模型 →",
    btnJoinStream: "进入直播 →",
    btnReserveSeat: "预订席位 →",
    searchPlaceholder: "搜索股票课程、导师、模型代码...",
    cmdKPlaceholder: "搜索股票或命令 (按 ⌘K)...",
  },
};
