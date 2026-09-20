function reply(res,status,body){res.setHeader('Cache-Control','no-store');return res.status(status).json(body)}
function sameOrigin(req){try{const origin=req.headers.origin,host=req.headers.host;return Boolean(origin&&host&&new URL(origin).host===host)}catch{return false}}
function allowedShareTarget(u,req){
  const h=u.hostname.toLowerCase();
  const requestHost=String(req.headers.host||'').split(':')[0].toLowerCase();
  return u.protocol==='https:'&&(h===requestHost||h==='demo.brickand.bond'||h.endsWith('.vercel.app'));
}

async function shortenCleanUri(target){
  const out=await fetch('https://cleanuri.com/api/v1/shorten',{
    method:'POST',
    headers:{
      'Content-Type':'application/x-www-form-urlencoded',
      'Accept':'application/json',
      'User-Agent':'WagStack Demo Link Shortener/1.0'
    },
    body:new URLSearchParams({url:target.href})
  });
  const json=await out.json().catch(()=>null);
  if(out.ok&&json?.result_url){
    const u=new URL(String(json.result_url));
    if(u.protocol==='https:'&&u.hostname==='cleanuri.com'&&u.pathname.length>1)return u.href;
  }
  throw new Error(json?.error||`CleanURI returned ${out.status}`);
}

async function shortenIsGd(host,target){
  const body=new URLSearchParams({format:'simple',url:target.href});
  const out=await fetch(`https://${host}/create.php`,{
    method:'POST',
    headers:{
      'Content-Type':'application/x-www-form-urlencoded',
      'Accept':'text/plain,*/*;q=0.8',
      'User-Agent':'WagStack Demo Link Shortener/1.0'
    },
    body
  });
  const raw=String(await out.text()).trim();
  if(out.ok){
    try{
      const u=new URL(raw);
      if(u.protocol==='https:'&&(u.hostname==='is.gd'||u.hostname==='v.gd')&&u.pathname.length>1)return u.href;
    }catch{}
  }
  throw new Error(raw||`Shortener returned ${out.status}`);
}

module.exports=async(req,res)=>{
  try{
    if(req.method!=='POST'){res.setHeader('Allow','POST');return reply(res,405,{error:'Method not allowed'})}
    if(!sameOrigin(req))return reply(res,403,{error:'Origin not allowed'});
    const raw=String(req.body?.url||'').trim();
    const kind=req.body?.kind==='image'?'image':'share';
    if(!raw)return reply(res,400,{error:'Missing URL'});
    if(raw.length>12000)return reply(res,413,{error:'URL is too large to shorten'});
    const target=new URL(raw);
    if(target.protocol!=='https:')return reply(res,400,{error:'Only HTTPS URLs can be shortened'});
    if(kind==='share'&&!allowedShareTarget(target,req))return reply(res,400,{error:'Invalid share link'});

    for(const attempt of [
      ()=>shortenCleanUri(target),
      ()=>shortenIsGd('is.gd',target),
      ()=>shortenIsGd('v.gd',target)
    ]){
      try{
        const short=await attempt();
        return reply(res,200,{url:short});
      }catch(error){console.warn('[demo-short]',error?.message||error)}
    }
    return reply(res,502,{error:'Short-link service is temporarily unavailable'});
  }catch(error){
    console.error('[demo-short]',error?.message||error);
    return reply(res,502,{error:'Could not create short link'});
  }
};