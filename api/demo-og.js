const sharp=require('sharp');

function first(v){return Array.isArray(v)?v[0]:v}
function esc(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]))}
function safeColor(v){const s=String(v||'').replace(/^#/,'');return /^[0-9a-fA-F]{6}$/.test(s)?'#'+s:'#ff7a1a'}

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
  return {
    brand:String(u.searchParams.get('b')||u.searchParams.get('brand')||'Your Brand').trim().slice(0,80)||'Your Brand',
    color:safeColor(u.searchParams.get('c')||u.searchParams.get('color')),
    logo:String(u.searchParams.get('l')||u.searchParams.get('logo')||'').trim()
  };
}

async function logoBuffer(raw){
  if(/^data:image\/(?:png|jpeg|webp);base64,/i.test(raw)){
    const m=raw.match(/^data:image\/(?:png|jpeg|webp);base64,(.+)$/i);
    if(!m)throw new Error('Invalid embedded logo');
    const b=Buffer.from(m[1],'base64');
    if(!b.length||b.length>1024*1024)throw new Error('Logo too large');
    return b;
  }
  if(/^https:\/\//i.test(raw)){
    const u=new URL(raw),h=u.hostname.toLowerCase();
    const headers={'Accept':'image/*','User-Agent':'Mozilla/5.0 (compatible; BrickAndBondPreview/1.0)'};
    if(h==='chatgpt.com'||h.endsWith('.chatgpt.com')||h==='openai.com'||h.endsWith('.openai.com')||h==='oaiusercontent.com'||h.endsWith('.oaiusercontent.com')||h==='oaistatic.com'||h.endsWith('.oaistatic.com'))headers.Referer='https://chatgpt.com/';
    const r=await fetch(raw,{headers,redirect:'follow'});
    if(!r.ok)throw new Error('Logo source unavailable');
    const b=Buffer.from(await r.arrayBuffer());
    if(!b.length||b.length>2*1024*1024)throw new Error('Logo too large');
    return b;
  }
  throw new Error('Missing logo');
}

function titleLines(brand){
  const words=brand.split(/\s+/).filter(Boolean);
  const lines=[];let line='';
  for(const word of words){
    const next=line?line+' '+word:word;
    if(next.length>28&&line){lines.push(line);line=word}else line=next;
  }
  if(line)lines.push(line);
  return lines.slice(0,2);
}

module.exports=async(req,res)=>{
  try{
    const code=String(first(req.query?.code)||'').trim();
    if(!/^[A-Za-z0-9._~%-]{2,64}$/.test(code))return res.status(404).send('Not found');
    const raw=await resolveCode(code);
    const {brand,color,logo}=parseBranding(raw);
    let logoPng=null;
    try{
      const source=await logoBuffer(logo);
      logoPng=await sharp(source,{failOn:'none'}).resize(240,240,{fit:'contain',withoutEnlargement:false}).png().toBuffer();
    }catch{}

    const lines=titleLines(brand);
    const y1=logoPng?398:286;
    const lineGap=66;
    const nameSvg=Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f8fafc"/>
          <stop offset="1" stop-color="#eef2f7"/>
        </linearGradient>
        <radialGradient id="a" cx="84%" cy="12%" r="70%">
          <stop offset="0" stop-color="${color}" stop-opacity=".18"/>
          <stop offset="1" stop-color="${color}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="630" rx="44" fill="url(#g)"/>
      <rect width="1200" height="630" rx="44" fill="url(#a)"/>
      <text x="600" y="${y1}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="54" font-weight="700" fill="#0b1e3f">${esc(lines[0]||brand)}</text>
      ${lines[1]?`<text x="600" y="${y1+lineGap}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="54" font-weight="700" fill="#0b1e3f">${esc(lines[1])}</text>`:''}
      <text x="600" y="${lines[1]?y1+128:y1+80}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="500" fill="#526070">Private interactive pet-care demo</text>
      <text x="600" y="584" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="600" fill="#7b8794">demo.brickand.bond</text>
    </svg>`);

    const base=sharp(nameSvg).png();
    const composites=[];
    if(logoPng)composites.push({input:logoPng,top:88,left:480});
    const out=await base.composite(composites).png({compressionLevel:9}).toBuffer();

    res.setHeader('Content-Type','image/png');
    res.setHeader('Content-Length',String(out.length));
    res.setHeader('Cache-Control','public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');
    res.setHeader('X-Content-Type-Options','nosniff');
    return res.status(200).send(out);
  }catch(error){
    console.error('[demo-og]',error?.message||error);
    return res.status(404).send('Preview unavailable');
  }
};