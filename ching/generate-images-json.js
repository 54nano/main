const fs = require('fs');
const path = require('path');

const imageDir = path.join(__dirname, 'photo');
const outputFile = path.join(__dirname, 'images.json');

// 允許的圖片副檔名
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

fs.readdir(imageDir, (err, files) => {
  if (err) {
    console.error("讀取 photo 資料夾失敗：", err);
    return;
  }

  // 過濾出圖片檔案
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return allowedExtensions.includes(ext);
  });

  // 加上路徑 prefix
  const imagePaths = imageFiles.map(file => path.join('photo', file));

  // 寫入 JSON 檔案
  fs.writeFile(outputFile, JSON.stringify(imagePaths, null, 2), err => {
    if (err) {
      console.error("寫入 images.json 失敗：", err);
    } else {
      console.log(`✔ 成功產生 images.json，共 ${imagePaths.length} 張圖片`);
    }
  });
});
