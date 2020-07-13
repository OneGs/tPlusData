const {connect} = require('../tPlus')
const timeGenerator = require('../utils/times')
const logger = require('../logging')

class DataV {
    constructor() {

        this._lastMonth = null;
        this._monthToYesterday = null;
        this._today = null;
        this._lastFiveMonthSale = null;
        this._personSaleRanking = null;
        this._workingOrders = null;

        return (async () => {
            await this.initStatic()
            return this
        })()
    }

    async initTimeData(times) {
        return this.reduceQuantity(await connect.then(
            value => {
                return value.getMonthInfo().filter(value1 => {
                    return value1['voucherdate'] >= times[0] &&
                        value1['voucherdate'] <= times[1]
                })
            }
        ))
    }

    async initLastMonth() {
        return this.reduceQuantity(await connect.then(
            async value => {
                const times = (new timeGenerator()).lastMonth(),
                    orders = await value.call({
                        BeginDefault: times[0],
                        EndDefault: times[1],
                        ReportTableColNames: ['quantity']
                    })
                return orders['DataSource']['Rows']
            }
        ))
    }

    async initLastFiveMonth() {
        const times = (new timeGenerator()).lastFiveMonth(),
            orders = await connect.then(
                async query => {
                    return await query.call({
                        BeginDefault: times[0],
                        EndDefault: times[1],
                        ReportTableColNames: ['voucherdate', 'quantity']
                    })
                }
            )
        //    获取每个月的数据总量
        let monthQuantityDict = {},
            fiveTimes = (new timeGenerator()).lastNumberMonth(5);
        let next = fiveTimes.next()
        while (!next.done) {
            monthQuantityDict[next.value[0]] = this.reduceQuantity(
                orders['DataSource']['Rows'].filter(value => {
                    return value['voucherdate'] >= next.value[0] &&
                        value['voucherdate'] <= next.value[1]
                })
            )
            next = fiveTimes.next()
        }
        return monthQuantityDict
    }

    async initOrderStatus() {
        return await connect.then(value => {
            return value.getMonthInfo().filter(value1 => {
                return value1['SaleOrderState'] === '未审'
            })
        })
    }

    async initPersonSaleRanking() {
        const saleRank = {};
        await connect.then(value => {
            value.getMonthInfo().forEach(({personName, quantity}) => {
                if (!(personName in saleRank)) {
                    saleRank[personName] = parseFloat(quantity)
                } else {
                    saleRank[personName] += parseFloat(quantity)
                }
            })
        })
        return saleRank
    }

    reduceQuantity(orders) {
        return orders.reduce(
            (total, value) => {
                return total + parseFloat(value['quantity'])
            }, 0
        )
    }

    async initStatic() {
        this._today = await this.initTimeData((new timeGenerator()).today())
        logger.info(`today init success: ${this._today}`)

        this._monthToYesterday = await this.initTimeData((new timeGenerator()).monthToYesterday())
        logger.info(`monthToYesterday init success: ${this._monthToYesterday}`)

        this._workingOrders = await this.initOrderStatus()
        logger.info(`WorkingOrders init success ${JSON.stringify(this._workingOrders)}`)

        this._personSaleRanking = await this.initPersonSaleRanking()
        logger.info(`initPersonSaleRanking init success ${JSON.stringify(this._personSaleRanking)}`)

        this._lastMonth = await this.initLastMonth()
        logger.info(`lastmonth init success: ${this._lastMonth}`)

        this._lastFiveMonthSale = await this.initLastFiveMonth()
        logger.info(`lastFiveMonth init success ${JSON.stringify(this._lastFiveMonthSale)}`)
    }
}

let a = new DataV()

a.then(
    value => {
    }
)
