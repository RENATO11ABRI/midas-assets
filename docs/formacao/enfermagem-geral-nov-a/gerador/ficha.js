#!/usr/bin/env node
// Ferramenta da Secretaria: cifra/decifra fichas de estudante com os MESMOS parâmetros do portal.
//   node ficha.js gerar [n]                         -> imprime n códigos de acesso
//   node ficha.js cifrar <código> <ficha.json>      -> imprime o documento cifrado (JSON) para write_db em alunos/<id>
//   node ficha.js decifrar <código> <doc.json>      -> imprime a ficha em claro
//   node ficha.js id <código>                       -> imprime o id do documento
const fs=require('fs'); const subtle=globalThis.crypto.subtle; const getRandomValues=a=>globalThis.crypto.getRandomValues(a);
const enc=new TextEncoder(), dec=new TextDecoder();
const b64=u=>Buffer.from(u).toString('base64'), unb64=s=>new Uint8Array(Buffer.from(s,'base64'));
const normCod=c=>String(c||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
async function idDe(cod){const h=await subtle.digest('SHA-256',enc.encode('nova-a:'+normCod(cod)));return [...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function chaveDe(cod,salt){const km=await subtle.importKey('raw',enc.encode(normCod(cod)),'PBKDF2',false,['deriveKey']);return subtle.deriveKey({name:'PBKDF2',salt,iterations:120000,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function cifrar(cod,obj){const salt=getRandomValues(new Uint8Array(16)),iv=getRandomValues(new Uint8Array(12));const k=await chaveDe(cod,salt);const ct=await subtle.encrypt({name:'AES-GCM',iv},k,enc.encode(JSON.stringify(obj)));return {v:1,salt:b64(salt),iv:b64(iv),ct:b64(ct),actualizado:new Date().toISOString()}}
async function decifrar(cod,doc){const k=await chaveDe(cod,unb64(doc.salt));const pt=await subtle.decrypt({name:'AES-GCM',iv:unb64(doc.iv)},k,unb64(doc.ct));return JSON.parse(dec.decode(pt))}
function gerarCodigo(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const r=getRandomValues(new Uint8Array(8));const s=[...r].map(b=>A[b%A.length]).join('');return `NOVA-${s.slice(0,4)}-${s.slice(4)}`}
(async()=>{const [cmd,a,b]=process.argv.slice(2);
 if(cmd==='gerar'){const n=+a||1;const seen=new Set();while(seen.size<n)seen.add(gerarCodigo());console.log([...seen].join('\n'));return}
 if(cmd==='id'){console.log(await idDe(a));return}
 if(cmd==='cifrar'){const f=JSON.parse(fs.readFileSync(b,'utf8'));f.actualizado=new Date().toISOString();const doc=await cifrar(a,f);doc.nome_iniciais=(f.nome||'').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();console.log(JSON.stringify({id:await idDe(a),doc},null,1));return}
 if(cmd==='decifrar'){const d=JSON.parse(fs.readFileSync(b,'utf8'));console.log(JSON.stringify(await decifrar(a,d.doc||d),null,1));return}
 console.error('uso: node ficha.js gerar [n] | id <código> | cifrar <código> <ficha.json> | decifrar <código> <doc.json>');process.exit(1)})();
