const timeGenerator = require('../utils/times')
const {Query} = require('../tPlus')
const query = new Query()


function createRequestOption(begin, end, ColumnName = 'VoucherDate', name = 'SA_SaleOrderDetailRpt',
                             SessionID = null, SolutionID = null, tables = ['quantity']) {
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
            time =(new timeGenerator()).lastMouth()
            break
        case 'year':
            time = (new timeGenerator()).year()
            break
    }
    const orders = await query.getReportInfo(createRequestOption(...time,
        ))
    return orders.reduce((total, val) => {
            return total + parseInt(val['quantity'])
        }, 0
    )
}



// async function

module.exports = {
    ordersCount
}