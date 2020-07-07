const dateTimeFormat = require('dateformat')

const YYYYMMDD = 'yyyy-mm-dd'

function dateYYYYMMDD(time) {
    return dateTimeFormat(time, YYYYMMDD)
}

module.exports = {
    dateYYYYMMDD
}

