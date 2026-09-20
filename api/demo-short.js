function reply(res,status,body){res.setHeader('Cache-Control','no-store');return res.status(status).json(body)}
function sameOrigin(req){try{const origin=req.headers.origin,host=req.headers.host;return Boolean(origin&&host&&new URL(origin).host===host)}catch{return false}}
function allowedTarget(u,req){
  const h=u.hostname.toLowerCase();
  const requestHost=String(req.headers.host||'').split(':')[0].toLowerCase();
  return u.protocol==='https:'&&(h===requestHost||h==='demo.brickand.bond'||h.endsWith('.vercel.app'));
}
async function shortenWith(host,target){
  const body=new URLSearchParams({format:'json',url:target.href});
  const out=await fetch(`https://${host}/create.php`,{
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':'WagStack Demo Link Shortener/1.0'},
    body
  });
  const json=await out.json().catch(()=>null);
  if(out.ok&&json?.shorturl&&/^https:\/\/(?:is|v)\.gd\/[A-Za-z0-9_]+$/.test(json.shorturl))return json.shorturl;
  throw new Error(json?.errormessage||`Shortener returned ${out.status}`);
}

module.exports=async(req,res)=>{
  try{
    if(req.method!=='POST'){res.setHeader('Allow','POST');return reply(res,405,{error:'Method not allowed'})}
    if(!sameOrigin(req))return reply(res,403,{error:'Origin not allowed'});
    const raw=String(req.body?.url||'').trim();
    if(!raw)return reply(res,400,{error:'Missing share link'});
    if(raw.length>5000)return reply(res,413,{error:'Branding link is still too large to shorten. Re-upload the logo and try again.'});
    const target=new URL(raw);
    if(!allowedTarget(target,req))return reply(res,400,{error:'Invalid share link'});
    for(const host of ['is.gd','v.gd']){
      try{
        const short=await shortenWith(host,target);
        return reply(res,200,{url:short});
      }catch(error){console.warn('[demo-short]',host,error?.message||error)}
    }
    return reply(res,502,{error:'Short-link service is temporarily unavailable'});
  }catch(error){
    console.error('[demo-short]',error?.message||error);
    return reply(res,502,{error:'Could not create short link'});
  }
};