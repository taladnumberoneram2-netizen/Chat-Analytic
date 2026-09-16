function dashboardData() {
      return {
        currentTab: 'dashboard',
        // ===============================
// TAB 4 : KEYWORD DASHBOARD
// ===============================

keywordLists: {
  customer: [],
  admin: []
},

activeKeywordListId: null,

keywordListCounter: 0,

activeKeywordSide: 'customer',

// Keep empty Keyword List input boxes at the top of each Page 4 column.
// The underlying arrays are not mutated; only the display order is derived.
get customerKeywordListsDisplay() {
  return [...(this.keywordLists.customer || [])].sort((a, b) => {
    const aEmpty = !(a.keywords || []).length && !String(a.tempKeyword || '').trim();
    const bEmpty = !(b.keywords || []).length && !String(b.tempKeyword || '').trim();
    if (aEmpty !== bEmpty) return aEmpty ? -1 : 1;
    return Number(b.id || 0) - Number(a.id || 0);
  });
},

get adminKeywordListsDisplay() {
  return [...(this.keywordLists.admin || [])].sort((a, b) => {
    const aEmpty = !(a.keywords || []).length && !String(a.tempKeyword || '').trim();
    const bEmpty = !(b.keywords || []).length && !String(b.tempKeyword || '').trim();
    if (aEmpty !== bEmpty) return aEmpty ? -1 : 1;
    return Number(b.id || 0) - Number(a.id || 0);
  });
},

// =========================================================
// TAB 4 : KEYWORD DASHBOARD LOGIC
// =========================================================


// จำนวนแชททั้งหมดหลังจากใช้ Filter ด้านบน
get keywordTotalChats() {
  return this.filteredData.length;
},


// =========================================================
// เพิ่ม Keyword List ใหม่
// =========================================================
addKeywordList(side) {

  this.keywordListCounter++;

  const list = {
    id: this.keywordListCounter,
    side: side,
    mode: 'OR',
    keywords: [],
    tempKeyword: ''
  };

  // New/empty input boxes should always start at the top of Page 4.
  this.keywordLists[side].unshift(list);

  this.activeKeywordListId = list.id;
  this.activeKeywordSide = side;

  // Page 4 data is the source for Report sections 8–9.
  // Redraw immediately so Report reflects the new list.
  this.scheduleReportCharts();
  if (this.currentTab === 'report') {
    this.$nextTick(() => this.renderReportKeywordChartsFresh());
  }
},


// =========================================================
// ลบ Keyword List
// =========================================================
removeKeywordList(side, id) {

  this.keywordLists[side] =
    this.keywordLists[side].filter(
      list => list.id !== id
    );

  if (this.activeKeywordListId === id) {
    this.activeKeywordListId = null;
  }

  // Keep Report sections 8–9 synchronized with Page 4.
  this.scheduleReportCharts();
  if (this.currentTab === 'report') {
    this.$nextTick(() => this.renderReportKeywordChartsFresh());
  }
},


// =========================================================
// เพิ่ม Keyword เข้า List
// =========================================================
addKeywordToList(list) {

  const keyword =
    String(list.tempKeyword || '').trim();

  if (!keyword) return;

  // ป้องกัน Keyword ซ้ำใน List เดียวกัน
  if (!list.keywords.includes(keyword)) {
    list.keywords.push(keyword);
  }

  list.tempKeyword = '';

  this.activeKeywordListId = list.id;
  this.activeKeywordSide = list.side;

  // The Report must immediately pick up the newly added keyword.
  this.scheduleReportCharts();
  if (this.currentTab === 'report') {
    this.$nextTick(() => this.renderReportKeywordChartsFresh());
  }
},

// Remove a keyword from Page 4 and refresh Report sections 8–9.
removeKeywordFromList(list, index) {
  if (!list || !Array.isArray(list.keywords)) return;
  list.keywords.splice(index, 1);
  this.scheduleReportCharts();
  if (this.currentTab === 'report') {
    this.$nextTick(() => this.renderReportKeywordChartsFresh());
  }
},

// =========================================================
// นับจำนวนแชท Keyword List
// รองรับการพิมพ์ Keyword แบบ Realtime
// =========================================================
// =========================================================
// TAB 4 : นับจำนวนแชท Keyword แบบ REALTIME
// รวม Keyword ที่กำลังพิมพ์อยู่ด้วย
// =========================================================
keywordListCount(list) {

  if (!list) return 0;

  const sourceField =
    list.side === 'customer'
      ? 'search_Customer'
      : 'search_Admin';

  // Keyword ที่กด + แล้ว
  let keywords = [
    ...(list.keywords || [])
  ];

  // Keyword ที่กำลังพิมพ์อยู่
  const typing =
    String(list.tempKeyword || '').trim();

  if (typing) {
    keywords.push(typing);
  }

  if (keywords.length === 0) {
    return 0;
  }

  keywords = keywords
    .map(kw => String(kw).trim().toLowerCase())
    .filter(Boolean);

  return this.filteredData.filter(item => {

    const text =
      String(item[sourceField] || '').toLowerCase();

    // AND = ต้องพบทุกคำ
    if (list.mode === 'AND') {

      return keywords.every(
        kw => text.includes(kw)
      );

    }

    // OR = พบคำใดคำหนึ่ง
    return keywords.some(
      kw => text.includes(kw)
    );

  }).length;
},


// =========================================================
// คำนวณเปอร์เซ็นต์ของ Keyword List
// =========================================================
keywordListPercent(list) {

  const total = this.keywordTotalChats;

  if (!total) {
    return '0.0';
  }

  const count =
    this.keywordListCount(list);

  return ((count / total) * 100).toFixed(1);
},


// =========================================================
// หา Keyword List ที่กำลังถูกเลือก
// =========================================================
get activeKeywordList() {

  const allLists = [
    ...this.keywordLists.customer,
    ...this.keywordLists.admin
  ];

  return allLists.find(
    list => list.id === this.activeKeywordListId
  ) || null;
},


// =========================================================
// TAB 4 : KEYWORD SEARCH RESULT
// ค้นหาคำที่เกี่ยวข้องกับ Keyword ที่กำลังพิมพ์
// =========================================================
get keywordSearchResults() {

  const allLists = [
    ...this.keywordLists.customer,
    ...this.keywordLists.admin
  ];

  const activeList =
    allLists.find(
      list => list.id === this.activeKeywordListId
    );

  if (!activeList) {
    return [];
  }

  const query =
    String(activeList.tempKeyword || '')
      .trim()
      .toLowerCase();

  if (!query) {
    return [];
  }

  const sourceField =
    activeList.side === 'customer'
      ? 'search_Customer'
      : 'search_Admin';

  const counts = {};

  this.filteredData.forEach(item => {

    const text =
      String(item[sourceField] || '').trim();

    if (!text) return;


    let words = [];

    try {

      if (typeof Intl !== 'undefined' && typeof Intl.Segmenter !== 'undefined') {

        const segmenter =
          new Intl.Segmenter('th', {
            granularity: 'word'
          });

        words =
          [...segmenter.segment(text)]
            .filter(x => x.isWordLike)
            .map(x => x.segment.trim())
            .filter(x => x.length >= 2);

      } else {

        words =
          text
            .replace(
              /[\[\]\(\)\{\}"'“”‘’.,!?;:|/\\\-_=+*#@]/g,
              ' '
            )
            .split(/\s+/)
            .map(x => x.trim())
            .filter(x => x.length >= 2);
      }

    } catch (e) {

      words =
        text
          .replace(
            /[\[\]\(\)\{\}"'“”‘’.,!?;:|/\\\-_=+*#@]/g,
            ' '
          )
          .split(/\s+/)
          .map(x => x.trim())
          .filter(x => x.length >= 2);
    }

    const roomWords = new Set();

    words.forEach(word => {

      const cleanWord =
        word.toLowerCase();

      if (
        cleanWord.includes(query) ||
        query.includes(cleanWord)
      ) {

        roomWords.add(cleanWord);

      }

    });

    roomWords.forEach(word => {

      if (!counts[word]) {
        counts[word] = 0;
      }

      counts[word]++;

    });

  });

  const total =
    this.keywordTotalChats;

  return Object.keys(counts)

    .map(keyword => {

      const count =
        counts[keyword];

      return {
        keyword: keyword,
        count: count,
        percent:
          total > 0
            ? ((count / total) * 100).toFixed(1)
            : '0.0'
      };

    })

    .sort(
      (a, b) => b.count - a.count
    )

    .slice(0, 50);

},
        loading: true,
        rawData: [],
        selectedYears: [],
        selectedMonths: [],
        selectedDates: [],
        selectedCategory: '',
        selectedProcess: '',
        selectedChatProcess: '',
        selectedCustomerProcess: '',
        selectedStatusFilter: '',
        selectedChannelFilter: '',
        customerNameSearch: '',

        // Report filters are reactive arrays so multiple boxes can be selected.
        reportSelectedChannel: [],
        reportSelectedStatus: [],
        reportSelectedProcess: [],
        reportCharts: {},
        reportChartRenderTimer: null,

        tempCustKeyword: '',
        customerKeywords: [],
        customerMatchMode: 'OR',

        tempAdminKeyword: '',
        adminKeywords: [],
        adminMatchMode: 'OR',
        





        activeChat: null,
        openYear: false,
        openMonth: false,
        openDate: false,

        
init() {

  fetch(window.DASHBOARD_CONFIG.API_URL, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  })
    .then(response => {
      if (!response.ok) throw new Error(`API HTTP ${response.status}`);
      return response.json();
    })
    .then(data => {
      this.rawData = Array.isArray(data) ? data : [];
      this.loading = false;
      this.$nextTick(() => this.scheduleReportCharts());
    })
    .catch(error => {
      console.error('Dashboard API error:', error);
      this.rawData = [];
      this.loading = false;
      alert('ไม่สามารถโหลดข้อมูลจาก Google Sheet ได้ กรุณาตรวจสอบ API_URL และการ Deploy Google Apps Script');
    });


  // Global Filter
  this.$watch(
    'selectedYears',
    () => this.scheduleReportCharts()
  );

  this.$watch(
    'selectedMonths',
    () => this.scheduleReportCharts()
  );

  this.$watch(
    'selectedDates',
    () => this.scheduleReportCharts()
  );

  this.$watch(
    'selectedChannelFilter',
    () => this.scheduleReportCharts()
  );

  this.$watch(
    'customerKeywords',
    () => this.scheduleReportCharts()
  );

  this.$watch(
    'adminKeywords',
    () => this.scheduleReportCharts()
  );

  this.$watch(
    'tempCustKeyword',
    () => this.scheduleReportCharts()
  );

  this.$watch(
    'tempAdminKeyword',
    () => this.scheduleReportCharts()
  );

  // Page 4 Keyword Lists are the source of Report sections 8–9.
  // Watch the whole object so adding/removing/editing keywords redraws the charts.
  this.$watch(
    'keywordLists',
    () => this.scheduleReportCharts()
  );


  // Report Filter
  this.$watch(
    'reportSelectedChannel',
    () => this.scheduleReportCharts()
  );

  this.$watch(
    'reportSelectedStatus',
    () => this.scheduleReportCharts()
  );

  this.$watch(
    'reportSelectedProcess',
    () => this.scheduleReportCharts()
  );


  // เปลี่ยน Tab
  this.$watch(
    'currentTab',
    value => {

      if (value === 'report') {
        this.$nextTick(() => {
          setTimeout(() => {
            this.scheduleReportCharts();
            this.renderReportKeywordChartsFresh();
          }, 0);
        });
      }

    }
  );
},

        formatReadableDate(dateStr) {
          if (!dateStr) return '-';
          try {
            let parts = dateStr.split('T');
            let datePart = parts[0];
            let timePart = parts[1] ? parts[1].split('+')[0].split('.')[0] : '';
           
            let dateSub = datePart.split('-');
            if (dateSub.length === 3) {
              let y = dateSub[0];
              let m = dateSub[1];
              let d = dateSub[2];
              return `${d}-${m}-${y}${timePart ? ' ' + timePart : ''}`;
            }
            return dateStr;
          } catch(e) {
            return dateStr;
          }
        },


        formatDateOnly(dateStr) {
          if (!dateStr) return '';
          try {
            let parts = dateStr.split('-');
            if (parts.length === 3) {
              return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            return dateStr;
          } catch(e) {
            return dateStr;
          }
        },

        getCustomerStatus(firstStr, latestStr) {
          if (!firstStr || !latestStr) return { type:'New', text:'New (0 วัน)', days:0 };
          try {
            const d1=new Date(firstStr), d2=new Date(latestStr);
            if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return {type:'New',text:'New',days:0};
            const days=Math.max(0,Math.floor(Math.abs(d2-d1)/86400000));
            const type=days>=365?'Old':(days>=30?'Lead':'New');
            if(type==='New') return {type,text:`New (${days} วัน)`,days};
            if(type==='Lead'){const months=Math.floor(days/30), rem=days%30; return {type,text:`Lead (${months} เดือน${rem?` ${rem} วัน`:''})`,days};}
            const years=Math.floor(days/365), remDays=days-years*365, months=Math.floor(remDays/30);
            return {type,text:`Old (${years} ปี${months?` ${months} เดือน`:''})`,days};
          } catch(e){ return {type:'New',text:'New',days:0}; }
        },

        goToChat(chat) {
          this.currentTab = 'chat';
          this.selectedChatProcess = chat.ai_Process || '';
          this.activeChat = chat;
        },

        addCustomerKeyword() {
          let val = this.tempCustKeyword.trim();
          if (val && !this.customerKeywords.includes(val)) {
            this.customerKeywords.push(val);
          }
          this.tempCustKeyword = '';
        },


        addAdminKeyword() {
          let val = this.tempAdminKeyword.trim();
          if (val && !this.adminKeywords.includes(val)) {
            this.adminKeywords.push(val);
          }
          this.tempAdminKeyword = '';
          this.reportSelectedChannel = [];
          this.reportSelectedStatus = [];
          this.reportSelectedProcess = [];
          this.scheduleReportCharts();
        },

        resetFilter() {
          this.selectedYears = [];
          this.selectedMonths = [];
          this.selectedDates = [];
          this.selectedCategory = '';
          this.selectedProcess = '';
          this.selectedChatProcess = '';
          this.selectedCustomerProcess = '';
          this.selectedStatusFilter = '';
          this.selectedChannelFilter = '';
          this.customerKeywords = [];
          this.adminKeywords = [];
          this.tempCustKeyword = '';
          this.tempAdminKeyword = '';

          this.reportSelectedChannel = [];
          this.reportSelectedStatus = [];
          this.reportSelectedProcess = [];
        },


        get uniqueYears() {
          return [...new Set(this.rawData.map(item => String(item.Year || '').trim()))].filter(Boolean).sort();
        },

        get uniqueMonths() {
          return [...new Set(this.rawData.map(item => String(item.Monyh || '').trim()))].filter(Boolean).sort((a,b) => Number(a)-Number(b));
        },


        get uniqueDates() {
          return [...new Set(this.rawData.map(item => String(item.DATE || '').trim()))].filter(Boolean).sort((a,b) => Number(a)-Number(b));
        },


        get filteredData() {
        return this.rawData.filter(item => {
        let itemYear = String(item.Year || '').trim();
        let itemMonth = String(item.Monyh || '').trim();
        let itemDate = String(item.DATE || '').trim();


        let matchYear = this.selectedYears.length === 0 || this.selectedYears.includes(itemYear);
        let matchMonth = this.selectedMonths.length === 0 || this.selectedMonths.includes(itemMonth);
        let matchDate = this.selectedDates.length === 0 || this.selectedDates.includes(itemDate);

        if (!matchYear || !matchMonth || !matchDate) return false;


        // 📌 แก้ไขช่วงเช็คตัวกรองช่องทางตรงนี้
        if (this.selectedChannelFilter) {
            let ch = String(item.channel_type || '').trim();
            if (ch === 'LinkQR' || ch === 'Link / QR') ch = 'Link/QR';
            if (ch !== this.selectedChannelFilter) return false;
        }


        // ... โค้ดค้นหาคำค้น (Keyword) ด้านล่างต่อตามปกติ ...


            // 🔍 ดึงข้อมูลดิบเฉพาะคอลัมน์ Q (search_Customer) และ R (search_Admin)
            let lowerCustMsgs = String(item.search_Customer || '').toLowerCase();
            let lowerAdminMsgs = String(item.search_Admin || '').toLowerCase();


            // 1️⃣ กล่องที่ 1: เช็คเฉพาะคอลัมน์ Q เท่านั้น
            let matchCust = true;
            let activeCustKws = [...this.customerKeywords];
            let currentCustTyping = this.tempCustKeyword.trim().toLowerCase();
            if (currentCustTyping) {
            activeCustKws.push(currentCustTyping);
            }
            if (activeCustKws.length > 0) {
            if (this.customerMatchMode === 'OR') {
            matchCust = activeCustKws.some(kw => lowerCustMsgs.includes(kw.toLowerCase()));
            } else {
            matchCust = activeCustKws.every(kw => lowerCustMsgs.includes(kw.toLowerCase()));
            }
           }

            // 2️⃣ กล่องที่ 2: เช็คเฉพาะคอลัมน์ R เท่านั้น
            let matchAdmin = true;
            let activeAdminKws = [...this.adminKeywords];
            let currentAdminTyping = this.tempAdminKeyword.trim().toLowerCase();
            if (currentAdminTyping) {
            activeAdminKws.push(currentAdminTyping);
            }
            if (activeAdminKws.length > 0) {
            if (this.adminMatchMode === 'OR') {
             matchAdmin = activeAdminKws.some(kw => lowerAdminMsgs.includes(kw.toLowerCase()));
             } else {
              matchAdmin = activeAdminKws.every(kw => lowerAdminMsgs.includes(kw.toLowerCase()));
            }
            }

            return matchCust && matchAdmin;
          });
        },

        get processFilteredData() {
          if (!this.selectedProcess) return this.filteredData;
          return this.filteredData.filter(item => (item.ai_Process || 'ไม่ระบุสถานะ') === this.selectedProcess);
        },


        get sortedFilteredData() {
          return [...this.filteredData];
        },


        get chatsByProcessFilter() {
          if (!this.selectedChatProcess) return this.sortedFilteredData;
          return this.sortedFilteredData.filter(item => (item.ai_Process || 'ไม่ระบุสถานะ') === this.selectedChatProcess);
        },


get customerTableBaseData() {
  // ฐานเดียวกับตารางลูกค้า: วันที่/เดือน/ปี + Keyword + ชื่อลูกค้า
  let list = this.rawData.filter(item => {
    const itemYear = String(item.Year || '').trim();
    const itemMonth = String(item.Monyh || '').trim();
    const itemDate = String(item.DATE || '').trim();
    return (this.selectedYears.length === 0 || this.selectedYears.includes(itemYear)) &&
           (this.selectedMonths.length === 0 || this.selectedMonths.includes(itemMonth)) &&
           (this.selectedDates.length === 0 || this.selectedDates.includes(itemDate));
  });

  const custKws = [...this.customerKeywords];
  const custTyping = String(this.tempCustKeyword || '').trim();
  if (custTyping) custKws.push(custTyping);
  const adminKws = [...this.adminKeywords];
  const adminTyping = String(this.tempAdminKeyword || '').trim();
  if (adminTyping) adminKws.push(adminTyping);

  if (custKws.length) {
    list = list.filter(item => {
      const text = String(item.search_Customer || '').toLowerCase();
      return this.customerMatchMode === 'OR'
        ? custKws.some(k => text.includes(String(k).toLowerCase()))
        : custKws.every(k => text.includes(String(k).toLowerCase()));
    });
  }
  if (adminKws.length) {
    list = list.filter(item => {
      const text = String(item.search_Admin || '').toLowerCase();
      return this.adminMatchMode === 'OR'
        ? adminKws.some(k => text.includes(String(k).toLowerCase()))
        : adminKws.every(k => text.includes(String(k).toLowerCase()));
    });
  }

  if (this.customerNameSearch && this.customerNameSearch.trim()) {
    const q = this.customerNameSearch.trim().toLowerCase();
    list = list.filter(item => String(item.customer_name || '').toLowerCase().startsWith(q));
  }
  return list;
},

get customersByProcessFilter() {
  let list = [...this.customerTableBaseData];
  if (this.selectedChannelFilter) {
    list = list.filter(item => {
      let ch = String(item.channel_type || '').trim();
      if (ch === 'LinkQR' || ch === 'Link / QR') ch = 'Link/QR';
      return ch === this.selectedChannelFilter;
    });
  }
  if (this.selectedCustomerProcess) {
    list = list.filter(item => (item.ai_Process || 'ไม่ระบุสถานะ') === this.selectedCustomerProcess);
  }
  if (this.selectedStatusFilter) {
    list = list.filter(item => this.getCustomerStatus(item.first_message_time, item.latest_message_time).type === this.selectedStatusFilter);
  }
  return list;
},

// Export ต้องใช้ข้อมูลชุดเดียวกับตาราง และใช้ชื่อ field จริงจาก Apps Script
exportCustomerDataToExcel() {
  const data = this.customersByProcessFilter;
  if (!data || data.length === 0) {
    alert('ไม่มีข้อมูลสำหรับ Export ครับ');
    return;
  }

  const csvCell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
  let csvContent = '\uFEFF';

  // Keep Status separate from Year / Month / Date.
  // Use the actual data fields when available, with date parsing as fallback.
  csvContent += [
    'Customer ID',
    'Name',
    'Status',
    'Year',
    'Month',
    'Date',
    'First Message',
    'Latest Message',
    'Channel',
    'message_text_Customer',
    'ai_Customer',
    'ai_Admin',
    'ai_Process'
  ].map(csvCell).join(',') + '\n';

  const extractDateParts = (item) => {
    const raw = String(item.first_message_time || '').trim();
    const match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    return {
      year: String(item.Year || '').trim() || (match ? match[1] : ''),
      month: String(item.Monyh || '').trim() || (match ? String(Number(match[2])) : ''),
      date: String(item.DATE || '').trim() || (match ? String(Number(match[3])) : '')
    };
  };

  data.forEach(item => {
    const statusObj = this.getCustomerStatus(item.first_message_time, item.latest_message_time);
    let channel = String(item.channel_type || '').trim();
    if (channel === 'LinkQR' || channel === 'Link / QR') channel = 'Link/QR';

    const parts = extractDateParts(item);

    // Support both possible backend field names.
    // If message_text_Customer exists, use it; otherwise fall back to message_text.
    const customerMessage =
      item.message_text_Customer ??
      item.message_text_customer ??
      item.messageText_Customer ??
      item.message_text ??
      '';

    const aiCustomer = item.ai_Customer ?? item.ai_Cutomer ?? '';
    const aiAdmin = item.ai_Admin ?? '';
    const aiProcess = item.ai_Process || 'ไม่ระบุสถานะ';

    csvContent += [
      item.conversation_id,
      item.customer_name,
      statusObj.type,
      parts.year,
      parts.month,
      parts.date,
      item.first_message_time,
      item.latest_message_time,
      channel,
      customerMessage,
      aiCustomer,
      aiAdmin,
      aiProcess
    ].map(csvCell).join(',') + '\n';
  });

  const blob = new Blob([csvContent], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `customer_data_export_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
},

        get statusCounts() {
          // นับ Status โดยตัด Status Filter ตัวเองออก แต่ยังคง Channel + Process ที่เลือกอยู่
          let baseList = [...this.customerTableBaseData];
          if (this.selectedChannelFilter) {
            baseList = baseList.filter(item => {
              let ch = String(item.channel_type || '').trim();
              if (ch === 'LinkQR' || ch === 'Link / QR') ch = 'Link/QR';
              return ch === this.selectedChannelFilter;
            });
          }
          if (this.selectedCustomerProcess) {
            baseList = baseList.filter(item => (item.ai_Process || 'ไม่ระบุสถานะ') === this.selectedCustomerProcess);
          }
          const counts = {New:0, Lead:0, Old:0};
          baseList.forEach(item => {
            const type = this.getCustomerStatus(item.first_message_time, item.latest_message_time).type;
            if (counts[type] !== undefined) counts[type]++;
          });
          return counts;
        },

        get channelCounts() {
          // นับ Channel โดยตัด Channel Filter ตัวเองออก แต่ยังคง Status + Process ที่เลือกอยู่
          let baseList = [...this.customerTableBaseData];
          if (this.selectedStatusFilter) {
            baseList = baseList.filter(item => this.getCustomerStatus(item.first_message_time, item.latest_message_time).type === this.selectedStatusFilter);
          }
          if (this.selectedCustomerProcess) {
            baseList = baseList.filter(item => (item.ai_Process || 'ไม่ระบุสถานะ') === this.selectedCustomerProcess);
          }
          const counts = {Ads:0, Organic:0, 'Link/QR':0, 'Out of Data Center':0};
          baseList.forEach(item => {
            let ch = String(item.channel_type || '').trim();
            if (ch === 'LinkQR' || ch === 'Link / QR') ch = 'Link/QR';
            if (counts[ch] !== undefined) counts[ch]++;
          });
          return counts;
        },

        get processCounts() {
          // นับ Process โดยตัด Process Filter ตัวเองออก แต่ยังคง Status + Channel ที่เลือกอยู่
          let baseList = [...this.customerTableBaseData];
          if (this.selectedStatusFilter) {
            baseList = baseList.filter(item => this.getCustomerStatus(item.first_message_time, item.latest_message_time).type === this.selectedStatusFilter);
          }
          if (this.selectedChannelFilter) {
            baseList = baseList.filter(item => {
              let ch = String(item.channel_type || '').trim();
              if (ch === 'LinkQR' || ch === 'Link / QR') ch = 'Link/QR';
              return ch === this.selectedChannelFilter;
            });
          }
          const counts = {};
          baseList.forEach(item => {
            const name = item.ai_Process || 'ไม่ระบุสถานะ';
            counts[name] = (counts[name] || 0) + 1;
          });
          return counts;
        },

        parseChatMessages(rawText) {
          if (!rawText) return [];
          let lines = rawText.split('\n');
          let parsed = [];
          let lastDate = null;

          lines.forEach(line => {
            let match = line.match(/^\[(.*?)\]\s*\[(Admin|Customer)\]:\s*(.*)$/i);
            if (match) {
              let dateTimeStr = match.shift();
              let fullDateTime = match[0].trim();
              let sender = match[1].trim();
              let text = match[2].trim();

              let parts = fullDateTime.split(' ');
              let datePart = parts[0] || '';
              let timePart = parts[1] || '';


              let showDate = null;
              if (datePart && datePart !== lastDate) {
                showDate = datePart;
                lastDate = datePart;
              }

              parsed.push({
                date: showDate,
                time: timePart,
                sender: sender,
                text: text
              });
            } else if (line.trim() !== '' && parsed.length > 0) {
              parsed[parsed.length - 1].text += '\n' + line;
            }
          });
          return parsed;
        },
// =========================================================
// TAB 5 : REPORT DATA
// =========================================================

// ---------------------------------------------------------
// ข้อมูลหลัง Report Filter
// Global Filter จะถูกใช้ผ่าน filteredData อยู่แล้ว
// แล้วจึงใช้ Channel + Status + Process ของ Report ซ้อนอีกชั้น
// ---------------------------------------------------------
get reportFilteredData() {
  let list=[...this.filteredData];
  if(this.reportSelectedChannel.length) list=list.filter(item=>{let ch=String(item.channel_type||'').trim();if(ch==='LinkQR'||ch==='Link / QR')ch='Link/QR';return this.reportSelectedChannel.includes(ch);});
  if(this.reportSelectedStatus.length) list=list.filter(item=>this.reportSelectedStatus.includes(this.getCustomerStatus(item.first_message_time,item.latest_message_time).type));
  if(this.reportSelectedProcess.length) list=list.filter(item=>this.reportSelectedProcess.includes(item.ai_Process||'ไม่ระบุสถานะ'));
  return list;
},

// ---------------------------------------------------------
// Percent
// ---------------------------------------------------------
reportPercent(count, total) {

  if (!total) return '0.0';

  return ((count / total) * 100).toFixed(1);
},


// ---------------------------------------------------------
// 1. CHANNEL
// ---------------------------------------------------------
get reportFilterBaseData() {
  return [...this.filteredData];
},

get reportChannelStats() {
  // Channel cards are calculated after Status + Process filters,
  // but NEVER after Channel itself. This keeps every selected/unselected
  // Channel box in the same position and always clickable.
  let list=[...this.filteredData];
  if(this.reportSelectedStatus.length) list=list.filter(item=>this.reportSelectedStatus.includes(this.getCustomerStatus(item.first_message_time,item.latest_message_time).type));
  if(this.reportSelectedProcess.length) list=list.filter(item=>this.reportSelectedProcess.includes(item.ai_Process||'ไม่ระบุสถานะ'));
  const total=list.length;
  const counts={Ads:0,Organic:0,'Link/QR':0,'Out of Data Center':0};
  list.forEach(item=>{
    let ch=String(item.channel_type||'').trim();
    if(ch==='LinkQR'||ch==='Link / QR') ch='Link/QR';
    if(counts[ch]!==undefined) counts[ch]++;
  });
  return Object.keys(counts).map(name=>({
    name,count:counts[name],percent:this.reportPercent(counts[name],total),
    color:({Ads:'#3498db',Organic:'#2ecc71','Link/QR':'#f39c12','Out of Data Center':'#f5c542'}[name]||'#64748b')
  }));
},

get reportStatusStats() {
  // Status cards are calculated after Channel + Process filters,
  // but NEVER after Status itself.
  let list=[...this.filteredData];
  if(this.reportSelectedChannel.length) list=list.filter(item=>{
    let ch=String(item.channel_type||'').trim();
    if(ch==='LinkQR'||ch==='Link / QR') ch='Link/QR';
    return this.reportSelectedChannel.includes(ch);
  });
  if(this.reportSelectedProcess.length) list=list.filter(item=>this.reportSelectedProcess.includes(item.ai_Process||'ไม่ระบุสถานะ'));
  const total=list.length;
  const counts={New:0,Lead:0,Old:0};
  list.forEach(item=>{const type=this.getCustomerStatus(item.first_message_time,item.latest_message_time).type;if(counts[type]!==undefined) counts[type]++;});
  return Object.keys(counts).map(name=>({
    name,count:counts[name],percent:this.reportPercent(counts[name],total),
    color:({New:'#2ecc71',Lead:'#f39c12',Old:'#94a3b8'}[name]||'#64748b')
  }));
},

// ---------------------------------------------------------
// 2. STATUS FREQUENCY
// แจกแจงระยะเวลาแชท
// ---------------------------------------------------------
get reportStatusFrequencyData() {
  const result={Overall:[],New:[],Lead:[],Old:[]};
  const buckets=['0 วัน','1 วัน','2-3 วัน','4-7 วัน','8-14 วัน','15-29 วัน','1 เดือน','2 เดือน','3 เดือน','4-5 เดือน','6-8 เดือน','9-11 เดือน','1 ปี','มากกว่า 1 ปี'];
  const makeBucket=days=>{
    if(days<=0) return '0 วัน';
    if(days===1) return '1 วัน';
    if(days<=3) return '2-3 วัน';
    if(days<=7) return '4-7 วัน';
    if(days<=14) return '8-14 วัน';
    if(days<=29) return '15-29 วัน';
    const status=this.getCustomerStatusFromDays(days);
    if(status.type==='Lead'){
      const m=status.months;
      if(m===1) return '1 เดือน';
      if(m===2) return '2 เดือน';
      if(m===3) return '3 เดือน';
      if(m<=5) return '4-5 เดือน';
      if(m<=8) return '6-8 เดือน';
      return '9-11 เดือน';
    }
    if(status.type==='Old' && status.years===1) return '1 ปี';
    return 'มากกว่า 1 ปี';
  };
  buckets.forEach(b=>['Overall','New','Lead','Old'].forEach(k=>result[k].push({bucket:b,count:0})));
  this.reportFilteredData.forEach(item=>{
    // Use the exact same status calculation as the customer table.
    const statusObj=this.getCustomerStatus(item.first_message_time,item.latest_message_time);
    const days=Number(statusObj.days)||0;
    const bucket=makeBucket(days);
    const status=statusObj.type;
    const a=result.Overall.find(x=>x.bucket===bucket); if(a)a.count++;
    const b=result[status]?.find(x=>x.bucket===bucket); if(b)b.count++;
  });
  return result;
},

getCustomerStatusFromDays(days){
  days=Math.max(0,Number(days)||0);
  if(days<30) return {type:'New',months:0,years:0};
  if(days<365) return {type:'Lead',months:Math.floor(days/30),years:0};
  return {type:'Old',months:0,years:Math.floor(days/365)};
},

// ---------------------------------------------------------
// 3. PROCESS
// ---------------------------------------------------------
get reportProcessStats() {
  // Process cards are calculated after Channel + Status filters,
  // but NEVER after Process itself. This keeps selected Process boxes
  // visible and in a stable order while filtering.
  let list=[...this.filteredData];
  if(this.reportSelectedChannel.length) list=list.filter(item=>{
    let ch=String(item.channel_type||'').trim();
    if(ch==='LinkQR'||ch==='Link / QR') ch='Link/QR';
    return this.reportSelectedChannel.includes(ch);
  });
  if(this.reportSelectedStatus.length) list=list.filter(item=>this.reportSelectedStatus.includes(this.getCustomerStatus(item.first_message_time,item.latest_message_time).type));

  const total=list.length, counts={};
  list.forEach(item=>{
    const proc=String(item.ai_Process||'ไม่ระบุสถานะ').trim() || 'ไม่ระบุสถานะ';
    counts[proc]=(counts[proc]||0)+1;
  });

  const colorFor=name=>{
    let h=0; for(let i=0;i<name.length;i++) h=(h*31+name.charCodeAt(i))%360;
    return `hsl(${h} 70% 55%)`;
  };
  return Object.keys(counts).sort((a,b)=>a.localeCompare(b,'th')).map(name=>({
    name,count:counts[name],percent:this.reportPercent(counts[name],total),color:colorFor(name)
  }));
},

// ---------------------------------------------------------
// 6. AI CUSTOMER
// ---------------------------------------------------------
get reportCustomerStats() {

  const total = this.reportFilteredData.length;

  const counts = {};

  this.reportFilteredData.forEach(item => {

    const value =
      item.ai_Customer || 'ไม่ระบุหมวดหมู่';

    counts[value] =
      (counts[value] || 0) + 1;
  });

  return Object.keys(counts)
    .map(name => ({
      name: name,
      count: counts[name],
      percent: this.reportPercent(
        counts[name],
        total
      )
    }))
    .sort((a, b) => b.count - a.count);
},


// ---------------------------------------------------------
// 7. AI ADMIN
// ---------------------------------------------------------
get reportAdminStats() {

  const total = this.reportFilteredData.length;

  const counts = {};

  this.reportFilteredData.forEach(item => {

    const value =
      item.ai_Admin || 'ไม่มีการตอบกลับ';

    counts[value] =
      (counts[value] || 0) + 1;
  });

  return Object.keys(counts)
    .map(name => ({
      name: name,
      count: counts[name],
      percent: this.reportPercent(
        counts[name],
        total
      )
    }))
    .sort((a, b) => b.count - a.count);
},


// ---------------------------------------------------------
// KEYWORD TOKENIZER
// 1 ห้อง = นับ Keyword 1 ครั้ง
// ---------------------------------------------------------
reportTokenize(text) {

  text = String(text || '').trim();

  if (!text) return [];

  let words = [];

  try {

    if (typeof Intl !== 'undefined' && typeof Intl.Segmenter !== 'undefined') {

      const segmenter =
        new Intl.Segmenter('th', {
          granularity: 'word'
        });

      words =
        [...segmenter.segment(text)]
          .filter(x => x.isWordLike)
          .map(x => x.segment.trim())
          .filter(x => x.length >= 2);

    } else {

      words =
        text
          .replace(
            /[\[\]\(\)\{\}"'“”‘’.,!?;:|/\\\-_=+*#@]/g,
            ' '
          )
          .split(/\s+/)
          .map(x => x.trim())
          .filter(x => x.length >= 2);
    }

  } catch (e) {

    words =
      text
        .replace(
          /[\[\]\(\)\{\}"'“”‘’.,!?;:|/\\\-_=+*#@]/g,
          ' '
        )
        .split(/\s+/)
        .map(x => x.trim())
        .filter(x => x.length >= 2);
  }

  return words.map(x => x.toLowerCase());
},


// ---------------------------------------------------------
// 8. CUSTOMER KEYWORDS
// ---------------------------------------------------------
get reportCustomerKeywordStats() { return this.getReportPage4KeywordStats('customer'); },
get reportAdminKeywordStats() { return this.getReportPage4KeywordStats('admin'); },
getReportPage4KeywordStats(side) {
  // =========================================================
  // IMPORTANT: Page 5 must represent EACH Page-4 BOX as ONE
  // keyword group.  Keywords inside the same box stay linked by
  // that box's OR / AND mode and must NOT be split into separate bars.
  // =========================================================

  const lists = Array.isArray(this.keywordLists?.[side])
    ? [...this.keywordLists[side]]
    : [];

  const field = side === 'customer' ? 'search_Customer' : 'search_Admin';
  const source = this.reportFilteredData;
  const total = source.length;

  const normalizeKeywords = list => {
    const values = [
      ...(Array.isArray(list?.keywords) ? list.keywords : []),
      String(list?.tempKeyword || '').trim()
    ];

    const seen = new Set();
    return values
      .map(v => String(v || '').trim())
      .filter(Boolean)
      .filter(v => {
        const key = v.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  };

  const groupedStats = lists
    .map(list => {
      const keywords = normalizeKeywords(list);
      if (!keywords.length) return null;

      const mode = String(list.mode || 'OR').toUpperCase() === 'AND'
        ? 'AND'
        : 'OR';

      const normalized = keywords.map(k => k.toLowerCase());

      // EXACTLY the same matching rule as Page 4 keywordListCount():
      // OR  = at least one keyword in the same box
      // AND = every keyword in the same box
      const count = source.filter(item => {
        const text = String(item[field] || '').toLowerCase();

        return mode === 'AND'
          ? normalized.every(kw => text.includes(kw))
          : normalized.some(kw => text.includes(kw));
      }).length;

      return {
        // Keep the box identity visible in the Report so each bar can
        // be traced directly back to its Page-4 Keyword List.
        name: `List #${list.id}: ${keywords.join(` ${mode} `)}`,
        count,
        percent: this.reportPercent(count, total),
        listId: list.id,
        mode,
        keywords
      };
    })
    .filter(Boolean)
    .sort((a, b) =>
      b.count - a.count || Number(a.listId || 0) - Number(b.listId || 0)
    );

  // Compatibility fallback for the older top keyword boxes on Page 1.
  // Only use this when there are no Page-4 groups at all.
  if (!groupedStats.length) {
    const legacy = side === 'customer'
      ? (this.customerKeywords || [])
      : (this.adminKeywords || []);

    const seen = new Set();
    return legacy
      .map(value => String(value || '').trim())
      .filter(Boolean)
      .filter(value => {
        const key = value.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(name => {
        const key = name.toLowerCase();
        const count = source.filter(item =>
          String(item[field] || '').toLowerCase().includes(key)
        ).length;
        return {
          name,
          count,
          percent: this.reportPercent(count, total)
        };
      })
      .sort((a, b) =>
        b.count - a.count || a.name.localeCompare(b.name, 'th')
      );
  }

  return groupedStats;
},

// ---------------------------------------------------------
// 5. BY DATE
// ---------------------------------------------------------
get reportDateStats() {

  const counts = {};

  this.reportFilteredData.forEach(item => {

    let date =
      String(item.DATE || '').trim();

    if (!date) {

      const d =
        new Date(item.first_message_time);

      if (!isNaN(d)) {
        date =
          String(d.getDate()).padStart(2, '0');
      }
    }

    if (!date) return;

    counts[date] =
      (counts[date] || 0) + 1;
  });

  return Object.keys(counts)
    .sort((a, b) => Number(a) - Number(b))
    .map(date => ({
      name: date,
      count: counts[date]
    }));
},


// ---------------------------------------------------------
// 5. BY TIME
// ---------------------------------------------------------
get reportTimeStats() {

  const counts = {};

  for (let i = 0; i < 24; i++) {
    counts[
      String(i).padStart(2, '0') + ':00'
    ] = 0;
  }

  this.reportFilteredData.forEach(item => {

    let time =
      String(item.Time || '').trim();

    let hour = null;

    if (time) {

      const match =
        time.match(/^(\d{1,2})/);

      if (match) {
        hour =
          Number(match[1]);
      }
    }

    if (
      hour === null ||
      isNaN(hour) ||
      hour < 0 ||
      hour > 23
    ) {

      const d =
        new Date(item.first_message_time);

      if (!isNaN(d)) {
        hour = d.getHours();
      }
    }

    if (hour !== null) {

      const key =
        String(hour).padStart(2, '0') + ':00';

      if (counts[key] !== undefined) {
        counts[key]++;
      }
    }
  });

  return Object.keys(counts).map(time => ({
    name: time,
    count: counts[time]
  }));
},

// =========================================================
// GLOBAL CHANNEL FILTER
// =========================================================
toggleGlobalChannelFilter(name) {
  const normalized = String(name || '').trim();
  this.selectedChannelFilter = (this.selectedChannelFilter === normalized) ? '' : normalized;
},

// =========================================================
// TAB 5 : REPORT FILTER ACTIONS
// =========================================================

toggleReportChannel(name){const i=this.reportSelectedChannel.indexOf(name);if(i>=0)this.reportSelectedChannel.splice(i,1);else this.reportSelectedChannel.push(name);this.scheduleReportCharts();},
toggleReportStatus(name){const i=this.reportSelectedStatus.indexOf(name);if(i>=0)this.reportSelectedStatus.splice(i,1);else this.reportSelectedStatus.push(name);this.scheduleReportCharts();},
toggleReportProcess(name){const i=this.reportSelectedProcess.indexOf(name);if(i>=0)this.reportSelectedProcess.splice(i,1);else this.reportSelectedProcess.push(name);this.scheduleReportCharts();},
clearReportFilters(){this.reportSelectedChannel=[];this.reportSelectedStatus=[];this.reportSelectedProcess=[];this.scheduleReportCharts();},

// =========================================================
// CHART HELPER
// =========================================================

destroyReportChart(id) {

  if (this.reportCharts[id]) {

    this.reportCharts[id].destroy();

    delete this.reportCharts[id];
  }
},


createReportChart(id, config) {
  const canvas = document.getElementById(id);
  if (!canvas || typeof Chart === 'undefined') return;

  // Report tab uses x-show. Do not create/measure charts while hidden.
  const parent = canvas.parentElement;
  if (!parent || parent.offsetWidth === 0 || parent.offsetHeight === 0) {
    setTimeout(() => {
      if (this.currentTab === 'report') this.createReportChart(id, config);
    }, 150);
    return;
  }

  canvas.style.width = '100%';
  canvas.style.height = '100%';

  try {
    let chart = this.reportCharts[id] || Chart.getChart(canvas);

    if (chart) {
      // Update the existing Chart.js instance in place. This prevents
      // graphs from disappearing when filters are clicked repeatedly.
      chart.data = config.data;
      chart.options = config.options || {};
      chart.config.type = config.type;
      if (config.plugins) chart.config.plugins = config.plugins;

      if (config._reportLabelData) chart._reportLabelData = config._reportLabelData;
      else delete chart._reportLabelData;
      if (config._reportLabelDataSets) chart._reportLabelDataSets = config._reportLabelDataSets;
      else delete chart._reportLabelDataSets;
      if (config._reportPercentTotal != null) chart._reportPercentTotal = config._reportPercentTotal;
      else delete chart._reportPercentTotal;

      chart.update('none');
    } else {
      chart = new Chart(canvas.getContext('2d'), config);
      this.reportCharts[id] = chart;

      // IMPORTANT: Chart.js does not copy our custom _report* fields from
      // the config object onto the chart instance.  The value-label plugin
      // reads these fields from the chart, so they must also be attached
      // when a NEW chart is created (not only when an existing chart updates).
      if (config._reportLabelData) chart._reportLabelData = config._reportLabelData;
      else delete chart._reportLabelData;
      if (config._reportLabelDataSets) chart._reportLabelDataSets = config._reportLabelDataSets;
      else delete chart._reportLabelDataSets;
      if (config._reportPercentTotal != null) chart._reportPercentTotal = config._reportPercentTotal;
      else delete chart._reportPercentTotal;
    }

    requestAnimationFrame(() => {
      if (chart && chart.canvas && chart.canvas.isConnected && this.currentTab === 'report') {
        chart.resize();
      }
    });
  } catch (err) {
    console.error('Report chart error:', id, err);
  }
},


// =========================================================
// RENDER ALL REPORT CHARTS
// =========================================================

renderReportValuePlugin(){
  return {
    id:'reportValueLabels',
    afterDatasetsDraw: chart => {
      const ctx = chart.ctx;
      if (!chart.data || !chart.data.datasets) return;
      ctx.save();
      ctx.textBaseline = 'bottom';

      if (chart.config.type === 'doughnut') {
        const ds = chart.data.datasets[0];
        const meta = chart.getDatasetMeta(0);
        const vals = ds.data || [];
        const total = vals.reduce((sum,v) => sum + (Number(v) || 0), 0);
        if (total) {
          meta.data.forEach((arc,i) => {
            const value = Number(vals[i]) || 0;
            if (!value) return;
            const percent = ((value / total) * 100).toFixed(1) + '%';
            const pos = typeof arc.tooltipPosition === 'function' ? arc.tooltipPosition() : {x:arc.x,y:arc.y};
            ctx.fillStyle = '#ffffff';
            ctx.font = '700 11px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(percent, pos.x, pos.y);
          });
        }
        ctx.restore();
        return;
      }

      if (chart.config.type !== 'bar') {
        ctx.restore();
        return;
      }

      // Keep labels readable. For dense date/time charts, only draw labels
      // when there is enough horizontal room. Hover/tooltips still show all data.
      const isFrequency = chart.canvas && chart.canvas.id === 'reportStatusFrequency';
      const isDense = chart.canvas && (chart.canvas.id === 'reportDateFrequency' || chart.canvas.id === 'reportTimeFrequency');
      const datasets = chart.data.datasets;

      datasets.forEach((dataset, datasetIndex) => {
        // IMPORTANT: do not draw labels for a dataset that the user has
        // hidden from the legend. This prevents "ghost" labels remaining
        // after clicking a color/legend to turn it off.
        if (typeof chart.isDatasetVisible === 'function' && !chart.isDatasetVisible(datasetIndex)) return;

        const meta = chart.getDatasetMeta(datasetIndex);
        const dataValues = dataset.data || [];
        const srcSets = chart._reportLabelDataSets || [];
        const singleSrc = chart._reportLabelData || [];

        meta.data.forEach((bar,i) => {
          const value = Number(dataValues[i]) || 0;
          if (!value) return;

          const props = bar.getProps(['x','y','width','height'], true);
          const width = Number(props.width) || 0;
          const src = (srcSets[datasetIndex] && srcSets[datasetIndex][i]) || singleSrc[i] || null;
          // For Keyword charts, use the exact percentage from the same
          // item used by the tooltip (the black tooltip). Never calculate
          // percentage from the sum of visible bars.
          const isKeywordChart = chart.canvas &&
            (chart.canvas.id === 'reportCustomerKeywordBar' || chart.canvas.id === 'reportAdminKeywordBar');
          const totalForPercent = chart._reportPercentTotal || dataValues.reduce((sum,v) => sum + (Number(v) || 0), 0);
          const pct = src && src.percent != null
            ? src.percent
            : (isKeywordChart
                ? '0.0'
                : (totalForPercent ? ((value / totalForPercent) * 100).toFixed(1) : '0.0'));

          if (isFrequency) {
            const label = `${value} (${pct}%)`;
            // Put each dataset label at the actual bar position and use a
            // small vertical offset. Hidden datasets are skipped above.
            const offset = datasetIndex * 10;
            const y = Math.max(12, props.y - 5 - offset);
            ctx.fillStyle = '#374151';
            ctx.font = '600 9px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(label, props.x, y);
            return;
          }

          // For dense Date/Time charts, suppress labels on very narrow bars.
          if (isDense && width < 24) return;

          // Sections 6–9: show count + percentage beside each horizontal bar.
          const label = `${value} (${pct}%)`;
          ctx.fillStyle = '#374151';
          ctx.font = '600 9px Arial';
          if (chart.options.indexAxis === 'y') {
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, props.x + 6, props.y);
          } else {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(label, props.x, Math.max(12, props.y - 5));
          }
        });
      });
      ctx.restore();
    }
  };
},

// Keyword charts are rebuilt from scratch because their labels/dataset length
// can change when Page 4 is edited after Report has already been opened.
renderReportKeywordChartsFresh() {
  if (this.currentTab !== 'report' || typeof Chart === 'undefined') return;

  const plugin = this.renderReportValuePlugin();
  const customer = this.reportCustomerKeywordStats;
  const admin = this.reportAdminKeywordStats;

  ['reportCustomerKeywordBar', 'reportAdminKeywordBar'].forEach(id => {
    try {
      const canvas = document.getElementById(id);
      const existing = this.reportCharts?.[id] || (canvas && Chart.getChart(canvas));
      if (existing) existing.destroy();
      if (this.reportCharts) delete this.reportCharts[id];
    } catch (e) {
      console.warn('Keyword chart destroy error:', id, e);
    }
  });

  const makeConfig = (items, backgroundColor) => ({
    type: 'bar',
    data: {
      labels: items.map(x => x.name),
      datasets: [{
        data: items.map(x => x.count),
        backgroundColor
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: {
          label: c => {
            const item = items[c.dataIndex];
            return item ? `${item.count} แชท (${item.percent}%)` : `${c.raw} แชท`;
          }
        }}
      },
      scales: { x: { beginAtZero: true, ticks: { precision: 0 } } }
    },
    plugins: [plugin]
  });

  const createFresh = (id, config, items) => {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent || parent.offsetWidth === 0 || parent.offsetHeight === 0) {
      setTimeout(() => {
        if (this.currentTab === 'report') this.renderReportKeywordChartsFresh();
      }, 120);
      return;
    }
    config._reportLabelData = items;
    // IMPORTANT: Keyword percentages must always use the total number of
    // chats in the current Report filter, NOT the sum of keyword bars.
    // Without this, the canvas-label fallback calculates 141/(141+22+12)
    // instead of 141/reportFilteredData.length.
    config._reportPercentTotal = this.reportFilteredData.length;
    this.createReportChart(id, config);
  };

  createFresh('reportCustomerKeywordBar', makeConfig(customer, '#60a5fa'), customer);
  createFresh('reportAdminKeywordBar', makeConfig(admin, '#4ade80'), admin);
},

renderReportCharts(){
  if (this.currentTab !== 'report' || typeof Chart === 'undefined') return;

  const plugin = this.renderReportValuePlugin();
  const pieLabelPlugin = {
    id:'reportPieLabels',
    afterDraw: chart => {
      try {
        const meta = chart.getDatasetMeta(0);
        const vals = chart.data.datasets[0].data || [];
        const total = vals.reduce((a,b)=>a + (Number(b)||0), 0);
        const ctx = chart.ctx;
        if (!total) return;
        ctx.save();
        meta.data.forEach((arc,i)=>{
          const v = Number(vals[i]) || 0;
          if (!v) return;
          const pct = ((v/total)*100).toFixed(1) + '%';
          const angle = (arc.startAngle + arc.endAngle) / 2;
          const radius = (arc.innerRadius + arc.outerRadius) / 2;
          const x = arc.x + Math.cos(angle) * radius;
          const y = arc.y + Math.sin(angle) * radius;
          ctx.fillStyle='#fff';
          ctx.font='700 12px Arial';
          ctx.textAlign='center';
          ctx.textBaseline='middle';
          ctx.fillText(pct,x,y);
        });
        ctx.restore();
      } catch(e) { console.warn('Pie label error', e); }
    }
  };
  const pieOptions = {
    responsive:true,
    maintainAspectRatio:false,
    animation:false,
    layout:{padding:8},
    plugins:{
      legend:{display:false},
      tooltip:{callbacks:{label:c => `${c.label}: ${c.raw} แชท`}}
    }
  };

  const channel = this.reportChannelStats;
  this.createReportChart('reportChannelPie', {
    type:'doughnut',
    data:{
      labels:channel.map(x=>x.name),
      datasets:[{
        data:channel.map(x=>x.count),
        backgroundColor:channel.map(x=>x.color),
        borderColor:'#ffffff',
        borderWidth:2,
        hoverOffset:4
      }]
    },
    options:{...pieOptions, cutout:'58%'},
    plugins:[pieLabelPlugin]
  });

  const status = this.reportStatusStats;
  this.createReportChart('reportStatusPie', {
    type:'doughnut',
    data:{
      labels:status.map(x=>x.name),
      datasets:[{
        data:status.map(x=>x.count),
        backgroundColor:status.map(x=>x.color),
        borderColor:'#ffffff',
        borderWidth:2,
        hoverOffset:4
      }]
    },
    options:{...pieOptions, cutout:'58%'},
    plugins:[pieLabelPlugin]
  });

  const process = this.reportProcessStats;
  this.createReportChart('reportProcessPie', {
    type:'doughnut',
    data:{
      labels:process.map(x=>x.name),
      datasets:[{
        data:process.map(x=>x.count),
        backgroundColor:process.map((x,i)=>`hsl(${(i*47)%360} 70% 55%)`),
        borderColor:'#ffffff',
        borderWidth:2,
        hoverOffset:3
      }]
    },
    options:{...pieOptions, cutout:'58%'},
    plugins:[pieLabelPlugin]
  });

  const f=this.reportStatusFrequencyData;
  const fl=f.Overall.map(x=>x.bucket);
  const freqTotal=this.reportFilteredData.length || 0;
  const makeFreqLabels=arr=>arr.map(x=>({count:x.count,percent:freqTotal?((x.count/freqTotal)*100).toFixed(1):'0.0'}));
  const freqLabelSets=[
    makeFreqLabels(f.Overall),
    makeFreqLabels(f.New),
    makeFreqLabels(f.Lead),
    makeFreqLabels(f.Old)
  ];
  this.createReportChart('reportStatusFrequency',{
    type:'bar',data:{labels:fl,datasets:[
      {label:'Overall',data:f.Overall.map(x=>x.count),backgroundColor:'#93c5fd'},
      {label:'New',data:f.New.map(x=>x.count),backgroundColor:'#86efac'},
      {label:'Lead',data:f.Lead.map(x=>x.count),backgroundColor:'#fbbf24'},
      {label:'Old',data:f.Old.map(x=>x.count),backgroundColor:'#94a3b8'}
    ]},
    options:{responsive:true,maintainAspectRatio:false,animation:false,scales:{x:{stacked:false,categoryPercentage:0.78,barPercentage:0.9,ticks:{maxRotation:0,minRotation:0}},y:{beginAtZero:true,ticks:{precision:0}}}},
    plugins:[plugin],
    _reportLabelDataSets:freqLabelSets,
    _reportPercentTotal:freqTotal
  });

  const dt=this.reportDateStats;
  this.createReportChart('reportDateFrequency',{type:'bar',data:{labels:dt.map(x=>x.name),datasets:[{data:dt.map(x=>x.count),backgroundColor:'#60a5fa'}]},options:{responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.raw} แชท`}}},scales:{x:{ticks:{autoSkip:false,maxRotation:45,minRotation:45}},y:{beginAtZero:true,ticks:{precision:0}}}},plugins:[plugin]});

  const tm=this.reportTimeStats;
  this.createReportChart('reportTimeFrequency',{type:'bar',data:{labels:tm.map(x=>x.name),datasets:[{data:tm.map(x=>x.count),backgroundColor:'#60a5fa'}]},options:{responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.raw} แชท`}}},scales:{x:{ticks:{autoSkip:false,maxRotation:45,minRotation:45}},y:{beginAtZero:true,ticks:{precision:0}}}},plugins:[plugin]});

  const cu=this.reportCustomerStats;
  const cuCfg={type:'bar',data:{labels:cu.map(x=>x.name),datasets:[{data:cu.map(x=>x.count),backgroundColor:'#60a5fa'}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,ticks:{precision:0}}}},plugins:[plugin]};
  cuCfg._reportLabelData=cu; this.createReportChart('reportCustomerBar',cuCfg);

  const ad=this.reportAdminStats;
  const adCfg={type:'bar',data:{labels:ad.map(x=>x.name),datasets:[{data:ad.map(x=>x.count),backgroundColor:'#4ade80'}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,ticks:{precision:0}}}},plugins:[plugin]};
  adCfg._reportLabelData=ad; this.createReportChart('reportAdminBar',adCfg);

  // Sections 8–9: rebuild from the current Page 4 keyword lists.
  this.renderReportKeywordChartsFresh();
},

// =========================================================
// DELAY RENDER
// =========================================================

scheduleReportCharts() {
  clearTimeout(this.reportChartRenderTimer);
  this.reportChartRenderTimer = setTimeout(() => {
    if (this.currentTab !== 'report') return;
    this.$nextTick(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.renderReportCharts();
          requestAnimationFrame(() => {
            Object.values(this.reportCharts || {}).forEach(chart => {
              try { if (chart && chart.canvas && chart.canvas.isConnected) chart.resize(); } catch(e) {}
            });
          });
        });
      });
    });
  }, 180);
},

        get sortedCustomerCategoryCount() {
          let counts = {};
          this.processFilteredData.forEach(item => {
            let cat = item.ai_Customer || 'ไม่ระบุหมวดหมู่';
            counts[cat] = (counts[cat] || 0) + 1;
          });
          return Object.keys(counts).map(cat => ({
            category: cat,
            count: counts[cat]
          })).sort((a, b) => b.count - a.count);
        },

        get sortedAdminResponseCount() {
          let targetData = this.processFilteredData;
          if (this.selectedCategory) {
            targetData = targetData.filter(item => (item.ai_Customer || '') === this.selectedCategory);
          }

          let map = {};
          targetData.forEach(item => {
            let admin = item.ai_Admin || 'ไม่มีการตอบกลับ';
            let proc = item.ai_Process || 'ไม่ระบุสถานะ';
           
            if (!map[admin]) {
              map[admin] = { count: 0, processMap: {} };
            }
            map[admin].count += 1;
            if (!map[admin].processMap[proc]) {
              map[admin].processMap[proc] = [];
            }
            map[admin].processMap[proc].push(item);
          });

          return Object.keys(map).map(admin => {
            let procMap = map[admin].processMap;
            let processDetails = Object.keys(procMap).map(pName => ({
              name: pName,
              count: procMap[pName].length,
              chats: procMap[pName]
            })).sort((a, b) => b.count - a.count);

            return {
              adminResp: admin,
              count: map[admin].count,
              processDetails: processDetails
            };
          }).sort((a, b) => b.count - a.count);
        },


        get sortedProcessSummary() {
          let total = this.filteredData.length;
          let counts = {};
          this.filteredData.forEach(item => {
            let proc = item.ai_Process || 'ไม่ระบุสถานะ';
            counts[proc] = (counts[proc] || 0) + 1;
          });

          return Object.keys(counts).map(proc => {
            let count = counts[proc];
            let percent = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
            return { processName: proc, count: count, percent: percent };
          }).sort((a, b) => b.count - a.count);
      
      
        }
      }
    }
