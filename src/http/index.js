const Koa = require('koa');
const router = require('koa-route')
const queryString = require('querystring')
const {ordersCount} = require('./request')
const app = new Koa();

function tengXun(value) {
    return [
        {
            value
        }
    ]
}

//设置请求头
app.use(async (ctx, next) => {
    await next()
    ctx.response.set('Access-Control-Allow-Origin', '*')
})

// last month quantity
app.use(
    router.get(
        '/orders', async (ctx) => {
            const info = queryString.parse(ctx.querystring)
            if (info && info.count) {
                switch (info.count) {
                    case 'today':
                        ctx.body = tengXun(await ordersCount('today'))
                        break
                    case 'month':
                        ctx.body = tengXun(await ordersCount('month'))
                        break
                    case 'lastMonth':
                        ctx.body = tengXun(await ordersCount('lastMonth'))
                        break
                }
            }
        }
    )
)

module.exports = app