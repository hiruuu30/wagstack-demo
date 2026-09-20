function first(v){return Array.isArray(v)?v[0]:v}
function esc(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function safeColor(v){const s=String(v||'').replace(/^#/,'');return /^[0-9a-fA-F]{6}$/.test(s)?s:'0B1E3F'}
function origin(req){const proto=String(req.headers['x-forwarded-proto']||'https').split(',')[0].trim();return proto+'://'+req.headers.host}
function imageUrl(req,logo){
  const raw=String(logo||'').trim(),base=origin(req);
  if(/^data:image\//i.test(raw))return base+'/api/demo-og-logo?d='+encodeURIComponent(raw);
  if(/^https:\/\//i.test(raw)){
    try{
      const u=new URL(raw),h=u.hostname.toLowerCase();
      const proxy=h==='chatgpt.com'||h.endsWith('.chatgpt.com')||h==='openai.com'||h.endsWith('.openai.com')||h==='oaiusercontent.com'||h.endsWith('.oaiusercontent.com')||h==='oaistatic.com'||h.endsWith('.oaistatic.com')||h==='blob.core.windows.net'||h.endsWith('.blob.core.windows.net');
      return proxy?base+'/api/demo-image?url='+encodeURIComponent(raw):raw;
    }catch{}
  }
  return base+'/assets/branddemo-brandmark.svg';
}
async function resolveCode(code){
  const r=await fetch('https://spoo.me/stats/'+encodeURIComponent(code),{
    method:'POST',
    headers:{'Accept':'application/json','User-Agent':'Brick-and-Bond-WagStack-Demo/1.0'}
  });
  const text=String(await r.text()).trim();
  let json=null;try{json=JSON.parse(text)}catch{}
  if(!r.ok||!json)throw new Error('Could not resolve outreach link');
  return String(json.original_url||json.originalUrl||json.url||'').trim();
}
function parseBranding(raw){
  const u=new URL(raw);
  if(u.hostname!=='demo.brickand.bond')throw new Error('Invalid outreach target');
  const brand=String(u.searchParams.get('b')||u.searchParams.get('brand')||'Your Brand').trim().slice(0,80)||'Your Brand';
  const color=safeColor(u.searchParams.get('c')||u.searchParams.get('color'));
  const client=String(u.searchParams.get('i')||u.searchParams.get('client')||'prospect').trim().slice(0,80)||'prospect';
  const logo=String(u.searchParams.get('l')||u.searchParams.get('logo')||'').trim();
  return {brand,color,client,logo};
}
module.exports=async(req,res)=>{
  try{
    const code=String(first(req.query?.code)||'').trim();
    if(!/^[A-Za-z0-9._~%-]{2,64}$/.test(code))return res.status(404).send('Not found');
    const stored=await resolveCode(code);
    const {brand,color,client,logo}=parseBranding(stored);
    const demo=new URL('/',origin(req));
    demo.searchParams.set('brand',brand);
    demo.searchParams.set('color',color);
    demo.searchParams.set('client',client);
    if(logo)demo.searchParams.set('logo',logo);
    const img=origin(req)+'/api/demo-og?code='+encodeURIComponent(code);
    const title=brand+' — Pet care demo';
    const description='A private interactive pet-care website and app concept prepared for '+brand+'.';
    const canonical=origin(req)+'/s/'+encodeURIComponent(code);
    const html='<!doctype html><html><head><meta charset="utf-8">'+
      '<meta name="viewport" content="width=device-width,initial-scale=1">'+
      '<title>'+esc(title)+'</title>'+
      '<meta name="description" content="'+esc(description)+'">'+
      '<meta property="og:type" content="website">'+
      '<meta property="og:site_name" content="Brick & Bond">'+
      '<meta property="og:title" content="'+esc(title)+'">'+
      '<meta property="og:description" content="'+esc(description)+'">'+
      '<meta property="og:image" content="'+esc(img)+'">'+
      '<meta property="og:image:secure_url" content="'+esc(img)+'">'+
      '<meta property="og:image:type" content="image/png">'+
      '<meta property="og:image:width" content="1200">'+
      '<meta property="og:image:height" content="630">'+
      '<meta property="og:image:alt" content="'+esc(brand)+' branded demo preview">'+
      '<meta property="og:url" content="'+esc(canonical)+'">'+
      '<meta name="twitter:card" content="summary_large_image">'+
      '<meta name="twitter:title" content="'+esc(title)+'">'+
      '<meta name="twitter:description" content="'+esc(description)+'">'+
      '<meta name="twitter:image" content="'+esc(img)+'">'+
      '<meta name="theme-color" content="#'+color+'">'+
      '<meta name="robots" content="noindex,nofollow">'+
      '</head><body><p>Opening '+esc(brand)+' demo…</p><p><a href="'+esc(demo.href)+'">Continue to demo</a></p>'+
      '<script>location.replace('+JSON.stringify(demo.href)+')</script></body></html>';
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','public, max-age=300, s-maxage=300');
    res.setHeader('X-Robots-Tag','noindex, nofollow');
    return res.status(200).send(html);
  }catch(error){
    console.error('[demo-outreach]',error?.message||error);
    return res.status(404).send('This outreach link is unavailable.');
  }
};