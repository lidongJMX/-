// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const db = cloud.database()
const ex = db.command
exports.main = async (event, context) => {
  try {
    return await db.collection(event.collName).where({
      _id: ex.exists(true)
    }).remove()
  } catch (e) {
    console.error(e)
  }
  
}