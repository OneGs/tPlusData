const {describe} = require('mocha')
const assert = require('assert')
//测试需要的包

const {Connect} = require('../../src/tPlus')
//需要测试的类

const connect = new Connect()

describe('测试Connect类', function () {
    describe('getSaleCounts、第一次请求获取个数、第二次全部请求', () => {
        it('dataSource.rows.length should equal TotalRecords', async function () {
            connect.then(async query => {
                const orders = await query.getSaleCounts({})
                assert(orders && orders['DataSource']['Rows'])
                assert(orders['DataSource']['Rows'].length === orders['TotalRecords'])
            })
        });
    })
})