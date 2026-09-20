const {put}=require('@vercel/blob');
const {createHash}=require('node:crypto');

function reply(res,status,body){res.setHeader('Cache-Control','no-store');return res.status(status).json(body)}
function sameOrigin(req){try{const origin=req.headers.origin,host=req.headers.host;return Boolean(origin&&host&&new URL(origin).host===host)}catch{return false}}
function safe(v,max=80){return String(v||'').trim().slice(0,max).replace(/[^a-zA-Z0-9_-]/g,'')}

module.exports=async(req,res)=>{
  try{
    if(req.method!=='POST'){res.setHeader('Allow','POST');return reply(res,405,{error:'Method not allowed'})}
    if(!sameOrigin(req))return reply(res,403,{error:'Origin not allowed'});
    const token=process.env.DEMO_LOGO_BLOB_READ_WRITE_TOKEN||process.env.BLOB_READ_WRITE_TOKEN;
    const {data,type,name,client}=req.body||{};
    if(typeof data!=='string'||typeof type!=='string')return reply(res,400,{error:'Invalid image'});
    const allowed=new Set(['image/png','image/jpeg','image/webp','image/svg+xml']);
    if(!allowed.has(type))return reply(res,415,{error:'Use PNG, JPG, WebP or SVG'});
    const match=data.match(/^data:image\/(?:png|jpeg|webp|svg\+xml);base64,(.+)$/i);
    if(!match)return reply(res,400,{error:'Invalid image data'});
    const buf=Buffer.from(match[1],'base64');
    if(!buf.length||buf.length>2*1024*1024)return reply(res,413,{error:'Logo must be 2 MB or smaller'});
    const ext=type==='image/jpeg'?'jpg':type==='image/svg+xml'?'svg':type.split('/')[1];
    const hash=createHash('sha256').update(buf).digest('hex').slice(0,16);
    const base=safe(client)||'general';
    const stem=safe(String(name||'logo').replace(/\.[^.]+$/,''),40)||'logo';
    if(token){
      try{
        const blob=await put(`demo-logos/${base}/${stem}-${hash}.${ext}`,buf,{
          access:'public',
          contentType:type,
          addRandomSuffix:false,
          allowOverwrite:true,
          token
        });
        return reply(res,201,{url:blob.url,hosted:true});
      }catch(error){
        console.warn('[demo-logo] Blob unavailable, using embedded fallback',error?.message||error);
      }
    }
    // Compatibility fallback: never block branding when Blob is absent or misconfigured.
    // New clients compact this before sharing; older cached clients can still use it directly.
    return reply(res,201,{url:data,embedded:true});
  }catch(error){
    console.error('[demo-logo]',error);
    return reply(res,503,{error:'Logo upload failed'});
  }
};