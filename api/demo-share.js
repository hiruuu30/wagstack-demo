function first(v){return Array.isArray(v)?v[0]:v}
function esc(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function safeColor(v){const s=String(v||'').replace(/^#/,'');return /^[0-9a-fA-F]{6}$/.test(s)?s:'0B1E3F'}
function origin(req){const proto=String(req.headers['x-forwarded-proto']||'https').split(',')[0].trim();return proto+'://'+req.headers.host}
function imageUrl(req,logo){
  const raw=String(logo||'').trim();
  const base=origin(req);
  if(/^data:image\//i.test(raw))return base+'/api/demo-og-logo?d='+encodeURIComponent(raw);
  if(/^https:\/\//i.test(raw)){
    try{
      const u=new URL(raw),h=u.hostname.toLowerCase();
      const proxy=h==='chatgpt.com'||h.endsWith('.chatgpt.com')||h==='openai.com'||h.endsWith('.openai.com')||h==='oaiusercontent.com'||h.endsWith('.oaiusercontent.com')||h==='oaistatic.com'||h.endsWith('.oaistatic.com')||h==='blob.core.windows.net'||h.endsWith('.blob.core.windows.net');
      return proxy?base+'/api/demo-image?url='+encodeURIComponent(raw):raw;
    }catch{}
  }
  return base+'/assets/biscuit-avatar.png';
}

module.exports=(req,res)=>{
  const brand=String(first(req.query?.b)||'Your Brand').trim().slice(0,80)||'Your Brand';
  const color=safeColor(first(req.query?.c));
  const client=String(first(req.query?.i)||'prospect').trim().slice(0,80)||'prospect';
  const logo=String(first(req.query?.l)||'').trim();
  const exp=Number(first(req.query?.exp)||0);
  // Links created before expiry support was added have no exp value and remain valid.
  if(Number.isFinite(exp)&&exp>0&&exp<=Date.now())return res.status(410).send('This demo link has expired.');
  const demo=new URL('/',origin(req));
  demo.searchParams.set('brand',brand);
  demo.searchParams.set('color',color);
  demo.searchParams.set('client',client);
  if(Number.isFinite(exp)&&exp>0)demo.searchParams.set('exp',String(exp));
  if(logo)demo.searchParams.set('logo',logo);

  const img=imageUrl(req,logo);
  const title=brand+' — Pet care demo';
  const description='A private interactive pet-care website and app concept prepared for '+brand+'.';
  const canonical=origin(req)+req.url;
  const html='<!doctype html><html><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>'+esc(title)+'</title>'+
    '<meta name="description" content="'+esc(description)+'">'+
    '<meta property="og:type" content="website">'+
    '<meta property="og:site_name" content="Brick & Bond">'+
    '<meta property="og:title" content="'+esc(title)+'">'+
    '<meta property="og:description" content="'+esc(description)+'">'+
    '<meta property="og:image" content="'+esc(img)+'">'+
    '<meta property="og:url" content="'+esc(canonical)+'">'+
    '<meta name="twitter:card" content="summary_large_image">'+
    '<meta name="twitter:title" content="'+esc(title)+'">'+
    '<meta name="twitter:description" content="'+esc(description)+'">'+
    '<meta name="twitter:image" content="'+esc(img)+'">'+
    '<meta name="theme-color" content="#'+color+'">'+
    '<meta name="robots" content="noindex,nofollow">'+
    '<meta http-equiv="refresh" content="0;url='+esc(demo.href)+'">'+
    '</head><body><p>Opening '+esc(brand)+' demo…</p><p><a href="'+esc(demo.href)+'">Continue to demo</a></p>'+
    '<script>location.replace('+JSON.stringify(demo.href)+')</script></body></html>';
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=300, s-maxage=300');
  res.setHeader('X-Robots-Tag','noindex, nofollow');
  return res.status(200).send(html);
};