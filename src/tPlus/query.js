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

    _saleOrderDetailRpt(requestOption) {
        return this._connect.Call('reportQuery/GetReportData', requestOption
            //    提供查询参数
            , this._connect.getAccessToken(), '')
            .then(value => {
                value = JSON.parse(value)
                return value
            })
    }

    //获取
    async getReportInfo(params) {
        if (typeof params !== 'object') {
            throw new Error(`${params} is not a json`)
        }
        const loginData = await this._generateLoginData()
        await this._reLogin(loginData)
        // //    此时得到token，可以开始请求数据
        let row = []
        let datas = await this._saleOrderDetailRpt(params)
        row = row.concat(datas['DataSource']['Rows'])
        while (datas['TotalRecords'] &&  datas['PageIndex'] * 200 <= datas['TotalRecords']) {
            params.request['PageIndex'] += 1
            params.request['TaskSessionID'] = datas['TaskSessionID']
            params.request['SolutionID'] = datas['SolutionID']
            datas = await this._saleOrderDetailRpt(params)
            row = row.concat(datas['DataSource']['Rows'])
        }
           // 还需要记录最后一个的数据
        return row
    }
}

module.exports = Query

// let a = new Query()
//
// a.getReportInfo({
//     request: {
//         "ReportName": "SA_SaleOrderDetailRpt",
//         "PageIndex": 1,
//         "PageSize": 200,
//         SearchItems: [{
//             ColumnName: "VoucherDate",
//             BeginDefault: "2020-06-01",
//             EndDefault: "2020-06-30",
//         }
//         ],
//         "ReportTableColNames": "VoucherDate,VoucherCode,CustomerCode,CustomerName",
//         "TaskSessionID": null,
//         "SolutionID": null
//     }
// }).then(value => {
//     console.log(value)
// })