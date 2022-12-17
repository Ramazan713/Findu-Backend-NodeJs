const SelectParam = require("../custom_models/select_param")



module.exports = (...fields)=>(req,res,next)=>{
    const passedFields={}
    for(let field of fields){
        let fieldValue = field instanceof SelectParam ? field.key: field
        let isRegex = field instanceof SelectParam && field.isRegex
        let queryValue = req.query[fieldValue]

        if(queryValue){
            passedFields[fieldValue] = isRegex ? new RegExp(queryValue,"i") : queryValue
        }        
    }
    req.fields=passedFields
    next()
}