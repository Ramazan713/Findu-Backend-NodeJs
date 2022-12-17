const request = require("supertest")
const mongoose = require("mongoose")
const useAdminAuth = require("../../../middleware/useAdminAuth")
const UserLevels = require("../../../constants/user_levels")


describe("useUserAuth middleware",()=>{

    let User
    let Instructor
    let Admin
    let Course
    let Category

    let token
    let courseId
    let admin
    let user

    beforeEach(async()=>{
        server = require("../../../index")
        User = mongoose.model("User")
        Instructor = mongoose.model("Instructor")
        Course = mongoose.model("Course")
        Category = mongoose.model("Category")
        Admin = mongoose.model("Admin")


        user = new User({email:"test@gmail.com",username:"username",password:"password"})
        await user.save()

        const instructor = new Instructor({userId: user._id,email: user.email})
        await instructor.save()

        const category = new Category({name:"Cat1"})
        await category.save()

        const course = new Course({catId:category._id,lessonType:"online",price:50,name:"name",
            instructorId: instructor._id.toString(),activeUntil: Date.now() + 10000})
        await course.save()

        admin = new Admin({email:"test@gmail.com",password:"1234567"})
        await admin.save()

        courseId = course._id.toString()
        token = admin.generateAuthToken()
    })

    afterEach(async()=>{
        await User.deleteMany()
        await Instructor.deleteMany()
        await Course.deleteMany()
        await Category.deleteMany()
        await Admin.deleteMany()
        server.close()
    })

    const exec = ()=>{
        return request(server).post(`/api/admins/approveCourse/${courseId}`)
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

    it("should return 403 if token is not admin token",async()=>{
        token = user.generateAuthToken()
        const res = await exec()
        expect(res.status).toBe(403)
    })


    it("should populate req.admin with the playload of a valid JWT",()=>{
        const req = {
            header: jest.fn().mockReturnValue(token)
        }
        const next = jest.fn()
        const res = {}

        useAdminAuth(req,res,next)
        expect(req.admin).toMatchObject({id: admin._id,userLevel:UserLevels.admin})

    })

})

