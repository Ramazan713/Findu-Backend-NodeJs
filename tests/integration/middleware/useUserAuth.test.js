const request = require("supertest")
const mongoose = require("mongoose")
const useUserAuth = require("../../../middleware/useUserAuth")
const UserLevels = require("../../../constants/user_levels")


describe("useUserAuth middleware",()=>{

    let User
    let Instructor
    let token
    let user

    beforeEach(async()=>{
        server = require("../../../index")
        User = mongoose.model("User")
        Instructor = mongoose.model("Instructor")

        user = new User({email:"test@gmail.com",username:"username",password:"1234567"})
        await user.save()
        token = user.generateAuthToken()
    })

    afterEach(async()=>{
        await User.deleteMany()
        await Instructor.deleteMany()
        server.close()
    })

    const exec = ()=>{
        return request(server).get("/api/users/me")
            .set("x-auth-token",token)
    }



    it("should return 401 if no token is provided",async()=>{
        token = ""
        const res = await exec()
        expect(res.status).toBe(401)
    })

    it("should return 400 if no token is invalid",async()=>{
        token = "a"
        const res = await exec()
        expect(res.status).toBe(400)
    })

    it("should return 200 if token is valid",async()=>{
        const res = await exec()
        expect(res.status).toBe(200)
    })

    it("should return 403 if token is not user token",async()=>{
        const instructor = new Instructor({userId: user._id,email:user.email})
        await instructor.save()
        token = instructor.generateAuthToken()
        const res = await exec()
        expect(res.status).toBe(403)
    })


    it("should populate req.user with the playload of a valid JWT",()=>{
        const req = {
            header: jest.fn().mockReturnValue(token)
        }
        const next = jest.fn()
        const res = {}

        useUserAuth(req,res,next)
        expect(req.user).toMatchObject({id: user._id,userLevel:UserLevels.user})

    })

})

