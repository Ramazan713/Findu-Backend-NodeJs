const request = require("supertest")
const mongoose = require("mongoose")
const useInstructorAuth = require("../../../middleware/useInstructorAuth")
const UserLevels = require("../../../constants/user_levels")


describe("useInstructorAuth middleware",()=>{

    let User
    let Instructor
    let token
    let instructor
    let user

    beforeEach(async()=>{
        server = require("../../../index")
        User = mongoose.model("User")
        Instructor = mongoose.model("Instructor")

        user = new User({email:"test@gmail.com",username:"username",password:"1234567"})
        await user.save()

        instructor = new Instructor({userId: user._id,email:user.email})
        await instructor.save()

        token = instructor.generateAuthToken()
    })

    afterEach(async()=>{
        await User.deleteMany()
        await Instructor.deleteMany()
        server.close()
    })

    const exec = ()=>{
        return request(server).get("/api/instructors/me")
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

    it("should return 403 if token is instructor user token",async()=>{
        token = user.generateAuthToken()
        const res = await exec()
        expect(res.status).toBe(403)
    })


    it("should populate req.instructor with the playload of a valid JWT",()=>{
        const req = {
            header: jest.fn().mockReturnValue(token)
        }
        const next = jest.fn()
        const res = {}

        useInstructorAuth(req,res,next)
        expect(req.instructor).toMatchObject({id: instructor._id,userLevel:UserLevels.instructor})

    })

})

