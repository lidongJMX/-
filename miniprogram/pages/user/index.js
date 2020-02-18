//index.js
//获取应用实例

/**
 * 1. 普通用户登录和管理员登录
 * 2. 管理员登录后显示验证框，点击返回flag为0，此时flag2为1显示验证手机号按钮
 * 3. 管理员登录，进入详情页，添加元素按钮为
 */
var app = getApp();
Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    showTopTips: false,
    showModal: false, //模拟框
    textV_user: '', // 模拟框输入账号
    textV_pwd: '',
    openId: '',
    flag: 0, //
    flag2: 0 //验证手机号按钮
  },
  changeFlag: function () {
    this.setData({
      flag: 0
    })
  },
  changeFlag2: function () {
    this.setData({
      flag: 1
    })
  },
  // 获取用户信息及登录
  getUserInfo: async function () {
    app.slogin();

    let that = this
    app.userInfoReadyCallback = (res) => {
      that.setData({
        userInfo: res.userInfo,
        hasUserInfo: true,
        showTopTips: false,
      })
    }
    // 如果是管理员的登录
    // 此时虽然flag：1，但是如果手机号验证不成功的话，表单页面添加元素按钮仍未disable：true
    if (that.data.flag) {
      that.setData({
        showModal: true
      })
    }
    wx.cloud.callFunction({
      name: "login",
      data: {},
    }).then(res => {
      that.setData({
        openId: res.result.openid
      })
      app.open_Id = res.result.openid
      // console.log("管理员的openID为：" + that.data.openId)
      // console.log("res.result = ",res.result)
      
    })
    // 获取当前登录时间的时间戳，单位为毫秒
    
  },
  submitForm: function () {
      wx.navigateTo({
        url: '/pages/index/index'
      })
  },
  // 生命周期函数
  onLoad: function (e) {
    let that = this
    if (wx.getStorageSync('Cookie')) {
      wx.getUserInfo({
        success: function (res) {
          that.setData({
            userInfo: res.userInfo,
            hasUserInfo: true,
            showTopTips: false
          })
        }
      })
    }
    wx.setStorage({
      key: "flag",
      data: this.data.flag
    })
  },


  // 验证手机号
  confirmPhone: function () {
    this.setData({
      showModal: true
    })
  },
  // 弹窗返回按钮
  back: function () {
    this.setData({
      showModal: false,
      flag: 0,
      flag2: 1
    })
  },
  // 手机号输入
  wish_put_user: function (e) {
    this.setData({
      textV_user: e.detail.value
    })
  },
  // 密码输入
  wish_put_pwd: function (e) {
    this.setData({
      textV_pwd: e.detail.value
    })
  },
  // 输入后确定
  ok: function () {
    // if (!(/^1[34578]\d{9}$/.test(this.data.textV_user))) {
    //   wx.showToast({
    //     title: "请输入正确格式的手机号",
    //     duration: 1500
    //   })
    // } else {
      const db = wx.cloud.database()
      db.collection("admin").where({
          phone: this.data.textV_user,
          password: this.data.textV_pwd
        })
        .get()
        .then((res) => {
          if (res.data.length == 0) {
            this.setData({
              showModal: true,
              flag: 0
            })
            wx.showToast({
              title: '手机号或密码错误',
              icon: 'none',
              duration: 1500,
            });
          } else {
            this.setData({
              showModal: false,
              flag: 1
            })
            wx.setStorage({
              key: "flag",
              data: this.data.flag
            })
          }
        })
    // }
  }

})