const {TplusOpenApiV1Client} = require('./auth')
const axios = require('axios')
const crypto = require('crypto')
const lodash = require('lodash')
const logger = require('../logging')
const timeGenerator = require('../utils/times')

const hostPort = 'http://121.89.206.102:8282'
const key = '349c89eb-440d-48a6-9398-9ca9fe24e29e'
const secret = '5yg8rz'

const username = '8888'
const password = 'sunzeyu123'
const company = '009'

const COUNT = 120;
const ONEMINUTE = 60000;

// 验证服务器是否正常
async function isLogin() {

    function generateAuth(url, accessToken) {
        const authParam = {
                "uri": url, "access_token": accessToken, "date": new Date().toUTCString()
            },
            hmac_sha1 = crypto.createHmac("sha1", secret);
        //加密
        const signalValue = hmac_sha1.update(JSON.stringify(authParam)).digest().toString('base64')

        const authDic = {
            "appKey": key, "authInfo": "hmac-sha1 " + signalValue, "paramInfo": authParam,
        }
        return Buffer.from(JSON.stringify(authDic)).toString('base64')
    }

    return await axios({
        method: 'post',
        baseURL: hostPort,
        url: 'TPlus/api/v1/Connection',
        headers: {
            'Authorization': generateAuth(`${hostPort}/TPlus/api/v1/Connection`, ''),
            "Content-Type": "application/x-www-form-urlencoded"
        }
    }).then(value => value.data)
}

class Connect {
    constructor(host = hostPort, appKey = key, appSecret = secret) {
        this._connect = new TplusOpenApiV1Client(host, appKey, appSecret);

        this._todayInfo = null;
        this._monthToYesterday = null;

        // 计数，避免过度请求造成程序假死。
        this._requestTick = null; // 定时器
        this._count = null;

        return (async () => {
           return await this.init()
        })()
    }

    async init(){
        await this.generateAccessToken()
        logger.info(`登录成功 ${this._connect.getAccessToken()}`)
        this._todayInfo = await this.initMonthInfo((new timeGenerator()).today())
        logger.info(`init today success: length is ${this._todayInfo.length}`)
        this._monthToYesterday = await this.initMonthInfo((new timeGenerator()).monthToYesterday())
        logger.info(`init monthToYesterday success: length is ${this._monthToYesterday.length}`)
        this._resetCount()
        logger.info(`设置请求次数`)
        this.flashTodayOrders()
        logger.info(`设置today请求定时器 ${this._requestTick}`)
        return this
    }

    _resetCount() {
        this._count = COUNT;
    }

    getMonthInfo() {
        return this._monthToYesterday.concat(this._todayInfo)
    }

    login() {
        return new Promise((resolve, reject) => {
            this._connect.generateAccessTokenByPassword(
                username, password, company, new Date(), (error, value) => {
                    return error ? reject(error) : resolve(value)
                })
        })
    }

    reLogin(accessToken) {
        return new Promise((resolve, reject) => {
            this._connect.reLogin(accessToken, (error, value) => {
                return error ? reject(error) : resolve(value)
            })
        })
    }

    logout(accessToken) {
        return new Promise((resolve, reject) => {
            this._connect.Loginout(accessToken, (error, value) => {
                return error ? reject(error) : resolve(value)
            })
        })
    }

    _parseToken(error) {
        const errorJson = JSON.parse(/{.*}/.exec(error.message)[0])
        return errorJson ? errorJson['data'] : ''
    }

    async generateAccessToken() {
        const currentAccessToken = await this.login().then(value => value).catch(error => this._parseToken(error))
        await this.reLogin(currentAccessToken).then(value => value).catch(error => error.message)
    }

    //数据请求部分
    _call(requestOption) {
        //默认请求：无法获取所有数据
        return new Promise((resolve, reject) => {
            this._connect.Call('reportQuery/GetReportData', requestOption
                , this._connect.getAccessToken(), this._connect.getSid(), (error, value) => {
                    error ? reject(error) : resolve(value)
                })
        }).then(value => JSON.parse(value)).catch(error => error)
    }

    async call({
                   PageIndex = 1,
                   PageSize = 1,
                   BeginDefault = null,
                   EndDefault = null,
                   TaskSessionID = null,
                   SolutionID = null,
                   ReportTableColNames = [],
                   ColumnName = 'VoucherDate',
                   ReportName = 'SA_SaleOrderDetailRpt'
               }) {
        //获取数据
        // 判断请求：两次请求，第一次获取总共的记录。
        //第二次获取全部请求

        let requestOption = {
            request: {
                ReportName, PageIndex, PageSize,
                SearchItems: [{
                    ColumnName, BeginDefault, EndDefault,
                }], "ReportTableColNames": 'quantity', TaskSessionID, SolutionID
            }
        }
        const response = await this._call(requestOption)
        //第一次请求，不需要过多的数据

        //第二次请求，获取完整数据
        requestOption['request']['PageSize'] = response['TotalRecords']
        requestOption['request']['ReportTableColNames'] = ReportTableColNames.join(',')
        // logger.info(`${JSON.stringify(requestOption)} CALL`)
        const orders = await this._call(requestOption)
        if (orders['DataSource']) {
            return orders
        }
        logger.debug('orders["DataSource"]为空、原因不明，终止程序')
        process.exit(1)
    }

    async initMonthInfo(times) {
        const orders = await this.call({
            BeginDefault: times[0],
            EndDefault: times[1],
            ReportTableColNames: ['voucherdate', 'SaleOrderCode', 'partnerName',
                'personName', 'SaleOrderState', 'inventoryName', 'quantity', 'deliveryDate']
        })
        return orders['DataSource']['Rows']
    }

    flashTodayOrders() {
        this._requestTick = setInterval(async () => {
            if (!this._count) {
                logger.info(`清除定时器`)
                clearInterval(this._requestTick)
                logger.info(`退出登录 ${await this.logout(this._connect.getAccessToken())}`)
                logger.info(`等待1分钟`)
                await new Promise(resolve => {
                    setTimeout(() => {
                        resolve()
                    }, ONEMINUTE);
                }).then(async () => {
                    await this.init();
                })
            } else {
                const times = (new timeGenerator()).today();
                const length = this._todayInfo.length;
                this._todayInfo = (await this.call({
                    BeginDefault: times[0],
                    EndDefault: times[1]
                }))['DataSource']['Rows']
                logger.info(`today原本长度: ${length}、现在长度：${this._todayInfo.length}、剩余次数：${this._count}`)
                this._count -= 1
            }
        }, ONEMINUTE)
    }

    flashLoginInfo() {

    }

    setTodayInfo(datas) {
        this._todayInfo = [
            {
                voucherdate: '2020-07-14',
                SaleOrderCode: 'SO-2020-07-0327',
                partnerName: '湖南金妍商贸有限公司',
                personName: '尹帮松',
                SaleOrderState: '生效',
                inventoryName: '户外香槟金属',
                quantity: '50.000000',
                deliveryDate: '2020-07-16',
                GroupLevel: '0',
                rowType: 'D',
                reportRowType: null
            }
        ]
    }
}

module.exports = Connect
