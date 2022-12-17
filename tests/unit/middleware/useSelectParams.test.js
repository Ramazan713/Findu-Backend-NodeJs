const SelectParam = require("../../../custom_models/select_param")
const useSelectParams = require("../../../middleware/useSelectParams")

describe("useSelectParams middleware",()=>{

    let next
    let res
    let req

    beforeEach(()=>{
        req = {query:{city:"City",country:"country",name:"name"}}
        next = jest.fn() 
        res = {}
    })

    it("should return fields we pass to parameters",()=>{
        const fieldsExpected = ["city","country"]

        useSelectParams(...fieldsExpected)(req,res,next)
        expect(req.query).toEqual(expect.objectContaining(req.fields))
    })

    it("should return fields we pass to parameters if exists",()=>{
        const fieldsExpected = ["city","country","age"]

        useSelectParams(...fieldsExpected)(req,res,next)
        expect(req.query).toEqual(expect.objectContaining(req.fields))
        expect(req.fields).not.toHaveProperty("age")
    })

    it("should return SelectParam type fields we pass to parameters",()=>{
        const fieldsExpected = [new SelectParam("city"),new SelectParam("name")]

        useSelectParams(...fieldsExpected)(req,res,next)
        expect(req.query).toEqual(expect.objectContaining(req.fields))
        expect(req.fields).toHaveProperty("city")
    })


    it("should return SelectParam type mixed regex fields we pass to parameters",()=>{
        const fieldsExpected = [new SelectParam("city",true),new SelectParam("name",false)]

        useSelectParams(...fieldsExpected)(req,res,next)
        
        let isCityRegex = req.fields["city"] instanceof RegExp
        let isNameRegex = req.fields["name"] instanceof RegExp
        
        expect(isCityRegex).toBeTruthy()
        expect(isNameRegex).not.toBeTruthy()
    })

})