# [左撇子のGen](https://lefty.blog) 部落格

## 說明
確認環境與工具都準備好之後，按照啟用流程就可以在本地端模擬專案囉。

### 環境設置
1. 安裝 [Node.js](https://nodejs.org)
```shell
# 輸入指令，若有顯示版本，代表安裝成功
$ node --version
```
2. 安裝 [Git](https://git-scm.com)
```shell
# 輸入指令，若有顯示版本，代表安裝成功
$ git --version
```
3. 安裝全域 gulp
```shell
# macOS 可能需要在前面加上 "sudo"
$ npm install gulp-cli -g
```
4. 安裝全域 firebase
```shell
# macOS 可能需要在前面加上 "sudo"
$ npm install firebase-tools -g
```
5. 開通 firebase 產品權限、帳戶權限
```shell
-到 firebase、algoria 尋找 .runtimeconfig.json.example 上的環境變數
-新增 .runtimeconfig.json 並填入對應內容
```

### 啟用流程
1. 前置作業
```shell
# 開啟終端機，輸入以下指令
$ cd 要存放專案的地方
$ git clone 專案網址
$ cd 專案資料夾
$ npm install
$ cd functions
$ npm install
$ cd ..
```
2. 編譯、打包靜態檔案
```shell
$ gulp build
```
3. 開啟本地端伺服器
```shell
$ firebase serve
```
4. 模擬專案
```shell
在瀏覽器輸入 localhost:5000
```