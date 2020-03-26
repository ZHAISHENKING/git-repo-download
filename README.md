# git-repo-download

> 前端「三剑客」解决github子目录下载问题

原理：

- 将目录中的 username repo branch rootPath提取出来
- 拼接`https://api.github.com/repos/{username}/{repo}/contents?ref={branch}` 
- axios.get 获取json
- 遍历目录，拼接`https://raw.githubusercontent.com/{username}/{repo}/{branch}/{dir}`放入待下载数组
- 使用JSZip库生成 blob（临时的类文件对象）,执行打包
- saveAs 库下载
