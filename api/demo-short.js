function reply(res,status,body){res.setHeader('Cache-Control','no-store');return res.status(status).json(body)}
function sameOrigin(req){try{const origin=req.headers.origin,host=req.headers.host;return Boolean(origin&&host&&new URL(origin).host===host)}catch{return false}}

module.exports=async(req,res)=>{
  try{
    if(req.method!=='POST'){res.setHeader('Allow','POST');return reply(res,405,{error:'Method not allowed'})}
    if(!sameOrigin(req))return reply(res,403,{error:'Origin not allowed'});
    const raw=String(req.body?.url||'').trim();
    if(!raw||raw.length>4900)return reply(res,400,{error:'Share link is too long to shorten'});
    const target=new URL(raw);
    if(target.protocol!=='https:'||target.host!==req.headers.host)return reply(res,400,{error:'Invalid share link'});
    const body=new URLSearchParams({format:'simple',url:target.href});
    const out=await fetch('https://is.gd/create.php',{
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':'WagStack Demo Link Shortener/1.0'},
      body
    });
    const short=String(await out.text()).trim();
    if(!out.ok||!/^https:\/\/is\.gd\/[A-Za-z0-9_]+$/.test(short))return reply(res,502,{error:'Could not shorten link'});
    return reply(res,200,{url:short});
  }catch(error){
    console.error('[demo-short]',error?.message||error);
    return reply(res,502,{error:'Could not shorten link'});
  }
};