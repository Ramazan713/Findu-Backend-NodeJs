const mongoose  = require("mongoose")

const useValidateObjectId = require("../../../middleware/useValidateObjectId")



describe("useValidateObjectId middleware",()=>{

    let next
    let res
    let req

    let id

    beforeEach(()=>{
        id = mongoose.Types.ObjectId()

        req = {params:{id}}
        next = jest.fn() 
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        }
    })


    it("should return 404 if params.id objectId is invalid",()=>{
        req.params.id = "myId"

        useValidateObjectId()(req,res,next)
        expect(res.status).toHaveBeenCalledWith(404)

    })

    it("should return 404 if param objectId is invalid",()=>{
        useValidateObjectId("myId")(req,res,next)

        expect(res.status).toHaveBeenCalledWith(404)
    })

    it("should call next if objectId is valid",()=>{
        useValidateObjectId()(req,res,next)
        expect(next).toHaveBeenCalled()
    })


})
