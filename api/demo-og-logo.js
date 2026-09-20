const MAX=120*1024;
function fail(res,status,msg){res.setHeader('Cache-Control','no-store');return res.status(status).send(msg)}
module.exports=(req,res)=>{
  try{
    const raw=String(Array.isArray(req.query?.d)?req.query.d[0]:req.query?.d||'');
    const m=raw.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/i);
    if(!m)return fail(res,400,'Invalid image');
    const buf=Buffer.from(m[2],'base64');
    if(!buf.length||buf.length>MAX)return fail(res,413,'Image too large');
    res.setHeader('Content-Type',m[1].toLowerCase());
    res.setHeader('Content-Length',String(buf.length));
    res.setHeader('Cache-Control','public, max-age=604800, s-maxage=604800, immutable');
    res.setHeader('X-Content-Type-Options','nosniff');
    return res.status(200).send(buf);
  }catch{return fail(res,400,'Invalid image')}
};