'use strict';
const D=window.CLUB,KEY='tochka-rosta-demo-v1',types=['Инсайт','Спорная мысль','Вопрос','Что применю','Не согласен'];
const main=document.querySelector('#main'),dialog=document.querySelector('#sheet'),body=document.querySelector('#sheet-body');
let storageWarning=false;
function freshState(){return {profile:{name:'Гость клуба',job:'',offer:'',seek:'',visible:false},registered:[],posts:[]};}
function initials(name){return name.trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();}
function readState(){
 try{
  const v=JSON.parse(localStorage.getItem(KEY)),s=freshState();
  if(!v||typeof v!=='object')return s;
  if(v.profile&&typeof v.profile==='object'){
   for(const k of ['name','job','offer','seek'])if(typeof v.profile[k]==='string')s.profile[k]=v.profile[k].slice(0,400);
   s.profile.visible=v.profile.visible===true;
  }
  if(Array.isArray(v.registered))s.registered=[...new Set(v.registered.filter(id=>D.events.some(e=>e.id===id)))];
  if(Array.isArray(v.posts))s.posts=v.posts.filter(p=>p&&typeof p.id==='string'&&typeof p.text==='string'&&typeof p.name==='string'&&types.includes(p.type)).slice(0,100).map(p=>({...p,text:p.text.slice(0,800),name:p.name.slice(0,70),initials:initials(p.name),time:'Ваша реплика'}));
  return s;
 }catch{storageWarning=true;return freshState();}
}
let state=readState(),personFilter='Все',postFilter='Все',eventFilter='Все',query='';
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function money(v){return new Intl.NumberFormat('ru-RU').format(v)+' ₽';}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));return true;}catch{toast('Изменения действуют до закрытия страницы: сохранение недоступно.');return false;}}
let toastTimer;
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),4200);}
function currentPage(){const r=location.hash.slice(1);return ['home','book','events','people','gallery','profile'].includes(r)?r:'home';}
function fee(e,n=e.count){return e.fee==='free'?'Бесплатно':e.fee==='pending'?'Взнос уточняется':'≈ '+money(Math.ceil((e.venue+e.organization)/n/10)*10);}
function count(e){return e.count+(state.registered.includes(e.id)?1:0);}
function cover(){return `<div class="book-cover" role="img" aria-label="Условное оформление книги"><span>${esc(D.book.author)}</span><strong>${esc(D.book.title)}</strong><span>КНИГА МЕСЯЦА</span></div>`;}
function faces(e){return `<div class="faces">${e.attendees.map(id=>{const p=D.people.find(p=>p.id===id);return `<span class="avatar" title="${esc(p.name)}">${p.initials}</span>`;}).join('')}<span>${count(e)} из ${e.capacity} мест занято</span></div>`;}
function eventCard(e){const r=state.registered.includes(e.id);return `<article class="card event-card"><div><span class="tag${r?' lime':''}">${r?'Вы записаны':esc(e.type)}</span></div><div class="event-heading"><div class="date-box"><strong>${e.day}</strong><span>${e.month}</span></div><h3>${esc(e.title)}</h3></div><p class="small muted">${esc(e.duration)}<br>${esc(e.place)}</p>${faces(e)}<div class="event-meta"><strong>${fee(e,count(e))}</strong><span>${e.capacity-count(e)} мест свободно</span></div><button class="button ${r?'outline':'dark'} full" data-action="event" data-id="${e.id}">${r?'Моя запись':'Подробнее и запись'} ↗</button></article>`;}
function personCard(p){return `<article class="card person-card"><div class="person-top"><span class="avatar">${esc(p.initials)}</span><div><h3>${esc(p.name)}</h3><p class="muted small">${esc(p.job)}</p></div></div><span class="label">Могу быть полезен / полезна</span><p>${esc(p.offer)}</p><button class="text-button" data-action="person" data-id="${esc(p.id)}">Познакомиться ↗</button></article>`;}
function home(){return `<section class="hero"><span class="eyebrow">СООБЩЕСТВО ПРЕДПРИНИМАТЕЛЕЙ И ПРАКТИКОВ</span><h1>Место, где идеи<br>встречаются<br>с <em>людьми.</em></h1><p>Читаем, обсуждаем и находим своих.<br>Растём не только на встречах — между ними.</p><a class="button" href="#people">Найти своих людей ↗</a><div class="trajectory" aria-hidden="true"></div><div class="hero-number" aria-hidden="true">↗</div></section>
<section class="section"><div class="section-head"><h2>В ритме клуба</h2><span class="small muted">${D.month}</span></div><div class="home-grid"><article class="card book-feature">${cover()}<div class="book-copy"><span class="eyebrow">КНИГА МЕСЯЦА</span><h3>${esc(D.book.title)}</h3><p class="muted">${esc(D.book.author)}</p><a class="text-button" href="#book">Войти в разговор ↗</a></div></article><div class="quiet-card"><span class="eyebrow">ОДНА МЫСЛЬ НА СЕГОДНЯ</span><h2>Что вы попробуете сделать иначе?</h2><p class="muted spacing">Вопрос, сомнение или маленький шаг — уже начало разговора.</p><a class="text-button" href="#book">Поделиться мыслью ↗</a></div></div></section>
<section class="section"><div class="section-head"><h2>Увидимся скоро</h2><a href="#events">Все события ↗</a></div><div class="grid">${[...D.events].sort((a,b)=>a.date.localeCompare(b.date)).slice(0,2).map(eventCard).join('')}</div></section>
<section class="section"><div class="section-head"><h2>За каждой идеей — человек</h2></div><div class="grid">${D.people.slice(0,2).map(personCard).join('')}</div><a class="text-button spacing" href="#people">Все участники ↗</a></section>
<section class="section"><div class="quiet-card"><span class="eyebrow">ПРОЗРАЧНОЕ УЧАСТИЕ</span><h3>Клуб бесплатный. Расходы — общие.</h3><p class="muted">Делим фактическую стоимость площадки и организации. Расчёт виден до записи, клуб не добавляет наценку.</p></div></section>`;}
function chipList(items,selected,kind){return `<div class="chips" aria-label="Фильтры">${items.map(x=>`<button class="chip ${x===selected?'active':''}" aria-pressed="${x===selected}" data-action="${kind}" data-value="${esc(x)}">${esc(x)}</button>`).join('')}</div>`;}
function people(){return `<section class="section"><div class="page-heading"><span class="eyebrow">ГЛАВНЫЙ АКТИВ КЛУБА</span><h1>Люди, с которыми<br>есть о чём.</h1><p class="muted">Ищите не только по профессии — по тому, чем можете помочь друг другу.</p></div><label for="people-search">Имя, сфера, «могу помочь» или «ищу»</label><input class="search" id="people-search" type="search" placeholder="Например, команда или продукт" value="${esc(query)}">${chipList(['Все','Предпринимательство','Продукт','Маркетинг','Команда'],personFilter,'people-filter')}<div id="people-results"></div></section>`;}
function renderPeople(){
 const list=D.people.filter(p=>(personFilter==='Все'||p.field===personFilter)&&[p.name,p.job,p.field,p.offer,p.seek].join(' ').toLowerCase().includes(query.toLowerCase().trim()));
 document.querySelector('#people-results').innerHTML=`<p class="count" role="status">Найдено: ${list.length} · демонстрационные карточки</p><div class="grid people-grid">${list.length?list.map(personCard).join(''):`<div class="empty"><h3>Пока никого не нашли</h3><p>Попробуйте другое слово или уберите фильтр.</p><button class="button outline" data-action="clear-search">Сбросить поиск</button></div>`}</div>`;
}
function events(){const list=[...D.events].sort((a,b)=>a.date.localeCompare(b.date)).filter(e=>eventFilter==='Все'||state.registered.includes(e.id));return `<section class="section"><div class="page-heading"><span class="eyebrow">ОКТЯБРЬ — ДЕКАБРЬ 2026 · ПРИМЕР РАСПИСАНИЯ</span><h1>Встречи, которые<br>продолжаются.</h1><p class="muted">Книга — повод. Разговор и новые знакомства — то, что остаётся с вами.</p></div>${chipList(['Все','Мои записи'],eventFilter,'event-filter')}<div class="grid">${list.length?list.map(eventCard).join(''):`<div class="empty"><h3>Вы ещё не выбрали встречу</h3><p>Найдите свой формат в расписании.</p><button class="button" data-action="event-filter" data-value="Все">Посмотреть события</button></div>`}</div><p class="form-hint spacing">Даты, места и суммы — примеры. Запись сохраняется только в вашем браузере.</p></section>`;}
function postCard(p){return `<article class="post"><div class="person-top"><span class="avatar">${esc(p.initials)}</span><div><h3>${esc(p.name)}</h3><span class="small muted">${esc(p.time)}</span></div></div><p>${esc(p.text)}</p><div class="post-meta"><span class="tag">${esc(p.type)}</span>${state.posts.some(x=>x.id===p.id)?`<button class="text-button" data-action="delete-post" data-id="${esc(p.id)}">Удалить</button>`:''}</div></article>`;}
function renderPosts(){const posts=[...state.posts,...D.posts].filter(p=>postFilter==='Все'||p.type===postFilter);document.querySelector('#posts').innerHTML=posts.length?posts.map(postCard).join(''):'<div class="empty">Реплик этого типа пока нет. Ваша может стать первой.</div>';}
function book(){return `<section class="section"><div class="book-intro">${cover()}<div><span class="eyebrow">${D.month} · КНИГА МЕСЯЦА</span><h1>${esc(D.book.title)}</h1><p class="muted spacing">${esc(D.book.author)}</p><span class="tag lime spacing">Сейчас читаем</span></div></div><h3>Почему читаем</h3><p class="muted spacing">${esc(D.book.note)}</p><p class="form-hint">Выбор книги и вводный текст — пример, не утверждённая программа клуба.</p><div class="quiet-card"><h3>С чего начать разговор</h3><ul class="questions">${D.book.questions.map(q=>`<li>${esc(q)}</li>`).join('')}</ul></div></section><section class="section"><div class="section-head"><h2>Разговор о книге</h2></div><p class="muted">Одна мысль — уже вклад. Можно не соглашаться, спрашивать и делиться тем, что попробуете.</p><form id="post-form" class="card spacing"><div class="form-row"><label for="post-type">Какой мыслью вы делитесь?</label><select id="post-type" name="type">${types.map(t=>`<option>${t}</option>`).join('')}</select></div><div class="form-row"><label for="post-text">Ваша реплика</label><textarea id="post-text" name="text" maxlength="800" required placeholder="После этой главы я задумался / задумалась…"></textarea></div><p class="form-hint">До 800 символов. Реплику увидите только вы в этом браузере.</p><button class="button dark full" type="submit">Добавить мысль ↗</button></form><div class="spacing">${chipList(['Все',...types],postFilter,'post-filter')}</div><div id="posts" aria-live="polite"></div></section><section class="section"><h2>Уже прочитали</h2>${D.book.archive.map(b=>`<div class="archive-item"><div><h3>${esc(b.title)}</h3><span class="small muted">${esc(b.author)}</span></div><span class="small muted">${b.month}</span></div>`).join('')}<p class="form-hint">Демонстрационный архив.</p></section>`;}
function gallery(){return `<section class="section"><div class="page-heading"><span class="eyebrow">ПАМЯТЬ КЛУБА</span><h1>После встречи<br>остаётся больше.</h1><p class="muted">Здесь появятся фотографии и заметки участников. Пока показываем структуру альбомов без чужих фотографий.</p></div><div class="grid">${D.albums.map(a=>`<article class="card album"><div class="album-art" aria-hidden="true">○ → ●</div><div class="album-copy"><span class="eyebrow">${a.date}</span><h3>${a.title}</h3><p class="muted">${a.caption}</p><span class="tag spacing">Макет альбома · фото пока нет</span></div></article>`).join('')}</div><a class="text-button spacing" href="#home">На главную ↗</a></section>`;}
function profile(){const p=state.profile;return `<section class="section"><div class="page-heading"><span class="eyebrow">ВАШЕ МЕСТО В СООБЩЕСТВЕ</span><h1>Начнём<br>со знакомства.</h1><p class="muted">Это локальный демопрофиль. Настоящий вход через Telegram появится после подключения сервера.</p></div><form id="profile-form" class="card"><div class="form-grid"><div class="form-row"><label for="profile-name">Как к вам обращаться</label><input id="profile-name" name="name" maxlength="70" required value="${esc(p.name)}" autocomplete="given-name"></div><div class="form-row"><label for="profile-job">Чем занимаетесь</label><input id="profile-job" name="job" maxlength="100" value="${esc(p.job)}" placeholder="Например, развиваю студию"></div></div><div class="form-row"><label for="profile-offer">Могу быть полезен / полезна</label><textarea id="profile-offer" name="offer" maxlength="400">${esc(p.offer)}</textarea></div><div class="form-row"><label for="profile-seek">Что ищу в сообществе</label><textarea id="profile-seek" name="seek" maxlength="400">${esc(p.seek)}</textarea></div><label class="checkline"><input type="checkbox" name="visible" ${p.visible?'checked':''}>Показывать карточку участникам после запуска. Сейчас настройка сохраняется только как пример.</label><p class="form-hint">Данные не отправляются на сервер. Не вводите конфиденциальную информацию на общем устройстве.</p><button class="button dark full" type="submit">Сохранить профиль</button></form><div class="quiet-card spacing"><h3>Мои встречи</h3><p class="muted">Вы записаны на ${state.registered.length} из демонстрационных событий.</p><button class="text-button" data-action="my-events">Посмотреть мои записи ↗</button></div><button class="text-button spacing" data-action="reset">Сбросить мои демонстрационные данные</button></section>`;}
function render(){
 const page=currentPage();main.innerHTML=({home,people,events,book,gallery,profile}[page])();
 document.querySelectorAll('[data-page]').forEach(a=>{const active=a.dataset.page===page;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 document.querySelector('.profile-button').textContent=state.profile.name==='Гость клуба'?'ВЫ':initials(state.profile.name);
 if(page==='people')renderPeople();if(page==='book')renderPosts();
 document.title=({home:'Главная',people:'Люди',events:'События',book:'Книга месяца',gallery:'Галерея',profile:'Профиль'}[page])+' · Точка роста';
}
function sheet(html){body.innerHTML=html;if(!dialog.open)dialog.showModal();}
function eventSheet(id){
 const e=D.events.find(e=>e.id===id);if(!e)return;
 const n=count(e),registered=state.registered.includes(id);
 sheet(`<span class="tag">${esc(e.type)}</span><h2 id="sheet-title" class="sheet-title">${esc(e.title)}</h2><p class="muted">${e.day} ${e.month.toLowerCase()} 2026 · ${esc(e.duration)}<br>${esc(e.place)}</p><p class="spacing">${esc(e.description)}</p>${registered?'<div class="saved-banner">Вы записаны в деморежиме. Организатору ничего не отправлено.</div>':''}${e.fee==='shared'?`<div class="costs"><span class="eyebrow">КАК СКЛАДЫВАЕТСЯ ВЗНОС</span><div class="cost-row"><span>Площадка</span><span>${money(e.venue)}</span></div><div class="cost-row"><span>Организация</span><span>${money(e.organization)}</span></div><div class="cost-row total"><span>Общие расходы</span><span>${money(e.venue+e.organization)}</span></div><label for="fee-range">Если придёт <span id="fee-count">${n}</span> человек</label><input id="fee-range" type="range" min="5" max="${e.capacity}" value="${n}" data-event="${id}"><div class="cost-row total"><span>Ориентир на человека</span><span id="fee-result">${fee(e,n)}</span></div><p class="small muted">Округление вверх до 10 ₽. Это оценка, а не счёт. Предполагаем оплату после закрытия записи; порядок нужно согласовать с организатором.</p></div>`:`<div class="quiet-card spacing"><h3>${fee(e)}</h3><p class="small muted">${e.fee==='pending'?'Доступна предварительная запись. Оплата сейчас не требуется.':'Организационного взноса нет.'}</p></div>`}<div class="detail"><h3>Кто идёт · ${n} из ${e.capacity}</h3>${faces(e)}<p class="small muted">${e.attendees.map(id=>esc(D.people.find(p=>p.id===id).name)).join(', ')}${registered?', вы':''}. Показаны примеры участников.</p></div><button class="button ${registered?'outline':'dark'} full" data-action="register" data-id="${id}" ${!registered&&n>=e.capacity?'disabled':''}>${registered?'Отменить мою запись':n>=e.capacity?'Свободных мест нет':e.fee==='pending'?'Записаться предварительно':'Записаться в деморежиме'}</button><p class="form-hint spacing">Реальная запись, платёж и уведомление в Telegram не выполняются.</p>`);
}
document.addEventListener('click',event=>{
 const b=event.target.closest('[data-action]');if(!b)return;const {action,id,value}=b.dataset;
 if(action==='close')dialog.close();
 if(action==='profile')location.hash='profile';
 if(action==='event')eventSheet(id);
 if(action==='register'){
  const e=D.events.find(e=>e.id===id);if(!e)return;
  if(state.registered.includes(id))state.registered=state.registered.filter(x=>x!==id);
  else if(count(e)<e.capacity)state.registered.push(id);else return;
  const ok=save();render();eventSheet(id);if(ok)toast(state.registered.includes(id)?'Запись сохранена в этом браузере':'Запись отменена');
 }
 if(action==='person'){
  const p=D.people.find(p=>p.id===id);if(!p)return;
  sheet(`<div class="avatar">${p.initials}</div><h2 id="sheet-title" class="sheet-title">${esc(p.name)}</h2><p class="muted">${esc(p.job)} · ${p.city}</p><p class="spacing">${esc(p.bio)}</p><div class="divider"></div><span class="label">Могу быть полезен / полезна</span><p>${esc(p.offer)}</p><span class="label spacing">Ищу</span><p>${esc(p.seek)}</p><div class="quiet-card spacing"><h3>Знакомство начинается на встрече</h3><p class="small muted">Карточка вымышлена. В рабочем приложении контакты будут доступны участникам после проверки доступа на сервере.</p></div><button class="button dark full spacing" data-action="meet">Выбрать встречу</button>`);
 }
 if(action==='meet'){dialog.close();location.hash='events';}
 if(action==='people-filter'){personFilter=value;render();}
 if(action==='clear-search'){query='';personFilter='Все';render();document.querySelector('#people-search').focus();}
 if(action==='event-filter'){eventFilter=value;render();}
 if(action==='my-events'){eventFilter='Мои записи';location.hash='events';}
 if(action==='post-filter'){postFilter=value;const y=window.scrollY;render();window.scrollTo(0,y);}
 if(action==='delete-post'){state.posts=state.posts.filter(p=>p.id!==id);save();renderPosts();}
 if(action==='install')sheet(`<h2 id="sheet-title" class="sheet-title">Клуб на вашем экране</h2><p>После публикации по HTTPS откройте приложение на телефоне.</p><div class="divider"></div><h3>iPhone · Safari</h3><p>В меню «Поделиться» выберите «На экран Домой».</p><h3 class="spacing">Android · Chrome</h3><p>В меню браузера выберите «Установить приложение» или «Добавить на главный экран».</p><p class="form-hint spacing">Команда зависит от браузера. Из локального файла установка недоступна. После первого посещения опубликованное приложение сможет открываться без сети.</p>`);
 if(action==='reset')sheet(`<h2 id="sheet-title" class="sheet-title">Начать заново?</h2><p>Будут удалены ваш демопрофиль, записи и реплики в этом браузере. Примеры останутся.</p><div class="stack"><button class="button danger" data-action="confirm-reset">Сбросить данные</button><button class="button outline" data-action="close">Оставить</button></div>`);
 if(action==='confirm-reset'){state=freshState();const ok=save();dialog.close();render();if(ok)toast('Демонстрационные данные сброшены');}
});
document.addEventListener('input',event=>{
 if(event.target.id==='people-search'){query=event.target.value;renderPeople();}
 if(event.target.id==='fee-range'){const e=D.events.find(e=>e.id===event.target.dataset.event),n=Number(event.target.value);document.querySelector('#fee-count').textContent=n;document.querySelector('#fee-result').textContent=fee(e,n);}
});
document.addEventListener('submit',event=>{
 if(event.target.id==='profile-form'){
  event.preventDefault();const data=new FormData(event.target),name=String(data.get('name')).trim();
  if(!name){toast('Укажите имя');document.querySelector('#profile-name').focus();return;}
  state.profile={name,job:String(data.get('job')).trim(),offer:String(data.get('offer')).trim(),seek:String(data.get('seek')).trim(),visible:data.has('visible')};
  const ok=save();render();if(ok)toast('Профиль сохранён в этом браузере');
 }
 if(event.target.id==='post-form'){
  event.preventDefault();const data=new FormData(event.target),text=String(data.get('text')).trim();
  if(!text){toast('Напишите хотя бы одну мысль');return;}
  if(state.posts.length>=100){toast('В демоверсии можно сохранить 100 реплик. Удалите одну из предыдущих.');return;}
  state.posts.unshift({id:'post-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),name:state.profile.name,initials:initials(state.profile.name),type:String(data.get('type')),text,time:'Ваша реплика'});
  postFilter='Все';const ok=save();render();document.querySelector('#posts').scrollIntoView({behavior:'auto',block:'start'});if(ok)toast('Мысль добавлена в ваш демопрототип');
 }
});
window.addEventListener('hashchange',()=>{if(dialog.open)dialog.close();render();window.scrollTo(0,0);main.focus({preventScroll:true});});
render();
if(storageWarning)toast('Хранилище недоступно или повреждено. Открыта чистая демоверсия.');
if('serviceWorker' in navigator&&['http:','https:'].includes(location.protocol))navigator.serviceWorker.register('./sw.js').catch(()=>{});