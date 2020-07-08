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

    yesterday() {
        let day = deepCopy(this.day)
        day.setDate(day.getDate() - 1)
        return dateYYYYMMDD(day)
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

    lastMouth() {
        let beginDate = deepCopy(this.day)
        beginDate.setMonth(beginDate.getMonth() - 1)
        beginDate.setDate(1)
        let endDate = deepCopy(this.day)
        endDate.setDate(0)
        return [dateYYYYMMDD(beginDate), dateYYYYMMDD(endDate)]
    }

    * lastNumberMonth(number) {
        // yield this.month()
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

// let a = new Times()
//
// let b = a.lastNumberMonth(2)
//
// let value = b.next()
// while (!value.done){
//     console.log(value.value)
//     value = b.next()
// }
