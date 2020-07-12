const Koa = require('koa');
const router = require('koa-route')
const queryString = require('querystring')
const {Connect} = require('../tPlus')
const times = require('../utils/times')
const loggerHttp = require('koa-pino-logger')()
// 导入的包

const app = new Koa();
app.use(loggerHttp)

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
            ctx.log.info(`${ctx.request.url}`)
            const params = queryString.parse(ctx.querystring),
                time = new times()
            //    判断是否为时间查询
            if (params.time && params.time in time) {
                ctx.body = params.time
            } else {
                ctx.body = '请添加正确的参数'
            }
        }
    )
)

module.exports = app