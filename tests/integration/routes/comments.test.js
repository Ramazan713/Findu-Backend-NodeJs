const request = require("supertest")
const mongoose = require("mongoose")
const _ = require("lodash")


describe("/api/instructors/comments",()=>{
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


    describe("POST /",()=>{
        let instructorId
        let message
        let rating
        let user
        let instructor
        let token

        beforeEach(async()=>{
            user = new User({email:"example@gmail.com",username:"username",password:"password"})
            await user.save()

            instructor = new Instructor({userId: user._id,email: user.email,occupation: "Developer",name:"name1"})
            await instructor.save()

            instructorId = instructor._id
            token = user.generateAuthToken()

            message="sampleMessage"
            rating=4
        })

        afterEach(async()=>{
            await User.deleteMany()
            await Instructor.deleteMany()
        })

        const exec = async(body={message,rating,instructorId})=>{
            return await request(server).post("/api/instructors/comments")
                .set("x-auth-token",token)
                .send(body)
        }

        it("should return added comment",async()=>{
            const res = await exec()
            expect(res.body).toMatchObject({rating,message,instructorId,userId: user._id})
            expect(res.status).toBe(201)
        })

        it("should contains instructor comments array",async()=>{
            const res = await exec()
            const newInstructor = await Instructor.findById(instructorId)
            const commentUserIds = newInstructor.comments.map(e=>e.userId.toString())
            
            expect(commentUserIds).toContain(user._id.toString())
        })

        it("should return 401 if token not provided",async()=>{
            token=""
            const res = await exec()
            expect(res.status).toBe(401)
        })

        it("should return 404 if user not found",async()=>{
            await user.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })

        it("should return 404 if instructor not found",async()=>{
            await instructor.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })

        it("should return 400 if already comment added",async()=>{
            const newComment={message,rating,userId: user._id,instructorId}
            instructor.comments.push(newComment)
            await instructor.save()

            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if instructorId not provided",async()=>{
            const res = await exec({message,rating})
            expect(res.status).toBe(400)
        })

        it("should return 400 if message less than 3 characters",async()=>{
            message="ab"
            const res = await exec()
            expect(res.status).toBe(400)
        })
        
        it("should return 400 if message more than 1024 characters",async()=>{
            message=new Array(1026).join("a")
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if rating less than 1",async()=>{
            rating=0
            const res = await exec()
            expect(res.status).toBe(400)
        })
        
        it("should return 400 if rating more than 5",async()=>{
            rating=6
            const res = await exec()
            expect(res.status).toBe(400)
        })


    })

    describe("PUT /",()=>{
        let instructorId
        let message
        let rating
        let user
        let instructor
        let token

        beforeEach(async()=>{
            user = new User({email:"example@gmail.com",username:"username",password:"password"})
            await user.save()

            instructor = new Instructor({userId: user._id,email: user.email,occupation: "Developer",name:"name1",comments:[]})
            await instructor.save()

            instructorId = instructor._id
            token = user.generateAuthToken()

            instructor.comments.push({message:"myMessage",rating:3,userId: user._id, instructorId})
            await instructor.save()

            message="newSampleMessage"
            rating=4
        })

        afterEach(async()=>{
            await User.deleteMany()
            await Instructor.deleteMany()
        })

        const exec = async(body={message,rating,instructorId})=>{
            return await request(server).put("/api/instructors/comments")
                .set("x-auth-token",token)
                .send(body)
        }

        it("should return updatedComment",async()=>{
            const res=await exec()
            expect(res.body).toMatchObject({message,rating,userId:user._id,instructorId})
            expect(res.status).toBe(200)
        })

        it("should return 404 if user not add comment before",async()=>{
            instructor.comments = []
            await instructor.save()
            const res=await exec()
            expect(res.status).toBe(404)
        })

        it("should return 401 if token not provided",async()=>{
            token=""
            const res = await exec()
            expect(res.status).toBe(401)
        })

        it("should return 404 if user not found",async()=>{
            await user.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })

        it("should return 404 if instructor not found",async()=>{
            await instructor.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })

        it("should return 400 if instructorId not provided",async()=>{
            const res = await exec({message,rating})
            expect(res.status).toBe(400)
        })

        it("should return 400 if message less than 3 characters",async()=>{
            message="ab"
            const res = await exec()
            expect(res.status).toBe(400)
        })
        
        it("should return 400 if message more than 1024 characters",async()=>{
            message=new Array(1026).join("a")
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if rating less than 1",async()=>{
            rating=0
            const res = await exec()
            expect(res.status).toBe(400)
        })
        
        it("should return 400 if rating more than 5",async()=>{
            rating=6
            const res = await exec()
            expect(res.status).toBe(400)
        })
    })

    describe("DELETE /instructorId",()=>{
        let instructorId
        let message
        let rating
        let user
        let instructor
        let token

        beforeEach(async()=>{
            user = new User({email:"example@gmail.com",username:"username",password:"password"})
            await user.save()

            instructor = new Instructor({userId: user._id,email: user.email,occupation: "Developer",name:"name1"})
            await instructor.save()

            instructorId = instructor._id.toString()
            token = user.generateAuthToken()

            message="sampleMessage"
            rating=4

            instructor.comments.push({rating,message,userId: user._id,instructorId})
            await instructor.save()

        })

        afterEach(async()=>{
            await User.deleteMany()
            await Instructor.deleteMany()
        })

        const exec = async()=>{
            return await request(server).delete(`/api/instructors/comments/${instructorId}`)
                .set("x-auth-token",token)
        }

        it("should return deleted comment after successfully deleted",async()=>{
            const res = await exec()
            expect(res.body).toMatchObject({rating,message,userId: user._id,instructorId})
        })

        it("should delete from db",async()=>{
            const before = await Instructor.findById(instructorId)

            const res = await exec()
            
            const after = await Instructor.findById(instructorId)
        
            expect(before.comments.length).toBe(1)
            expect(after.comments.length).toBe(0)
        })

        it("should return 404 if comment not found",async()=>{
            instructor.comments = []
            await instructor.save()

            const res = await exec()
            expect(res.status).toBe(404)
        })


        it("should return 401 if token not provided",async()=>{
            token=""
            const res = await exec()
            expect(res.status).toBe(401)
        })

        it("should return 404 if user not found",async()=>{
            await user.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })

        it("should return 404 if instructor not found",async()=>{
            await instructor.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })

    })

})