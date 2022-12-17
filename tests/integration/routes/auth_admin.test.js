const request = require("supertest")
const mongoose = require("mongoose")
const _ = require("lodash")


describe("/api/auth/admin",()=>{
    let server
    let Admin

    beforeEach(async()=>{
        server = require("../../../index")
        Admin = mongoose.model("Admin")
        
    })

    afterEach(async()=>{
        await Admin.deleteMany()
        server.close()
    })

    describe("POST /signup",()=>{
        let email
        let password
        let name
        let surname
        let phone
        let args

        beforeEach(async()=>{
            email="eadmin@gmail.com"
            password="123456789"
            name = "name"
            surname="surname"
            phone="1234567"

            args={email,password,name,surname,phone}
        })

        afterEach(async()=>{
            await Admin.deleteMany()
        })

        const exec = async function(defaultArgs={email,password,name,surname,phone}){
            return await request(server).post("/api/auth/admin/signup")
                .send(defaultArgs)
        }

        it("should return success with admin token",async()=>{
            const res = await exec()
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty("token")
        })

        it("should return 400 if email is already used",async()=>{
            await new Admin({email,password}).save()
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

        it("should return 400 if email length is less than 7",async()=>{
            email = "123456"
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if email length is greater than 50",async()=>{
            email = new Array(52).join("a")
            const res = await exec()
            expect(res.status).toBe(400)
        })


        it("should return 400 if name length is less than 3",async()=>{
            name = "12"
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if name length is greater than 50",async()=>{
            name = new Array(52).join("a")
            const res = await exec()
            expect(res.status).toBe(400)
        })


        it("should return 400 if surname length is less than 3",async()=>{
            surname = "12"
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if surname length is greater than 50",async()=>{
            surname = new Array(52).join("a")
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if phone length is less than 7",async()=>{
            phone = "123456"
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if phone length is greater than 13",async()=>{
            phone = new Array(15).join("a")
            const res = await exec()
            expect(res.status).toBe(400)
        })


        it("should return 400 if email not provided",async()=>{
            delete args.email
            const res = await exec(args)
            expect(res.status).toBe(400)
        })

        it("should return 400 if password not provided",async()=>{
            delete args.password
            const res = await exec(args)
            expect(res.status).toBe(400)
        })
       
    })

    describe("POST /signin",()=>{
        let email
        let password

        let admin

        beforeEach(async()=>{
            email="admin@gmail.com"
            password="123456789"

            admin = new Admin({email,password})
            await admin.save()
        })

        afterEach(async()=>{
            await Admin.deleteMany()
        })

        const exec = async function(args={email,password}){
            return await request(server).post("/api/auth/admin/signin")
                .send(args)
        }


        it("should return success with token",async()=>{
            const res = await exec()
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty("token")
        })

        it("should return 404 if email wrong",async()=>{
            email = "new" + email
            const res = await exec()
            expect(res.status).toBe(404)
        })

        it("should return 404 if password wrong",async()=>{
            password += "new"
            const res = await exec()
            expect(res.status).toBe(404)
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

        it("should return 400 if password missing",async()=>{
            const res = await exec({email})
            expect(res.status).toBe(400)
        })

        it("should return 400 if email missing",async()=>{
            const res = await exec({password})
            expect(res.status).toBe(400)
        })

    })


})