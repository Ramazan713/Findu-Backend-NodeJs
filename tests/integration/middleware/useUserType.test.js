const request = require("supertest")
const mongoose = require("mongoose")
const useUserType = require("../../../middleware/useUserType")
const UserLevels = require("../../../constants/user_levels")


describe("useUserType middleware",()=>{

    let User
    let Instructor
    let Admin

    let token
    let user
    let instructor
    let admin


    beforeEach(async()=>{
        server = require("../../../index")
        User = mongoose.model("User")
        Instructor = mongoose.model("Instructor")
        Admin = mongoose.model("Admin")

        user = new User({email:"test@gmail.com",username:"username",password:"1234567"})
        await user.save()

        instructor = new Instructor({userId: user._id,email: user.email})
        await instructor.save()

        admin = new Admin({email:"admin@gmail.com",password:"123456789"})
        await admin.save()


        token = user.generateAuthToken()
    })

    afterEach(async()=>{
        await User.deleteMany()
        await Instructor.deleteMany()
        await Admin.deleteMany()
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
        token = instructor.generateAuthToken()
        const res = await exec()
        expect(res.status).toBe(403)
    })


    it("should populate req.userType if token not provided and userlevel includes anonymous ",()=>{
        const req = {
            header: jest.fn().mockReturnValue("")
        }
        const next = jest.fn()
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        }

        const userTypes = [UserLevels.anonymous,UserLevels.user]

        useUserType(...userTypes)(req,res,next)
        
        expect(req.userType).toEqual(UserLevels.anonymous)

    })

    it("should populate req.userType if token provided",()=>{
        const req = {
            header: jest.fn().mockReturnValue(token)
        }
        const next = jest.fn()
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        }

        const userTypes = [UserLevels.anonymous,UserLevels.user]

        useUserType(...userTypes)(req,res,next)
        
        expect(req.userType).toMatchObject({userLevel: UserLevels.user,id: user._id})

    })

})

