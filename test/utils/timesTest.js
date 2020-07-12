const {describe} = require('mocha')
const assert = require('assert')
const times = require('../../src/utils/times')


describe('#times', function () {
    describe('monthToYesterday', () => {
        it('should be equal', function () {
            const testTime = ['2020-07-01', '2020-07-11']
            const actTime = (new times()).monthToYesterday()
            assert(actTime[0] === testTime[0])
            assert(actTime[1] === testTime[1])
        });
    })
})