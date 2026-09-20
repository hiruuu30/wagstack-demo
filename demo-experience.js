import { observeUI } from './ui-lifecycle.js';
const config=window.DemoConfig,STORE='brand-demo-workspace-v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=()=>JSON.parse(localStorage.getItem(STORE)||'{}');
const money=n=>'₱'+Number(n||0).toLocaleString('en-PH');
let ownerTab='bookings',tourStep=-1,lastFocused,previousBookings=new Set((read().bookings||[]).map(b=>String(b.id)));
let visitor=localStorage.getItem('demo-visitor');if(!visitor){visitor=crypto.randomUUID();localStorage.setItem('demo-visitor',visitor)}
const track=(event,extra={})=>{if(window.DemoPresenter||navigator.doNotTrack==='1')return;fetch('/api/demo-events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event,client:config.client,visitor,...extra}),keepalive:true}).catch(()=>{})};
function toast(message){document.querySelector('.demo-toast')?.remove();const n=document.createElement('div');n.className='demo-toast';n.setAttribute('role','status');n.textContent=message;document.body.append(n);setTimeout(()=>n.remove(),4500)}
function logoSrc(value){
  const raw=String(value||'').trim();
  if(!raw)return '/assets/branddemo-brandmark.svg';
  try{
    const u=new URL(raw,location.origin),h=u.hostname.toLowerCase();
    const openAI=h==='chatgpt.com'||h.endsWith('.chatgpt.com')||h==='openai.com'||h.endsWith('.openai.com')||h==='oaiusercontent.com'||h.endsWith('.oaiusercontent.com')||h==='oaistatic.com'||h.endsWith('.oaistatic.com')||h==='blob.core.windows.net'||h.endsWith('.blob.core.windows.net');
    if(u.protocol==='https:'&&openAI)return '/api/demo-image?url='+encodeURIComponent(u.href);
  }catch{}
  return raw;
}
function logo(){return `<img class="demo-logo" src="${esc(logoSrc(config.logo))}" alt="${config.logo?esc(config.name)+' logo':'Your logo placeholder'}" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='/assets/branddemo-brandmark.svg'">`}
function go(path){if(location.pathname!==path){history.pushState({},'',path+location.search);dispatchEvent(new PopStateEvent('popstate'))}else window.DemoWorkspace?.refresh();}
function customer(path='/'){sessionStorage.setItem('demo-entered','1');document.body.classList.remove('demo-welcome','demo-owner-mode');document.querySelector('#demo-welcome').hidden=true;document.querySelector('#demo-owner').hidden=true;setSwitch('customer');go(path);track('customer_view');brandUI()}
function owner(){sessionStorage.setItem('demo-entered','1');document.body.classList.remove('demo-welcome');document.body.classList.add('demo-owner-mode');document.querySelector('#demo-welcome').hidden=true;document.querySelector('#demo-owner').hidden=false;setSwitch('owner');renderOwner();track('owner_view')}
function setSwitch(which){document.querySelectorAll('[data-demo-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.demoView===which)))}
const bar=document.createElement('header');bar.className='demo-bar';bar.innerHTML=`<div class="demo-bar-brand"><strong>${esc(config.name)}</strong><small>Interactive demo · Sample data</small></div><div class="demo-view-switch" role="group" aria-label="Demo perspective"><button type="button" data-demo-view="customer" aria-pressed="true">Customer</button><button type="button" data-demo-view="owner" aria-pressed="false">Owner</button></div><button type="button" class="demo-start-tour" data-demo-tour>Take a tour</button><button type="button" class="demo-brand-button" data-demo-brand>Your branding</button><button type="button" class="demo-primary demo-get" data-demo-inquiry><span class="desktop-label">Get this for my business</span><span class="mobile-label">Get yours</span></button><details class="demo-menu"><summary aria-label="Demo options">More</summary><div class="demo-menu-panel"><button data-demo-brand>Personalize & share</button><button data-demo-welcome>Demo introduction</button><button data-demo-reset>Reset sample data</button><label><input type="checkbox" data-demo-presenter ${window.DemoPresenter?'checked':''}>Presenter mode</label><p>Presenter mode excludes this browser from demo analytics. Share links never include it.</p><a href="/reports.html">Private sales report</a></div></details>`;document.body.append(bar);
const welcome=document.createElement('section');welcome.id='demo-welcome';welcome.className='demo-surface';welcome.innerHTML=`<div class="demo-welcome-grid"><div class="demo-welcome-copy"><p class="demo-eyebrow">PET CARE FOR YOUR BUSINESS</p><h1>Everything your pet care business needs in one place</h1><p>Customers can book services, manage their pets, check care records, earn rewards, and shop from one simple app.</p><div class="demo-welcome-actions"><button class="demo-primary" data-demo-enter>Try the customer experience</button><button data-demo-tour>Show me around · 60 seconds</button></div><small>No signup. No payment. Explore at your own pace.</small></div><div class="demo-preview"><div class="demo-preview-brand">${logo()}<strong>${esc(config.name)}</strong></div><div class="demo-preview-pet"><img src="/assets/biscuit-avatar.png" alt="Biscuit, a sample golden retriever"><div><h2>Meet Biscuit.</h2><p>Golden Retriever · 3 years old</p></div></div><div class="demo-preview-booking"><small>One simple journey</small><h3>A fresh groom. A happy regular.</h3><p>Book as a customer → Confirm as the owner → See the updated appointment.</p></div><div class="demo-preview-foot"><span>Pet profiles & care</span><span>Bookings & rewards</span></div></div></div><div class="demo-benefits"><div><b>Make booking easier</b><p>Try a complete appointment request, from choosing a pet to reviewing the details.</p></div><div><b>Keep care connected</b><p>Explore individual pet profiles, care records, hotel stays, and loyalty rewards.</p></div><div><b>Make it feel like yours</b><p>Preview your name, logo, and accent color. Copy a personalized link to share with your team.</p></div></div><p class="demo-disclosure">This is an interactive preview. Pets, appointments, orders, balances, and weather are sample data. Demo actions stay in this browser and do not create real bookings or charges.</p><footer class="demo-footer"><span>Built by Brick & Bond</span><button data-demo-inquiry>Discuss your own version</button><span>Anonymous demo interactions may be counted. No pet details are sent.</span></footer>`;document.body.append(welcome);
const ownerSurface=document.createElement('section');ownerSurface.id='demo-owner';ownerSurface.className='demo-surface';ownerSurface.hidden=true;document.body.append(ownerSurface);
function showWelcome(){endTour();document.body.classList.remove('demo-owner-mode');document.body.classList.add('demo-welcome');welcome.hidden=false;ownerSurface.hidden=true;setSwitch('customer');window.scrollTo(0,0)}
if(sessionStorage.getItem('demo-entered')==='1')welcome.hidden=true;else showWelcome();
function renderOwner(){const s=read(),bookings=s.bookings||[],pets=s.pets||[],orders=s.orders||[];ownerSurface.innerHTML=`<div class="demo-owner-heading"><div><p class="demo-eyebrow">Owner workspace · Sample business</p><h1>${esc(config.name)}, behind the counter.</h1><p>Try a booking in Customer view, then manage it here. Changes appear on both sides.</p></div><button class="demo-primary" data-demo-inquiry>Build this for my business</button></div><div class="demo-owner-stats"><div class="demo-owner-stat"><small>Appointments</small><b>${bookings.length}</b></div><div class="demo-owner-stat"><small>Awaiting confirmation</small><b>${bookings.filter(b=>b.status==='Pending').length}</b></div><div class="demo-owner-stat"><small>Pet profiles</small><b>${pets.length}</b></div><div class="demo-owner-stat"><small>Shop orders</small><b>${orders.length}</b></div></div><div class="demo-owner-tabs" role="tablist" aria-label="Owner records">${['bookings','pets','orders'].map(t=>`<button role="tab" data-owner-tab="${t}" aria-selected="${t===ownerTab}">${t==='bookings'?'Appointments':t==='pets'?'Pet profiles':'Shop orders'}</button>`).join('')}</div><div class="demo-owner-list" role="tabpanel">${ownerTab==='bookings'?bookings.map(b=>{const p=pets.find(p=>p.name===b.pet);return `<article class="demo-booking"><img src="${esc(p?.image||'/assets/biscuit-avatar.png')}" alt=""><div><h3>${esc(b.pet)} · ${esc(b.service)}</h3><p>${esc(b.date)}${b.endDate?' to '+esc(b.endDate):''} · ${esc(b.time)}</p><small>${esc(b.type)} · Sample customer</small></div><div class="demo-booking-actions"><span class="demo-badge ${b.status==='Confirmed'?'confirmed':b.status==='Pending'?'pending':''}">${esc(b.status)}</span>${b.status==='Pending'?`<button class="demo-primary" data-confirm-booking="${esc(b.id)}">Confirm</button>`:''}${b.status==='Confirmed'?`<button data-complete-booking="${esc(b.id)}">Mark complete</button>`:''}</div></article>`}).join('')||'<div class="demo-empty">No appointments yet. Switch to Customer and try booking a groom.</div>':ownerTab==='pets'?pets.map(p=>`<article class="demo-booking"><img src="${esc(p.image)}" alt=""><div><h3>${esc(p.name)}</h3><p>${esc(p.breed)} · ${esc(p.age)} · ${esc(p.weight)}</p><small>${(s.healthByPet?.[p.name]||[]).length} care records</small></div><button data-owner-pet="${esc(p.name)}">View care profile</button></article>`).join(''):orders.map(o=>`<article class="demo-booking"><div aria-hidden="true">Bag</div><div><h3>Order ${esc(o.id)}</h3><p>${money(o.total)} · ${esc(o.customer?.name||'Sample customer')}</p><small>${esc(o.status)} · Demo only, no charge</small></div><button data-order-fulfill="${esc(o.id)}" ${o.status==='Fulfilled'?'disabled':''}>${o.status==='Fulfilled'?'Fulfilled':'Mark fulfilled'}</button></article>`).join('')||'<div class="demo-empty">No sample orders yet. Visit the shop in Customer view, add an item, and try the demo checkout.</div>'}</div><p class="demo-reset-note">All records on this screen belong to this browser’s demo. Use “Reset sample data” to start again.</p>`}
function write(s){window.DemoWorkspace?.set(s);localStorage.setItem(STORE,JSON.stringify(s));renderOwner()}
function dialog(title,body){document.querySelector('.demo-dialog')?.remove();lastFocused=document.activeElement;const d=document.createElement('dialog');d.className='demo-dialog';d.setAttribute('aria-label',title);d.innerHTML=`<button class="demo-close" aria-label="Close dialog" type="button">×</button><h2>${esc(title)}</h2>${body}`;document.body.append(d);d.querySelector('.demo-close').onclick=()=>d.close();d.addEventListener('close',()=>{d.remove();lastFocused?.focus()});d.addEventListener('click',e=>{if(e.target===d&&e.clientX&&(e.clientX<d.getBoundingClientRect().left||e.clientX>d.getBoundingClientRect().right))d.close()});d.showModal();return d}
function brandDialog(){
  track('branding_open');
  let selectedFile=null,uploadedUrl=(/^https:\/\//i.test(config.logo)||/^data:image\//i.test(config.logo))?config.logo:'';
  const d=dialog('Make it your brand',`<p>Preview your business identity across the demo.</p><form>
    <label>Business name<input name="name" maxlength="60" required value="${esc(config.name)}"></label>
    <label>Accent color<input type="color" name="color" value="${esc(config.color)}"></label>
    <label>Upload logo<input type="file" name="logoFile" accept="image/png,image/jpeg,image/webp,image/svg+xml"></label>
    <div class="demo-logo-upload-preview" ${config.logo?'':'hidden'}><img data-logo-preview src="${esc(config.logo||'')}" alt="Logo preview"></div>
    <small class="demo-upload-note">PNG, JPG, WebP or SVG, up to 2 MB. The logo is included when you copy the demo link.</small>
    <label>Or use a logo image URL<input type="url" name="logo" placeholder="https://your-site.com/logo.png" value="${esc(/^https:\/\//i.test(config.logo)?config.logo:'')}"></label>
    <label>Client link label<input name="client" maxlength="60" pattern="[A-Za-z0-9_-]+" value="${esc(config.client)}" required></label>
    <div class="demo-form-actions"><button class="demo-primary" type="submit">Apply branding</button><button type="button" data-copy-brand>Copy short link</button></div>
    <p class="demo-form-status" role="status"></p>
  </form>`);
  const form=d.querySelector('form'),status=d.querySelector('[role=status]'),fileInput=d.querySelector('[name=logoFile]'),previewWrap=d.querySelector('.demo-logo-upload-preview'),preview=d.querySelector('[data-logo-preview]');
  fileInput.addEventListener('change',()=>{
    const file=fileInput.files?.[0];
    if(!file)return;
    if(file.size>2*1024*1024){status.textContent='Please use a logo smaller than 2 MB.';fileInput.value='';return}
    if(!/^image\/(png|jpeg|webp|svg\+xml)$/i.test(file.type)){status.textContent='Please upload a PNG, JPG, WebP or SVG logo.';fileInput.value='';return}
    selectedFile=file;uploadedUrl='';
    const reader=new FileReader();
    reader.onload=()=>{preview.src=String(reader.result||'');previewWrap.hidden=false;status.textContent='Logo ready to upload.'};
    reader.readAsDataURL(file);
  });
  const urlInput=d.querySelector('[name=logo]');
  urlInput.addEventListener('change',()=>{
    const value=urlInput.value.trim();
    if(!value)return;
    preview.src=logoSrc(value);
    preview.onerror=()=>{preview.onerror=null;preview.src='/assets/branddemo-brandmark.svg';status.textContent='That link could not be loaded as an image.'};
    previewWrap.hidden=false;
  });
  const baseValues=()=>{const fd=new FormData(form);return {name:String(fd.get('name')).trim(),color:String(fd.get('color')),logoUrl:String(fd.get('logo')||'').trim(),client:String(fd.get('client')).trim()}};
  const link=v=>{const u=new URL('/',location.origin);u.searchParams.set('brand',v.name);u.searchParams.set('color',v.color.slice(1));u.searchParams.set('client',v.client);if(v.logo)u.searchParams.set('logo',v.logo);return u.href};
  async function compactLogo(file){
    const url=URL.createObjectURL(file);
    try{
      const img=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=url});
      const render=(max,quality)=>{
        const scale=Math.min(1,max/img.naturalWidth,max/img.naturalHeight);
        const w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));
        const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
        const ctx=canvas.getContext('2d');ctx.clearRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
        const webp=canvas.toDataURL('image/webp',quality);
        return webp.startsWith('data:image/webp')?webp:canvas.toDataURL('image/png');
      };
      let data=render(64,.72);
      if(data.length>2800)data=render(52,.62);
      if(data.length>2800)data=render(44,.55);
      if(data.length>3200)throw new Error('Please use a simpler logo image so the outreach link can stay short.');
      return data;
    }finally{URL.revokeObjectURL(url)}
  }
  async function uploadIfNeeded(v){
    if(!selectedFile)return uploadedUrl||v.logoUrl;
    status.textContent='Preparing logo…';
    const file=selectedFile;
    const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=reject;r.readAsDataURL(file)});
    try{
      const res=await fetch('/api/demo-logo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data,type:file.type,name:file.name,client:v.client})});
      const out=await res.json().catch(()=>({}));
      if(res.ok&&out.url){
        uploadedUrl=out.embedded?await compactLogo(file):out.url;
        selectedFile=null;
        return uploadedUrl;
      }
    }catch{}
    status.textContent='Adding logo to the share link…';
    uploadedUrl=await compactLogo(file);
    selectedFile=null;
    return uploadedUrl;
  }
  async function collect(){
    const v=baseValues();
    if(!form.reportValidity())return null;
    if(v.logoUrl&&!/^https:\/\//i.test(v.logoUrl)){status.textContent='Use an HTTPS logo URL.';return null}
    try{return {...v,logo:await uploadIfNeeded(v)}}catch(err){status.textContent=err.message||'Logo upload failed.';return null}
  }
  form.onsubmit=async e=>{e.preventDefault();const button=form.querySelector('[type=submit]');button.disabled=true;const v=await collect();if(!v){button.disabled=false;return}localStorage.setItem('demo-brand',JSON.stringify({name:v.name,color:v.color,logo:v.logo,client:v.client}));location.href=link(v)};
  d.querySelector('[data-copy-brand]').onclick=async()=>{
    const button=d.querySelector('[data-copy-brand]');button.disabled=true;
    const v=await collect();
    if(!v){button.disabled=false;return}
    const share=link(v);
    localStorage.setItem('demo-brand',JSON.stringify({name:v.name,color:v.color,logo:v.logo,client:v.client}));
    status.textContent='Creating short link…';
    let outreach=share;
    try{
      const r=await fetch('/api/demo-short',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:share})});
      const out=await r.json().catch(()=>({}));
      if(r.ok&&out.url)outreach=out.url;
    }catch{}
    try{await navigator.clipboard.writeText(outreach);status.textContent=outreach===share?'Link copied.':'Short outreach link copied.'}
    catch{status.textContent=outreach}
    button.disabled=false;
  };
}
function inquiry(){track('inquiry_click');const d=dialog('Let’s make it yours.',`<p>Tell Brick & Bond about your business. Your request includes the demo branding you’re viewing.</p><form><label>Business name<input name="business" maxlength="100" required value="${esc(config.name==='Your Brand'?'':config.name)}"></label><label>Your name<input name="name" maxlength="100" required autocomplete="name"></label><label>Email address<input name="email" type="email" maxlength="180" required autocomplete="email"></label><label>What would you like included?<textarea name="needs" maxlength="2000">Grooming and hotel booking, pet profiles, rewards, and shop.</textarea></label><label class="demo-honeypot">Website<input name="website" tabindex="-1" autocomplete="off"></label><label class="demo-checkbox"><input type="checkbox" required name="consent">I agree to share these details with Brick & Bond so they can respond to this inquiry.</label><button class="demo-primary" type="submit">Request my own version</button><p class="demo-form-status" role="status"></p><p>This sends a real inquiry, not a demo booking. No payment is collected.</p></form>`);d.querySelector('form').onsubmit=async e=>{e.preventDefault();const form=e.target,button=form.querySelector('[type=submit]'),status=form.querySelector('[role=status]');button.disabled=true;status.textContent='Sending your request…';const payload={...Object.fromEntries(new FormData(form)),client:config.client,brand:config.name,color:config.color};try{const r=await fetch('/api/demo-inquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!r.ok)throw Error();status.textContent='Your request is saved. Brick & Bond will review your details and contact you.';form.querySelectorAll('input,textarea').forEach(e=>e.disabled=true);track('inquiry_submit')}catch{status.replaceChildren(document.createTextNode('Your request was not sent. Please try again, or '));const a=document.createElement('a');a.textContent='open an email draft';a.href='mailto:hello@brickand.bond?subject='+encodeURIComponent('Pet-care app inquiry — '+payload.business)+'&body='+encodeURIComponent(`Name: ${payload.name}\nBusiness: ${payload.business}\nEmail: ${payload.email}\nInterested in: ${payload.needs}\nDemo: ${config.client}`);status.append(a);button.disabled=false}}}
const tour=[{path:'/',title:'Here’s the customer view.',copy:'This is where customers can see their pets, appointments, care reminders, and rewards.',target:'.home__glass--showcase'},{path:'/pets',title:'Here’s Biscuit’s profile.',copy:'Each pet has their own profile, with basic details and care records in one place.',target:'.pet-workspace-v25'},{path:'/grooming',title:'Try booking a service.',copy:'Choose a service, date, and time. You can fill it out yourself or add a sample booking.',target:'.clone-glass',action:true},{owner:true,title:'Now check the owner side.',copy:'The booking shows up here. You can confirm it, and the customer will see the updated status.',target:'.demo-owner-list'},{path:'/rewards',title:'Rewards are here too.',copy:'Customers can check their points and membership along with their bookings and pet records.',target:'.clone-glass'},{path:'/',title:'That’s the basic flow.',copy:'You can also try your business name and logo, or tell us what you’d want in your own version.',target:'.home__brand-slot'}];
function endTour(){tourStep=-1;sessionStorage.removeItem('demo-tour-step');document.querySelector('.demo-tour')?.remove();document.querySelectorAll('.demo-highlight').forEach(e=>e.classList.remove('demo-highlight'))}
function showTour(i){if(i>=tour.length){track('tour_complete');endTour();inquiry();return}tourStep=i;sessionStorage.setItem('demo-tour-step',String(i));document.querySelector('.demo-tour')?.remove();document.querySelectorAll('.demo-highlight').forEach(e=>e.classList.remove('demo-highlight'));const step=tour[i];step.owner?owner():customer(step.path);const card=document.createElement('aside');card.className='demo-tour';card.setAttribute('aria-label','Guided demo');card.innerHTML=`<small>QUICK TOUR · ${i+1} / ${tour.length}</small><h2 tabindex="-1">${step.title}</h2><p>${step.copy}</p>${step.action?'<button type="button" data-tour-booking>Add a sample request</button>':''}<div class="demo-tour-actions"><button data-tour-skip>Skip</button>${i?'<button data-tour-back>Back</button>':''}<button class="demo-primary" data-tour-next>${i===tour.length-1?'Done':'Next'}</button></div>`;document.body.append(card);card.querySelector('h2').focus({preventScroll:true});setTimeout(()=>{document.querySelector(step.target)?.classList.add('demo-highlight')},180);track('tour_step',{step:i+1})}
function sampleBooking(){const s=read(),date=new Date();date.setDate(date.getDate()+2);const booking={id:Date.now(),type:'Grooming',service:'Full Grooming',date:date.toISOString().slice(0,10),time:'10:00',status:'Pending',pet:s.pets?.[0]?.name||'Biscuit'};s.bookings.unshift(booking);write(s);track('booking_complete');toast('Sample request added. Switch to Owner to confirm it.');showTour(3)}
function brandUI(){document.title=config.name+' — Pet care demo';const slot=document.querySelector('.home__brand-slot');if(slot&&!slot.dataset.demoBranded){slot.dataset.demoBranded='1';slot.innerHTML=`<a class="demo-public-brand" href="/" aria-label="${esc(config.name)} home">${logo()}<div class="demo-inline-brand">${esc(config.name)}</div><small class="demo-brand-tagline">Your pet care, connected.</small></a>`}document.querySelectorAll('img[src*="branddemo-brandmark"],img[src*="branddemo-favicon"]').forEach(img=>{if(config.logo&&img.src!==logoSrc(config.logo))img.src=logoSrc(config.logo);img.alt=config.logo?config.name+' logo':'Your Logo';img.onerror=()=>{img.onerror=null;img.src='/assets/branddemo-brandmark.svg'}});const walker=document.createTreeWalker(document.querySelector('#root')||document.body,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement?.closest('script,style,textarea,input')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});let n;while(n=walker.nextNode()){if(/YourBrand|branddemo\.|Wag Club|Paw Points|Wag Points/.test(n.nodeValue))n.nodeValue=n.nodeValue.replace(/YourBrand|branddemo\./g,config.name).replace(/Wag Club/g,'Care Club').replace(/Paw Points|Wag Points/g,'Care Points')};document.querySelectorAll('.weather-source').forEach(e=>{if(e.textContent!=='Sample Quezon City weather · Demo only')e.textContent='Sample Quezon City weather · Demo only'});document.documentElement.style.setProperty('--orange',config.color);}
observeUI(brandUI);brandUI();
document.addEventListener('click',e=>{const t=e.target.closest('button,a');if(!t)return;if(t.matches('[data-demo-enter]'))customer();if(t.matches('[data-demo-view]')){endTour();t.dataset.demoView==='owner'?owner():customer()}if(t.matches('[data-demo-tour]')){track('tour_start');showTour(0)}if(t.matches('[data-demo-brand]'))brandDialog();if(t.matches('[data-demo-inquiry]'))inquiry();if(t.matches('[data-demo-welcome]'))showWelcome();if(t.matches('[data-demo-reset]')){dialog('Start fresh?',`<p>This clears only the sample pets, appointments, orders, and edits in this browser. Your branding stays.</p><button class="demo-primary" data-confirm-reset>Reset demo</button>`)}if(t.matches('[data-confirm-reset]')){localStorage.removeItem(STORE);sessionStorage.removeItem('demo-tour-step');track('demo_reset');location.reload()}if(t.matches('[data-owner-tab]')){ownerTab=t.dataset.ownerTab;renderOwner()}if(t.matches('[data-confirm-booking],[data-complete-booking]')){const s=read(),id=t.dataset.confirmBooking||t.dataset.completeBooking,b=s.bookings.find(b=>String(b.id)===id);if(b){b.status=t.dataset.confirmBooking?'Confirmed':'Completed';write(s);track('booking_managed');toast('Updated. The customer sees the same appointment status.')}}if(t.matches('[data-owner-pet]')){const s=read();s.activePet=t.dataset.ownerPet;write(s);customer('/pets')}if(t.matches('[data-order-fulfill]')){const s=read(),o=s.orders.find(o=>String(o.id)===t.dataset.orderFulfill);if(o){o.status='Fulfilled';write(s)}}if(t.matches('[data-tour-skip]')){track('tour_skip');endTour()}if(t.matches('[data-tour-back]'))showTour(tourStep-1);if(t.matches('[data-tour-next]'))showTour(tourStep+1);if(t.matches('[data-tour-booking]'))sampleBooking();if(t.closest('.demo-menu-panel'))document.querySelector('.demo-menu').open=false;},true);
document.addEventListener('change',e=>{if(e.target.matches('[data-demo-presenter]')){window.DemoPresenter=e.target.checked;localStorage.setItem('demo-presenter',e.target.checked?'1':'0');toast(e.target.checked?'Presenter mode on. This browser is excluded from analytics.':'Prospect analytics enabled for this browser.')}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&tourStep>=0)endTour()});
window.addEventListener('demo:workspace-saved',()=>{const bookings=read().bookings||[],fresh=bookings.filter(b=>!previousBookings.has(String(b.id)));if(fresh.length){track('booking_complete');if(tourStep<0)toast('Booking saved. Switch to Owner to manage it.')}previousBookings=new Set(bookings.map(b=>String(b.id)));if(document.body.classList.contains('demo-owner-mode'))renderOwner()});
const openKey='demo-open:'+config.client;if(!sessionStorage.getItem(openKey)){track('demo_open');sessionStorage.setItem(openKey,'1')}

document.addEventListener('submit',e=>{if(e.target.matches('[data-about-contact]')){e.preventDefault();e.stopImmediatePropagation();toast('Sample message only. Use Get this for my business to contact Brick & Bond.')}},true);
document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(a&&(a.href.startsWith('tel:')||(a.href.startsWith('mailto:')&&!a.closest('.demo-dialog')))){e.preventDefault();e.stopImmediatePropagation();toast('Your business contact details will appear here in your own version.')}},true);
