// Firebase chỉ đóng gói thư mục server: sao chép đúng bộ luật đã deploy cùng client.
const fs = require('node:fs'), path = require('node:path');
const dest = path.join(__dirname, 'shared'); fs.mkdirSync(dest, { recursive: true });
for (const name of ['data.js', 'expansion.js', 'engine.js', 'mastery.js']) fs.copyFileSync(path.join(__dirname, '..', 'js', name), path.join(dest, name));
console.log('Prepared shared mastery rules');
