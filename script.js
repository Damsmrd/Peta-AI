/* PetaAI - perilaku halaman: pencarian, filter kategori dan harga, rekomendasi, favorit, tema terang/gelap. */
(function(){
  var doc=document, root=doc.documentElement;
  root.classList.add('js');
  function $(s,r){return (r||doc).querySelector(s)}
  function $$(s,r){return Array.prototype.slice.call((r||doc).querySelectorAll(s))}
  var reduce=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  /* Penyimpanan: kalau browser memblokir localStorage, favorit tetap jalan di memori sesi. */
  var store=null;
  try{localStorage.setItem('petaai.probe','1');localStorage.removeItem('petaai.probe');store=localStorage;}catch(e){store=null;}
  if(!store){var fn=$('#favNote');if(fn)fn.hidden=false;}
  /* Tema: ikuti pilihan pengguna, lalu mode pratinjau, lalu preferensi sistem. */
  var themeBtn=$('#themeBtn');
  function setTheme(t,save){
    root.setAttribute('data-theme',t);
    themeBtn.setAttribute('aria-pressed',t==='dark'?'true':'false');
    themeBtn.setAttribute('aria-label',t==='dark'?'Aktifkan tema terang':'Aktifkan tema gelap');
    if(save&&store){try{store.setItem('petaai.tema',t)}catch(e){}}
  }
  var theme=null;
  if(store){try{theme=store.getItem('petaai.tema')}catch(e){}}
  try{
    var pm=getComputedStyle(root).getPropertyValue('--zwork-preview-mode')||'';
    if(/dark/i.test(pm))theme='dark';else if(/light/i.test(pm))theme='light';
  }catch(e){}
  if(theme!=='dark'&&theme!=='light')theme=(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';
  setTheme(theme,false);
  themeBtn.addEventListener('click',function(){setTheme(root.getAttribute('data-theme')==='dark'?'light':'dark',true);});
  /* Data kartu: indeks editor + bahan pencarian */
  var grid=$('#grid'), cards=$$('.tool',grid), byName={};
  cards.forEach(function(c,i){
    var nm=$('.name',c).textContent.trim();
    c.dataset.i=i;c._name=nm;byName[nm]=c;
    c.hay=(nm+' '+$('.desc',c).textContent+' '+$$('.tag',c).map(function(t){return t.textContent}).join(' ')+' '+(c.getAttribute('data-alias')||'')).toLowerCase().replace(/\s+/g,' ');
  });
  /* Favorit */
  var favName='petaai.favorit', fav=[];
  if(store){
    try{
      var raw=JSON.parse(store.getItem(favName)||'[]');
      if(Object.prototype.toString.call(raw)==='[object Array]')fav=raw.filter(function(n){return typeof n==='string'});
    }catch(e){fav=[];}
  }
  var favSet={};fav.forEach(function(n){favSet[n]=1;});
  function persist(){if(store){try{store.setItem(favName,JSON.stringify(fav))}catch(e){}}}
  var q=$('#q'), clearQ=$('#clearQ'), chips=$$('#chips .chip'), sortSel=$('#sortSel'), priceSel=$('#priceSel'),
  resetBtn=$('#resetBtn'), count=$('#resultCount'), emptyWrap=$('#emptyWrap'), emptyQ=$('#emptyQ'),
  emptyQueryLine=$('#emptyQueryLine'), emptyFilterLine=$('#emptyFilterLine'), reset2=$('#emptyReset'),
  recGrid=$('#recGrid'), recNote=$('#recNote'), shuffleBtn=$('#shuffleBtn'),
  favList=$('#favList'), favEmpty=$('#favEmpty'), favCount=$('#favCount'), clearFav=$('#clearFav'),
  navFav=$('#navFav'), live=$('#live');
  var state={q:'',cat:'all',price:'all',sort:'editor'};
  function apply(){
    var s=state.q.trim().toLowerCase(), terms=s?s.split(/\s+/):[], shown=0;
    cards.forEach(function(c){
      var ok=true, p=c.getAttribute('data-price');
      if(state.cat!=='all'&&c.getAttribute('data-cat')!==state.cat)ok=false;
      if(ok&&state.price==='gratis'&&p!=='gratis'&&p!=='freemium')ok=false;
      if(ok&&state.price==='bayar'&&p!=='bayar')ok=false;
      if(ok&&terms.length)ok=terms.every(function(t){return c.hay.indexOf(t)>-1});
      c.hidden=!ok;
      if(ok)shown++;
    });
    count.textContent=(shown===cards.length)?(shown+' alat ditampilkan'):('Menampilkan '+shown+' dari '+cards.length+' alat');
    var none=shown===0;
    emptyWrap.hidden=!none;grid.hidden=none;
    emptyQ.textContent=state.q.trim();
    emptyQueryLine.hidden=!state.q.trim();
    emptyFilterLine.hidden=!!state.q.trim();
    resetBtn.hidden=!(state.q.trim()||state.cat!=='all'||state.price!=='all');
  }
  function sortCards(){
    var arr=cards.slice();
    arr.sort(state.sort==='az'
    ?function(a,b){return a._name.localeCompare(b._name,'id',{sensitivity:'base'})}
    :function(a,b){return a.dataset.i-b.dataset.i});
    arr.forEach(function(c){grid.appendChild(c)});
  }
  function chipSync(){chips.forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-cat')===state.cat?'true':'false');});}
  function syncAll(){
    $$('.fav').forEach(function(b){
      var n=b.getAttribute('data-name'), on=!!favSet[n], inRow=!!b.closest('.fav-row');
      b.setAttribute('aria-pressed',on?'true':'false');
      b.setAttribute('aria-label',(on||inRow)?('Hapus '+n+' dari favorit'):('Simpan '+n+' ke favorit'));
    });
  }
  function logoClone(c){return $('.logo',c).cloneNode(true);}
  function tagClones(c){return $$('.tag',c).map(function(t){return t.cloneNode(true)});}
  function linkTo(c){return $('.name a',c).href;}
  function renderFav(){
    fav=Object.keys(favSet);
    var n=fav.length;
    navFav.textContent=n;navFav.hidden=n===0;
    favCount.textContent=n?(n+' alat tersimpan'):'Belum ada alat tersimpan';
    clearFav.hidden=n<2;
    favEmpty.hidden=n>0;favList.hidden=n===0;
    favList.innerHTML='';
    fav.forEach(function(name){
      var c=byName[name];if(!c)return;
      var row=doc.createElement('div');row.className='fav-row';
      row.appendChild(logoClone(c));
      var mid=doc.createElement('div');mid.className='fav-mid';
      var a=doc.createElement('a');a.className='name';a.href=linkTo(c);a.target='_blank';a.rel='noopener';a.textContent=name;
      var tags=doc.createElement('div');tags.className='tags';
      tagClones(c).forEach(function(t){tags.appendChild(t)});
      mid.appendChild(a);mid.appendChild(tags);row.appendChild(mid);
      var acts=doc.createElement('div');acts.className='fav-actions';
      var ob=doc.createElement('a');ob.className='icon-btn';ob.href=linkTo(c);ob.target='_blank';ob.rel='noopener';
      ob.setAttribute('aria-label','Buka '+name+' di tab baru');
      ob.innerHTML='<svg class="ic" aria-hidden="true"><use href="#i-out"/></svg>';
      var rb=doc.createElement('button');rb.type='button';rb.className='fav';rb.setAttribute('data-name',name);
      rb.setAttribute('aria-pressed','true');rb.setAttribute('aria-label','Hapus '+name+' dari favorit');
      rb.innerHTML='<svg class="ic" aria-hidden="true"><use href="#i-heart"/></svg>';
      acts.appendChild(ob);acts.appendChild(rb);row.appendChild(acts);
      favList.appendChild(row);
    });
  }
  var EDITOR=['Descript','Elicit','v0','Luma AI','Ideogram','Ollama'];
  var REASON={
    'agent-qa':'Menguji web dan aplikasi seluler dengan memori persisten dan bukti eksekusi.',
    'Descript':'Mengedit audio dan video lewat transkrip, bukan lewat timeline.',
    'Elicit':'Menyisir literatur ilmiah dan merapikan temuan ke dalam tabel.',
    'v0':'Mengubah kalimat deskriptif menjadi komponen antarmuka siap pakai.',
    'Luma AI':'Membuat video pendek yang halus dari satu gambar atau teks.',
    'Ideogram':'Pilihan tepat saat gambar perlu memuat teks yang terbaca.',
    'Ollama':'Menjalankan model di komputer sendiri, data tetap di perangkat.'
  };
  function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
  function savedInCat(cat){var r='';Object.keys(favSet).forEach(function(n){var c=byName[n];if(!r&&c&&c.getAttribute('data-cat')===cat)r=n;});return r;}
  function picks(){
    var out=[],savedCats={};
    Object.keys(favSet).forEach(function(n){var c=byName[n];if(c)savedCats[c.getAttribute('data-cat')]=1;});
    if(Object.keys(savedCats).length){
      var pool=cards.filter(function(c){return savedCats[c.getAttribute('data-cat')]&&!favSet[c._name];});
      shuffle(pool).forEach(function(c){if(out.length<3&&out.indexOf(c)<0)out.push(c);});
    }
    var ep=EDITOR.map(function(n){return byName[n]}).filter(function(c){return c&&!favSet[c._name]});
    shuffle(ep).forEach(function(c){if(out.length<3&&out.indexOf(c)<0)out.push(c);});
    if(out.length<3)shuffle(cards.slice()).forEach(function(c){if(out.length<3&&!favSet[c._name]&&out.indexOf(c)<0)out.push(c);});
    return out;
  }
  function recCard(c){
    var name=c._name, art=doc.createElement('article');art.className='rec';
    var head=doc.createElement('div');head.className='tool-head';
    head.appendChild(logoClone(c));
    var b=doc.createElement('button');b.type='button';b.className='fav';b.setAttribute('data-name',name);
    b.setAttribute('aria-pressed',favSet[name]?'true':'false');
    b.setAttribute('aria-label','Simpan '+name+' ke favorit');
    b.innerHTML='<svg class="ic" aria-hidden="true"><use href="#i-heart"/></svg>';
    head.appendChild(b);art.appendChild(head);
    var h=doc.createElement('h3');h.className='name';
    var a=doc.createElement('a');a.href=linkTo(c);a.target='_blank';a.rel='noopener';a.textContent=name;
    h.appendChild(a);art.appendChild(h);
    var why=doc.createElement('p');why.className='why';
    why.innerHTML='<svg class="ic ic-sm" aria-hidden="true"><use href="#i-spark"/></svg>';
    var sp=doc.createElement('span'), who=savedInCat(c.getAttribute('data-cat'));
    sp.textContent=who?('Karena kamu menyimpan '+who+'.'):(REASON[name]||'Banyak dipakai untuk alur kerja yang mirip.');
    why.appendChild(sp);art.appendChild(why);
    var tags=doc.createElement('div');tags.className='tags';
    tagClones(c).forEach(function(t){tags.appendChild(t)});
    art.appendChild(tags);
    return art;
  }
  function renderRec(){
    recGrid.innerHTML='';
    picks().forEach(function(c){recGrid.appendChild(recCard(c));});
    recNote.textContent=fav.length
    ?'Disarankan dari kategori yang kamu simpan.'
    :'Pilihan editor minggu ini. Simpan alat agar saran menyesuaikan favoritmu.';
    syncAll();
  }
  function skeleton(){
    recGrid.innerHTML='';
    for(var i=0;i<3;i++){
      var a=doc.createElement('div');a.className='rec is-sk';
      a.innerHTML='<div class="tool-head"><span class="sk sk-logo"></span><span class="sk sk-btn"></span></div><span class="sk sk-t" style="width:52%"></span><span class="sk sk-t" style="width:88%"></span><span class="sk sk-t" style="width:70%"></span>';
      recGrid.appendChild(a);
    }
  }
  function setFav(name,on,announce){
    if(on)favSet[name]=1;else delete favSet[name];
    fav=Object.keys(favSet);persist();syncAll();renderFav();renderRec();
    if(announce)live.textContent=on?(name+' ditambahkan ke favorit.'):(name+' dihapus dari favorit.');
  }
  q.addEventListener('input',function(){state.q=q.value;clearQ.hidden=!q.value;apply();});
  clearQ.addEventListener('click',function(){q.value='';state.q='';clearQ.hidden=true;apply();q.focus();});
  doc.addEventListener('keydown',function(e){
    var t=e.target;
    if(e.key==='/'&&!/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)){e.preventDefault();q.focus();q.select();}
    if(e.key==='Escape'&&t===q){if(q.value){q.value='';state.q='';clearQ.hidden=true;apply();}else{q.blur();}}
  });
  chips.forEach(function(b){b.addEventListener('click',function(){state.cat=b.getAttribute('data-cat');chipSync();apply();});});
  sortSel.addEventListener('change',function(){state.sort=sortSel.value;sortCards();apply();});
  priceSel.addEventListener('change',function(){state.price=priceSel.value;apply();});
  function resetAll(){
    state.q='';state.cat='all';state.price='all';
    q.value='';clearQ.hidden=true;priceSel.value='all';chipSync();sortCards();apply();
  }
  resetBtn.addEventListener('click',resetAll);
  reset2.addEventListener('click',resetAll);
  $$('[data-suggest]').forEach(function(b){b.addEventListener('click',function(){
      state.q='';q.value='';clearQ.hidden=true;state.cat=b.getAttribute('data-suggest');chipSync();apply();
    });});
  doc.addEventListener('click',function(e){
    var b=(e.target&&e.target.closest)?e.target.closest('.fav'):null;
    if(b){var n=b.getAttribute('data-name');setFav(n,!favSet[n],true);}
  });
  var armed=false,armTimer=null;
  clearFav.addEventListener('click',function(){
    if(!armed){
      armed=true;clearFav.textContent='Klik lagi untuk mengosongkan';
      armTimer=setTimeout(function(){armed=false;clearFav.textContent='Bersihkan semua';},4000);
      return;
    }
    clearTimeout(armTimer);armed=false;clearFav.textContent='Bersihkan semua';
    favSet={};fav=[];persist();syncAll();renderFav();renderRec();
    live.textContent='Semua favorit dikosongkan.';
  });
  shuffleBtn.addEventListener('click',function(){
    if(shuffleBtn.disabled)return;
    shuffleBtn.disabled=true;skeleton();
    setTimeout(function(){renderRec();shuffleBtn.disabled=false;},reduce?60:420);
  });
  $$('a[href^="#"]').forEach(function(a){
    a.addEventListener('click',function(e){
      var el=doc.getElementById(a.getAttribute('href').slice(1));
      if(!el)return;
      e.preventDefault();
      var y=el.getBoundingClientRect().top+window.pageYOffset-74;
      window.scrollTo({top:y,behavior:reduce?'auto':'smooth'});
      if(!el.hasAttribute('tabindex'))el.setAttribute('tabindex','-1');
      el.focus({preventScroll:true});
    });
  });
  window.addEventListener('error',function(e){
    var t=e.target;
    if(t&&t.tagName==='IMG'){var lg=t.closest('.logo');
      if(lg){var h=lg.closest('.tool')||lg.closest('.rec')||lg.closest('.fav-row');
        if(h&&!$('.mk',lg)){var m=doc.createElement('span');m.className='mk';m.textContent=$('.name',h).textContent.trim().slice(0,2);lg.appendChild(m);}
        lg.classList.add('is-missing');}}
  },true);
  chipSync();sortCards();apply();renderFav();renderRec();
})();
