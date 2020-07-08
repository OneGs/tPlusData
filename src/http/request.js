const timeGenerator = require('../utils/times')
const {Query} = require('../tPlus')
const query = new Query()


function createRequestOption({
                                 begin,
                                 end,
                                 ColumnName = 'VoucherDate',
                                 name = 'SA_SaleOrderDetailRpt',
                                 SessionID = null,
                                 SolutionID = null,
                                 tables = ['quantity']
                             }) {
    return {
        request: {
            "ReportName": name,
            "PageIndex": 1,
            "PageSize": 200,
            SearchItems: [{
                ColumnName: ColumnName,
                BeginDefault: begin,
                BeginDefaultText: begin,
                EndDefault: end,
                EndDefaultText: end
            }
            ],
            "ReportTableColNames": tables.join(','),
            "TaskSessionID": SessionID,
            "SolutionID": SolutionID
        }
    }
}

async function ordersCount(day) {
    let time = []
    switch (day) {
        case 'today':
            time = (new timeGenerator()).today()
            break
        case 'month':
            time = (new timeGenerator()).month()
            break
        case 'lastMonth':
            time = (new timeGenerator()).lastMouth()
            break
        case 'year':
            time = (new timeGenerator()).year()
            break
    }
    const orders = await query.getReportInfo(createRequestOption({
        begin: time[0],
        end: time[1]
        },
    ))
    return orders.reduce((total, val) => {
            return total + parseInt(val['quantity'])
        }, 0
    )
}

async function saleManOrder() {
    const time = (new timeGenerator()).month()
    const orders = await query.getReportInfo(createRequestOption(
        {
            begin: time[0],
            end: time[1],
            tables: ['personName', 'quantity']
        }
    ))
    let personRecord = {}
    orders.forEach(
        ({personName, quantity}) => {
            if(!(personName in personRecord)){
                personRecord[personName] = parseFloat(quantity)
            }else {
                personRecord[personName] += parseFloat(quantity)
            }
        }
    )
    return personRecord
}

async function ordersSixCount(){
    const six = (new timeGenerator()).lastNumberMonth(5)
    let times = six.next(),
        monthInfo = {};
    while (!times.done){
        const orders = await query.getReportInfo(
            createRequestOption({
                begin: times.value[0],
                end: times.value[1]
            })
        )
        if(!(times.value[0] in monthInfo)){
            monthInfo[times.value[0]] = orders.reduce((total, value) => {
                return total + parseFloat(value.quantity)
            }, 0)
        }
        times = six.next()
    }
    return monthInfo
}

// async function

module.exports = {
    ordersCount,
    saleManOrder,
    ordersSixCount
}

// ordersSixCount().then()
