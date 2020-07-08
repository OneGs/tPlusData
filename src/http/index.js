const Koa = require('koa');
const router = require('koa-route')
const queryString = require('querystring')
const {ordersCount, saleManOrder, ordersSixCount} = require('./request')
const app = new Koa();

function tengXun(value) {
    return [
        {
            value: value / 1000
        }
    ]
}

function saleManFormat(values) {
    let temp = []
    for (let key in values) {
        if (values.hasOwnProperty(key)) {
            temp.push({
                'saleMan': key,
                'quantity': values[key] / 1000
            })
        }
    }
    temp.sort(
        (a, b) => {
            return b.quantity - a.quantity
        }
    )
    return temp
}

function threeColumnFormat({
    col1, col2, col3, values
                          }){
    let temp = []
    for(let key in values){
        if(values.hasOwnProperty(key)){
            temp.push({
                [col1]: key,
                [col2]: values[key] / 1000,
                [col3]: 's1'
            })
        }
    }
    // temp.sort((a, b) => {
    //     return a[col1] - b[col1]
    // })
    console.log(temp)
    return temp
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

app.use(
    router.get('/saleman', async (ctx) => {
        ctx.body = saleManFormat(await saleManOrder())
    })
)

app.use(
    router.get('/monthinfo', async (ctx) => {
        ctx.body = threeColumnFormat({
            col1: 'x',
            col2: 'y',
            col3: 's',
            values: await ordersSixCount()
        })
    })
)

module.exports = app