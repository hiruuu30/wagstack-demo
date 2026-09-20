const PAGE='https://ibb.co/xZNhNzH';

async function fetchDirectImage(){
  const page=await fetch(PAGE,{
    redirect:'follow',
    headers:{
      'Accept':'text/html,application/xhtml+xml',
      'User-Agent':'Mozilla/5.0 (compatible; BrickAndBondDemo/1.0)'
    }
  });
  if(!page.ok)throw new Error('Image page unavailable');
  const html=await page.text();
  const m=html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    ||html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if(!m?.[1])throw new Error('Direct image URL not found');
  const direct=m[1].replace(/&amp;/g,'&');
  const img=await fetch(direct,{
    redirect:'follow',
    headers:{
      'Accept':'image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8,*/*;q=0.1',
      'User-Agent':'Mozilla/5.0 (compatible; BrickAndBondDemo/1.0)',
      'Referer':PAGE
    }
  });
  if(!img.ok)throw new Error('Direct image unavailable');
  const type=(img.headers.get('content-type')||'image/jpeg').split(';')[0];
  if(!type.startsWith('image/'))throw new Error('Invalid image response');
  const buf=Buffer.from(await img.arrayBuffer());
  if(!buf.length||buf.length>5*1024*1024)throw new Error('Invalid image size');
  return {buf,type};
}

module.exports=async(req,res)=>{
  try{
    if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).send('Method not allowed')}
    const {buf,type}=await fetchDirectImage();
    res.setHeader('Content-Type',type);
    res.setHeader('Content-Length',String(buf.length));
    res.setHeader('Cache-Control','public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');
    res.setHeader('X-Content-Type-Options','nosniff');
    return res.status(200).send(buf);
  }catch(error){
    console.error('[alex-eala-photo]',error?.message||error);
    return res.status(404).send('Image unavailable');
  }
};