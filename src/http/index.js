const Koa = require('koa');
const router = require('koa-route')
const queryString = require('querystring')
const loggerHttp = require('koa-pino-logger')()
// 导入的包
const store = require('../store')
const format = require('../utils/format')
const deepcopy = require('deepcopy')
const {connect} = require('../tPlus')

const app = new Koa();
app.use(loggerHttp)

const timeKey = ['month', 'lastMonth', 'today']

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
            const params = queryString.parse(ctx.querystring)
            let data = null
            //    判断是否为时间查询
            if (params.time) {
                switch (params.time) {
                    case 'today':
                        data = await store.then(async value => {
                            await value.flashToday()
                            return value.getToday()
                        })
                        break
                    case 'month':
                        data = await store.then(value => {
                            return value.getMonth()
                        })
                        break
                    case 'lastMonth':
                        data = await store.then(value => {
                            return value.getLastMonth()
                        })
                }
                ctx.body = [{'value': format.kgToTonne(data)}]
            } else {
                ctx.body = '请添加正确的参数'
            }
        }
    )
)

app.use(router.get('/saleRank', async (ctx) => {
    ctx.body = rankStyle(await store.then(async value => {
        await value.flashPersonSaleRanking()
        return value.getPersonSaleRanking()
    }))
}))

app.use(router.get('/monthStatus', async (ctx) => {
    ctx.body = monthStatusStyle(await store.then(value => {
        return value.getLastFiveMonthSale()
    }))
}))

app.use(router.get('/workOrders', async (ctx) => {
    const orders = await store.then(async value => {
        await value.flashWorkingOrders()
        const orders = deepcopy(value.getWorkingOrders())
        return orders.length ? orders : [
            {
                voucherdate: 'null',
                partnerName: '所有订单审核生效',
                quantity: 'null',
                inventoryName: 'null',
                personName: 'null'
            }
        ]
    })
    workOrdersStyle(orders)
    ctx.body = orders
}))

// app.use(router.get('/get', async (ctx) => {
//     await connect.then(value => {
//         value.setTodayInfo()
//     })
//     ctx.body = '更新成功'
// }))

function rankStyle(ranks) {
    let temp = []
    for (let key in ranks) {
        if (ranks.hasOwnProperty(key))
            temp.push({
                saleMan: key,
                quantity: ranks[key]
            })
    }
    return temp
}

function monthStatusStyle(status) {
    let temp = []
    for (let key in status) {
        if (status.hasOwnProperty(key))
            temp.push({
                x: key,
                y: status[key],
                s: 's1'
            })
    }
    return temp
}

function workOrdersStyle(orders) {
    orders.forEach(value => {
        value['voucherdate'] = value['voucherdate'].slice(5)
        value['quantity'] = (parseFloat(value['quantity'])).toFixed(2)
    })
}

module.exports = app