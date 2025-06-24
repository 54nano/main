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

3.如要加入圖片說明，建立與圖片同名之.txt文字檔存於txt/子目錄下，將說明內容寫入文字檔內文中，
   如果沒有檔案，將以檔名前4個字+"年"為說明文字