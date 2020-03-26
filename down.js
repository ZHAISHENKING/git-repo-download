/* eslint-disable */
function down() {
  let repoInfo = {};

  /**
   * 解析信息
   * @param parameters
   * @returns {{}}
   */
  function parseInfo(parameters) {
    // https://github.com/{username}/{repo}/tree/{branch}/{rootDir}
    let repoPath = new URL(parameters.url).pathname;
    let splitPath = repoPath.split('/');
    let info = {};

    // 拆分 author repo branch rootPath
    info.author = splitPath[1];
    info.repository = splitPath[2];
    info.branch = splitPath[4];

    info.rootName = splitPath[splitPath.length - 1];
    if (!!splitPath[4]) {
      info.resPath = repoPath.substring(
        repoPath.indexOf(splitPath[4]) + splitPath[4].length + 1
      );
    }

    // https://api.github.com/repos/{username}/{repo}/contents?ref={branch}
    info.urlPrefix = 'https://api.github.com/repos/' +
      info.author + '/' + info.repository + '/contents/';
    info.urlPostfix = '?ref=' + info.branch;

    // 确定下载资源地址
    if (!parameters.fileName || parameters.fileName === '') {
      info.downloadFileName = info.rootName;
    } else {
      info.downloadFileName = parameters.fileName;
    }

    if (parameters.rootDirectory === 'false') {
      info.rootDirectoryName = '';

    } else if (!parameters.rootDirectory || parameters.rootDirectory === '' ||
      parameters.rootDirectory === 'true') {
      info.rootDirectoryName = info.rootName + '/';

    } else {
      info.rootDirectoryName = parameters.rootDirectory + '/';
    }

    return info;
  }

  /**
   * 下载目录
   * @param progress
   */
  function downloadDir(progress) {
    progress.isProcessing.val = true;

    let dirPaths = [];
    let files = [];
    let requestedPromises = [];

    dirPaths.push(repoInfo.resPath);
    mapFileAndDirectory(dirPaths, files, requestedPromises, progress);
  }

  /**
   * 遍历文件和目录
   * @param dirPaths
   * @param files
   * @param requestedPromises
   * @param progress
   */
  function mapFileAndDirectory(dirPaths, files, requestedPromises, progress) {
    axios.get(repoInfo.urlPrefix + dirPaths.pop() + repoInfo.urlPostfix)
      .then(function (response) {
        for (let i = response.data.length - 1; i >= 0; i--) {
          if (response.data[i].type === 'dir') {
            dirPaths.push(response.data[i].path);
          } else {
            if (response.data[i].download_url) {
              getFile(response.data[i].path,
                response.data[i].download_url,
                files, requestedPromises, progress
              );
            } else {
              console.log(response.data[i]);
            }
          }
        }

        if (dirPaths.length <= 0) {
          downloadFiles(files, requestedPromises, progress);
        } else {
          mapFileAndDirectory(dirPaths, files, requestedPromises, progress);
        }
      });
  }

  /**
   * 下载目录中的文件
   * @param files
   * @param requestedPromises
   * @param progress
   */
  function downloadFiles(files, requestedPromises, progress) {
    let zip = new JSZip();
    Promise.all(requestedPromises)
      .then(function (data) {
        for (let i = files.length - 1; i >= 0; i--) {
          zip.file(
            repoInfo.rootDirectoryName + files[i].path.substring(decodeURI(repoInfo.resPath).length + 1),
            files[i].data
          );
        }

        progress.isProcessing.val = false;
        zip.generateAsync({ type: 'blob' })
          .then(function (content) {
            saveAs(content, repoInfo.downloadFileName + '.zip');
          });
      });
  }

  /**
   * 获取要下载的文件
   * @param path
   * @param url
   * @param files
   * @param requestedPromises
   * @param progress
   */
  function getFile(path, url, files, requestedPromises, progress) {
    let promise = axios.get(url, { responseType: 'arraybuffer' })
      .then(function (file) {
        files.push({
          path: path,
          data: file.data
        });
        progress.downloadedFiles.val = files.length;
      }, function (error) {
        console.log(error);
      });

    requestedPromises.push(promise);
    progress.totalFiles.val = requestedPromises.length;
  };

  /**
   * 执行打包、下载
   * @param url
   * @param progress
   * @param toastr
   */
  function downloadFile(url, progress, toastr) {
    progress.isProcessing.val = true;
    progress.downloadedFiles.val = 0;
    progress.totalFiles.val = 1;

    let zip = new JSZip();
    axios.get(url, { responseType: 'arraybuffer' })
      .then(function (file) {
        progress.downloadedFiles.val = 1;
        zip.file(repoInfo.rootName, file.data);

        progress.isProcessing.val = false;
        zip.generateAsync({ type: 'blob' })
          .then(function (content) {
            saveAs(content, repoInfo.downloadFileName + '.zip');
          });
      }, function (error) {
        console.log(error);
        progress.isProcessing.val = false;
        toastr.warning('Error! Server failure or wrong URL.', { iconClass: 'toast-down' });
      });
  }

  return {
    downloadZippedFiles: function (parameters, progress, toastr) {
      /*
      repoInfo: {
          author: "ZHAISHENKING"
          repository: "js_test"
          branch: "master"
          rootName: "html_test"
          resPath: "html_test"
          urlPrefix: "https://api.github.com/repos/ZHAISHENKING/js_test/contents/"
          urlPostfix: "?ref=master"
          downloadFileName: "html_test"
          rootDirectoryName: "html_test/"
       }
       */
      repoInfo = parseInfo(parameters);
      if (!repoInfo.resPath || repoInfo.resPath === '') {
        if (!repoInfo.branch || repoInfo.branch === '') {
          repoInfo.branch = 'master';
        }
        let downloadUrl = 'https://github.com/' + repoInfo.author + '/' +
          repoInfo.repository + '/archive/' + repoInfo.branch + '.zip';
        window.location = downloadUrl;
      } else {
        axios.get(repoInfo.urlPrefix + repoInfo.resPath + repoInfo.urlPostfix)
          .then(function (response) {
            if (response.data instanceof Array) {
              downloadDir(progress);
            } else {
              downloadFile(response.data.download_url, progress, toastr);
            }
          }, function (error) {
            console.log('probable big file.');
            downloadFile('https://raw.githubusercontent.com/' + repoInfo.author + '/' +
              repoInfo.repository + '/' + repoInfo.branch + '/' + repoInfo.resPath,
              progress, toastr);
          });
      }
    },
  };
}

const {downloadZippedFiles} = down()

function run(routeParam) {
  const scope = {
    downUrl : '',
    url: '',
    isProcessing: {val: false},
    downloadedFiles: {val: 0},
    totalFiles: {val: 0}
  }

  const templateUrl = "https?://github.com/.+/.+";

  if (routeParam) scope.url = routeParam.url

  if (scope.url.match(templateUrl)) {
    let parameter = {
      url: routeParam.url,
      fileName: routeParam.fileName,
      rootDirectory: routeParam.rootDirectory
    };
    let progress = {
      isProcessing: scope.isProcessing,
      downloadedFiles: scope.downloadedFiles,
      totalFiles: scope.totalFiles
    };
    downloadZippedFiles(parameter, progress, toastr);
  }else{
    throw 'error'
  }
}
