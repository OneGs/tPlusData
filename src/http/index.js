const Koa = require('koa');
const router = require('koa-route')
const queryString = require('querystring')
const {Connect} = require('../tPlus')
const times = require('../utils/times')
const app = new Koa();
// 导入的包

const format = require('../utils/format')

const connect = new Connect()


//设置请求头
app.use(async (ctx, next) => {
    await next()
    ctx.response.set('Access-Control-Allow-Origin', '*');
    ctx.response.set('Content-Type', 'application/json; charset=utf-8')
})

// last month quantity
app.use(
    router.get(
        '/ordersQuantity', async (ctx) => {
            const params = queryString.parse(ctx.querystring),
                time = new times()
            //    判断是否为时间查询
            if (params.time && params.time in time) {
                const value = format.kgToTonne(await connect.then(async query => {
                    return await query.ordersQuantity(time[params.time]())
                }))
                ctx.body = [{value}]
            } else {
                ctx.body = '请添加正确的参数'
            }
        }
    )
)

// app.use(
//     router.get('/saleman', async (ctx) => {
//         ctx.body = saleManFormat(await saleManOrder())
//     })
// )
//
// app.use(
//     router.get('/monthinfo', async (ctx) => {
//         ctx.body = threeColumnFormat({
//             col1: 'x',
//             col2: 'y',
//             col3: 's',
//             values: await ordersSixCount()
//         })
//     })
// )

module.exports = app