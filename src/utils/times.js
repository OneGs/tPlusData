const {dateYYYYMMDD} = require('../utils/formatDate')
const deepCopy = require('deepcopy')

class Times {
    constructor() {
        this.day = new Date()
    }

    //只返回一个值
    today() {
        return [dateYYYYMMDD(this.day), dateYYYYMMDD(this.day)]
    }

    year() {
        let day = deepCopy(this.day)
        day.setDate(1)
        day.setMonth(0)
        return dateYYYYMMDD(day)
    }

    month() {
        let beginDate = deepCopy(this.day)
        beginDate.setDate(1)
        let endDate = deepCopy(this.day)
        endDate.setMonth(endDate.getMonth() + 1)
        endDate.setDate(0)
        return [dateYYYYMMDD(beginDate), dateYYYYMMDD(endDate)]
    }

    monthToYesterday(){
        let beginDate = deepCopy(this.day)
        beginDate.setDate(1)
        let enDate = deepCopy(this.day)
        enDate.setDate(enDate.getDate() - 1)
        return[dateYYYYMMDD(beginDate), dateYYYYMMDD(enDate)]
    }

    lastMonth() {
        let beginDate = deepCopy(this.day)
        beginDate.setMonth(beginDate.getMonth() - 1)
        beginDate.setDate(1)
        let endDate = deepCopy(this.day)
        endDate.setDate(0)
        return [dateYYYYMMDD(beginDate), dateYYYYMMDD(endDate)]
    }

    lastFiveMonth(){
        let beginDate = deepCopy(this.day),
            endDate = deepCopy(this.day)
        beginDate.setMonth(beginDate.getMonth() - 5)
        beginDate.setDate(1)
        endDate.setDate(0)
        return [dateYYYYMMDD(beginDate), dateYYYYMMDD(endDate)]
    }

    * lastNumberMonth(number) {
        let beginDate = deepCopy(this.day),
            endDate = deepCopy(this.day)
        while (number > 0) {
            beginDate.setMonth(beginDate.getMonth() - 1)
            beginDate.setDate(1)
            endDate.setDate(0)
            yield [dateYYYYMMDD(beginDate), dateYYYYMMDD(endDate)]
            number -= 1
        }
    }
}

module.exports = Times
