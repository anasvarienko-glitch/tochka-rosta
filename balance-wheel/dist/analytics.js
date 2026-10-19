/* Яндекс Метрика: посещаемость и события без оценок карьерного колеса. */
(function () {
 'use strict';
 const counterId=113678862;
 const allowed=new Set(['study_start','study_complete','card_download','contact_telegram','contact_max','gift_telegram','gift_max','demo_view','demo_download']);
 const seen=new Set();
 window.careerAnalytics={goal:function(name,once){if(!allowed.has(name)||(once&&seen.has(name)))return;seen.add(name);try{if(typeof window.ym==='function')window.ym(counterId,'reachGoal',name);}catch{}}};
 // Не отправлять локальные предпросмотры и проверки в рабочую статистику.
 if(location.protocol!=='https:'||location.hostname!=='anasvarienko-glitch.github.io'||!location.pathname.startsWith('/tochka-rosta/balance-wheel/dist/'))return;
 window.ym=window.ym||function(){(window.ym.a=window.ym.a||[]).push(arguments);};
 window.ym.l=window.ym.l||Date.now();
 const tag=document.createElement('script');tag.async=true;tag.src='https://mc.yandex.ru/metrika/tag.js';document.head.appendChild(tag);
 window.ym(counterId,'init',{clickmap:false,trackLinks:true,accurateTrackBounce:true,webvisor:false});
})();
