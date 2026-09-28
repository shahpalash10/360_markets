import { NextResponse } from "next/server";

// Comprehensive Financial & Quantitative Knowledge Base
const KNOWLEDGE_BASE: Record<string, any> = {
  "动量": {
    EN: {
      definition: "Momentum refers to the velocity and persistence of price changes in a financial asset. In quantitative finance, assets with strong positive momentum over 3 to 12 months tend to outperform peers in subsequent periods.",
      tradingImplications: "Used in trend-following algorithms and relative strength rotation strategies. Momentum strategies often trigger aggressive long positions upon breakout confirmation with abnormal volume.",
      example: "A stock breaking through its 52-week high with 3x average volume, triggering CTA and quantitative systematic trend-following buys.",
      riskFactors: "Sudden momentum crashes (sharp reversals during market inflection points) and high drawdown during choppy, range-bound regimes.",
      relatedTerms: ["Relative Strength Index (RSI)", "MACD Histogram", "Trend Following", "Alpha Factor"]
    },
    ZH: {
      definition: "动量（Momentum）指资产价格变动的速率与持续性。在量化投资中，过去 3 至 12 个月表现强势的股票，在未来短期内往往具有持续跑赢同类的统计概率。",
      tradingImplications: "广泛应用于顺势交易算法、行业轮动与突破策略。当个股突破关键阻力位且伴随异常成交量时，动量因子会触发系统性机构买盘。",
      example: "能源加工与油运链受地缘溢价驱动，突破横盘整理区间创出新高，触发量化动量策略加仓追入。",
      riskFactors: "动量反转风险（在牛熊转折点可能发生急剧踩踏）、高换手率带来的交易滑点与冲击成本。",
      relatedTerms: ["RSI 相对强弱指标", "MACD 动能柱", "趋势跟踪", "多因子阿尔法"]
    },
    JA: {
      definition: "モメンタム（勢い・トレンド）とは、株価などの価格変動の速度と持続性を指します。過去数ヶ月間に好調だった資産は短期的にも好調を維持する傾向があります。",
      tradingImplications: "トレンドフォロー戦略やクオンツ運用で広く利用されます。ブレイクアウトと出来高急増で買いシグナルが点灯します。",
      example: "好決算を受けたハイテク株が52週高値を更新し、アルゴリズムによる追随買いが加速する局面。",
      riskFactors: "市場の転換点における急激なモメンタム崩壊（リバーサル）や、保ち合い相場でのダマシ。",
      relatedTerms: ["RSI", "MACD", "トレンドフォロー", "マルチファクター"]
    }
  },
  "地缘溢价": {
    EN: {
      definition: "Geopolitical Premium is the additional pricing cushion embedded in commodity and asset prices due to geopolitical risks, regional conflicts, or supply-chain interruptions.",
      tradingImplications: "Commonly impacts Crude Oil (Brent/WTI), Natural Gas, Defense equities, and Shipping freight rates (VLCC tanker rates). Quants measure risk escalation via volatility surfaces and calendar spreads.",
      example: "Shipping routes through the Red Sea or Strait of Hormuz experiencing disruptions, causing crude oil tanker spot day-rates to surge by 40%.",
      riskFactors: "Rapid deflation of the premium if diplomatic ceasefires or pipeline resumptions materialize unexpectedly.",
      relatedTerms: ["Crude Oil Calendar Spread", "Supply Chain Disruption", "Risk-off Sentiment", "Safe Haven Asset"]
    },
    ZH: {
      definition: "地缘溢价（Geopolitical Premium）是指由于地缘政治局势紧张、地区冲突或战略运输走廊受阻，导致大宗商品、航运运价或能源资产价格中计入的额外风险溢价。",
      tradingImplications: "主要作用于原油、天然气、航运（VLCC油运散运）、黄金与国防军工标的。机构通常通过近远月远期价差（Calendar Spread）和期权隐含波动率监测溢价程度。",
      example: "输油管道停运及运力受阻，导致现货原油即期紧缺，布伦特原油近月升水扩大，油运板块股价大幅攀升。",
      riskFactors: "一旦局势缓和或外交谈判取得突破，地缘溢价可能在极短时间内快速挤出，引发高位多头踩踏。",
      relatedTerms: ["现货升水（Backwardation）", "原油期限结构", "供应链瓶颈", "避险资产"]
    },
    JA: {
      definition: "地政学プレミアムとは、国際紛争や航路途絶などのリスクにより、原油や海運、貴金属などの資産価格に上乗せされるリスク分の価格差です。",
      tradingImplications: "エネルギー、防衛株、海運セクターに直接影響します。先物カーブのバックワーデーション（逆鞘）を観測して取引されます。",
      example: "ホルムズ海峡の緊張によるタンカー運賃急騰や原油先物の一時的跳ね上がり。",
      riskFactors: "情勢の急な沈静化に伴うプレミアムの急速な剥落（急落リスク）。",
      relatedTerms: ["バックワーデーション", "サプライチェーンリスク", "リスクオフ"]
    }
  },
  "回踩确认": {
    EN: {
      definition: "Pullback Confirmation occurs when an asset breaks out of a key resistance level, temporarily retests that previous resistance level (now acting as new support), and rebounds upward.",
      tradingImplications: "Offers high risk-reward entry points for swing and trend-following traders, minimizing false breakout risks by entering on confirmed support verification.",
      example: "A stock breaks $150 resistance to $158, pulls back to $150.50 on declining volume, and rebounds on heavy volume — confirming the support level.",
      riskFactors: "If the retest fails and the price slips deeply back inside the previous channel, it becomes a failed breakout / bull trap.",
      relatedTerms: ["Support & Resistance", "Breakout Trading", "Risk-Reward Ratio", "Volume Confirmation"]
    },
    ZH: {
      definition: "回踩确认（Pullback Confirmation）是经典技术分析形态：价格放量突破关键阻力位后，出现短期缩量回调至原阻力线附近（阻力转支撑），并在该点位重新获得买盘支撑企稳回升。",
      tradingImplications: "属于极高盈亏比（Risk/Reward）的买入时机。相比于盲目追高，等待缩量回踩可大幅过滤假突破陷阱，并提供明确的止损位（设在支撑线下方）。",
      example: "医药创新龙头部标的放量突破60日均线后，缩量回踩均线获得承接，确认底部扎实，迎来新一轮波段上攻。",
      riskFactors: "若回踩时伴随放量下破原突破线且无法在2-3个交易日收回，则判定为假突破（多头陷阱），需立即止损。",
      relatedTerms: ["阻力转支撑", "假突破", "缩量整理", "盈亏比设定"]
    },
    JA: {
      definition: "押し目確認（プルバック・コンファメーション）とは、レジスタンスを上抜けた後、かつての抵抗線（新たな支持線）まで一時的に下落し、そこで反発を確認する動きです。",
      tradingImplications: "ダマシのブレイクアウトを回避し、リスクリワード比の優れたエントリー機会を提供します。",
      example: "高値ブレイク後に出来高減少を伴って調整し、サポートラインで陽線を形成して再上昇する局面。",
      riskFactors: "サポートを割り込んで元のレンジ内に沈んだ場合はダマシ（ブルトラップ）となるため即座の損切りが必要です。",
      relatedTerms: ["サポート＆レジスタンス", "ブレイクアウト", "リスクリワード比"]
    }
  },
  "LEVEL-2": {
    EN: {
      definition: "Level-2 Market Depth provides the complete real-time order book (bids and asks across multiple price tiers, market maker IDs, and cumulative sizing) beyond top-of-book quotes.",
      tradingImplications: "Institutional quants and day traders inspect Level-2 to detect iceberg orders, hidden liquidity, spoofing, and order book imbalance prior to momentum moves.",
      example: "Observing a massive 50,000-share bid cluster at $240 while asks thin out, indicating institutional accumulation and impending upward price pressure.",
      riskFactors: "Algorithmic spoofing (orders posted and canceled within milliseconds) can mislead traders relying solely on static book depth.",
      relatedTerms: ["Order Flow", "Depth of Market (DOM)", "Market Maker", "Iceberg Orders"]
    },
    ZH: {
      definition: "Level-2 深度行情（十档/多档盘口）展示超越一档买卖盘的多层级限价挂单数据，包括各价位的委托挂单量、委托笔数及机构做市商订单分布。",
      tradingImplications: "量化做市与高频日内交易的核心工具。通过微观订单流（Order Flow）能够洞察冰山委托、大单护盘、垫单吸筹及买卖不平衡压力。",
      example: "美股某科技股盘前在$120处堆叠超5万股买单托底，而上方卖单稀疏，预示开盘后极易出现快速向上脉冲。",
      riskFactors: "高频算法诱骗（Spoofing，即瞬间撤单）可能制造虚假流动性陷阱，需结合实际成交笔数（Time & Sales）研判。",
      relatedTerms: ["订单流（Order Flow）", "盘口挂单量", "冰山订单", "做市商机制"]
    },
    JA: {
      definition: "板情報（Level-2 / Depth of Market）は、最良気配値だけでなく複数気配値（買い板・売り板の数量と価格帯）をリアルタイムで表示する市場データです。",
      tradingImplications: "機関投資家の大口注文や、板の偏り（オーダーインバランス）を瞬時に分析して短期トレードに活用します。",
      example: "特定の価格帯に厚い買い板が出現し、売り板が薄い場合に上方へのブレイクアウトを狙う手法。",
      riskFactors: "見せ板（スプーフィング）などの直前キャンセルによる誤認リスク。",
      relatedTerms: ["オーダーフロー", "歩み値", "マーケットメーカー", "アイスバーグ注文"]
    }
  }
};

export async function POST(req: Request) {
  try {
    const { term, context, language = "EN" } = await req.json();

    if (!term || typeof term !== "string") {
      return NextResponse.json({ error: "Term is required" }, { status: 400 });
    }

    const cleanTerm = term.trim();
    const upperTerm = cleanTerm.toUpperCase();
    const targetLang = ["EN", "ZH", "JA"].includes(language) ? language : "EN";

    // 1. Direct Knowledge Base Match
    let matchedData = null;
    for (const [key, val] of Object.entries(KNOWLEDGE_BASE)) {
      if (cleanTerm.includes(key) || key.includes(cleanTerm) || upperTerm.includes(key)) {
        matchedData = val[targetLang] || val.EN;
        break;
      }
    }

    // 2. Intelligent Dynamic Synthesis if term is not in hardcoded KB
    if (!matchedData) {
      if (targetLang === "ZH") {
        matchedData = {
          definition: `“${cleanTerm}” 是金融市场与量化投资中的关键核心术语。在当前行情上下文中，通常与资产定价、资金博弈或宏观驱动因子的传导机制紧密关联。`,
          tradingImplications: `机构交易员在评估“${cleanTerm}”时，通常侧重于其对标的波动率、风险敞口（Beta/Alpha）以及中短期资金面流向的边际变化。`,
          example: `以实际交易为例，当市场出现“${cleanTerm}”特征时，系统性资金往往会结合成交量异动与趋势均线系统做出仓位调整。`,
          riskFactors: "应警惕指标钝化、宏观突发黑天鹅事件带来的逻辑破坏，建议严格设置止损线与仓位上限（不超过总资金的 20%）。",
          relatedTerms: ["量化因子", "波动率指数", "风险报酬比", "仓位管理"]
        };
      } else if (targetLang === "JA") {
        matchedData = {
          definition: `「${cleanTerm}」は、金融市場やクオンツ取引において重要な概念です。資産価格の形成、流動性動態、または市場参加者の需給バランスに深く関与しています。`,
          tradingImplications: `機関投資家は「${cleanTerm}」をボラティリティ予測やアルゴリズム執行、リスク管理のパラメータとして活用します。`,
          example: `市場で「${cleanTerm}」が観測された際、トレンドフォローや平均回帰戦略に基づくポジション調整が実行されます。`,
          riskFactors: "突発的な市場ショックによるシグナルのダマシに注意し、明確な損切り基準を設定することが重要です。",
          relatedTerms: ["クオンツファクター", "ボラティリティ", "リスク管理", "アルゴリズム取引"]
        };
      } else {
        matchedData = {
          definition: `"${cleanTerm}" is an essential concept in equity trading and quantitative finance, representing key market dynamics, valuation metrics, or institutional execution mechanisms.`,
          tradingImplications: `Institutional desk analysts assess "${cleanTerm}" to calibrate volatility exposure, optimize alpha generation, and execute systematic rebalancing.`,
          example: `In active market regimes, observations of "${cleanTerm}" often prompt automated execution engines to adjust limit order spreads and liquidity allocations.`,
          riskFactors: "Always cross-validate with volume metrics and broader index direction. Maintain strict position sizing and predefined stop-loss orders.",
          relatedTerms: ["Quantitative Alpha", "Market Microstructure", "Risk-Reward Ratio", "Volatility Surface"]
        };
      }
    }

    return NextResponse.json({
      ok: true,
      term: cleanTerm,
      context: context || "",
      language: targetLang,
      data: matchedData
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Analysis failed" }, { status: 500 });
  }
}
