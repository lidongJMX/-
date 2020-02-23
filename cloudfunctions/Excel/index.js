  const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const ex = db.command
const xlsx = require('node-xlsx');
exports.main = async (event, context) => {
  let userdata = [] // 一个对象数组
  let allData = [] // 最终alldata要成为一个二维数组
  let dataCVS = event.proTable+'.xlsx' // 表名 
  let row = [] //表格列名
  let rowEngName = []
  let temp = [] //临时存放userdata中取出的数据
  try {
    // 获取全部数据
    await db.collection(event.proTable).get().then(res => {
      // userdata为一个对象数组[{},{}]
      userdata = res.data
    })
    await db.collection(event.templetTable).get().then(res => {
      for (let i in res.data) {
        row.push(res.data[i].tle)
        rowEngName.push(res.data[i].name)
      }
    })
    allData.push(row)
    // // 循环把userdata中的对应数据添加到alldata中
    for (let i = 0; i < userdata.length; i++) {
      for (let j = 0; j < rowEngName.length; j++) {
        let val = rowEngName[j]
        temp.push(userdata[i][val])
      }
      allData.push(temp)
      temp =[]
    }
    var buffer = await xlsx.build([{
      name: "mySheetName",
      data: allData
    }]);
    //4，把excel文件保存到云存储里
    return await cloud.uploadFile({
      cloudPath: dataCVS,
      fileContent: buffer, //excel二进制文件
    })
  } catch (error) {

  }
}