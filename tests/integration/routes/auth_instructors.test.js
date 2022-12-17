const request = require("supertest")
const mongoose = require("mongoose")
const _ = require("lodash")


describe("/api/auth/instructor",()=>{
    let server
    let User
    let Instructor

    beforeEach(async()=>{
        server = require("../../../index")
        User = mongoose.model("User")
        Instructor = mongoose.model("Instructor")
    })

    afterEach(async()=>{
        await User.deleteMany()
        await Instructor.deleteMany()
        server.close()
    })

    describe("POST /switchToInstructor",()=>{
        let token

        let user
        let instructor

        beforeEach(async()=>{
            user = new User({email:"user@gmail.com",username:"username",password:"password"})
            await user.save()

            instructor = new Instructor({userId: user._id,email: "instructor@gmail.com"})
            await instructor.save()

            token = user.generateAuthToken()
        })

        afterEach(async()=>{
            await User.deleteMany()
            await Instructor.deleteMany()
        })

        const exec = async()=>{
            return await request(server).post("/api/auth/instructor/switchToInstructor")
                .set("x-auth-token",token)
                
        }


        it("should return instructor token",async()=>{
            const res = await exec()
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty("token")
        })

        it("should return 404 if user not found",async()=>{
            await user.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })

        it("should return 401 if token not provided",async()=>{
            token=""
            const res = await exec()
            expect(res.status).toBe(401)
        })

        it("should create new instructor with related userId if instructor not exists",async()=>{
            await instructor.remove()
            const res = await exec()

            const newInstructor = await Instructor.findOne({userId: user._id})
            const oldInstructor = await Instructor.findById(instructor._id)
            
            expect(oldInstructor).toBeNull()
            expect(newInstructor).not.toBeNull()
            expect(res.body).toHaveProperty("token")
        })
    })

})