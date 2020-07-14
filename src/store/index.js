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

    getMonth() {
        return this._monthToYesterday + this._today
    }

    getToday() {
        return this._today
    }

    getLastMonth() {
        return this._lastMonth
    }

    getLastFiveMonthSale() {
        return this._lastFiveMonthSale
    }

    getPersonSaleRanking() {
        return this._personSaleRanking
    }

    getWorkingOrders() {
        return this._workingOrders
    }

    async flashToday() {
        this._today = await this.initTimeData((new timeGenerator()).today())
    }

    async flashMonthToYesterday() {
        this._monthToYesterday = await this.initTimeData((new timeGenerator()).monthToYesterday())
    }

    async flashWorkingOrders() {
        this._workingOrders = await this.initOrderStatus()
    }

    async flashPersonSaleRanking() {
        this._personSaleRanking = await this.initPersonSaleRanking()
    }

    async flashLastMonth() {
        this._lastMonth = await this.initLastMonth()
    }

    async flashLastFiveMonthSale() {
        this._lastFiveMonthSale = await this.initLastFiveMonth()
    }

    async initStatic() {
        await this.flashToday()
        logger.info(`today init success: ${this._today}`)

        await this.flashMonthToYesterday()
        logger.info(`monthToYesterday init success: ${this._monthToYesterday}`)

        await this.flashWorkingOrders()
        logger.info(`WorkingOrders init success ${JSON.stringify(this._workingOrders)}`)

        await this.flashPersonSaleRanking()
        logger.info(`initPersonSaleRanking init success ${JSON.stringify(this._personSaleRanking)}`)

        await this.flashLastMonth()
        logger.info(`lastmonth init success: ${this._lastMonth}`)

        await this.flashLastFiveMonthSale()
        logger.info(`lastFiveMonth init success ${JSON.stringify(this._lastFiveMonthSale)}`)
    }
}

module.exports = new DataV()
