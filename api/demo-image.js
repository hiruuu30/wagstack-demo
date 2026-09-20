const MAX_BYTES=4*1024*1024;
const ALLOWED_HOSTS=[
  'chatgpt.com',
  'openai.com',
  'oaiusercontent.com',
  'oaistatic.com',
  'blob.core.windows.net'
];

function allowedHost(host){
  const h=String(host||'').toLowerCase();
  return ALLOWED_HOSTS.some(base=>h===base||h.endsWith('.'+base));
}
function reply(res,status,body){res.setHeader('Cache-Control','no-store');return res.status(status).json(body)}

async function fetchImage(url,depth=0){
  if(depth>4)throw new Error('Too many redirects');
  const u=new URL(url);
  if(u.protocol!=='https:'||!allowedHost(u.hostname))throw new Error('Unsupported image host');
  const r=await fetch(u.href,{
    redirect:'manual',
    headers:{
      'Accept':'image/avif,image/webp,image/png,image/jpeg,image/svg+xml,image/*;q=0.8,*/*;q=0.1',
      'User-Agent':'Mozilla/5.0 (compatible; WagStackDemo/1.0)',
      'Referer':'https://chatgpt.com/'
    }
  });
  if(r.status>=300&&r.status<400){
    const loc=r.headers.get('location');
    if(!loc)throw new Error('Invalid redirect');
    return fetchImage(new URL(loc,u).href,depth+1);
  }
  if(!r.ok)throw new Error('Image source unavailable');
  const type=(r.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
  if(!type.startsWith('image/'))throw new Error('URL is not a direct image');
  const length=Number(r.headers.get('content-length')||0);
  if(length&&length>MAX_BYTES)throw new Error('Image is too large');
  const buf=Buffer.from(await r.arrayBuffer());
  if(!buf.length||buf.length>MAX_BYTES)throw new Error('Image is too large');
  return {buf,type};
}

module.exports=async(req,res)=>{
  try{
    if(req.method!=='GET'){res.setHeader('Allow','GET');return reply(res,405,{error:'Method not allowed'})}
    const raw=String(req.query?.url||'').trim();
    if(!raw)return reply(res,400,{error:'Missing image URL'});
    const {buf,type}=await fetchImage(raw);
    res.setHeader('Content-Type',type);
    res.setHeader('Content-Length',String(buf.length));
    res.setHeader('Cache-Control','public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');
    res.setHeader('X-Content-Type-Options','nosniff');
    return res.status(200).send(buf);
  }catch(error){
    console.error('[demo-image]',error?.message||error);
    return reply(res,404,{error:error?.message||'Image unavailable'});
  }
};