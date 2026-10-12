import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync('dist/index.html','utf8');
const assets=[...html.matchAll(/(?:src|href)="(\/sistema-cnpj\/[^"?#]+)"/g)].map(x=>x[1]);
assert.ok(assets.some(x=>x.endsWith('.js')));assert.ok(assets.some(x=>x.endsWith('.css')));assert.ok(assets.some(x=>x.endsWith('.svg')));
for(const url of assets)assert.ok(fs.existsSync('dist/'+url.slice('/sistema-cnpj/'.length)),url);
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(dir+'/'+x.name):[dir+'/'+x.name]);}
for(const file of walk('dist')){
 assert.ok(!/\.(map|sql|zip|env|log)$/i.test(file),file);
 if(!/\.(js|css|html|svg|json)$/.test(file))continue;
 const text=fs.readFileSync(file,'utf8').replace(/(["'])http:\/\/127\.0\.0\.1:3333\1/g, '"API_LOCAL_AUTORIZADA"');
 for(const pattern of [/https?:\/\/(?:127\.0\.0\.1|localhost|\[::1\])/i,/postgres(?:ql)?:\/\//i,/(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,})/,/-----BEGIN .*PRIVATE KEY-----/,/demoSource|demoRows/])assert.ok(!pattern.test(text),`${file}: conteúdo não publicável`);
}
console.log('PASS: base path, JS/CSS/favicon, arquivos estáticos e auditoria do bundle');
