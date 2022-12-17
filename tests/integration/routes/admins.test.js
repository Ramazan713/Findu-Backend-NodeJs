
const request = require("supertest")
const mongoose = require("mongoose")
const _ = require("lodash")


describe("/api/admins",()=>{
    let server
    let User
    let Instructor
    let Admin
    let Course
    let Category


    beforeEach(async()=>{
        server = require("../../../index")
        User = mongoose.model("User")
        Instructor = mongoose.model("Instructor")
        Course = mongoose.model("Course")
        Category = mongoose.model("Category")
        Admin = mongoose.model("Admin")
    })

    afterEach(async()=>{
        await User.deleteMany()
        await Instructor.deleteMany()
        await Course.deleteMany()
        await Category.deleteMany()
        await Admin.deleteMany()
        server.close()
    })


    describe("POST /approveCourse/:courseId",()=>{
        let token
        let courseId

        let admin
        let course


        beforeEach(async()=>{
            const user = new User({email:"test@gmail.com",username:"username",password:"password"})
            await user.save()

            const instructor = new Instructor({userId: user._id,email: user.email})
            await instructor.save()

            const category = new Category({name:"Cat1"})
            await category.save()

            course = new Course({catId:category._id,lessonType:"online",name:"name",city:"city",country:"country",price:100,
                instructorId: instructor._id.toString(),activeUntil: Date.now() + 10000})
            await course.save()

            admin = new Admin({email:"admin@gmail.com",password:"123456789"})
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
        })

        const exec = async()=>{
            return await request(server).post(`/api/admins/approveCourse/${courseId}`)
                .set("x-auth-token",token)
        }

        it("should approve unUpproved course and return approved course",async()=>{
            const res = await exec()
            const updatedCourse = await Course.findById(courseId)

            expect(res.body.isApproved).toBeTruthy()
            expect(course.isApproved).not.toBeTruthy()
            expect(updatedCourse.isApproved).toBeTruthy()
            expect(res.body).toMatchObject(_.pick(course,["catId","instructorId","name","city","country","price"]))
        })

        it("should return 404 if course not found",async()=>{
            await course.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })

        it("should return 404 if admin not found",async()=>{
            await admin.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })

    })


    describe("POST /disApproveCourse/:courseId",()=>{
        let token
        let courseId

        let admin
        let course


        beforeEach(async()=>{
            const user = new User({email:"test@gmail.com",username:"username",password:"password"})
            await user.save()

            const instructor = new Instructor({userId: user._id,email: user.email})
            await instructor.save()

            const category = new Category({name:"Cat1"})
            await category.save()

            course = new Course({catId:category._id,lessonType:"online",name:"name",city:"city",country:"country",price:100,
                instructorId: instructor._id.toString(),activeUntil: Date.now() + 10000,isApproved:true})
            await course.save()

            admin = new Admin({email:"admin@gmail.com",password:"123456789"})
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
        })

        const exec = async()=>{
            return await request(server).post(`/api/admins/disApproveCourse/${courseId}`)
                .set("x-auth-token",token)
        }

        it("should disapprove approved course and return disapprove course",async()=>{
            const res = await exec()
            const updatedCourse = await Course.findById(courseId)

            expect(res.body.isApproved).not.toBeTruthy()
            expect(course.isApproved).toBeTruthy()
            expect(updatedCourse.isApproved).not.toBeTruthy()
            expect(res.body).toMatchObject(_.pick(course,["catId","instructorId","name","city","country","price"]))
        })

        it("should return 404 if course not found",async()=>{
            await course.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })

        it("should return 404 if admin not found",async()=>{
            await admin.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })
    })


})
