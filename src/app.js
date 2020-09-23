import dwt from 'dwt'

export class App {
  constructor () {
    this.title = 'Dynamic Web TWAIN love aurelia'
    this.dwt = {
      obj: null,
      licenseKey: 't01016QAAADyBe7yfb9oPaRKoDodUi2D6w3Dj/XeSforvLiBX6PXItwyqx3NL/4Uso1U/t4Gol58RCjB9B1q+RjxJ2qOVHa1eGzRmGbzga3PGGn1/tDAWpk/DKsyhQmO9F1PDDdxIL+c=',
      resourcePath: '/lib/dwt',
      webTwainId: 'dwt-obj',
    }
    this.viewer = {
      containerId: 'dwt-viewer',
      width: '100%',
      height: '100%',
      obj: null
    }
    this.formats = [
      {id: 'pdf', text: 'pdf'},
      {id: 'jpg', text: 'jpg'},
      {id: 'tif', text: 'tif'}
    ]
    this.selectFormat = 'pdf'
    this.fileName = ''
  }
  attached(argument) {
    console.log('component attached ' + argument)
    this.init()
  }
  init() {
    this.unmountDwt()
    this.mountDwt().then(() => { this.bindViewer() })
    // this.dwt.obj = dwtObj
  }
  mountDwt() {
    return new Promise((res, rej) => {
      console.log('dwt process: mount')
      const that = this
      dwt.WebTwainEnv.UseLocalService = true
      dwt.WebTwainEnv.ResourcesPath = '/lib/dwt'
      dwt.WebTwainEnv.AutoLoad = false
      dwt.WebTwainEnv.IfAddMD5InUploadHeader = false
      dwt.WebTwainEnv.IfConfineMaskWithinTheViewer = false
      dwt.WebTwainEnv.ProductKey = this.dwt.licenseKey
      dwt.WebTwainEnv.Containers = [{ContainerId: this.dwt.containerId, Width: '100%', Height: '100%'}]
      dwt.WebTwainEnv.CreateDWTObjectEx(
        { WebTwainId: this.dwt.webTwainId },
        function (dwtObj) { console.log('dwt instance created'); that.dwt.obj = dwtObj; res(dwtObj);},
        function (errStr) { console.error(errStr); (errStr); }
      )
    })
  }
  unmountDwt() {
    return new Promise((res, rej) => {
      console.log('dwt process: unmount')
      if (dwt.WebTwainEnv.DeleteDWTObject(this.dwt.containerId)) {
        console.log('dwt delete success')
        res(true)
      } else {
        console.log('dwt delete failed')
        res(false)
      }
    })
  }
  getWebTwain() {
    console.log(dwt.WebTwainEnv.GetWebTwain(this.dwt.containerId))
    window.dwt = dwt
  }
  printUpload () {
    console.log(`upload: ${this.fileName}.${this.selectFormat}`)
  }
  uploadFile () {
    const host = '127.0.0.1'
    const protocol = 'http'
    const uploadPath = '/api/File'
    let uploadFileName = this.fileName + '.' + this.selectFormat
    const port = 51065

    let format = (select => {
              switch (select) {
                case 'jpg': { return dwt.EnumDWT_ImageType.IT_JPG }
                case 'pdf': { return dwt.EnumDWT_ImageType.IT_PDF }
                case 'tif': { return dwt.EnumDWT_ImageType.IT_TIF }
            }
        })(this.selectFormat)

        console.log(format)

    let uploadFormat = dwt.EnumDWT_UploadDataFormat.Binary

    const DWObj = this.dwt.obj
    if (DWObj) {
        DWObj.HTTPPort = port
        DWObj.IfSSL = false
        let indices = DWObj.SelectedImagesIndices
        DWObj.HTTPUpload(
            // protocol + '//' + host + ':' + port + uploadPath,
            'http://localhost:8080/api/File',
            indices,
            format,
            uploadFormat,  // 0 for binary; 1 for base64
            uploadFileName,
            () => { alert('success') },
            (errCode, errStr, res) => {
                console.error(`${errCode}: ${errStr}. Server return: ${ res }`)
            }
        )
    }
  }
  acquireImage () {
    const DWObject = this.dwt.obj;
    if (DWObject) {
      if (DWObject.UseLocalService) {
        let configure = {
          IfShowUI: this.showUI,
          PixelType: this.colorMode,
          Resolution: this.resolution,
          IfFeederEnabled: this.autoFeeder,
          IfDuplexEnabled: this.duplex,
          IfDisableSourceAfterAcquire: true,
          // Advance settings
          IfGetImageInfo: true,
          IfGetExtImageInfo: true,
          extendedImageInfoQueryLevel: 0
        }
        DWObject.SelectSourceByIndex(this.selectScanner)
        DWObject.AcquireImage(
          configure,
          () => { DWObject.CloseSource() },
          () => { DWObject.CloseSource() }
        )
      }
    }
  }
  bindViewer() {
    let options = {
      width: this.viewer.width,
      height: this.viewer.height,
      view: {
        bShow: true,
        Width: this.viewer.width,
        Height: this.viewer.height
      }
    }
    if (this.dwt.obj.BindViewer(this.viewer.containerId, options)) {
      this.viewer.obj = this.dwt.obj.Viewer
    }
  }
}
