//index.js
//获取应用实例
const app = getApp()
const _this = this;
Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    disable: true,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    // 渲染数组
    messages: [],
    submitMessage: {},
    showModal: false,
    textV: '', //tle
    textV2: '', // name
    openId: '',
    new_add_id: '', //新添加的元素ID
    classTableName: '',
    loadModal: false, //页面载入显示
    fileUrl: '', //文件下载路径
    dataCount: 0 //表中数据个数
  },
  /**
   * 1.login云函数获取openID
   * 2.当点击保存按钮时：查询数据库是否已有此openID
   * 3.有则不能再保存，不论数据是否修改
   * 4.当数据发生修改时，只有点击更新数据才能修改
   * 5.如果过了修改时间则不能修改
   */
  // 提交按钮选择
  submit: function (e) {
    if (e.detail.target.dataset.type == 1) {
      this.formSubmit(e)
    } else {
      this.updateInfo(e)
    }
  },
  // 保存数据
  formSubmit: function (e) {
    const db = wx.cloud.database()
    let newLength
    wx.cloud.callFunction({
      name: "login",
      data: {}
    }).then(res => {
      db.collection(this.data.classTableName).where({
        _openid: res.result.openid
      }).get().then(res => {
        newLength = 0
        newLength = res.data.length
      }).then(res => {
        if (newLength != 0) {
          wx.showToast({
            title: "请勿重复添加",
            duration: 1500
          })
        } else {
          db.collection(this.data.classTableName).add({
            data: e.detail.value,
            success: res => {
              wx.showToast({
                title: '保存成功',
                duration: 1500,
                mask: true,
              })
              // 把对象中的数据存储到本地存储中
              for (let key in e.detail.value) {
                wx.setStorageSync(key, e.detail.value[key]);
              }
              let timesTemp = Date.parse(new Date())
              // // 有效期一个小时
              let expirydate = timesTemp + 1000 * 60 * 60 * 24;
              // wx.setStorageSync("open_id",res.result.openid)6
              wx.setStorageSync("expiry_date", expirydate)
            },
            fail: (err) => {
              wx.showToast({
                title: '保存失败！',
                duration: 1500,
                mask: true,
              })
            }
          })
        }
      })

    })

  },


  // 更新数据
  updateInfo: async function (e) {
    let that = this
    // 获取当前时间戳
    await wx.cloud.callFunction({
      name: "login",
      data: {}
    }).then(res => {
      that.setData({
        openId: res.result.openid
      })
    })
    console.log("openid为：" + that.data.openId)
    let nowTimesTemp = Date.parse(new Date())
    const db = wx.cloud.database()

    wx.getStorage({
      key: "expiry_date",
      success(res) {
        // expire:过期
        let isExpire = nowTimesTemp - res.data
        for (let key in e.detail.value) {
          wx.setStorageSync(key, e.detail.value[key]);
        }
        // resu<0:没有过期
        if (isExpire <= 0) {
          let changedId = ''
          db.collection(that.data.classTableName).where({
            _openid: that.data.openId
          }).get().then(res => {
            changedId = res.data[0]._id
            console.log(changedId)
          }).then(() => {
            db.collection(that.data.classTableName).doc(changedId).update({
              data: e.detail.value
            })
          })
          wx.showToast({
            title: '更新成功',
            duration: 1500,
          })
        } else {
          for (let key in e.detail.value) {
            wx.removeStorageSync(key)
          }
          wx.showToast({
            title: '已超过修改时间，修改失败',
            duration: 1500,
          });
          console.log("超时了")
        }
      }
    })
  },

  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },


  // 页面加载执行
  onLoad: function (options) {
    let adminId = options.adminOpenId
    let that = this
    that.setData({
      classTableName: options.classTableName
    })
    app.class_Table_Name = options.classTableName
    wx.getStorage({
      key: 'flag',
      success(res) {
        // res.data是flag的值：1->管理员  0->普通用户
        if (res.data) {
          that.setData({
            disable: false,
            loadModal: true
          })
          // 页面加载从get集合数据渲染页面
          const db = wx.cloud.database()
          db.collection(app.open_Id)
            .get().then((res) => {
              // console.log("渲染", res.data)
              that.beforeData(res)
              that.setData({
                messages: res.data
              })
            })
        } else {
          that.setData({
            disable: true
          })
          const db = wx.cloud.database()
          db.collection(adminId)
            .get().then((res) => {
              that.beforeData(res)
              that.setData({
                messages: res.data
              })
            })
        }

      }
    })
    that.beforeData()
  },
  // 上次填写的数据从storage中取出渲染页面
  beforeData: function (res) {
    for (let i = 0; i < res.data.length; i++) {
      for (let key in res.data[i]) {
        try {
          let val = wx.getStorageSync(res.data[i].name)
          res.data[i].value = val;
        } catch (error) {}
      }
    }
  },
  // 页面载入创建表格
  createTable: function () {
    wx.cloud.callFunction({
      name: "createDB",
      data: {
        collName: this.data.classTableName
      }
    })
    app.class_Table_Name = this.data.classTableName
    this.setData({
      loadModal: false,
    })
  },
  // 获取页面载入表名
  wish_put_table: function (e) {
    this.setData({
      classTableName: e.detail.value
    })
  },


  // 下拉刷新
  onPullDownRefresh: function () {
    // 页面加载从get集合数据渲染页面
    const db = wx.cloud.database()
    db.collection(app.open_Id)
      .get().then((res) => {
        this.beforeData(res)
        this.setData({
          messages: res.data
        })
      })
    // 表中记录条数统计
    wx.cloud.callFunction({
      name: "getInfo",
      data: {
        collName: app.class_Table_Name
      }
    }).then(res => {
      this.setData({
        dataCount: res.result.data.length
      })
    })
  },


  // 获取用户信息
  getUserInfo: function (e) {
    app.globalData.userInfo = e.detail.userInfo
    that.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },


  // 增加元素
  addElem: function () {

    this.setData({
      showModal: true,
    })
  },
  // 点击返回按钮隐藏
  back: function () {
    this.setData({
      showModal: false,
      loadModal: false
    })
  },
  // 获取input输入值
  wish_put: function (e) {
    this.setData({
      textV: e.detail.value
    })
  },
  wish_put2: function (e) {
    this.setData({
      textV2: e.detail.value
    })
  },


  // 点击确定按钮获取input值并且关闭弹窗
  ok: function () {
    let length = this.data.messages.length + 1
    // 创建数据库
    wx.cloud.callFunction({
      name: "createDB",
      data: {
        collName: app.open_Id
      },
      success: ((res) => {
        console.log("创建数据库，调用云函数成功")
        this.createDatabase(res, length)
      }),
      fail: ((err) => {
        let res = '空值'
        this.createDatabase(res, length)
        console.log("云函数调用失败")
      })
    })
  },


  /**
   * 模板创建
   * 元素重复则不可创建
   */
  createDatabase: function (res, length) {
    let db = wx.cloud.database()
    // tle,name
    db.collection(app.open_Id).where({
      tle: this.data.textV
    }).get().then(res => {
      if (res.data.length) {
        console.log(res.data)
        return wx.showToast({
          title: '元素不能重复',
          duration: 1500
        })
      } else {
        db.collection(app.open_Id).add({
          data: {
            tle: this.data.textV,
            name: this.data.textV2,
            value: "",
            unique: "unique_" + length
          }
        }).then((res) => {
          this.setData({
            showModal: false,
            new_add_id: res._id
          })
          db.collection(app.open_Id).where({
              // unique: "unique_" + length
              _id: this.data.new_add_id
            })
            .get()
            .then((reso) => {
              let newMessages = reso.data //获取的数据库新数组
              this.setData({
                showModal: false,
                messages: this.data.messages.concat(newMessages)
              })
            })
        })
      }
    })

  },


  // 清除数据库内容
  clearDB: function () {
    wx.cloud.callFunction({
      name: "clearData",
      data: {
        collName: app.open_Id,
      },
      success: (res) => {
        wx.showToast({
          title: '已清除模板和表格',
          duration: 1500,
        });
      },
      fail: (e) => {
        console.log("调用云函数失败", e)
      }
    })
    wx.cloud.callFunction({
      name: "clearClassTable",
      data: {
        tableName: this.data.classTableName
      },
      success: (res) => {

      },
      fail: (e) => {
        console.log("调用云函数失败", e)
      }
    })
  },


  // 生成表格
  productTable: function () {
    let that = this
    wx.cloud.callFunction({
      name: "Excel",
      data: {
        proTable: app.class_Table_Name,
        templetTable: app.open_Id
      }
    }).then(res => {
      wx.showToast({
        title: "表格已生成",
        icon: "none",
        duration: 1500
      })
      // app.file_ID = res.result.fileID
      that.getFileUrl(res.result.fileID)
    })
  },
  getFileUrl(fileID) {
    let that = this;
    wx.cloud.getTempFileURL({
      fileList: [fileID],
      success: res => {
        // get temp file URL
        that.setData({
          fileUrl: res.fileList[0].tempFileURL
        })
      },
      fail: err => {
        // handle error
      }
    })
  },
  // 下载表格
  downloadTable: function () {
    let that = this
    wx.setClipboardData({
      data: that.data.fileUrl,
      success(res) {
        wx.getClipboardData({
          success(res) {
            console.log(res.data) // data
          }
        })
      }
    })
  },


  // 转发小程序（携带参数）
  onShareAppMessage: function (res) {
    return {
      title: "信息采集小程序",
      path: "/pages/index/index?adminOpenId=" + app.open_Id + "&classTableName=" + this.data.classTableName
    }
  }

})