const request = require("supertest")
const mongoose = require("mongoose")
const _ = require("lodash")


describe("/api/auth/user",()=>{
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


    describe("POST /signup",()=>{

        let Token

        let username
        let password
        let email

        let otherUser
        let otherInstructor

        beforeEach(async()=>{
            Token = mongoose.model("Token")

            otherUser = new User({email:"user@gmail.com",username:"username",password:"password"})
            await otherUser.save()

            otherInstructor = new Instructor({userId: otherUser._id,email: "instructor@gmail.com"})
            await otherInstructor.save()

            username="myUsername"
            password="myPassword"
            email="mytest@gmail.com"
        })

        afterEach(async()=>{
            await Token.deleteMany()
            await User.deleteMany()
            await Instructor.deleteMany()
        })

        const exec = async(args={password,email,username})=>{
            return await request(server).post("/api/auth/user/signup")
                .send(args)
        }

        it("should return success with token",async()=>{
            const res = await exec()
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty("token")
        })

        it("should return 400 if email is already used by user",async()=>{
            email=otherUser.email
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if email is already used by instructor",async()=>{
            email=otherInstructor.email
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if username used",async()=>{
            username = otherUser.username
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if username length is less than 3",async()=>{
            username = "as"
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if username length is greater than 50",async()=>{
            username = new Array(52).join("a")
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if email length is less than 7",async()=>{
            email = new Array(8).join("a")
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if email length is greater than 50",async()=>{
            email = new Array(52).join("a")
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if password length is less than 5",async()=>{
            password = "1234"
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if password length is greater than 30",async()=>{
            password = new Array(32).join("a")
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if email missing",async()=>{
            const res = await exec({password,username})
            expect(res.status).toBe(400)
        })

        it("should return 400 if password missing",async()=>{
            const res = await exec({email,username})
            expect(res.status).toBe(400)
        })

        it("should return 400 if username missing",async()=>{
            const res = await exec({password,email})
            expect(res.status).toBe(400)
        })

    })

    describe("POST /signin",()=>{
        let username
        let password
        let email

        let user

        beforeEach(async()=>{
            username="myUsername"
            password="myPassword"
            email="user@gmail.com"

            user = new User({email,username,password})
            await user.save()
        })

        afterEach(async()=>{
            await User.deleteMany()
        })

        const exec = async(args)=>{
            return await request(server).post("/api/auth/user/signin")
                .send(args)
        }

        it("should return success with token",async()=>{
            const res = await exec({password,email})
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty("token")
        })

        it("should return success if username and email provided at the same time",async()=>{
            const res = await exec({password,email,username})
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty("token")
        })


        it("should return token with username login",async()=>{
            const res = await exec({username,password})
            expect(res.body).toHaveProperty("token")
        })

        it("should return token with email login",async()=>{
            const res = await exec({password,email})
            expect(res.body).toHaveProperty("token")
        })

        it("should return 404 if email wrong",async()=>{
            email = "new" + email
            const res = await exec({password,email})
            expect(res.status).toBe(404)
        })

        it("should return 404 if username wrong",async()=>{
            username += "new"
            const res = await exec({password,username})
            expect(res.status).toBe(404)
        })

        it("should return 404 if password wrong",async()=>{
            password += "new"
            const res = await exec({password,username})
            expect(res.status).toBe(404)
        })

        it("should return 400 if email and username missing",async()=>{
            const res = await exec({password})
            expect(res.status).toBe(400)
        })

        it("should return 400 if password missing",async()=>{
            const res = await exec({username})
            expect(res.status).toBe(400)
        })

        it("should return 400 if username length is less than 3",async()=>{
            username = "as"
            const res = await exec({username,password})
            expect(res.status).toBe(400)
        })

        it("should return 400 if username length is greater than 50",async()=>{
            username = new Array(52).join("a")
            const res = await exec({username,password})
            expect(res.status).toBe(400)
        })

        it("should return 400 if email length is less than 7",async()=>{
            email = new Array(8).join("a")
            const res = await exec({email,password})
            expect(res.status).toBe(400)
        })

        it("should return 400 if email length is greater than 50",async()=>{
            email = new Array(52).join("a")
            const res = await exec({email,password})
            expect(res.status).toBe(400)
        })

        it("should return 400 if password length is less than 5",async()=>{
            password = "1234"
            const res = await exec({email,password})
            expect(res.status).toBe(400)
        })

        it("should return 400 if password length is greater than 30",async()=>{
            password = new Array(32).join("a")
            const res = await exec({email,password})
            expect(res.status).toBe(400)
        })
    })


    describe("POST /switchToUser",()=>{
        let token

        let user
        let instructor

        beforeEach(async()=>{
            user = new User({email:"user@gmail.com",username:"username",password:"password"})
            await user.save()

            instructor = new Instructor({userId: user._id,email: "instructor@gmail.com"})
            await instructor.save()

            token = instructor.generateAuthToken()
        })

        afterEach(async()=>{
            await User.deleteMany()
            await Instructor.deleteMany()
        })

        const exec = async()=>{
            return await request(server).post("/api/auth/user/switchToUser")
                .set("x-auth-token",token)
                
        }

        it("should return user token",async()=>{
            const res = await exec()
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty("token")
        })

        it("should return 404 if instructor not found",async()=>{
            await instructor.remove()
            const res = await exec()
            expect(res.status).toBe(404)
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

    })


})