'use strict';
/* ================= 吃灰博物馆 v3 · 只进不出 =================
   纯前端零依赖 · localStorage · 手机优先 */
var KEY='dustMuseum.v3';
/* ---- 版本与更新机制 ----
   APP_VER：每次发版必须手动 +1，并在 CHANGELOG 顶部补一条。
   数据迁移：load() 内按存储版本逐级 upgrade，永不覆盖用户数据。 */
var APP_VER='3.3.0';
var BUILD_AT='2026-10-25';
var CHANGELOG=[
 {v:'3.3.0',d:'2026-10-25',items:['小红书小工具版适配：存相册走官方通道、导出改弹层复制、「更早」月份改页内输入、容器内自动跳过联网检查']},
 {v:'3.2.5',d:'2026-10-25',items:['明信片「换一张」实至名归：每次重新盖章（角度/位置/大小随机）+ 随机馆藏登记号，照片始终保留']},
 {v:'3.2.4',d:'2026-10-25',items:['修复：捐赠证书/明信片点「换一张」后用户照片消失的问题（重放原图而非回落到门票绘制）']},
 {v:'3.2.3',d:'2026-10-25',items:['购买原因支持自定义：点「＋自定义」输入，回车即存；捐赠人自动署名「一时兴起的{原因}」，独立成厅陈列']},
 {v:'3.2.2',d:'2026-10-25',items:['类别支持自定义：点「＋自定义」输入名称，回车即存为本馆永久类别']},
 {v:'3.2.1',d:'2026-10-25',items:['类别二次扩容：10 类 → 18 类（新增 家居家具/乐器音响/户外运动/潮玩手办/游戏设备/车载用品/工具器材/保健器械）']},
 {v:'3.2.0',d:'2026-10-25',items:['类别扩容：6 类 → 10 类（新增书籍课程/宠物用品/旅行装备/爱好器材）','购买原因扩容：5 种 → 8 种（新增送礼备选/入坑幻想/理想生活）','新增三大展厅：送不出去的心意/入坑即巅峰/理想生活遗址','导览手册支持左右滑动翻页（手机手势，按钮保留）']},
 {v:'3.1.0',d:'2026-10-25',items:['新增版本管理与更新公告机制','使用说明/演示馆藏/更新公告常驻页脚','演示模式不再覆盖真实馆藏（自动存取备份）','镇馆之宝角标跨展厅误标修复','门票/明信片 iOS 长按保存支持','存储超额时明确提示不再静默丢数据']},
 {v:'3.0.0',d:'2026-10-25',items:['只进不出 v3 定稿：入馆即终审，概不赎回','积灰滤镜、三厅陈列、镇馆之宝、手痒急救','捐赠证书与门票 Canvas 生成']}
];
var UPD_MANIFEST='update.json'; /* 同目录 manifest，发新版时改 VER 字段即可触发"点击刷新" */
var CATS=[['digital','数码'],['fitness','健身'],['kitchen','厨具'],['clothes','衣服'],['beauty','美妆'],['book','书籍课程'],['pet','宠物用品'],['travel','旅行装备'],['hobby','爱好器材'],['furniture','家居家具'],['music','乐器音响'],['sport','户外运动'],['toy','潮玩手办'],['game','游戏设备'],['auto','车载用品'],['tool','工具器材'],['health','保健器械'],['other','其他']];
var MAT={digital:'硅、金属，与吃灰的算力',fitness:'橡胶、铁，与办卡时的决心',kitchen:'金属、玻璃，与未实现的清晨',
  clothes:'棉、纤维，与想象中的场合',beauty:'瓶瓶罐罐，与直播间的三秒心动',book:'纸张、像素，与没打开的第 1 页',
  pet:'毛绒、猫抓布，与主子不领的情',travel:'防水布料，与永远凑不齐的假期',hobby:'铝合金，与三分钟热度的重量',
  furniture:'板材、螺丝，与图纸上的书房',music:'实木、琴弦，与没练熟的指法',sport:'速干面料，与下一个周末的约定',
  toy:'树脂、涂装，与柜子里的编制',game:'芯片、摇杆，与通关前的热情',auto:'塑料、镀铬，与堵在路上的生活',
  tool:'钢铁、刻度，与差一点开始的手工',health:'硅胶、电机，与办卡赠送的体测',other:'复合材质，与说不清的冲动'};
var WHY=[['fomo','跟风'],['plan','自用计划'],['promo','大促氛围'],['peer','别人都有'],['impulse','一时上头'],['gift','送礼备选'],['hobby','入坑幻想'],['life','理想生活']];
var DONOR={fomo:'一群人的热闹',plan:'更好的自己',promo:'一年只冷静两次的购物节',peer:'朋友圈经济',impulse:'3 秒后的决定',gift:'还没送出的心意',hobby:'入坑第一天的一生之约',life:'想象中的那种生活'};
/* 统一捐赠人取值：预设走 DONOR 映射；自定义原因署名「一时兴起的{名}」 */
function donorOf(reason){
  return DONOR[reason]||((DB.settings.customWhys||[]).indexOf(reason)>=0?'一时兴起的'+reason:'无名氏');
}
/* 统一展厅名取值：预设走 WHYROOM；自定义原因独立成「{名}厅」 */
function whyRoomOf(reason){
  return WHYROOM[reason]||((DB.settings.customWhys||[]).indexOf(reason)>=0?reason+'厅':WHYROOM[reason]);
}
var WHYROOM={fomo:'一号展厅 · 跟风购买',plan:'二号展厅 · 宏伟计划遗骸',promo:'三号展厅 · 大促纪念',peer:'四号展厅 · 别人都有公司',impulse:'五号展厅 · 一时上头',gift:'六号展厅 · 送不出去的心意',hobby:'七号展厅 · 入坑即巅峰',life:'八号展厅 · 理想生活遗址'};
var CURATOR={fomo:'这些展品的主人说，当时大家都在买。',
  plan:'每一件都曾伴随一份计划书。计划书没有幸存下来。',
  promo:'省下的钱，都花在了原本不会买的东西上。',
  peer:'馆方未能证实「别人」是否真的都有。',
  impulse:'从心动到下单用了 3 秒；从下单到入馆，平均 11 天。',
  gift:'它们本该出现在别人手里。后来它们出现在了这里。',
  hobby:'装备党的第一定律：买装备的快感约等于练十次。',
  life:'买下它们的那一刻，你已经是另一个人了。后来你变回来了。'};
var CURA_MULTI={promo:'折扣是真实的，需求是想象的。两句话都成立，账单也是。'};
var WHEN=[['week','本周'],['month','本月'],['earlier','更早']];
var WHEN_DAYS={week:7,month:30};

/* ============ 工具 ============ */
function $(id){return document.getElementById(id)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function fmt(n){n=Math.round(n);return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,',')}
function today0(){var d=new Date();d.setHours(0,0,0,0);return d.getTime()}
function daysBetween(t){return Math.max(0,Math.floor((today0()-t)/86400000))}
function toast(msg){var t=$('toast');t.textContent=msg;t.classList.add('show');
  clearTimeout(toast._h);toast._h=setTimeout(function(){t.classList.remove('show')},2200)}
function openSheet(s,m){s.classList.add('show');m.classList.add('show')}
function closeSheet(s,m){s.classList.remove('show');m.classList.remove('show')}
function uid(){return 'e_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function dust(days){ /* 积灰滤镜：天数→CSS filter */
  if(days<=1)return 'none';
  var g=Math.min(.82,days/210*.85), b=Math.max(.72,1-days/210*.28);
  return 'grayscale('+g.toFixed(2)+') brightness('+b.toFixed(2)+') sepia('+(g*.25).toFixed(2)+')';
}
function dayWord(n){
  if(n<1)return '今日入馆';if(n<30)return '吃灰 '+n+' 天';
  if(n<365)return '吃灰 '+(n/30).toFixed(1)+' 个月';
  return '吃灰 '+(n/365).toFixed(1)+' 年';
}
function perUse(e){return e.price/Math.max(1,e.usesAtEntry)}

/* ============ 数据层 ============ */
function blankDB(){return {v:3,settings:{monthlyIncome:3000,createdAt:Date.now(),demo:false,donated:0,customCats:[],customWhys:[]},exhibits:[],intercepts:[]}}
function upgrade(d){ /* 存储版本逐级迁移通道：v3 之后新增字段在此追加 */
  if(d.settings&&!d.settings.customCats)d.settings.customCats=[]; /* v3 → v3.2.2：自定义类别 */
  if(d.settings&&!d.settings.customWhys)d.settings.customWhys=[]; /* v3 → v3.2.3：自定义购买原因 */
  return d;
}
function load(){
  try{
    var raw=localStorage.getItem(KEY);
    if(!raw)return blankDB();
    var d=JSON.parse(raw);
    if(!d||typeof d!=='object'||!d.exhibits)return blankDB();
    if(d.v!==3)d=upgrade(d);
    if(!d.settings)d.settings={monthlyIncome:3000,createdAt:Date.now(),demo:false,donated:d.exhibits.length};
    if(d.settings.donated==null)d.settings.donated=d.exhibits.length;
    if(!Array.isArray(d.settings.customCats))d.settings.customCats=[];
    if(!Array.isArray(d.settings.customWhys))d.settings.customWhys=[];
    if(!d.intercepts)d.intercepts=[];
    return d;
  }catch(e){return blankDB()}
}
function save(silent){
  try{localStorage.setItem(KEY,JSON.stringify(DB))}
  catch(e){
    if(!silent)toast('保存失败：手机存储已满（照片太多）。请先导出备份，再清理部分展品');
    console.warn('localStorage save failed',e);
  }
}
var DB=load();
function nextNo(){
  var d=new Date(),ym=String(d.getFullYear()).slice(2)+String(d.getMonth()+1).padStart(2,'0');
  return 'DUST-'+ym+'-'+String(DB.settings.donated+1).padStart(3,'0');
}
/* 派生统计 */
function stats(){
  var s={total:0,count:DB.exhibits.length,sealed:0,daysSum:0,best:null,worst:null,maxDays:0,byWhy:{},byCat:{}};
  DB.exhibits.forEach(function(e){
    s.total+=e.price;
    if(e.usesAtEntry===0)s.sealed++;
    var d=daysBetween(e.enteredAt);s.daysSum+=d;if(d>s.maxDays)s.maxDays=d;
    var pu=perUse(e);
    if(!s.best||pu>perUse(s.best))s.best=e;
    if(!s.worst||e.price>s.worst.price)s.worst=e;
    s.byWhy[e.reason]=(s.byWhy[e.reason]||0)+e.price;
    s.byCat[e.category]=(s.byCat[e.category]||0)+e.price;
  });
  s.hourly=(DB.settings.monthlyIncome||3000)/176;
  s.workDays=s.hourly>0?s.total/s.hourly:0;
  return s;
}

/* ============ 首屏渲染 ============ */
var curHall='all';
function render(){
  var s=stats();
  $('heroNum').textContent=fmt(s.total);
  $('museumNo').textContent='DUST MUSEUM · NO.'+String(DB.settings.donated+1).padStart(3,'0');
  if(s.count>0){
    var pain=s.best;
    $('heroPain').innerHTML='其中一件 <b>'+esc(pain.name)+'</b>，入馆前只用过 '+
      (pain.usesAtEntry===0?'0 次 · 原封未拆':pain.usesAtEntry+' 次')+' ——<b>¥'+fmt(perUse(pain))+'/次</b>';
    $('heroMeta').innerHTML='<span><i></i>馆藏 '+s.count+' 件</span><span><i></i>原封未拆 '+s.sealed+' 件</span>'+
      '<span><i></i>涉案 '+fmt(s.workDays)+' 天的班</span>';
  }else{
    $('heroPain').innerHTML='馆藏虚位以待。<br>第一件展品，由你亲自捐赠。';
    $('heroMeta').innerHTML='<span><i></i>全馆免费开放</span><span><i></i>全年无休</span>';
  }
  renderStrip(s);renderHalls();renderTreasure(s);renderWall(s);
}
function renderStrip(s){
  var el=$('reportStrip'),h='';
  if(s.count===0){
    el.innerHTML='<div class="rp-card"><div class="v">—</div><div class="k">空馆。愿它永远如此（做不到就点下方按钮）</div></div>';
    return;
  }
  var whyTop=Object.keys(s.byWhy).sort(function(a,b){return s.byWhy[b]-s.byWhy[a]})[0];
  var whyPct=Math.round(s.byWhy[whyTop]/s.total*100);
  h+='<div class="rp-card hot" id="rpOpen"><div class="v"><small>¥</small>'+fmt(s.total)+'</div><div class="k">涉案总额 · 点击看策展报告</div></div>';
  h+='<div class="rp-card"><div class="v">'+whyPct+'%</div><div class="k">花在「'+(WHY.find(function(w){return w[0]===whyTop})||['',''])[1]+'」</div></div>';
  h+='<div class="rp-card"><div class="v">'+fmt(perUse(s.best))+'<small>/次</small></div><div class="k">单次使用价之最</div></div>';
  h+='<div class="rp-card"><div class="v">'+(s.daysSum/365).toFixed(1)+'<small>年</small></div><div class="k">全馆合计吃灰时长</div></div>';
  h+='<div class="rp-card"><div class="v">'+DB.intercepts.length+'</div><div class="k">累计拦截手痒次数</div></div>';
  el.innerHTML=h;
  $('rpOpen').onclick=openReport;
}
var HALLS=[['all','全馆'],['fomo','跟风'],['plan','宏伟计划'],['promo','大促'],['peer','别人都有'],['impulse','一时上头'],['gift','送礼'],['hobby','入坑'],['life','理想生活'],['sealed','未拆封']];
function renderHalls(){
  var cnt={all:DB.exhibits.length,sealed:0};
  DB.exhibits.forEach(function(e){
    cnt[e.reason]=(cnt[e.reason]||0)+1;
    if(e.usesAtEntry===0)cnt.sealed++;
  });
  var tabs=HALLS.slice();
  /* 自定义原因的展厅：有藏品才出现，厅名={原因}厅，插在「未拆封」前 */
  (DB.settings.customWhys||[]).forEach(function(w){
    if(cnt[w])tabs.splice(tabs.length-1,0,[w,esc(w)+'厅']);
  });
  $('hallTabs').innerHTML=tabs.map(function(h){
    var n=h[0]==='all'?(cnt.all||''):('·'+(cnt[h[0]]||0));
    return '<button class="hall-tab'+(curHall===h[0]?' on':'')+'" data-h="'+esc(h[0])+'">'+h[1]+'<span class="n">'+n+'</span></button>';
  }).join('');
  Array.prototype.forEach.call($('hallTabs').children,function(b){
    b.onclick=function(){curHall=b.dataset.h;renderHalls();renderWall(stats());
      $('hallHead').scrollIntoView({behavior:'smooth',block:'start'})};
  });
}
function renderTreasure(s){
  var slot=$('treasureSlot');
  if(!s.best||curHall!=='all'){slot.innerHTML='';return}
  var e=s.best,d=daysBetween(e.enteredAt);
  slot.innerHTML='<div class="treasure" id="tkTreasure"><img class="th" id="tkThImg" alt="">'+
    '<div class="tt"><div class="a">'+esc(e.name)+'</div>'+
    '<div class="b">单次使用价 <em>¥'+fmt(perUse(e))+'/次</em> · '+dayWord(d)+'</div></div></div>';
  var im=$('tkThImg');im.src=e.photo;im.style.filter=dust(d);
  $('tkTreasure').onclick=function(){openCase(e.id)};
}
function pieceCard(e){
  var d=daysBetween(e.enteredAt),sealed=e.usesAtEntry===0;
  var why=(WHY.find(function(w){return w[0]===e.reason})||['',''])[1];
  return '<div class="piece" data-id="'+e.id+'">'+
    '<div class="ph">'+(e.isTreasure?'<span class="crown">镇馆之宝</span>':'')+(sealed?'<span class="sealed">原封未拆</span>':'')+
    '<img src="'+e.photo+'" style="filter:'+dust(d)+'" alt="'+esc(e.name)+'"></div>'+
    '<div class="tag"><div class="nm">'+esc(e.name)+'<span class="pr">¥'+fmt(e.price)+'</span></div>'+
    '<div class="meta">'+dayWord(d)+' · ¥'+fmt(perUse(e))+'/次</div>'+
    '<div class="why">「'+esc(donorOf(e.reason))+'」捐赠</div></div></div>';
}
function renderWall(s){
  var wall=$('wall'),head=$('hallHead'),list;
  if(curHall==='all'){list=DB.exhibits.slice()}
  else if(curHall==='sealed'){list=DB.exhibits.filter(function(e){return e.usesAtEntry===0})}  else{list=DB.exhibits.filter(function(e){return e.reason===curHall})}
  if(curHall==='all'){
    head.innerHTML='<div class="t">全馆藏品</div><div class="curatorial">'+(s.count? '按入馆时间陈列，越旧越灰。':'这里目前空无一物——愿它永远如此。')+'</div>';
  }else if(curHall==='sealed'){
    head.innerHTML='<div class="t">原封未拆特展</div><div class="curatorial">包装完好，梦想保质期未知。</div>';
  }else{
    var name=(HALLS.find(function(h){return h[0]===curHall})||['',''])[1];
    head.innerHTML='<div class="t">'+whyRoomOf(curHall)+'</div><div class="curatorial">'+(CURATOR[curHall]||'')+'</div>';
  }
  if(list.length===0){
    wall.innerHTML='<div class="empty-hall"><div class="big">虚位以待</div>'+(s.count===0?
      '馆长致辞：欢迎开馆。这里目前空无一物——<br>愿它永远如此。（若做不到，右下角按钮见）':'这个展厅暂时没有藏品')+'</div>';
    return;
  }
  list.sort(function(a,b){return perUse(b)-perUse(a)});
  var s2=stats();
  /* 角标只按 id 判定，不写回对象——修复跨厅残留 */
  var treasureId=(curHall==='all'&&s2.best)?s2.best.id:null;
  wall.innerHTML=list.map(function(e){
    e.isTreasure=(e.id===treasureId);
    return pieceCard(e);
  }).join('');
  Array.prototype.forEach.call(wall.children,function(c){
    if(c.dataset && c.dataset.id)c.onclick=function(){openCase(c.dataset.id)};
  });
}

/* ============ 捐赠流程 ============ */
var draft={photo:null,cat:null,why:null,when:'month'};
function initForm(){
  function catChips(){
    var h=CATS.map(function(c){return '<button class="chip" data-v="'+c[0]+'">'+c[1]+'</button>'}).join('');
    (DB.settings.customCats||[]).forEach(function(c){h+='<button class="chip" data-v="'+c+'">'+esc(c)+'</button>'});
    h+='<button class="chip chip-new" data-v="__new">＋自定义</button>';
    $('fCat').innerHTML=h;
    Array.prototype.forEach.call($('fCat').children,function(b){
      if(b.dataset.v==='__new'){b.onclick=function(){$('fCatNew').classList.remove('hidden');$('fCatNew').focus()};return}
      b.onclick=function(){
        Array.prototype.forEach.call($('fCat').children,function(x){x.classList.remove('on')});
        b.classList.add('on');draft.cat=b.dataset.v;checkReady();
      };
    });
  }
  catChips();
  /* 自定义类别：回车或失焦确认 → 存入 settings.customCats 永久可选 */
  $('fCatNew').onkeydown=function(ev){
    if(ev.key==='Enter'){ev.preventDefault();commitCat()}
  };
  $('fCatNew').onblur=commitCat;
  function commitCat(){
    var v=$('fCatNew').value.trim().slice(0,6);
    if(!v){return}
    $('fCatNew').value='';$('fCatNew').classList.add('hidden');
    if((DB.settings.customCats||[]).indexOf(v)<0&&!(CATS.some(function(c){return c[1]===v}))){DB.settings.customCats.push(v);save()}
    catChips();
    Array.prototype.forEach.call($('fCat').children,function(x){
      if(x.dataset.v===v){x.classList.add('on')}
    });
    draft.cat=v;checkReady();
    toast('「'+v+'」已加入本馆类别');
  }
  /* 自定义原因：同类别机制，存 settings.customWhys；展厅名=「{名}厅」，捐赠人=「一时兴起的{名}」 */
  function whyChips(){
    var h=WHY.map(function(c){return '<button class="chip" data-v="'+c[0]+'">'+c[1]+'</button>'}).join('');
    (DB.settings.customWhys||[]).forEach(function(w){h+='<button class="chip" data-v="'+esc(w)+'">'+esc(w)+'</button>'});
    h+='<button class="chip chip-new" data-v="__new">＋自定义</button>';
    $('fWhy').innerHTML=h;
    Array.prototype.forEach.call($('fWhy').children,function(b){
      if(b.dataset.v==='__new'){b.onclick=function(){$('fWhyNew').classList.remove('hidden');$('fWhyNew').focus()};return}
      b.onclick=function(){
        Array.prototype.forEach.call($('fWhy').children,function(x){x.classList.remove('on')});
        b.classList.add('on');draft.why=b.dataset.v;checkReady();
      };
    });
  }
  whyChips();
  $('fWhyNew').onkeydown=function(ev){if(ev.key==='Enter'){ev.preventDefault();commitWhy()}};
  $('fWhyNew').onblur=commitWhy;
  function commitWhy(){
    var v=$('fWhyNew').value.trim().slice(0,6);
    if(!v){return}
    $('fWhyNew').value='';$('fWhyNew').classList.add('hidden');
    if((DB.settings.customWhys||[]).indexOf(v)<0&&!(WHY.some(function(c){return c[1]===v}))){DB.settings.customWhys.push(v);save()}
    whyChips();
    Array.prototype.forEach.call($('fWhy').children,function(x){
      if(x.dataset.v===v){x.classList.add('on')}
    });
    draft.why=v;checkReady();
    toast('「'+v+'」已加入本馆原因');
  }
  $('fWhen').innerHTML=WHEN.map(function(c){return '<button class="chip'+(c[0]==='month'?' on':'')+'" data-v="'+c[0]+'">'+c[1]+'</button>'}).join('');
  bindChips('fWhen',function(v){
    draft.when=v;
    /* 选「更早」展开页内月份输入（容器禁用 window.prompt） */
    if(v==='earlier'){$('fWhenMonth').classList.remove('hidden');$('fWhenMonth').focus()}
    else{$('fWhenMonth').classList.add('hidden')}
  });
  $('fWhenMonth').onkeydown=function(ev){
    if(ev.key==='Enter'){
      ev.preventDefault();
      var v=this.value.trim();
      if(/^\d{4}-\d{1,2}$/.test(v)){whenMonthVal=v;toast('大约入馆时间：'+v);this.blur()}
      else{toast('格式：2025-06')}
    }
  };
  $('fWhenMonth').onblur=function(){if(this.value.trim())whenMonthVal=this.value.trim()};
  $('fName').oninput=$('fPrice').oninput=$('fUses').oninput=checkReady;
  $('photoInput').onchange=onPhoto;
}
function bindChips(id,cb){
  Array.prototype.forEach.call($(id).children,function(b){
    b.onclick=function(){
      Array.prototype.forEach.call($(id).children,function(x){x.classList.remove('on')});
      b.classList.add('on');cb(b.dataset.v);checkReady();
    };
  });
}
function checkReady(){
  var ok=draft.photo&&$('fName').value.trim()&&parseFloat($('fPrice').value)>0&&(draft.cat!==null)&&(draft.why!==null)&&$('fUses').value!=='';
  $('donateGo').disabled=!ok;
}
function onPhoto(ev){
  var f=ev.target.files&&ev.target.files[0];if(!f)return;
  var rd=new FileReader();
  rd.onload=function(){var im=new Image();
    im.onload=function(){
      var c=document.createElement('canvas'),max=640,s=Math.min(1,max/Math.max(im.width,im.height));
      c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);
      c.getContext('2d').drawImage(im,0,0,c.width,c.height);
      draft.photo=c.toDataURL('image/jpeg',.72);
      $('photoPick').querySelectorAll('.ph-ico,#photoHint').forEach(function(n){n.style.display='none'});
      var old=$('photoPick').querySelector('img');if(old)old.remove();
      var pv=document.createElement('img');pv.src=draft.photo;$('photoPick').appendChild(pv);
      checkReady();
    };im.src=rd.result};
  rd.readAsDataURL(f);
}
var whenMonthVal=''; /* 「更早」月份输入值（页内输入框，替代被容器禁用的 window.prompt） */
function computeBoughtAt(){
  if(draft.when==='week')return Date.now()-7*86400000;
  if(draft.when==='earlier'){
    if(whenMonthVal&&/^\d{4}-\d{1,2}$/.test(whenMonthVal)){
      var p=whenMonthVal.split('-');return new Date(+p[0],+p[1]-1,15).getTime();
    }
    return Date.now()-120*86400000;
  }
  return Date.now()-30*86400000;
}
function openDonate(){openSheet($('donateSheet'),$('donateMask'))}
$('donateMask').onclick=$('donateClose').onclick=function(){closeSheet($('donateSheet'),$('donateMask'))};
$('btnDonate').onclick=openDonate;
$('donateGo').onclick=function(){
  $('registering').classList.remove('hidden');
  setTimeout(function(){
    var e={id:uid(),name:$('fName').value.trim(),price:Math.round(parseFloat($('fPrice').value)),
      category:draft.cat,reason:draft.why,usesAtEntry:Math.max(0,parseInt($('fUses').value)||0),
      photo:draft.photo,enteredAt:computeBoughtAt()};
    DB.exhibits.unshift(e);DB.settings.donated++;save();
    $('registering').classList.add('hidden');
    closeSheet($('donateSheet'),$('donateMask'));
    resetForm();render();
    showCert(e);
  },1100);
};
function resetForm(){
  draft={photo:null,cat:null,why:null,when:'month'};
  $('fName').value='';$('fPrice').value='';$('fUses').value='';
  ['fCat','fWhy'].forEach(function(id){Array.prototype.forEach.call($(id).children,function(x){x.classList.remove('on')})});
  $('fCatNew').value='';$('fCatNew').classList.add('hidden');
  $('fWhyNew').value='';$('fWhyNew').classList.add('hidden');
  whenMonthVal='';$('fWhenMonth').value='';$('fWhenMonth').classList.add('hidden');
  Array.prototype.forEach.call($('fWhen').children,function(x,i){x.classList.toggle('on',i===1)});
  var pv=$('photoPick').querySelector('img');if(pv)pv.remove();
  $('photoPick').querySelectorAll('.ph-ico,#photoHint').forEach(function(n){n.style.display=''});
  $('donateGo').disabled=true;
}
/* 捐赠证书 Canvas */
function showCert(e){
  var c=document.createElement('canvas');c.width=750;c.height=960;var x=c.getContext('2d');
  x.fillStyle='#f3ecd9';x.fillRect(0,0,750,960);
  x.strokeStyle='#a3834c';x.lineWidth=3;x.strokeRect(24,24,702,912);
  x.strokeStyle='#c9a25e';x.lineWidth=1;x.strokeRect(34,34,682,892);
  x.fillStyle='#26221a';x.textAlign='center';
  x.font='15px Georgia';x.fillStyle='#a3834c';x.fillText('D U S T   M U S E U M',375,92);
  x.font='34px Georgia,"PingFang SC"';x.fillStyle='#26221a';x.fillText('藏 品 捐 赠 证 书',375,146);
  x.strokeStyle='#c9a25e';x.beginPath();x.moveTo(275,168);x.lineTo(475,168);x.stroke();
  x.font='16px "PingFang SC"';x.fillStyle='#5c564a';
  x.fillText('兹收到捐赠人「'+ donorOf(e.reason) +'」捐赠之藏品',375,230);
  x.font='bold 30px "PingFang SC"';x.fillStyle='#26221a';x.fillText('《 '+e.name+' 》',375,290);
  /* 藏品照片 */
  var done=false;
  function drawRest(){
    if(done)return;done=true;
    x.fillStyle='#f3ecd9';
    x.font='16px "PingFang SC"';x.fillStyle='#5c564a';
    x.fillText('入手价格 ¥'+fmt(e.price)+' · 入馆前使用 '+e.usesAtEntry+' 次',375,640);
    x.fillText('馆藏编号 '+e.id.toUpperCase().replace('E_','DUST-')+' → 永久馆藏',375,676);
    x.font='14px "PingFang SC"';x.fillStyle='#8d8778';
    x.fillText('依据本馆修复伦理，本藏品保留历史原貌，概不出馆。',375,742);
    x.fillText('感谢你为理性消费事业作出的示范性牺牲。',375,772);
    x.font='15px Georgia';x.fillStyle='#a3834c';
    x.fillText('参观免费 · 教训自付',375,872);
    var url=c.toDataURL('image/jpeg',.85);
    postMode='cert';
    openPostView(url,'捐赠证书已生成，保存后可炫耀（或忏悔）');
  }
  var im=new Image();
  im.onload=function(){
    var w=300,h=300,sx=0,sy=0,iw=im.width,ih=im.height;
    if(iw>ih){sx=(iw-ih)/2;iw=ih}else{sy=(ih-iw)/2;ih=iw}
    x.fillStyle='#efe6d2';x.fillRect(225,330,300,300);
    x.drawImage(im,sx,sy,iw,ih,225,330,300,300);
    x.strokeStyle='#c9a25e';x.strokeRect(225,330,300,300);
    drawRest();
  };
  im.onerror=drawRest;
  im.src=e.photo;
}
/* 明信片/证书通用预览（复用门票 sheet 画布区） */
var postHold=null;
var postExhibit=null; /* 明信片对应的展品，「换一张」重新生成用 */
var postMode='postcard'; /* 'postcard'=可重新生成 | 'cert'=证书重放 */
var tkMode='ticket'; /* 'ticket'=门票重绘 | 'post'=明信片/证书重放 postHold 图 */
function openPostView(url,msg){
  postHold=url;tkMode='post';
  var im=new Image();
  im.onload=function(){
    var c=$('tkCanvas'),x=c.getContext('2d');
    /* 复位 canvas/img 双通道状态（上次保存可能留下的 img 模式） */
    var savedImg=$('tkImg');
    if(savedImg){savedImg.classList.add('hidden');var h=$('tkImgHint');if(h)h.remove();}
    c.classList.remove('hidden');
    var r=Math.min(c.width/im.width,c.height/im.height);
    var w=im.width*r,h=im.height*r;
    x.fillStyle='#161310';x.fillRect(0,0,c.width,c.height);
    x.drawImage(im,(c.width-w)/2,(c.height-h)/2,w,h);
    $('tkSheet').querySelector('.sheet-head .t').textContent=msg||'明信片';
    openSheet($('tkSheet'),$('tkMask'));
  };
  im.src=url;
}

/* ============ 展柜特写 ============ */
var caseCur=null;
function openCase(id){
  var e=DB.exhibits.find(function(x){return x.id===id});if(!e)return;
  caseCur=e;
  var d=daysBetween(e.enteredAt),sealed=e.usesAtEntry===0;
  var im=$('caseImg');im.src=e.photo;im.style.filter=dust(d);
  $('cp1').textContent=e.name+'，'+new Date(e.enteredAt).getFullYear();
  $('cp2').textContent=MAT[e.category]||'复合材质，与说不清的冲动';
  $('cp3').textContent='由「'+donorOf(e.reason)+'」捐赠';
  $('cp4').textContent=(sealed?'原封未拆 · ':'入馆前使用 '+e.usesAtEntry+' 次 · ')+dayWord(d);
  $('cp5').textContent=nextNoOf(e);
  $('caseMeta').innerHTML=
    '<div>入手价格 <b>¥'+fmt(e.price)+'</b></div>'+
    '<div>单次使用价 <b class="pain">¥'+fmt(perUse(e))+'/次</b>'+(sealed?'':' · 每多用一次，本可以便宜一点')+'</div>'+
    '<div>已在本馆沉睡 <b>'+d+'</b> 天——无人参观</div>';
  openSheet($('case'),{classList:{add:function(){},remove:function(){}}});
}
function nextNoOf(e){
  var d=new Date(e.enteredAt),ym=String(d.getFullYear()).slice(2)+String(d.getMonth()+1).padStart(2,'0');
  var idx=DB.exhibits.indexOf(e);
  return 'DUST-'+ym+'-'+String(DB.exhibits.length-idx).padStart(3,'0');
}
$('caseClose').onclick=function(){$('case').classList.remove('show')};
$('casePost').onclick=function(){
  if(!caseCur)return;
  postExhibit=caseCur;postMode='postcard';
  makePostcard(caseCur,function(url){openPostView(url,'藏品明信片 · 长按或保存')});
};
$('caseTicket').onclick=openTicket;
function makePostcard(e,cb){
  var c=document.createElement('canvas');c.width=750;c.height=1000;var x=c.getContext('2d');
  x.fillStyle='#f3ecd9';x.fillRect(0,0,750,1000);
  x.strokeStyle='#c9a25e';x.lineWidth=2;x.strokeRect(22,22,706,956);
  var im=new Image();
  im.onload=function(){
    var w=640,h=640,sx=0,sy=0,iw=im.width,ih=im.height;
    if(iw>ih){sx=(iw-ih)/2;iw=ih}else{sy=(ih-iw)/2;ih=iw}
    x.fillStyle='#efe6d2';x.fillRect(55,60,640,640);
    x.save();x.filter=dust(daysBetween(e.enteredAt))||'none';
    x.drawImage(im,sx,sy,iw,ih,55,60,640,640);x.restore();
    x.strokeStyle='#a3834c';x.lineWidth=3;x.strokeRect(55,60,640,640);
    /* 红章：角度/位置/大小每次随机，让「换一张」真有得换 */
    var ang=-(Math.random()*.5+.1),dx=(Math.random()*60-30),dy=(Math.random()*40-20),sc=(Math.random()*.25+.9);
    x.save();x.translate(628+dx,636+dy);x.rotate(ang);x.scale(sc,sc);
    x.strokeStyle='#a63a2e';x.lineWidth=4;x.globalAlpha=.88;
    x.beginPath();x.arc(0,0,52,0,7);x.stroke();
    x.beginPath();x.arc(0,0,40,0,7);x.lineWidth=1.5;x.stroke();
    x.fillStyle='#a63a2e';x.font='46px Georgia';x.textAlign='center';x.fillText('灰',0,16);
    x.restore();
    /* 馆藏编号手写风戳记：每次随机 */
    x.save();x.globalAlpha=.75;x.fillStyle='#8d8778';
    x.font='italic 17px Georgia';x.textAlign='left';
    x.fillText('Reg. No. '+String(Math.floor(Math.random()*8999)+1000)+'-'+String(Math.floor(Math.random()*89)+10),70,955);
    x.restore();
    /* 展签 */
    x.fillStyle='#26221a';x.textAlign='center';
    x.font='32px Georgia,"PingFang SC"';x.fillText(e.name+'，'+new Date(e.enteredAt).getFullYear(),375,770);
    x.font='19px "PingFang SC"';x.fillStyle='#5c564a';
    x.fillText(MAT[e.category]||'',375,808);
    x.fillText('由「'+donorOf(e.reason)+'」捐赠 · '+dayWord(daysBetween(e.enteredAt)),375,840);
    x.font='13px Georgia';x.fillStyle='#8d8778';x.fillText('¥'+fmt(perUse(e))+' / 次   ·   DUST MUSEUM',375,878);
    x.fillText('参观免费 · 教训自付',375,934);
    cb(c.toDataURL('image/jpeg',.85));
  };
  im.src=e.photo;
}

/* ============ 手痒急救 ============ */
$('btnAid').onclick=function(){
  var s=stats();
  if(s.count===0){
    toast('馆藏还是空的——这次，让它一直空着？');
    return;
  }
  var fomoN=DB.exhibits.filter(function(e){return e.reason==='fomo'}).length;
  $('aidNums').innerHTML=
    '<div class="aid-row"><span class="k">你已有藏品在吃灰</span><span class="v">'+s.count+' <small>件</small></span></div>'+
    '<div class="aid-row"><span class="k">涉案总额</span><span class="v">¥'+fmt(s.total)+'</span></div>'+
    '<div class="aid-row"><span class="k">其中跟风买的</span><span class="v">'+fomoN+' <small>件</small></span></div>';
  $('aidQuote').textContent='眼前这件东西，半年后大概率就是它们中的一员。馆方建议：先去展厅里转一圈，再来决定。';
  openSheet($('aidSheet'),$('aidMask'));
};
$('aidMask').onclick=$('aidClose').onclick=function(){closeSheet($('aidSheet'),$('aidMask'))};
$('aidResist').onclick=function(){
  DB.intercepts.push({id:uid(),amount:0,at:Date.now()});save();
  closeSheet($('aidSheet'),$('aidMask'));
  toast('拦截成功 · 今日第 '+(DB.intercepts.length)+' 次手痒被劝退');
  render();
};
$('aidBuy').onclick=function(){
  closeSheet($('aidSheet'),$('aidMask'));
  setTimeout(function(){toast('那至少——别让下一个它进馆。')},350);
};

/* ============ 策展报告 ============ */
function openReport(){renderReport();openSheet($('rpSheet'),$('rpMask'))}
$('rpMask').onclick=$('rpClose').onclick=function(){closeSheet($('rpSheet'),$('rpMask'))};
function renderReport(){
  var s=stats(),b=$('rpBody');
  if(s.count===0){b.innerHTML='<div class="empty-hall">本季度无展可策。恭喜。</div>';return}
  var h='';
  /* 原因占比 */
  var whyKeys=Object.keys(s.byWhy).sort(function(a,b){return s.byWhy[b]-s.byWhy[a]});
  var pal={fomo:'#c05b3a',plan:'#8a6d3b',promo:'#b98a2f',peer:'#7d7461',impulse:'#a63a2e'};
  var PAL_FB=['#b0714f','#9c8560','#8a6d3b','#a63a2e','#b98a2f','#7d7461'];
  h+='<div class="f-lb" style="margin-top:8px">涉案金额按购买原因</div><div class="chart">';
  var fbi=0;
  whyKeys.forEach(function(k){
    var v=s.byWhy[k],pct=Math.round(v/s.total*100);
    var nm=(WHY.find(function(w){return w[0]===k})||['',(DB.settings.customWhys||[]).indexOf(k)>=0?donorOf(k).replace('一时兴起的',''):'?'])[1];
    var color=pal[k]||PAL_FB[fbi++%PAL_FB.length];
    h+='<div class="bar-row"><div class="bl"><span>'+esc(nm)+'</span><b>¥'+fmt(v)+' · '+pct+'%</b></div>'+
       '<div class="bar"><i class="r" data-w="'+pct+'" style="background:'+color+'"></i></div></div>';
  });
  h+='</div>';
  /* 类别占比 */
  var catKeys=Object.keys(s.byCat).sort(function(a,b){return s.byCat[b]-s.byCat[a]});
  h+='<div class="f-lb">按类别</div><div class="chart">';
  catKeys.forEach(function(k){
    var pct=Math.round(s.byCat[k]/s.total*100);
    var nm=(CATS.find(function(w){return w[0]===k})||['','?'])[1];
    h+='<div class="bar-row"><div class="bl"><span>'+nm+'</span><b>¥'+fmt(s.byCat[k])+' · '+pct+'%</b></div>'+
       '<div class="bar"><i data-w="'+pct+'"></i></div></div>';
  });
  h+='</div>';
  /* 收入锚点 */
  h+='<div class="anc"><div class="a1">涉案总额，等于你</div>'+
     '<div class="a2">'+fmt(s.workDays)+' 天的班</div>'+
     '<div class="a3">按月薪 ¥'+fmt(DB.settings.monthlyIncome||3000)+' ÷ 176h 计算 · 可在馆长办公室调整</div></div>';
  /* 三项之最 */
  var bd=daysBetween(DB.exhibits.reduce(function(a,e){return daysBetween(e.enteredAt)>daysBetween(a.enteredAt)?e:a},DB.exhibits[0]));
  h+='<div class="best"><div class="bh">本 展 之 最</div>'+
     '<div class="bb"><span class="bn">单次使用价之最 · '+(s.best?esc(s.best.name):'—')+'</span><span class="bv">¥'+(s.best?fmt(perUse(s.best)):'—')+'/次</span></div>'+
     '<div class="bb"><span class="bn">沉睡最久 · '+(bd?esc(bd.name):'—')+'</span><span class="bv">'+(bd?daysBetween(bd.enteredAt):'—')+' 天</span></div>'+
     '<div class="bb"><span class="bn">原封未拆</span><span class="bv">'+s.sealed+' 件</span></div>'+
     '<div class="bb"><span class="bn">累计拦截手痒</span><span class="bv">'+DB.intercepts.length+' 次</span></div></div>';
  h+='<div class="f-note" style="text-align:center;margin-top:14px">以上数据只增不减。馆方对此深表遗憾，并深表期待。</div>';
  b.innerHTML=h;
  requestAnimationFrame(function(){requestAnimationFrame(function(){
    b.querySelectorAll('.bar i').forEach(function(i){i.style.width=i.dataset.w+'%'});
  })});
}

/* ============ 门票 Canvas ============ */
var tkSeed=Math.random();
function openTicket(){
  tkMode='ticket';
  tkSeed=Math.random();
  $('tkSheet').querySelector('.sheet-head .t').textContent='本馆门票';
  var savedImg=$('tkImg');
  if(savedImg){savedImg.classList.add('hidden');var h=$('tkImgHint');if(h)h.remove();}
  $('tkCanvas').classList.remove('hidden');
  drawTicket();openSheet($('tkSheet'),$('tkMask'));
}
$('tkMask').onclick=$('tkClose').onclick=function(){closeSheet($('tkSheet'),$('tkMask'))};
$('tkRegen').onclick=function(){
  if(tkMode==='post'){
    /* 明信片：有对应展品就重新生成（红章/编号随机变化）；证书无随机性则重放 */
    if(postMode==='postcard'&&postExhibit){makePostcard(postExhibit,function(url){openPostView(url,'藏品明信片 · 长按或保存')});return}
    if(postHold){openPostView(postHold,$('tkSheet').querySelector('.sheet-head .t').textContent)}
    return;
  }
  tkSeed=Math.random();
  var cv=$('tkCanvas'),im=$('tkImg');
  if(im&&!im.classList.contains('hidden')){im.classList.add('hidden');cv.classList.remove('hidden');
    var h=$('tkImgHint');if(h)h.remove();}
  drawTicket();
};
function saveCanvasImage(canvas,filename){
  var data=canvas.toDataURL('image/png');
  /* 小红书容器：优先走官方桥存相册 */
  var mt=window.xhs&&window.xhs.miniTool;
  if(mt&&typeof mt.saveImageToPhotosAlbum==='function'){
    mt.saveImageToPhotosAlbum({filePath:data}).then(function(){
      toast('已保存到手机相册');
    }).catch(function(){toast('保存失败，请长按图片手动保存')});
    return;
  }
  /* iOS Safari：canvas 长按不能存图，换 <img> 展示供长按保存 */
  var isIOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(isIOS&&navigator.canShare&&navigator.canShare({files:[new File([new Blob([data])],{type:'image/png'})]})){
    canvas.toBlob(function(blob){
      var f=new File([blob],filename,{type:'image/png'});
      navigator.share({files:[f],title:'吃灰博物馆'}).catch(function(){});
    });
    return;
  }
  var img=$('tkImg');
  if(img){
    img.src=data;img.classList.remove('hidden');canvas.classList.add('hidden');
    if(!$('tkImgHint')){
      var hint=document.createElement('div');hint.id='tkImgHint';hint.className='linkish';
      hint.textContent='长按图片保存 · 完成后点「换一张」返回';
      img.parentNode.insertBefore(hint,img.nextSibling);
    }
    return;
  }
  var a=document.createElement('a');a.download=filename;a.href=data;a.click();
}
$('tkSave').onclick=function(){saveCanvasImage($('tkCanvas'),'吃灰博物馆门票.png')};
function drawTicket(){
  var s=stats(),c=$('tkCanvas'),x=c.getContext('2d'),W=750,H=944;
  x.fillStyle='#161310';x.fillRect(0,0,W,H);
  x.strokeStyle='rgba(201,162,94,.5)';x.lineWidth=2;x.strokeRect(20,20,W-40,H-40);
  x.fillStyle='#efe6d2';x.textAlign='center';
  x.font='20px Georgia';x.fillStyle='#a3834c';x.fillText('D U S T   M U S E U M',W/2,86);
  x.font='44px Georgia,"PingFang SC"';x.fillStyle='#efe6d2';x.fillText('吃 灰 博 物 馆',W/2,148);
  x.font='17px "PingFang SC"';x.fillStyle='#9c917c';x.fillText('参观免费 · 教训自付',W/2,186);
  /* 撕裂线 */
  x.strokeStyle='rgba(201,162,94,.45)';x.setLineDash([8,7]);x.beginPath();
  x.moveTo(46,H-330);x.lineTo(W-46,H-330);x.stroke();x.setLineDash([]);
  x.font='15px Georgia';x.fillStyle='#9c917c';x.fillText('✂ - - - - - - - - - - - - - - -',W/2,H-300);
  /* 主数据 */
  if(s.count>0){
    x.font='18px "PingFang SC"';x.fillStyle='#9c917c';x.fillText('馆藏 '+s.count+' 件 · 涉案总额',W/2,H-250);
    x.font='64px Georgia';x.fillStyle='#f3e9d0';x.fillText('¥'+fmt(s.total),W/2,H-176);
    x.font='19px "PingFang SC"';x.fillStyle='#b3a88e';
    x.fillText('相当于 '+fmt(s.workDays)+' 天的班',W/2,H-132);
    x.font='18px "PingFang SC"';x.fillStyle='#9c917c';
    var bd=DB.exhibits.reduce(function(a,e){return daysBetween(e.enteredAt)>daysBetween(a.enteredAt)?e:a},DB.exhibits[0]);
    x.fillText('沉睡之最 '+(bd?esc(bd.name):'—')+' · 已睡 '+(bd?daysBetween(bd.enteredAt):0)+' 天',W/2,H-92);
    x.fillText('单次使用价之最 ¥'+fmt(perUse(s.best))+'/次',W/2,H-56);
  }else{
    x.font='20px "PingFang SC"';x.fillStyle='#b3a88e';
    x.fillText('空馆一张票',W/2,H-200);
    x.font='17px "PingFang SC"';x.fillStyle='#9c917c';
    x.fillText('愿它永远如此',W/2,H-160);
  }
  /* 票号 */
  var no='NO.'+String(Math.floor(tkSeed*899999)+100000)+'-'+(DB.intercepts.length);
  x.font='16px Georgia';x.fillStyle='#a3834c';x.fillText(no,W/2,H-286);
}

/* ============ 首访引导（馆长致辞+导览手册） ============ */
var GD=[
 {k:'WELCOME',t:'欢迎开馆',d:'这里陈列你买错的每一件东西。它们不被审判，也不被忘记——只是被挂起来，替你看着下一次手痒。'},
 {k:'HOW',t:'怎么逛',d:'买错了什么，就把它「捐赠」进来：一张照片、一个价格、一句老实话。馆方负责让它随时间慢慢变灰，越来越有分量。'},
 {k:'RULE',t:'唯一馆规',d:'藏品只进不出。没有赎回，没有翻案——买了就是买了。这面墙只会越来越满，而这正是它存在的意义。'}
];
var gdIdx=0;
function openGuide(first){
  gdFirst=first;gdIdx=0;renderGuide(first);openSheet($('gdSheet'),$('gdMask'));
}
$('gdMask').onclick=function(){};
/* 导览手册：左右滑动切页（v3.1，按钮保留双通道） */
(function(){
  var sx=0,sy=0,tracking=false;
  $('gdSheet').addEventListener('touchstart',function(ev){
    if(ev.touches.length!==1)return;
    sx=ev.touches[0].clientX;sy=ev.touches[0].clientY;tracking=true;
  },{passive:true});
  $('gdSheet').addEventListener('touchend',function(ev){
    if(!tracking)return;tracking=false;
    var t=ev.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;
    /* 水平位移 >48px 且明显大于垂直位移才算翻页，避免与页面滚动打架 */
    if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.5){
      if(dx<0&&gdIdx<GD.length-1){gdIdx++;renderGuide(gdFirst)}
      else if(dx>0&&gdIdx>0){gdIdx--;renderGuide(gdFirst)}
    }
  },{passive:true});
})();
var gdFirst=false;
function renderGuide(first){
  var p=GD[gdIdx];
  $('gdPage').innerHTML='<div class="gk">'+p.k+'</div><div class="gt">'+p.t+'</div><div class="gd">'+p.d+'</div>';
  $('gdDots').innerHTML=GD.map(function(_,i){return '<i class="'+(i===gdIdx?'on':'')+'"></i>'}).join('');
  var h='';
  if(gdIdx>0)h+='<button class="btn btn-ghost" id="gdPrev">上一页</button>';
  if(gdIdx<GD.length-1)h+='<button class="btn btn-donate" id="gdNext">下一页</button>';
  else h+='<button class="btn btn-donate" id="gdStart">'+(first?'开始逛馆':'继续')+'</button>';
  h+=first?'<button class="btn btn-ghost" id="gdDemo">先看演示馆藏</button>':'';
  $('gdActs').innerHTML=h;
  if($('gdPrev'))$('gdPrev').onclick=function(){gdIdx--;renderGuide(first)};
  if($('gdNext'))$('gdNext').onclick=function(){gdIdx++;renderGuide(first)};
  if($('gdStart'))$('gdStart').onclick=function(){closeSheet($('gdSheet'),$('gdMask'))};
  if($('gdDemo'))$('gdDemo').onclick=function(){loadDemo();closeSheet($('gdSheet'),$('gdMask'))};
}
/* ============ 演示模式 ============ */
function svgDataURl(svg){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}
function demoPhoto(bg,mid,dark,shape){
  var s='<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640">'+
    '<rect width="640" height="640" fill="'+bg+'"/>';
  if(shape==='mat'){s+='<g transform="translate(320,340)"><rect x="-190" y="-150" width="380" height="300" rx="16" fill="'+mid+'" stroke="'+dark+'" stroke-width="6"/>'+
    '<circle cx="0" cy="0" r="60" fill="'+dark+'"/></g>'}
  else if(shape==='dumbbell'){s+='<g transform="translate(320,320)"><rect x="-170" y="-24" width="340" height="48" rx="24" fill="'+mid+'"/>'+
    '<rect x="-220" y="-90" width="80" height="180" rx="20" fill="'+dark+'"/><rect x="140" y="-90" width="80" height="180" rx="20" fill="'+dark+'"/></g>'}
  else if(shape==='toaster'){s+='<g transform="translate(320,330)"><rect x="-200" y="-60" width="400" height="200" rx="46" fill="'+mid+'" stroke="'+dark+'" stroke-width="6"/>'+
    '<rect x="-140" y="-92" width="80" height="36" rx="10" fill="'+dark+'"/><rect x="60" y="-92" width="80" height="36" rx="10" fill="'+dark+'"/>'+
    '<rect x="-160" y="10" width="320" height="18" rx="9" fill="'+dark+'" opacity=".4"/></g>'}
  else if(shape==='camera'){s+='<g transform="translate(320,330)"><rect x="-210" y="-120" width="420" height="280" rx="30" fill="'+mid+'" stroke="'+dark+'" stroke-width="6"/>'+
    '<circle cx="0" cy="10" r="95" fill="'+dark+'"/><circle cx="0" cy="10" r="55" fill="'+bg+'"/><circle cx="0" cy="10" r="24" fill="'+mid+'"/>'+
    '<rect x="-70" y="-158" width="140" height="40" rx="12" fill="'+dark+'"/></g>'}
  else if(shape==='dress'){s+='<g transform="translate(320,330)"><path d="M-90,-160 L90,-160 L60,-60 L110,160 L-110,160 L-60,-60 Z" fill="'+mid+'" stroke="'+dark+'" stroke-width="6"/>'+
    '<path d="M-90,-160 Q0,-90 90,-160" fill="'+dark+'"/></g>'}
  else{s+='<g transform="translate(320,330)"><rect x="-160" y="-130" width="320" height="260" rx="26" fill="'+mid+'" stroke="'+dark+'" stroke-width="6"/>'+
    '<rect x="-120" y="-90" width="240" height="120" rx="12" fill="'+dark+'"/><rect x="-120" y="60" width="240" height="14" rx="7" fill="'+dark+'"/></g>'}
  s+='<ellipse cx="320" cy="560" rx="210" ry="26" fill="rgba(0,0,0,.10)"/></svg>';
  return svgDataURl(s);
}
/* ============ 演示模式（v3.1：不覆盖真实数据，自动备份/恢复） ============ */
var BK_KEY='dustMuseum.v3.backup';
function loadDemo(){
  var now=Date.now();
  var D=[
   {name:'瑜伽垫',price:499,category:'fitness',reason:'plan',usesAtEntry:2,when:214,
    photo:demoPhoto('#cfd8bd','#7d8f5e','#4c5a35','mat')},
   {name:'哑铃 5kg',price:329,category:'fitness',reason:'impulse',usesAtEntry:0,when:178,
    photo:demoPhoto('#d8d2c2','#8d8778','#4a463c','dumbbell')},
   {name:'烤面包机',price:249,category:'kitchen',reason:'plan',usesAtEntry:1,when:96,
    photo:demoPhoto('#e8d9b8','#c9a25e','#7a5c2e','toaster')},
   {name:'vlog 相机',price:2399,category:'digital',reason:'peer',usesAtEntry:3,when:45,
    photo:demoPhoto('#c4cdd8','#6b7b8f','#333f4e','camera')},
   {name:'法式碎花裙',price:359,category:'clothes',reason:'fomo',usesAtEntry:1,when:60,
    photo:demoPhoto('#e3cfd6','#b57d8f','#74485a','dress')},
   {name:'空气炸锅',price:399,category:'kitchen',reason:'promo',usesAtEntry:4,when:12,
    photo:demoPhoto('#d8cdb8','#a98a5e','#5c4830','box')}
  ];
  /* 真实馆藏非空且尚未备份时，先备份再进演示——演示退出原样恢复 */
  var real=DB.settings.demo?null:DB;
  if(real&&(real.exhibits.length||real.intercepts.length)){
    try{localStorage.setItem(BK_KEY,JSON.stringify(real))}catch(e){real=null}
  }else if(real&&real.exhibits.length===0&&real.intercepts.length===0){
    real=null; /* 本来就是空馆，退出直接回空馆，无需备份 */
  }
  DB={v:3,settings:{monthlyIncome:8000,createdAt:now,demo:true,donated:6,customCats:[],customWhys:[]},exhibits:[],intercepts:[{id:uid(),amount:0,at:now-3*86400000}]};
  D.forEach(function(d){
    DB.exhibits.push({id:uid(),name:d.name,price:d.price,category:d.category,reason:d.reason,
      usesAtEntry:d.usesAtEntry,photo:d.photo,enteredAt:now-d.when*86400000});
  });
  save(true);render();
  $('demoBadge').classList.remove('hidden');
  toast('演示馆藏已布展 · 右上角退出，原馆藏原样奉还');
}
$('demoBadge').onclick=function(){
  var bak=null;
  try{bak=localStorage.getItem(BK_KEY)}catch(e){}
  if(bak){
    try{
      var d=JSON.parse(bak);
      if(d&&d.exhibits){DB=d;DB.settings.demo=false;localStorage.removeItem(BK_KEY);save();render();
        $('demoBadge').classList.add('hidden');$('case').classList.remove('show');toast('欢迎回来 · 你的馆藏已原样恢复');return}
    }catch(e){}
  }
  DB={v:3,settings:{monthlyIncome:DB.settings.monthlyIncome||3000,createdAt:Date.now(),demo:false,donated:0,customCats:[],customWhys:[]},exhibits:[],intercepts:[]};
  save();$('demoBadge').classList.add('hidden');render();
};

/* ============ 更新公告 + 检查更新 ============ */
function renderChangelog(){
  var h='<div class="f-note" style="margin-top:4px">当前版本 v'+APP_VER+'（'+BUILD_AT+'）</div>';
  CHANGELOG.forEach(function(c){
    h+='<div class="cl-v"><div class="cl-h">v'+c.v+'<span>'+c.d+'</span></div><ul>'+
      c.items.map(function(i){return '<li>'+i+'</li>'}).join('')+'</ul></div>';
  });
  h+='<div class="f-note">发版机制：馆方翻新后，本页会在下次到访时提示「刷新换新版本」——你的馆藏数据永远跟着你走，更新不动它。</div>';
  $('clBody').innerHTML=h;
}
function openChangelog(){renderChangelog();openSheet($('clSheet'),$('clMask'))}
$('clMask').onclick=$('clClose').onclick=function(){closeSheet($('clSheet'),$('clMask'))};
function checkUpdate(){
  /* 同目录 update.json：{"ver":"3.1.1"} 大于当前版本即提示刷新（刷新后 html 由发布端替换） */
  if(location.protocol==='file:')return;
  /* 小红书小工具容器纯离线：window.xhs 存在即为容器环境，跳过联网检查（fetch 会被拦截） */
  if(window.xhs)return;
  fetch(UPD_MANIFEST+'?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(function(m){
    if(!m||!m.ver)return;
    if(cmpVer(String(m.ver),APP_VER)>0){
      var b=$('updBar');
      b.classList.remove('hidden');
      b.onclick=function(){location.reload(true)};
    }
  }).catch(function(){});
}
function cmpVer(a,b){
  var pa=String(a).split('.'),pb=String(b).split('.');
  for(var i=0;i<3;i++){
    var x=parseInt(pa[i]||0),y=parseInt(pb[i]||0);
    if(x!==y)return x>y?1:-1;
  }
  return 0;
}

/* ============ 页脚常驻入口 ============ */
$('lnkGuide').onclick=function(){openGuide(false)};
$('lnkDemo').onclick=loadDemo;
$('lnkChlog').onclick=openChangelog;
$('lnkAdmin').onclick=openSet;
$('stChlog').onclick=function(){closeSheet($('stSheet'),$('stMask'));setTimeout(openChangelog,250)};
$('stChk').onclick=function(){checkUpdate();toast('已向馆方查询最新版本'+'（当前 v'+APP_VER+'）')};
$('stVer').textContent='v'+APP_VER;

/* ============ 闭馆彩蛋 ============ */
function closedNow(){var h=new Date().getHours();return h>=0&&h<6}
function checkClosed(){
  if(closedNow()){$('closedTag').classList.remove('hidden');
    $('museumSub').textContent='本馆夜间值守，劝退夜购手痒';}
}
/* ============ 设置 ============ */
$('stIncome').value=DB.settings.monthlyIncome||'';
$('stIncome').onchange=function(){
  DB.settings.monthlyIncome=Math.max(1,parseInt($('stIncome').value)||3000);
  save();render();updateHourly();
};
function updateHourly(){
  var hr=(DB.settings.monthlyIncome||3000)/176;
  $('stHourly').textContent='¥'+hr.toFixed(1)+'/h';
}
function openSet(){openSheet($('stSheet'),$('stMask'));updateHourly()}
$('stMask').onclick=$('stClose').onclick=function(){closeSheet($('stSheet'),$('stMask'))};
$('stExport').onclick=function(){
  /* 容器禁用 navigator.clipboard：改为弹层展示 JSON 供长按全选手动复制 */
  var s=JSON.stringify(DB);
  var box=document.createElement('div');
  box.style.cssText='position:fixed;left:12px;right:12px;top:50%;transform:translateY(-50%);z-index:120;background:#fff;border-radius:12px;padding:16px;box-shadow:0 12px 40px rgba(0,0,0,.35);max-height:70vh;display:flex;flex-direction:column';
  box.innerHTML='<div style="font-size:14px;font-weight:600;color:#26221a;margin-bottom:8px">备份 JSON（长按全选 → 复制）</div>';
  var ta=document.createElement('textarea');
  ta.value=s;ta.readOnly=true;
  ta.style.cssText='flex:1;min-height:200px;font-size:11px;font-family:monospace;border:1px solid #ddd;border-radius:8px;padding:8px;color:#26221a;-webkit-user-select:text;user-select:text';
  var close=document.createElement('button');
  close.textContent='关闭';close.style.cssText='margin-top:10px;padding:10px;border:0;border-radius:8px;background:#a3834c;color:#fff;font-size:14px';
  close.onclick=function(){document.body.removeChild(box)};
  box.appendChild(ta);box.appendChild(close);document.body.appendChild(box);
  ta.focus();ta.select();
  toast('全选并复制后，粘贴到备忘录保存');
};
$('stReset').onclick=function(){
  if(!window.confirm('清空全部馆藏与记录？此操作不可恢复（馆方说到做到）。'))return; DB={v:3,settings:{monthlyIncome:DB.settings.monthlyIncome,createdAt:Date.now(),demo:false,donated:0,customCats:[],customWhys:[]},exhibits:[],intercepts:[]};
  save();$('demoBadge').classList.add('hidden');closeSheet($('stSheet'),$('stMask'));render();
};
$('museumName')&&($('museumName').ondblclick=openSet);
$('museumNo').ondblclick=openSet;

/* ============ 启动 ============ */
(function(){
  initForm();checkClosed();render();
  var seenGuide=localStorage.getItem(KEY+'.guided');
  var first=!seenGuide&&DB.exhibits.length===0&&!DB.settings.demo;
  if(DB.settings.demo)$('demoBadge').classList.remove('hidden');
  if(first)setTimeout(function(){openGuide(true)},400);
  /* 首访引导一旦开始，落盘标记——关闭/刷新不再反复弹 */
  if(!seenGuide){try{localStorage.setItem(KEY+'.guided','1')}catch(e){}}
  checkUpdate();
})();