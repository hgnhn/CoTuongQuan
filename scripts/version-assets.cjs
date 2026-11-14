// Chạy sau khi thêm nhật ký cập nhật để JS/CSS có URL mới trên GitHub Pages/CDN.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
require(path.join(root, 'js/changelog.js'));
const version = globalThis.CTQ.VERSION;
const filename = path.join(root, 'index.html');
const html = fs.readFileSync(filename, 'utf8').replace(/((?:src|href)="(?:js|css)\/[^"?]+)(?:\?v=[^"]*)?"/g, `$1?v=${version}"`);
fs.writeFileSync(filename, html);
console.log('Asset version: ' + version);
