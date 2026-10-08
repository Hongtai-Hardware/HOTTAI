/**
 * generate-og-previews.js —— 生成"链接预览专用"小页面
 * ---------------------------------------------
 * 为什么需要它：product.html 是打开后靠 JS 读 products.json 才显示内容的，
 * WhatsApp 抓取链接预览图的程序不会运行 JS，只认写在 HTML <head> 里的标签。
 * 所以每个型号在 /p/ 文件夹下生成一个几行的小页面：
 *   - 平台的爬虫读它的标题和缩略图（客户点开之前，聊天里就能看到这一款的图）
 *   - 真人点开后，浏览器会立刻跳转到真正的 product.html，并把 ?cid=... 一起带过去
 *
 * 用法（在网站文件夹最外层，也就是能看到 index.html 的那一层）：
 *   node generate-og-previews.js           生成/更新预览页，并列出过期文件（不会删除）
 *   node generate-og-previews.js --clean   同上，并把过期的预览页删除
 *
 * 什么时候要运行：每次运行完 sync_products_from_feishu.py 之后。
 *
 * 给客户的单款链接格式：
 *   https://hongtai-hardware.github.io/HOTTAI/p/H27.html?cid=客户编号
 *
 * 注意：
 *   - 只给"有图片"的型号生成预览页（没图的型号没有缩略图可显示，也不该发给客户）
 *   - 缩略图用的是该型号 images 里的第一张，所以最好的那张图要命名成 01.jpg
 */
const fs = require('fs');
const path = require('path');

const SITE_ROOT = 'https://hongtai-hardware.github.io/HOTTAI';
const DATA_PATH = path.join(__dirname, 'assets', 'data', 'products.json');
const OUT_DIR = path.join(__dirname, 'p');
const CLEAN = process.argv.includes('--clean');

let data;
try {
  data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
} catch (e) {
  console.error('❌ 读取 assets/data/products.json 失败：' + e.message);
  process.exit(1);
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

const made = new Set();
const noImage = [];
const badKey = [];

for (const [key, model] of Object.entries(data)) {
  if (key.startsWith('_')) continue; // 跳过 "_说明" 那一条

  if (!/^[A-Za-z0-9_-]+$/.test(key)) { badKey.push(key); continue; }
  const images = Array.isArray(model.images) ? model.images : [];
  if (images.length === 0) { noImage.push(key); continue; }

  const title = escapeHtml(model.name || key);
  const desc = escapeHtml(model.tagline || 'Hongtai Precision Hardware');
  const imageUrl = `${SITE_ROOT}/assets/${encodeURIComponent(key)}/${encodeURIComponent(images[0])}`;
  const target = `../product.html?model=${encodeURIComponent(key)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${title} — Hongtai Precision Hardware</title>
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${imageUrl}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<noscript><meta http-equiv="refresh" content="0; url=${target}"></noscript>
<script>
  // 真人（浏览器会运行 JS）：跳到真正的产品页，并把 ?cid=... 等参数原样带过去
  var qs = window.location.search;
  window.location.replace('${target}' + (qs ? '&' + qs.slice(1) : ''));
</script>
</head>
<body>
  <p>Redirecting to <a href="${target}">${title}</a>…</p>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT_DIR, `${key}.html`), html, 'utf8');
  made.add(`${key}.html`);
}

// 过期文件：p/ 里有、但这次没有生成的 .html（比如旧格式的 H001.html，或者已经没图的型号）
const stale = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.html') && !made.has(f));

console.log(`✅ 生成了 ${made.size} 个预览页，在 p/ 文件夹下`);
if (noImage.length) {
  console.log(`⚠️ ${noImage.length} 个型号没有图片，没有生成预览页：${noImage.join(', ')}`);
}
if (badKey.length) {
  console.log(`⚠️ 这些型号编号含有特殊字符，已跳过：${badKey.join(', ')}`);
}
if (stale.length) {
  if (CLEAN) {
    stale.forEach((f) => fs.unlinkSync(path.join(OUT_DIR, f)));
    console.log(`🧹 已删除 ${stale.length} 个过期预览页：${stale.join(', ')}`);
  } else {
    console.log(`ℹ️ p/ 里有 ${stale.length} 个过期预览页：${stale.join(', ')}`);
    console.log('   确认不需要后，运行 node generate-og-previews.js --clean 删除它们');
  }
}
