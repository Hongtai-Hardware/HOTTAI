# 新增型号上线流程（HOTTAI 网站）

最后更新：2026-10-08
本地网站文件夹：`/Users/linkaixin/Documents/GitHub/melody`（对应线上仓库 `Hongtai-Hardware/HOTTAI`）
网站地址：https://hongtai-hardware.github.io/HOTTAI/

> 这个文件在公开仓库里，所以这里不写任何密钥、密码和私人链接。

## 一句话流程

飞书加产品 → 原图加水印 → 水印图放进网站文件夹 → 同步 → 生成预览页 → 提交并推送。

## 第一次使用前确认（只做一次）

- 网站文件夹里有 `feishu_secret.txt`（只写一行飞书应用密钥）。它已经在 `.gitignore` 里，不会被上传。
- 电脑上能运行 `python3` 和 `node`。
- GitHub 仓库 Settings → Pages 里：Source 选 "Deploy from a branch"，Branch 选 `main`，目录选 `/ (root)`。如果线上打开显示 "Site not found"，就是这里被关掉了，重新保存一次就行。

## 步骤

### 1. 原图放进 Google Drive
把这个型号的原图放进 Drive 里对应的文件夹（比如 `HINGE`）。原图一直留在 Drive，不要删。

### 2. 批量加水印
打开 Apps Script 项目 **"HOTTAI 批量水印工具"**（在 script.google.com 的项目列表里，打开它的网页应用）。

1. 输入 Drive 里的文件夹名（比如 `HINGE`），点"扫描文件夹"。它会连子文件夹一起扫描，自动跳过名字以 `_wm` 结尾的文件夹和文件。
2. 搜索并加载 LOGO（Drive 里的 `hottai_logo_big_phone.png`）。
3. 水印参数用你固定的那一组（Drive 里有一张"水印参数"截图）。
4. 点"开始加水印"。每张图保存成 `原名_wm.jpg`，放进 Drive 根目录的 `HINGE_wm`（保持子文件夹结构），原图不会被改动。重复运行会覆盖旧的水印图。

### 3. 水印图放进网站文件夹
把 `HINGE_wm` 里这个型号的水印图下载，放进网站文件夹的 `assets/网站代码/`，例如 `assets/H27/`。

- 建议命名 `01.jpg`、`02.jpg`、`03.jpg`…
- **排在最前面的图（`01.jpg`）会成为封面，也是聊天里链接预览的缩略图**，所以最好的那一张命名成 `01.jpg`。
- 支持的格式：jpg、jpeg、png、webp。

### 4. 飞书"产品主表"里新增型号
- "网站代码"必须是**字母 + 数字**，例如 `H35`。只写一个字母（比如单独一个 `H`）会被当作"还没准备好"，同步时被跳过。
- 首字母决定分类：

| 首字母 | 分类 | 首字母 | 分类 |
|---|---|---|---|
| H | 铰链 hinge | G | 气撑 gasspring |
| S | 滑轨 slide | D | 门吸 stopper |
| U | 隐藏滑轨 undermount | Y | 合页 doorhinge |
| T | 骑马抽 tandembox | P | 反弹器 pushcatcher |
| M | 其他五金 misc | | |

- 克重、克重单位、单价单位、订单数量单位也在这张表里填，同步后会显示在产品页的规格里。

### 5. 同步，生成 products.json
在网站文件夹里运行：

```
python3 sync_products_from_feishu.py
```

注意：
- 必须在第 3、4 步之后运行，否则新型号的图片列表是空的。
- 每次运行都是**清空重建**，只保留你手填过的视频字段（video）。不要手工改 `products.json`。
- 运行完检查有没有"没有图片"的型号：

```
python3 -c "import json;d=json.load(open('assets/data/products.json'));print([k for k,v in d.items() if not k.startswith('_') and not v.get('images')])"
```

输出的型号要么补图再同步一次，要么暂时不要给客户发它的链接。

### 5b. 生成链接预览页
仍然在网站文件夹里运行：

```
node generate-og-previews.js
```

- 它会在 `p/` 下给**每个有图片的型号**生成一个预览页（WhatsApp 靠它显示缩略图）。没有图片的型号不生成。
- 如果提示"有过期预览页"，确认不需要后运行 `node generate-og-previews.js --clean` 删除。
- **每次同步之后都要运行**，否则新型号发出去的单款链接会打不开。

### 6. 提交并推送
用 GitHub Desktop：Commit to main → Push origin。等一两分钟 GitHub Pages 更新。

上线检查（建议用浏览器的无痕窗口，避免记住上一个客户）：
1. 打开 `https://hongtai-hardware.github.io/HOTTAI/p/H35.html?cid=test123`，应该自动跳到产品页，地址栏里带着 `cid=test123`。
2. 过一会儿，Google 追踪表里应该出现编号 `test123` 的记录。

## 给客户发的链接

| 用途 | 链接格式 |
|---|---|
| **单款型号（最常用）** | `https://hongtai-hardware.github.io/HOTTAI/p/H27.html?cid=客户编号` |
| 某一类产品 | `https://hongtai-hardware.github.io/HOTTAI/category.html?type=hinge&cid=客户编号` |
| 官网首页 | `https://hongtai-hardware.github.io/HOTTAI/?cid=客户编号` |

- 单款链接在 WhatsApp 里，客户点开之前就能看到这一款的缩略图；微信聊天里通常只显示成一行链接。
- **cid 的算法**：客户电话只留数字 → MD5 → 取前 8 位。和 `wa_reply_bot.js` 里的算法完全一致，所以同一个客户在 WhatsApp 和微信里的编号相同。**不要改这个算法**，否则以前发出去的链接就认不出人了。
- 微信机器人通过工具 `get_tracking_link` 自动生成这些链接，客户编号由工具根据聊天名查飞书线索库得到。
- cid 怎么一路带下去：预览页 → 产品页、分类页 → 产品页，都会自动带上；其余页面（顶部导航等）由 `tracker.js` 在客户的浏览器里记住编号。

## 常见问题

- **双击 html 文件，页面显示"加载失败"**：正常现象，浏览器不允许直接打开的文件去读 `products.json`。要在网站文件夹里运行 `python3 -m http.server 8000`，再用浏览器打开 `http://localhost:8000/product.html?model=H27`。
- **线上显示 "Site not found"**：见上面"第一次使用前确认"里的 Pages 设置。
- **整个网站突然全坏**：多半是 `products.json` 格式错了（比如多了一个逗号）。同步脚本生成的不会有这个问题，手工改过才会。
- **WhatsApp 里没有出现缩略图**：先确认 `p/` 里有这一款的预览页、已经推送到线上；再看封面图是不是太大（WhatsApp 对预览图的大小有限制，几百 KB 以内比较稳妥）。
- **追踪表里出现"未知客户"**：链接里没有 cid，或者客户是在没带编号的页面直接打开的。

## 网站文件夹里重要的文件

- `index.html`、`category.html`、`product.html`、`factory.html`、`catalog-pdf.html`、`packaging.html`：各个页面
- `assets/data/products.json`：产品数据，由同步脚本生成
- `assets/<网站代码>/`：每个型号的图片
- `p/`：链接预览页，由 `generate-og-previews.js` 生成
- `tracker.js`：客户浏览追踪（打开、停留、滚动）。里面的追踪地址在线上是公开可见的，这是浏览器追踪的必然结果
- `sync_products_from_feishu.py`：从飞书同步产品数据
- `feishu_secret.txt`：飞书密钥，只在本地，不会上传
- `assets/data/packaging.json`：包装页的数据（更新方式待补充）
