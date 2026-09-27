'use strict';
const D=window.CLUB,KEY='tochka-rosta-demo-v1',types=['Инсайт','Спорная мысль','Вопрос','Что применю','Не согласен'];
const main=document.querySelector('#main'),dialog=document.querySelector('#sheet'),body=document.querySelector('#sheet-body');
let storageWarning=false;
function freshState(){return {profile:{name:'Гость клуба',job:'',offer:'',seek:'',about:'',contact:'',photo:'',joined:false,visible:false},registered:[],posts:[]};}
function validContact(value){return /^@[A-Za-z0-9_]{5,32}$/.test(value.trim())||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());}
function isProfileComplete(p){return ['name','about','job','offer','contact'].every(k=>typeof p[k]==='string'&&p[k].trim())&&p.name.trim().split(/\s+/).length>=2&&validContact(p.contact)&&typeof p.photo==='string'&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(p.photo)&&p.photo.length<500000;}
function profileError(message,id){
 const el=document.querySelector('#profile-error');el.textContent=message;el.hidden=false;
 document.getElementById(id).focus();el.scrollIntoView({block:'center',behavior:'auto'});
}
function initials(name){return name.trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();}
function readState(){
 try{
  const v=JSON.parse(localStorage.getItem(KEY)),s=freshState();
  if(!v||typeof v!=='object')return s;
  if(v.profile&&typeof v.profile==='object'){
   for(const k of ['name','job','offer','seek','about','contact'])if(typeof v.profile[k]==='string')s.profile[k]=v.profile[k].slice(0,400);
   s.profile.visible=v.profile.visible===true; s.profile.joined=v.profile.joined===true; if(typeof v.profile.photo==='string'&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v.profile.photo)&&v.profile.photo.length<500000)s.profile.photo=v.profile.photo;
  }
  if(Array.isArray(v.registered))s.registered=[...new Set(v.registered.filter(id=>D.events.some(e=>e.id===id)))];
  if(Array.isArray(v.posts))s.posts=v.posts.filter(p=>p&&typeof p.id==='string'&&typeof p.text==='string'&&typeof p.name==='string'&&types.includes(p.type)).slice(0,100).map(p=>({...p,text:p.text.slice(0,800),name:p.name.slice(0,70),initials:initials(p.name),time:'Ваша реплика'}));
  s.profile.joined=s.profile.joined&&isProfileComplete(s.profile); return s;
 }catch{storageWarning=true;return freshState();}
}
let draftPhoto='',photoLoading=false,photoRequest=0;
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
function home(){return `<section class="hero club-hero"><div class="club-intro"><span class="eyebrow">КНИЖНЫЙ КЛУБ «ТОЧКА РОСТА»</span><h1>Читаем вместе.<br><em>Встречаемся<br>обсуждать.</em></h1><p>Выбираем книгу, читаем каждый в своём ритме и собираемся, чтобы поделиться впечатлениями. Слушаем друг друга, задаём вопросы и открываем в прочитанном что-то новое.</p><a class="button" href="#profile">Вступить в клуб <span aria-hidden="true">↗</span></a><span class="hero-note">Без членского взноса. О расходах на встречи — ниже.</span></div><figure class="club-photo"><img src="./club-hero.jpg" width="960" height="1280" alt="Ребёнок в прыжке над водой. Точка роста — растём вместе с книгами." fetchpriority="high"></figure></section>
<section class="section club-about"><span class="eyebrow">ЧТО ТАКОЕ «ТОЧКА РОСТА»</span><h2>Одна книга.<br>Много разных взглядов.</h2><p class="lead">Это клуб для тех, кто хочет читать и говорить о прочитанном. Здесь не нужно быть литературным экспертом: ваши впечатления, вопросы и несогласие — часть разговора.</p><div class="reading-steps"><article><span class="step-number">01</span><h3>Выбираем книгу</h3><p>Знакомимся с книгой клуба и планируем чтение до встречи.</p></article><article><span class="step-number">02</span><h3>Читаем вместе</h3><p>Каждый в своём темпе. По ходу чтения можно делиться мыслями и вопросами.</p></article><article><span class="step-number">03</span><h3>Встречаемся обсудить</h3><p>Собираемся за общим разговором: что откликнулось, удивило или вызвало спор.</p></article></div><p class="extra-events">Иногда встречаемся и по другим поводам — ходим на экскурсии или знакомимся за кофе. Это дополнение к главному: совместному чтению и обсуждению книг.</p></section>
<section class="section"><div class="club-money"><span class="eyebrow">КАК УСТРОЕНО УЧАСТИЕ</span><h2>Вступление — бесплатно.<br>Расходы — открыто.</h2><div class="money-rules"><article><h3>Без членского взноса</h3><p>За вступление в клуб и участие в книжном разговоре платить не нужно.</p></article><article><h3>На аренду зала — собираем вместе</h3><p>Если для встречи арендуем зал, взнос на аренду обязателен для участников этой встречи. Сумму и расчёт показываем в карточке события до записи.</p></article><article><h3>Пожертвования — добровольно</h3><p>Дополнительно поддержать клуб можно по желанию. Пожертвование не является условием вступления и не заменяет обязательный взнос на аренду.</p></article></div><p class="small muted">Клуб не добавляет наценку к аренде. Порядок сбора и итоговую сумму сообщаем до подтверждения участия.</p></div></section>
<section class="section join-invitation"><span class="eyebrow">ДАВАЙТЕ ЗНАКОМИТЬСЯ</span><h2>Начнём с книги.<br>И пары слов о вас.</h2><p>Чтобы вступить в клуб, заполните анкету полностью. Нам важно знакомиться с людьми, с которыми мы читаем и встречаемся.</p><a class="button dark" href="#profile">Вступить в клуб ↗</a><p class="form-hint">В прототипе анкета сохраняется только в вашем браузере. Настоящая регистрация пока не подключена.</p></section>`;}
function chipList(items,selected,kind){return `<div class="chips" aria-label="Фильтры">${items.map(x=>`<button class="chip ${x===selected?'active':''}" aria-pressed="${x===selected}" data-action="${kind}" data-value="${esc(x)}">${esc(x)}</button>`).join('')}</div>`;}
function people(){return `<section class="section"><div class="page-heading"><span class="eyebrow">УЧАСТНИКИ КНИЖНОГО КЛУБА</span><h1>Люди, с которыми<br>есть о чём.</h1><p class="muted">Знакомьтесь с теми, с кем читаете. Узнавайте об интересах друг друга и делитесь опытом.</p></div><label for="people-search">Имя, сфера, «могу помочь» или «ищу»</label><input class="search" id="people-search" type="search" placeholder="Например, команда или продукт" value="${esc(query)}">${chipList(['Все','Своё дело','Продукт','Маркетинг','Команда'],personFilter,'people-filter')}<div id="people-results"></div></section>`;}
function renderPeople(){
 const list=D.people.filter(p=>(personFilter==='Все'||p.field===personFilter)&&[p.name,p.job,p.field,p.offer,p.seek].join(' ').toLowerCase().includes(query.toLowerCase().trim()));
 document.querySelector('#people-results').innerHTML=`<p class="count" role="status">Найдено: ${list.length} · демонстрационные карточки</p><div class="grid people-grid">${list.length?list.map(personCard).join(''):`<div class="empty"><h3>Пока никого не нашли</h3><p>Попробуйте другое слово или уберите фильтр.</p><button class="button outline" data-action="clear-search">Сбросить поиск</button></div>`}</div>`;
}
function events(){const list=[...D.events].sort((a,b)=>a.date.localeCompare(b.date)).filter(e=>eventFilter==='Все'||state.registered.includes(e.id));return `<section class="section"><div class="page-heading"><span class="eyebrow">ОКТЯБРЬ — ДЕКАБРЬ 2026 · ПРИМЕР РАСПИСАНИЯ</span><h1>Встречи, которые<br>продолжаются.</h1><p class="muted">Главные встречи клуба — обсуждения прочитанного. Экскурсии и другие события дополняют книжную программу.</p></div>${chipList(['Все','Мои записи'],eventFilter,'event-filter')}<div class="grid">${list.length?list.map(eventCard).join(''):`<div class="empty"><h3>Вы ещё не выбрали встречу</h3><p>Найдите свой формат в расписании.</p><button class="button" data-action="event-filter" data-value="Все">Посмотреть события</button></div>`}</div><p class="form-hint spacing">Даты, места и суммы — примеры. Запись сохраняется только в вашем браузере.</p></section>`;}
function postCard(p){return `<article class="post"><div class="person-top"><span class="avatar">${esc(p.initials)}</span><div><h3>${esc(p.name)}</h3><span class="small muted">${esc(p.time)}</span></div></div><p>${esc(p.text)}</p><div class="post-meta"><span class="tag">${esc(p.type)}</span>${state.posts.some(x=>x.id===p.id)?`<button class="text-button" data-action="delete-post" data-id="${esc(p.id)}">Удалить</button>`:''}</div></article>`;}
function renderPosts(){const posts=[...state.posts,...D.posts].filter(p=>postFilter==='Все'||p.type===postFilter);document.querySelector('#posts').innerHTML=posts.length?posts.map(postCard).join(''):'<div class="empty">Реплик этого типа пока нет. Ваша может стать первой.</div>';}
function book(){return `<section class="section"><div class="book-intro">${cover()}<div><span class="eyebrow">${D.month} · КНИГА МЕСЯЦА</span><h1>${esc(D.book.title)}</h1><p class="muted spacing">${esc(D.book.author)}</p><span class="tag lime spacing">Сейчас читаем</span></div></div><h3>Почему читаем</h3><p class="muted spacing">${esc(D.book.note)}</p><p class="form-hint">Выбор книги и вводный текст — пример, не утверждённая программа клуба.</p><div class="quiet-card"><h3>С чего начать разговор</h3><ul class="questions">${D.book.questions.map(q=>`<li>${esc(q)}</li>`).join('')}</ul></div></section><section class="section"><div class="section-head"><h2>Разговор о книге</h2></div><p class="muted">Одна мысль — уже вклад. Можно не соглашаться, спрашивать и делиться тем, что попробуете.</p><form id="post-form" class="card spacing"><div class="form-row"><label for="post-type">Какой мыслью вы делитесь?</label><select id="post-type" name="type">${types.map(t=>`<option>${t}</option>`).join('')}</select></div><div class="form-row"><label for="post-text">Ваша реплика</label><textarea id="post-text" name="text" maxlength="800" required placeholder="После этой главы я задумался / задумалась…"></textarea></div><p class="form-hint">До 800 символов. Реплику увидите только вы в этом браузере.</p><button class="button dark full" type="submit">Добавить мысль ↗</button></form><div class="spacing">${chipList(['Все',...types],postFilter,'post-filter')}</div><div id="posts" aria-live="polite"></div></section><section class="section"><h2>Уже прочитали</h2>${D.book.archive.map(b=>`<div class="archive-item"><div><h3>${esc(b.title)}</h3><span class="small muted">${esc(b.author)}</span></div><span class="small muted">${b.month}</span></div>`).join('')}<p class="form-hint">Демонстрационный архив.</p></section>`;}
function gallery(){return `<section class="section"><div class="page-heading"><span class="eyebrow">ПАМЯТЬ КЛУБА</span><h1>После встречи<br>остаётся больше.</h1><p class="muted">Здесь появятся фотографии и заметки участников. Пока показываем структуру альбомов без чужих фотографий.</p></div><div class="grid">${D.albums.map(a=>`<article class="card album"><div class="album-art" aria-hidden="true">○ → ●</div><div class="album-copy"><span class="eyebrow">${a.date}</span><h3>${a.title}</h3><p class="muted">${a.caption}</p><span class="tag spacing">Макет альбома · фото пока нет</span></div></article>`).join('')}</div><a class="text-button spacing" href="#home">На главную ↗</a></section>`;}
function profile(){
 const p=state.profile;draftPhoto=p.photo||'';photoLoading=false;photoRequest++;
 return `<section class="section registration"><div class="page-heading"><span class="eyebrow">КНИЖНЫЙ КЛУБ «ТОЧКА РОСТА»</span><h1>${p.joined?'Ваша анкета':'Вступить в клуб'}</h1><p class="muted">Давайте знакомиться. Для вступления заполните все поля и добавьте фото: так каждый участник приходит в клуб с понятной, живой анкетой.</p></div>${p.joined?'<div class="saved-banner">Анкета сохранена на этом устройстве. В прототипе она не отправляется организатору.</div>':''}<form id="profile-form" class="card"><p class="form-hint">Все поля анкеты и фотография обязательны. Отчество укажите при наличии.</p><p id="profile-error" class="form-error" role="alert" hidden></p><div class="photo-field"><div id="photo-preview" class="photo-preview">${draftPhoto?`<img src="${esc(draftPhoto)}" alt="Ваше фото">`:'<span aria-hidden="true">+</span>'}</div><div><label for="profile-photo">Ваше фото</label><input id="profile-photo" type="file" ${draftPhoto?'': 'required'} accept="image/jpeg,image/png,image/webp" aria-describedby="photo-hint"><p id="photo-hint" class="form-hint">JPG, PNG или WebP, до 5 МБ. Добавьте фото, на котором вас можно узнать.</p><button type="button" class="text-button" data-action="remove-photo">Убрать фото</button></div></div>
<div class="form-row"><label for="profile-name">Фамилия, имя, отчество</label><input id="profile-name" name="name" maxlength="100" required value="${esc(p.name==='Гость клуба'?'':p.name)}" autocomplete="name" placeholder="Как вас представить участникам"><p class="form-hint">Обязательное поле. Отчество — при наличии.</p></div>
<div class="form-row"><label for="profile-about">Немного о себе</label><textarea id="profile-about" name="about" required maxlength="400" placeholder="Что любите читать? Чем интересуетесь?">${esc(p.about)}</textarea></div>
<div class="form-row"><label for="profile-job">Должность или чем занимаетесь</label><input id="profile-job" name="job" required maxlength="100" value="${esc(p.job)}" placeholder="Работа, учёба, своё дело или увлечение"></div>
<div class="form-row"><label for="profile-offer">По каким вопросам к вам можно обратиться</label><textarea id="profile-offer" name="offer" required maxlength="400" placeholder="Чем можете быть полезны другим участникам?">${esc(p.offer)}</textarea></div>
<div class="form-row"><label for="profile-contact">Как с вами связаться</label><input id="profile-contact" name="contact" required maxlength="120" value="${esc(p.contact)}" placeholder="Telegram @имя или электронная почта"><p class="form-hint">Укажите Telegram в формате @username или электронную почту.</p></div>
<label class="checkline"><input type="checkbox" name="visible" ${p.visible?'checked':''}>Хочу показывать анкету и контакт участникам клуба после запуска.</label>
<p class="form-hint">Сейчас все данные, включая фото, сохраняются только в этом браузере. Анкета не публикуется. В рабочей версии видимость будет защищена проверкой доступа.</p>
<div class="registration-rules"><strong>Условия участия</strong><p>Вступление бесплатно. Для встречи с арендой зала нужен обязательный взнос; сумма указана до записи. Дополнительные пожертвования добровольны.</p></div>
<button class="button dark full" id="save-profile" type="submit">${p.joined?'Сохранить изменения':'Вступить в клуб'}</button><p class="form-hint spacing">Это прототип регистрации. Вход и отправка анкеты организатору пока не подключены.</p></form><div class="quiet-card spacing"><h3>Мои встречи</h3><p class="muted">Ваших демонстрационных записей: ${state.registered.length}.</p><button class="text-button" data-action="my-events">Посмотреть мои записи ↗</button></div><button class="text-button spacing" data-action="reset">Сбросить мои демонстрационные данные</button></section>`;
}
function render(){
 photoRequest++;photoLoading=false;const page=currentPage();main.innerHTML=({home,people,events,book,gallery,profile}[page])();
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
 if(action==='remove-photo'){photoRequest++;photoLoading=false;draftPhoto='';document.querySelector('#photo-preview').innerHTML='<span aria-hidden='+String.fromCharCode(34)+'true'+String.fromCharCode(34)+'>+</span>';document.querySelector('#profile-photo').value='';document.querySelector('#profile-photo').required=true;document.querySelector('#save-profile').disabled=false;}
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
  event.preventDefault();
  if(photoLoading){profileError('Дождитесь загрузки фотографии.','profile-photo');return;}
  const data=new FormData(event.target);
  const candidate={...state.profile,photo:draftPhoto,joined:true,visible:data.has('visible')};
  for(const key of ['name','about','job','offer','contact'])candidate[key]=String(data.get(key)||'').trim();
  const fields=[['name','Укажите фамилию и имя.'],['about','Расскажите немного о себе.'],['job','Укажите должность или чем вы занимаетесь.'],['offer','Расскажите, по каким вопросам к вам можно обратиться.'],['contact','Укажите контакт для связи.']];
  for(const [key,message] of fields){if(!candidate[key]){profileError(message,'profile-'+key);return;}}
  if(candidate.name.split(/\s+/).length<2){profileError('Укажите фамилию и имя; отчество — при наличии.','profile-name');return;}
  if(!validContact(candidate.contact)){profileError('Укажите Telegram @username (от 5 символов после @) или электронную почту.','profile-contact');return;}
  if(!isProfileComplete(candidate)){profileError('Добавьте фотографию, чтобы завершить анкету.','profile-photo');return;}
  const previous=state.profile;state.profile=candidate;
  if(save()){render();toast('Полная анкета сохранена. Это демоверсия вступления в клуб.');}
  else{state.profile=previous;profileError('Не удалось сохранить анкету в браузере. Освободите место или разрешите локальное хранение.','profile-name');}
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
/* Фото остаётся на устройстве; уменьшаем перед сохранением в localStorage. */
document.addEventListener('change',async event=>{
 if(event.target.id!=='profile-photo')return;
 const file=event.target.files[0];if(!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){
  toast('Выберите JPG, PNG или WebP размером до 5 МБ');event.target.value='';return;
 }
 const request=++photoRequest;photoLoading=true;
 const submit=document.querySelector('#save-profile');submit.disabled=true;
 let url;
 try{
  url=URL.createObjectURL(file);
  const img=new Image();
  await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url;});
  const scale=Math.min(1,512/Math.max(img.naturalWidth,img.naturalHeight));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
  const context=canvas.getContext('2d');context.fillStyle='#f6f7f2';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(img,0,0,canvas.width,canvas.height);
  const photo=canvas.toDataURL('image/jpeg',.8);
  if(request!==photoRequest||currentPage()!=='profile')return;
  draftPhoto=photo;document.querySelector('#profile-photo').required=false;
  const preview=document.querySelector('#photo-preview');preview.replaceChildren();
  const image=document.createElement('img');image.src=photo;image.alt='Ваше фото';preview.append(image);
  toast('Фото добавлено. Сохраните анкету.');
 }catch{if(request===photoRequest)toast('Не удалось открыть изображение. Попробуйте другое фото.');}
 finally{if(url)URL.revokeObjectURL(url);if(request===photoRequest){photoLoading=false;submit.disabled=false;}}
});