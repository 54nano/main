const fs = require('fs');
const path = require('path');

const photoDir = path.join(__dirname, 'photo');
const outputFile = path.join(__dirname, 'images.json');
const allowedExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

fs.readdir(photoDir, (err, files) => {
  if (err) {
    console.error('讀取目錄錯誤：', err);
    return;
  }

  const imageFiles = files
    .filter(file => allowedExt.includes(path.extname(file).toLowerCase()))
    .map(file => `photo/${file}`)
    .sort();

  fs.writeFile(outputFile, JSON.stringify(imageFiles, null, 2), err => {
    if (err) {
      console.error('寫入檔案失敗：', err);
    } else {
      console.log(`✅ 已產生 ${outputFile}，共 ${imageFiles.length} 張圖。`);
    }
  });
});
