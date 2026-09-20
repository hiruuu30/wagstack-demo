// Standalone showcase: no production account, database, email, or payment connection.
(()=>{
  const query=new URLSearchParams(location.search),read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))||f}catch{return f}};
  const stored=read('demo-brand',{}),name=(query.get('brand')||stored.name||'Your Brand').slice(0,60),color=/^[0-9a-f]{6}$/i.test(query.get('color')||'')?'#'+query.get('color'):stored.color||'#ff7a1a';
  const logoInput=query.get('logo')||stored.logo||'',logo=(/^https:\/\//i.test(logoInput)||/^data:image\/(?:png|jpeg|webp|svg\+xml);base64,/i.test(logoInput))?logoInput:'';
  const client=(query.get('client')||stored.client||'general').replace(/[^a-z0-9_-]/gi,'').slice(0,60)||'general';
  const exp=Number(query.get('exp')||0);
  const isShared=Boolean(query.get('brand')||query.get('client')||query.get('logo'));
  if(isShared&&(!Number.isFinite(exp)||exp<=Date.now())){
    document.documentElement.innerHTML='<head><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Demo expired</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#07111f;color:#fff;font-family:Inter,system-ui,sans-serif}main{max-width:520px;padding:40px;text-align:center}h1{font-size:32px;margin:0 0 12px}p{color:#aeb9c8;line-height:1.6;margin:0}</style></head><body><main><h1>This demo has expired</h1><p>This private demo was available for 7 days. Contact Brick & Bond if you would like a fresh link.</p></main></body>';
    throw new Error('DEMO_EXPIRED');
  }
  window.DemoConfig={name,color,logo,client,exp};localStorage.setItem('demo-brand',JSON.stringify(window.DemoConfig));
  localStorage.setItem('branddemo-guest-mode-v1','1');window.YourBrandCatalog={status:'ready'};
  if(query.get('presenter')==='1')localStorage.setItem('demo-presenter','1');
  window.DemoPresenter=localStorage.getItem('demo-presenter')==='1';
  document.documentElement.style.setProperty('--demo-accent',color);
  // Allow only this demo's APIs; backend isolation is additionally enforced by CSP.
  const nativeFetch=window.fetch.bind(window);
  window.fetch=(resource,options)=>{const url=new URL(resource instanceof Request?resource.url:resource,location.href);if(url.origin!==location.origin)return Promise.reject(new Error('External data connections are disabled in this demo.'));if(url.pathname.startsWith('/api/')&&!['/api/demo-events','/api/demo-inquiry','/api/demo-report','/api/demo-logo','/api/demo-short'].includes(url.pathname))return Promise.reject(new Error('This action is not connected in the demo.'));return nativeFetch(resource,options)};
  if(location.pathname.startsWith('/auth/')||location.pathname==='/admin')history.replaceState({},'', '/');
})();
