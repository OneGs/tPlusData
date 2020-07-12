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
            await this.init()
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
                        EndDefault: times[1]
                    })
                return orders['DataSource']['Rows']
            }
        ))
    }

    reduceQuantity(orders) {
        return orders.reduce(
            (total, value) => {
                return total + parseFloat(value['quantity'])
            }, 0
        )
    }

    async init() {
        this._today = await this.initTimeData((new timeGenerator()).today())
        logger.info(`today init success: ${this._today}`)

        this._monthToYesterday = await this.initTimeData((new timeGenerator()).monthToYesterday())
        logger.info(`monthToYesterday init success: ${this._monthToYesterday}`)

        this._lastMonth = await this.initLastMonth()
            logger.info(`lastmonth init success: ${this._lastMonth}`)
    }
}

let a = new DataV()

a.then(
    value => {
        console.log(value._today)
    }
)
