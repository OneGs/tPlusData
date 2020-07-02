const {TplusOpenApiV1Client} = require('chanjet.tc.openapisdk.node')

const hostPort = 'http://121.89.206.102:8282'
const key = '349c89eb-440d-48a6-9398-9ca9fe24e29e'
const secret = '5yg8rz'

const username = '8888'
const password = 'sunzeyu123'
const company = '009'

const yes = '√'
const no = 'x'

class Query {

    constructor(host = hostPort, appKey = key, appSecret = secret) {
        this._connect = new TplusOpenApiV1Client(host, appKey, appSecret)
    }

    //请求的错误信息回调函数
    _messageShow(error, result) {
        if (error) {
            this._standardPrint(error.message, false)
        } else {
            this._standardPrint(result.toString())
        }
    }

    //标准的错误输格式——添加错误判断符号
    _standardPrint(message, isRight = true) {
        let symbol = yes
        if (!isRight) {
            symbol = no
        }
        console.log(symbol, new Date(), message)
    }

    // 解析string中的token
    _parseToken(error) {
        const jsonPatter = /{.*}/
        let errorJson = jsonPatter.exec(error.message)[0]
        try {
            errorJson = JSON.parse(errorJson)
        } catch (e) {
            this._messageShow(e)
        }
        return errorJson.data
    }

    //生成token
    _generateLoginData() {
        return this._connect.generateAccessTokenByPassword(
            username, password, company, new Date()).catch((error) => {
            this._messageShow(error)
            return this._parseToken(error)
        })
    }

    //重新登录
    _reLogin(loginData) {
        return this._connect.reLogin(loginData).then(value => {
            this._messageShow('', value.access_token)
            return value
        })
    }

    _saleOrderDetailRpt(reportName) {
        return this._connect.Call('reportQuery/GetReportData', {
            //    提供查询参数
            request: {
                //表格
                "ReportName": "SA_SaleOrderDetailRpt",
                // 起始页
                "PageIndex": 1,
                //一页最多可展示的数量
                "PageSize": 200,
                //查询条件
                SearchItems: [{
                    ColumnName: "VoucherDate",
                    BeginDefault: "2013-01-01",
                    // BeginDefaultText: "2013-01-01",
                    EndDefault: "2020-12-31",
                    // EndDefaultText: "2020-12-31"
                }
                ],
                //需要返回的内容
                "ReportTableColNames": "VoucherDate,VoucherCode,CustomerCode,CustomerName",
                //后续请求的ID、第一次请求返回
                "TaskSessionID": null,
                //后续请求的ID、第一次请求返回
                "SolutionID": null

            }
        }, this._connect.getAccessToken(), this._connect.getSid())
            .then(value => {
                value = JSON.parse(value)
                return value['TotalRecords']
            })
    }

    //获取
    async getReportInfo(reportName) {
        const loginData = await this._generateLoginData()
        await this._reLogin(loginData)
        //    此时得到token，可以开始请求数据
        return await this._saleOrderDetailRpt()
    }


}

module.exports = Query