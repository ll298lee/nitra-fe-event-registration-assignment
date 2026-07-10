/**
 * Traditional Chinese (`zh-TW`). Mirrors `en.js` key-for-key (IMPLEMENTATION_PLAN.md D14 / D45).
 *
 * Only the app's own chrome is translated. Data-layer content (`src/mocks/*` — event/ticket/
 * session/add-on names, descriptions, perks, prices) and date/currency formatting are locale-
 * independent and render identically to `en` (D45).
 */
export default {
  app: {
    title: '活動報名',
  },

  language: {
    en: 'EN',
    zhTW: '中文',
    label: '語言',
  },

  stepper: {
    aria: '報名進度',
  },

  steps: {
    attendee: '出席者資訊',
    sessions: '議程',
    addons: '附加項目',
    review: '檢閱',
  },

  footer: {
    back: '返回',
    nextSessions: '下一步：選擇議程',
    nextAddons: '下一步：附加項目',
    nextReview: '下一步：檢閱',
    submit: '送出報名',
  },

  field: {
    optional: '（選填）',
  },

  step1: {
    ticketHeading: '選擇票種',
    ticketAria: '票種',
    ticketSelected: '✓ 已選擇',
    heading: '出席者資訊',
    fields: {
      fullName: { label: '姓名', placeholder: '請輸入您的姓名' },
      email: { label: '電子郵件', placeholder: '請輸入您的電子郵件' },
      phone: { label: '電話', placeholder: '請輸入您的電話號碼' },
      company: { label: '公司', placeholder: '請輸入您的公司名稱' },
      jobTitle: { label: '職稱', placeholder: '請輸入您的職稱' },
      shippingAddress: { label: '寄送地址', placeholder: '請輸入您的寄送地址' },
    },
  },

  step2: {
    heading: '選擇議程',
    dayAria: '議程日期',
    counter: '已選擇 {count} 個議程',
  },

  session: {
    soldOut: '已額滿',
    spotsLeft: '剩餘 {n} 個名額',
  },

  step3: {
    heading: '選擇附加項目',
    categoryAria: '附加項目類別',
    tabs: {
      workshop: '工作坊',
      meal: '餐點方案',
      merchandise: '周邊商品',
    },
  },

  workshop: {
    soldOut: '已額滿',
    spotsRemaining: '剩餘 {n} 個名額',
  },

  merch: {
    size: '尺寸：',
    sizeAria: '{name} 的尺寸',
    selectPlaceholder: '請選擇',
    qty: '數量：',
    decreaseAria: '減少 {name} 數量',
    increaseAria: '增加 {name} 數量',
    max: '最多 {n}',
    added: '✓ 已加入訂單',
  },

  shipping: {
    title: '寄送資訊',
    body: '周邊商品將於會議前一週寄送至您的地址。請確認您在步驟 1 填寫的寄送地址正確無誤。',
  },

  summary: {
    orderTitle: '訂單摘要',
    pricingTitle: '費用摘要',
    aria: {
      order: '訂單摘要',
      pricing: '費用摘要',
    },
    empty: '尚未選擇任何項目。',
    ticketLine: '{name} 票券',
    line: '{name} × {qty}',
    discount: '工作坊折扣（VIP 10%）',
    total: '總計',
    grandTotal: '總金額',
  },

  step4: {
    heading: '確認您的報名',
    editStep: '編輯 → 步驟 {n}',
    editAria: '編輯 {title}',
    sections: {
      attendee: '出席者資訊',
      sessions: '已選議程',
      addons: '附加項目',
    },
    rows: {
      name: '姓名',
      email: '電子郵件',
      phone: '電話',
      company: '公司',
      jobTitle: '職稱',
      ticketType: '票種',
      shippingAddress: '寄送地址',
    },
    addonLabels: {
      workshop: '工作坊',
      meal: '餐點',
      merchandise: '周邊商品',
    },
    empty: {
      sessions: '尚未選擇議程。',
      addons: '尚未選擇附加項目。',
    },
    required: '— （必填）',
    requiredMerch: '— （購買周邊商品時必填）',
    priceParens: '{name}（{price}）',
    errorBannerTitle: '請先修正以下錯誤再送出',
    errorLine: '步驟 {step}：{message}',
  },

  success: {
    title: '報名完成！',
    confirmation: '確認編號 #{number}',
    thanks: '{name}，感謝您！您的 {ticket} 報名（{event}）已確認。',
    email: '確認信將寄送至 {email}。',
    backToHome: '返回首頁',
  },

  validation: {
    required: '請填寫{label}',
    labels: {
      fullName: '姓名',
      email: '電子郵件',
      phone: '電話',
      company: '公司',
      jobTitle: '職稱',
    },
    emailInvalid: '請輸入有效的電子郵件',
    phoneInvalid: '請輸入有效的電話號碼',
    shippingRequired: '選購周邊商品時必須填寫寄送地址',
    ticketRequired: '請選擇票種',
  },

  conflict: {
    session: '{a} 與 {b} 時間衝突',
    workshop: '{workshop} 與 {session} 時間衝突',
    cardOverlaps: '與 {sessions} 時間衝突',
    cardUnavailable: '無法選擇：與 {sessions} 時間衝突',
  },
};
