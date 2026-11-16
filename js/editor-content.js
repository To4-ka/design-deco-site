/* Editorial content adapter for GitHub Pages + Pages CMS.
   Pages CMS edits content/*.json; the original HTML is the fallback if loading fails. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const text = (selector, value, root = document) => {
    const node = $(selector, root);
    if (node && typeof value === 'string') node.textContent = value;
  };
  function imagePath(path) {
    if (typeof path !== 'string' || !path.trim()) return '';
    const p = path.trim().replaceAll('\\', '/');
    if (/^(https?:)?\/\//i.test(p) || /^data:/i.test(p) || /^javascript:/i.test(p)) return '';
    // Pages CMS writes /assets/... by default. On project GitHub Pages,
    // root-relative /assets would incorrectly point outside the repository.
    return p.replace(/^\/+/, '');
  }
  function setImage(node, path, description) {
    const url = imagePath(path);
    if (node && url) { node.src = url; if (description) node.alt = description; }
  }
  async function readJSON(filename) {
    const res = await fetch('content/' + filename + '.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(filename + ': ' + res.status);
    return res.json();
  }
  function updateHome(c) {
    text('.hero .eyebrow', c.hero_eyebrow);
    const heading = $('.hero h1');
    if (heading && [c.hero_line_1,c.hero_line_2,c.hero_line_3,c.hero_line_4].every(v=>typeof v==='string')) {
      heading.replaceChildren(document.createTextNode(c.hero_line_1),document.createElement('br'),
        document.createTextNode(c.hero_line_2),document.createElement('br'));
      const em=document.createElement('em');
      em.append(document.createTextNode(c.hero_line_3),document.createElement('br'),document.createTextNode(c.hero_line_4));
      heading.append(em);
    }
    text('.hero .intro',c.hero_intro);
    setImage($('.hero-image img'),c.hero_image,'Визуализация проекта');
    text('.approach blockquote',c.approach_quote);
    text('.approach p',c.approach_description);
    const p=$$('.principles > div');
    [1,2,3].forEach((n,i)=> { if(p[i]) {text('h3',c['principle_'+n+'_title'],p[i]);text('p',c['principle_'+n+'_text'],p[i]);} });
    const about=$$('.about-copy > p');
    [c.about_lead,c.about_1,c.about_2,c.about_3].forEach((value,i)=>{
      if(!about[i] || typeof value!=='string') return;
      if(i===0){const strong=about[i].querySelector('strong');if(strong)strong.textContent=value;}
      else about[i].textContent=value;
    });
    const portrait=$('.portrait');
    const url=imagePath(c.portrait);
    if(portrait && url) {
      portrait.classList.remove('image-empty');
      portrait.replaceChildren();
      const img=document.createElement('img');
      img.className='image-fill'; img.alt='Татьяна Черепахина — архитектор-дизайнер';img.loading='lazy';img.src=url;
      portrait.append(img);
    }
    text('#services > div > p',c.services_description);
    $$('.service strong').forEach((node,i)=>{ const v=c['service_'+(i+1)];if(typeof v==='string')node.textContent=v; });
    text('.contact-grid > div:last-child > p',c.contact_description);
    const links=$$('.contact-link a');
    const telegram = String(c.telegram||'').trim().replace(/^@/,'').replace(/^https?:\/\/t\.me\//,'').replace(/\/.*$/,'').replace(/[^a-z0-9_]/gi,'');
    const phone = String(c.phone||'').trim();
    const phoneDigits = phone.replace(/[^\d+]/g,'');
    const whatsapp = String(c.whatsapp||'').replace(/\D/g,'');
    const email = String(c.email||'').trim();
    if(links[0] && telegram) links[0].href='https://t.me/'+telegram;
    if(links[1] && phoneDigits){ links[1].href='tel:'+phoneDigits;links[1].textContent='Телефон: '+phone; }
    if(links[2] && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){links[2].href='mailto:'+email;links[2].textContent='Email: '+email;}
    if(links[3] && whatsapp) links[3].href='https://wa.me/'+whatsapp;
  }
  function updateCard(card,c){
    if(!card||!c) return;
    text('.project-meta span:first-child',c.label,card);
    text('.project-meta span:last-child',c.area,card);
    text('h3',c.card_heading,card);
    text('p',c.card_description,card);
    setImage($('.project-image img',card),c.card_image,'Визуализация проекта: '+(c.label||''));
  }
  function updateProject(c){
    if (!c) return;
    text('.page-intro .eyebrow',c.page_label);
    text('.page-intro h1',c.page_heading);
    text('.page-intro .case-text',c.page_description);
    const gallery=$('.gallery');
    if (gallery && Array.isArray(c.gallery)) {
      const arr=c.gallery.map(imagePath).filter(Boolean);
      if(arr.length){
        const items=arr.map((src,i)=>{
          const img=document.createElement('img');img.src=src;
          img.alt=(c.page_label || 'Проект') + ' — визуализация ' + (i+1);
          img.loading='lazy';return img;
        });
        gallery.replaceChildren(...items);
      }
    }
  }
  document.addEventListener('DOMContentLoaded',async()=>{
    try{
      if(document.body.hasAttribute('data-cms-home')){
        // Independent fetches: a missing project file must not disable the home page.
        readJSON('site').then(updateHome).catch(console.warn);
        const slugs=['house-1000','apartment','house-350','salon'];
        const cards=$$('.project');
        await Promise.all(slugs.map((slug,i)=>readJSON(slug).then(c=>updateCard(cards[i],c)).catch(console.warn)));
      }else {
        const slug=document.body.getAttribute('data-cms-project');
        if(slug && /^(house-1000|apartment|house-350|salon)$/.test(slug)) updateProject(await readJSON(slug));
      }
    }catch(error){console.warn('Pages CMS data unavailable, showing built-in page:',error);}
  });
})();
