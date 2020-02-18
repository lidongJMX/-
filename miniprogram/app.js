//app.js

App({
  open_Id: '',
  class_Table_Name: '',
  file_ID:'',// 文件下载地址
  onLaunch: function () {

    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: "infoget-bjg3e",
        traceUser: true,
      })
    }

    this.globalData = {}
  },
  slogin: function () {
    let that = this
    wx.login({
      success: function (res) {
        wx.getUserInfo({
          success: function (res) {
            that.globalData.userInfo = res.userInfo
            // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
            // 所以此处加入 callback 以防止这种情况
            if (that.userInfoReadyCallback) {
              that.userInfoReadyCallback(res)
              // console.log("userInfoReadyCallback",that.userInfoReadyCallback(res))
            }
            var iv = res.iv
            var encryptedData = res.encryptedData
            // 下面开始调用注册接口
            console.log(`wx.getStorageSync('dengluUrl')`, wx.getStorageSync('danluUrl'))

          }
        })
      },
      fail: function (res) {
        // console.log('wx.login fail', res)
      }
    })
  },

})