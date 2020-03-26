# git-repo-download
![](https://img.shields.io/github/repo-size/ZHAISHENKING/git-repo-download)
![](https://img.shields.io/github/license/ZHAISHENKING/git-repo-download)
> 前端「三剑客」解决github子目录下载问题

## 原理

- 将目录中的 username repo branch rootPath提取出来
- 拼接`https://api.github.com/repos/{username}/{repo}/contents?ref={branch}` 
- axios.get 获取json
- 遍历目录，拼接`https://raw.githubusercontent.com/{username}/{repo}/{branch}/{dir}`放入待下载队列
- 使用JSZip库生成 blob（临时的类文件对象）,执行打包
- saveAs 库下载

## 使用

1. 下载项目
2. 打开 `down.html`

## 显示预览
![](https://qiniu.s001.xin/pic/down.gif)
