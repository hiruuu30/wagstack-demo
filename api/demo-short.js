function reply(res,status,body){res.setHeader('Cache-Control','no-store');return res.status(status).json(body)}
function sameOrigin(req){try{const origin=req.headers.origin,host=req.headers.host;return Boolean(origin&&host&&new URL(origin).host===host)}catch{return false}}
function allowedTarget(raw,req){
  try{
    const u=new URL(raw),host=String(req.headers.host||'').split(':')[0].toLowerCase();
    return u.protocol==='https:'&&(u.hostname.toLowerCase()===host||u.hostname.toLowerCase()==='demo.brickand.bond')&&u.pathname==='/api/demo-share';
  }catch{return false}
}
async function spoo(raw){
  const out=await fetch('https://spoo.me/',{
    method:'POST',
    headers:{
      'Accept':'application/json',
      'Content-Type':'application/x-www-form-urlencoded',
      'User-Agent':'Brick-and-Bond-WagStack-Demo/1.0'
    },
    body:new URLSearchParams({url:raw,'block-bots':'false'})
  });
  const json=await out.json().catch(()=>null);
  if(out.ok&&json?.short_url){
    const u=new URL(String(json.short_url));
    if(u.protocol==='https:'&&u.hostname==='spoo.me'&&u.pathname.length>1)return u.href;
  }
  throw new Error(json?.message||json?.error||('Spoo returned '+out.status));
}
module.exports=async(req,res)=>{
  try{
    if(!['POST','GET'].includes(req.method)){res.setHeader('Allow','POST, GET');return reply(res,405,{error:'Method not allowed'})}
    if(req.method==='POST'&&!sameOrigin(req))return reply(res,403,{error:'Origin not allowed'});
    const raw=String(req.method==='GET'?(Array.isArray(req.query?.url)?req.query.url[0]:req.query?.url):req.body?.url||'').trim();
    if(!allowedTarget(raw,req))return reply(res,400,{error:'Invalid demo share link'});
    if(raw.length>10000)return reply(res,413,{error:'Logo is too large for an outreach link. Re-upload a simpler logo.'});
    const url=await spoo(raw);
    return reply(res,200,{url});
  }catch(error){
    console.error('[demo-short]',error?.message||error);
    return reply(res,502,{error:'Could not create the outreach link. Please try again.'});
  }
};