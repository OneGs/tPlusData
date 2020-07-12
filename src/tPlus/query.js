const {TplusOpenApiV1Client} = require('./auth')
const axios = require('axios')
const crypto = require('crypto')

const hostPort = 'http://121.89.206.102:8282'
const key = '349c89eb-440d-48a6-9398-9ca9fe24e29e'
const secret = '5yg8rz'

const username = '8888'
const password = 'sunzeyu123'
const company = '009'

const yes = '√'
const no = 'x'


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
        return (async () => {
            await this.generateAccessToken()
            return this
        })()
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

    call(requestOption) {
        return new Promise((resolve, reject) => {
            this._connect.Call('reportQuery/GetReportData', requestOption
                , this._connect.getAccessToken(), this._connect.getSid(), (error, value) => {
                    error ? reject(error) : resolve(value)
                })
        }).then(value => JSON.parse(value)).catch(error => error)
    }

    async getSaleCounts({
                            PageIndex = 1,
                            PageSize = 1,
                            BeginDefault = null,
                            EndDefault = null,
                            TaskSessionID = null,
                            SolutionID = null,
                            ReportTableColNames = ['quantity'],
                            ColumnName = 'VoucherDate',
                            ReportName = 'SA_SaleOrderDetailRpt'
                        }) {

        let requestOption = {
            request: {
                ReportName, PageIndex, PageSize,
                SearchItems: [{
                    ColumnName, BeginDefault, EndDefault,
                }], "ReportTableColNames": ReportTableColNames.join(','), TaskSessionID, SolutionID
            }
        }
        const response = await this.call(requestOption)

        requestOption['request']['PageSize'] = response['TotalRecords']
        return await this.call(requestOption)
    }

    async ordersQuantity(params) {
        const ordersInfo = await this.getSaleCounts({
            BeginDefault: params[0],
            EndDefault: params[1]
        })
        return ordersInfo && ordersInfo['DataSource']['Rows'].reduce(
            (total, value) => {
                return total + parseInt(value['quantity'])
            }, 0
        )
    }
}

module.exports = Connect
