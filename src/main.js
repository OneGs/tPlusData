const {Query} = require('./tPlus')

const tPlusQuery = new Query()

tPlusQuery.getReportInfo('')
    .then(value => {
        console.log(value)
    })