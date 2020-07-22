const Koa = require('koa');
const router = require('koa-route')
const queryString = require('querystring')
const loggerHttp = require('koa-pino-logger')()
// 导入的包
const store = require('../store')
const format = require('../utils/format')
const deepcopy = require('deepcopy')
// const {connect} = require('../tPlus')
const DaJian = require('../format/daJian')

const app = new Koa();
app.use(loggerHttp)

//设置请求头
app.use(async (ctx, next) => {
    await next()
    ctx.response.set('Access-Control-Allow-Origin', '*');
    ctx.response.set('Content-Type', 'application/json; charset=utf-8')
})

// last month quantity
app.use(router.get('/ordersQuantity', async (ctx) => {
    ctx.log.info(`${ctx.request.url}`)
    const params = queryString.parse(ctx.querystring)
    let data = null, month = null;
    //    判断是否为时间查询
    if (params.time) {
        switch (params.time) {
            case 'today':
                data = await store.then(async value => {
                    month = "当日销售"
                    await value.flashToday()
                    return value.getToday()
                })
                break
            case 'month':
                data = await store.then(value => {
                    month = "当月销售"
                    return value.getMonth()
                })
                break
            case 'lastMonth':
                data = await store.then(value => {
                    month = "上月销售"
                    return value.getLastMonth()
                })
        }
        ctx.body = [DaJian.formatDigitalDealer(month, "吨", format.kgToTonne(data))]
    } else {
        ctx.body = '请添加正确的参数'
    }
}))

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

app.use(router.get('/companyQuantity', async (ctx) => {
    ctx.body = companyQuantityStyle(await store.then(value => {
        return value.getCompanyQuantity()
    }))
}))

app.use(router.get('/wareHouse', async (ctx) => {
    ctx.body = await store.then(value => {
        return value.getWareHouse()
    })
}))

app.use(router.get('/companyInfo', ctx => {
    ctx.body = [
        {
            data: `
        陕西蓝晟新材料研发有限公司
            前身陕西蓝魔化工有限公司，成立于2004年，续2011年成立蓝晟，至2020年成立16载。
        总部位于十三朝古都“西安”并以陕西为中心，以西北为依托，下设有蓝晟银川分公司（生产基地）、蓝晟兰州分公司（生产基地）、重庆蓝晟氟硅新材科技有限公司（生产基地）及布局多个城市办事处。
        与全球知名原材料供应商建立长期战略合作关系，如荷兰的DSM、德国BASF、美国氰特、杜邦、中国神剑等。
        总部拥有万余平方米的标准化立体式工业厂房。国内外先进的生产设备（粉末生产线十几条，实验生产线6条，进口金属邦定机1套），年产可达到万吨以上。
        总部建立先进的研发中心及配备世界先进研发设备和检测设备。拥有丰富、成熟的大型生产作业经验，可满足各类大中小型高端技术制造及海外客户的需求。
        `
        }
    ]
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
                x: key,
                y: format.kgToTonne(ranks[key]),
                type: 's1'
            })
    }
    return temp.sort((first, second) => {
        return second.y - first.y
    })
}

function monthStatusStyle(status) {
    let temp = []
    for (let key in status) {
        if (status.hasOwnProperty(key))
            temp.push({
                x: key.slice(5),
                y: format.kgToTonne(status[key]),
                s: 's1'
            })
    }
    return temp.sort((first, second) => {
        if (first.x > second.x) {
            return 1
        } else if (first.x < second.x) {
            return -1
        } else {
            return 0
        }
    })
}

function workOrdersStyle(orders) {
    orders.forEach(value => {
        value['voucherdate'] = value['voucherdate'].slice(5)
        value['quantity'] = (parseFloat(value['quantity'])).toFixed(2)
        value['partnerName'] = dimCompanyName(value['partnerName'])
    })
}

function companyQuantityStyle(companys) {
    let temp = [];
    for (let key in companys) {
        if (companys.hasOwnProperty(key))
            temp.push({
                x: dimCompanyName(key),
                y: format.kgToTonne(companys[key]),
                s: 's1'
            })
    }
    return temp.sort((first, second) => {
        return second.y - first.y
    }).slice(0, 10)
}

function dimCompanyName(name){
    return name.replace(name.substr(6, 2), "**")
}

// function wareHouseStyle(wares){
//
// }

module.exports = app