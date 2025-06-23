liching藝廊
1.先讀取photo/下的圖片檔案列表
  A.本地電腦需先安裝Node.js（如果尚未安裝，到 https://nodejs.org 安裝最新版 Node.js)
  B.執行【產生圖片清單.bat】(generateImageList.js需在同一目錄)
  C.就會自動產生或更新 images.json 檔案。供主程式(liching藝廊.html)讀取

2.檢查images.json內容應為：
[   
   "photo/2023001.jpg",
   "photo/2023001.jpg",
   "photo/2023001.jpg"
]