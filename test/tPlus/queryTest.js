const {describe} = require('mocha')
const assert = require('assert')
const times = require('../../src/utils/times')
//测试需要的包

const {Connect} = require('../../src/tPlus')
//需要测试的类

const connect = new Connect()

describe('#new Connect()', function () {
    describe('#getSaleCounts()--第一次请求获取个数、第二次全部请求', () => {
        it('dataSource.rows.length should equal TotalRecords', async function () {
            const orders = await connect.then(async query => {
                return await query.getSaleCounts({
                    BeginDefault: '2020-03-01',
                    EndDefault: '2020-03-12'
                })
            })
            assert(orders['DataSource']['Rows'].length === orders['TotalRecords'])
        });
    });
    describe('#ordersQuantity', function () {
        describe('params with yesterday', function () {
            it('all request should be equal', function (done) {
                let requestList = []
                for (let i = 0; i < 3; i++) {
                    requestList.push(
                        connect.then(async query => {
                            return await query.ordersQuantity(['2020-07-11', '2020-07-11'])
                        })
                    )
                }
                Promise.all(requestList).then(
                    values => {
                        assert(values.every(el => el === values[0]) === true)
                        done()
                    }
                )
            });
        });
        describe('params with lastmonth', function () {
            it('all should be equal', function (done) {
                let requestList = []
                for (let i = 0; i < 3; i++) {
                    requestList.push(
                        connect.then(async query => {
                            return await query.ordersQuantity((new times()).lastMonth())
                        })
                    )
                }
                Promise.all(requestList).then(
                    values => {
                        assert(values.every(el => el === values[0]) === true)
                        done()
                    }
                )
            });
        });
        describe('params with yesterday and lastmonth as same time', function () {
            it('yesterday、lastmonth、month should be not equal', function (done) {
                let requestList = [
                    connect.then(async query => {
                        return await query.ordersQuantity((new times()).lastMonth())
                    }),
                    connect.then(async query => {
                        return await query.ordersQuantity((new times()).month())
                    }),
                    connect.then(async query => {
                        return await query.ordersQuantity((new times()).today())
                    })
                ];
                Promise.all(requestList).then(
                    values => {
                        assert((new Set(values)).size === values.length)
                        done()
                    }
                )
            });
        })
    })
})