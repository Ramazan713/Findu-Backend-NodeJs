const request = require("supertest")
const mongoose = require("mongoose")
const config = require("config")

describe("/api/users",()=>{
    let User
    let server

    beforeEach(async()=>{
        server = require("../../../index")
        User = mongoose.model("User")
    })

    afterEach(async()=>{
        server.close()
    })


    describe("GET /me",()=>{
        let token
        let user

        beforeEach(async()=>{
            user = new User({email:"test@gmail.com",username:"username",password:"1234567"})
            await user.save()
            token = user.generateAuthToken()
        })

        afterEach(async()=>{
            await User.deleteMany()
        })

        const exec=async()=>{
            return await request(server).get("/api/users/me")
            .set("x-auth-token",token)
        }

        it('should return current user',async()=>{
            const res=await exec()
            
            expect(res.body).toHaveProperty("_id","email","username","isVerified")
            expect(res.body._id).toEqual(user._id.toString())
            expect(res.body.email).toEqual(user.email)
        })

        it("should return 404 if user not found",async()=>{
            await user.remove()
            const res=await exec()
            expect(res.status).toBe(404)
        })

        it("should return 401 if token not valid",async()=>{
            token=""
            const res=await exec()
            expect(res.status).toBe(401)
        })

    })

    describe("PATCH /",()=>{
        let token
        let user
        let password

        beforeEach(async()=>{
            password = "1234567"

            user = new User({name:"name",email:"test@gmail.com",surname:"surname",phone:"123456789",
                username:"username",city:"myCity",country:"myCountry",password
            })
            await user.save()

            token = user.generateAuthToken()
            
        })

        afterEach(async()=>{
            await User.deleteMany()
        })


        const exec = async(args)=>{
            return request(server).patch("/api/users/")
                .set("x-auth-token",token)
                .send(args)
        }

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

        it("should return 400 if email address is already used",async()=>{
            let email="example2@gmail.com"
            await new User({username:"test2Username",email,password:"123456789"}).save()
            const res = await exec({email})
            expect(res.status).toBe(400)
        })

        it("should return 400 if username is already used",async()=>{
            let username="test2Username"
            await new User({username,email:"example2@gmail.com",password:"123456789"}).save()
            const res = await exec({username})
            expect(res.status).toBe(400)
        })
        
        it("should not return password property",async()=>{
            const res = await exec()
            expect(res.body).not.toHaveProperty("password")
        })
        
        it("should return 400 if username less than 3 characters",async()=>{
            let username="ab"
            const res = await exec({username})
            expect(res.status).toBe(400)
        })
        
        it("should return 400 if username more than 50 characters",async()=>{
            let username=new Array(52).join("a")
            const res = await exec({username})
            expect(res.status).toBe(400)
        })

        it("should return updated username",async()=>{
            let username = "newUsername"
            const res = await exec({username})
            expect(res.body.username).toEqual(username)
            expect(res.body.username).not.toEqual(user.username)
        })

        it("should return 400 if email less than 7 characters",async()=>{
            let email="abcedf"
            const res = await exec({email})
            expect(res.status).toBe(400)
        })
        
        it("should return 400 if email more than 50 characters",async()=>{
            let email=new Array(52).join("a")
            const res = await exec({email})
            expect(res.status).toBe(400)
        })

        it("should return updated email",async()=>{
            let email = "newEmail@gmail.com"
            const res = await exec({email})
            expect(res.body.email).toEqual(email)
            expect(res.body.email).not.toEqual(user.email)
        })

        it("should return 400 if name less than 3 characters",async()=>{
            let name="ab"
            const res = await exec({name})
            expect(res.status).toBe(400)
        })
        
        it("should return 400 if name more than 50 characters",async()=>{
            let name=new Array(52).join("a")
            const res = await exec({name})
            expect(res.status).toBe(400)
        })

        it("should return updated name",async()=>{
            let name = "newName"
            const res = await exec({name})
            expect(res.body.name).toEqual(name)
            expect(res.body.name).not.toEqual(user.name)
        })

        it("should return 400 if surname less than 3 characters",async()=>{
            let surname="ab"
            const res = await exec({surname})
            expect(res.status).toBe(400)
        })
        
        it("should return 400 if surname more than 50 characters",async()=>{
            let surname=new Array(52).join("a")
            const res = await exec({surname})
            expect(res.status).toBe(400)
        })

        it("should return updated surname",async()=>{
            let surname = "newSurname"
            const res = await exec({surname})
            expect(res.body.surname).toEqual(surname)
            expect(res.body.surname).not.toEqual(user.surname)
        })

        it("should return 400 if phone less than 7 characters",async()=>{
            let phone="123456"
            const res = await exec({phone})
            expect(res.status).toBe(400)
        })
        
        it("should return 400 if phone more than 13 characters",async()=>{
            let phone=new Array(15).join("1")
            const res = await exec({phone})
            expect(res.status).toBe(400)
        })

        it("should return updated phone",async()=>{
            let phone = "123456454"
            const res = await exec({phone})
            expect(res.body.phone).toEqual(phone)
            expect(res.body.phone).not.toEqual(user.phone)
        })

        it("should return 400 if city less than 2 characters",async()=>{
            let city="a"
            const res = await exec({city})
            expect(res.status).toBe(400)
        })
        
        it("should return 400 if city more than 50 characters",async()=>{
            let city=new Array(52).join("1")
            const res = await exec({city})
            expect(res.status).toBe(400)
        })

        it("should return updated city",async()=>{
            let city = "newCity"
            const res = await exec({city})
            expect(res.body.city).toEqual(city)
            expect(res.body.city).not.toEqual(user.city)
        })

        it("should return 400 if country less than 2 characters",async()=>{
            let country="a"
            const res = await exec({country})
            expect(res.status).toBe(400)
        })
        
        it("should return 400 if country more than 50 characters",async()=>{
            let country=new Array(52).join("a")
            const res = await exec({country})
            expect(res.status).toBe(400)
        })

        it("should return updated country",async()=>{
            let country = "newCountry"
            const res = await exec({country})
            expect(res.body.country).toEqual(country)
            expect(res.body.country).not.toEqual(user.country)
        })

    })

    describe("PUT /",()=>{
        let token
        let email
        let name
        let surname
        let username
        let phone
        let city
        let country
        let user
        let password

        beforeEach(async()=>{
            password = "1234567"
            name="newname"
            surname="newsurname"
            email="newtest@gmail.com"
            phone="12345678912"
            username="newusername"
            city="newmyCity"
            country="newmyCountry"

            user = new User({name:"name",email:"test@gmail.com",surname:"surname",phone:"123456789",
                username:"username",city:"city",country:"country",password
            })
            await user.save()

            token = user.generateAuthToken()
            
        })

        afterEach(async()=>{
            await User.deleteMany()
        })


        const exec = async(args={name,email,surname,phone,username,city,country})=>{
            return request(server).put("/api/users/")
                .set("x-auth-token",token)
                .send(args)
        }

        it("should return 401 if token not provided",async()=>{
            token=""
            const res = await exec()
            expect(res.status).toBe(401)
        })

        it("should return updated user",async()=>{
            const res = await exec()
            expect(res.body).toMatchObject({name,email,surname,phone,username,city,country})
            expect(res.status).toBe(200)
        })

        it("should do not change isVerified property",async()=>{
            await User.findOneAndUpdate({_id:user._id},{isVerified:true})
            const res = await exec()
            expect(res.body.isVerified).toBeTruthy()
        })

        it("should do not change password property",async()=>{
            const res = await exec()
            const updatedUser = await User.findById(user._id)
            const isPasswordEqual = updatedUser.comparePassword(password)
            expect(isPasswordEqual).toBeTruthy()
        })

        it("should return 404 if user not found",async()=>{
            await user.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })

        it("should return 400 if email address is already used",async()=>{
            email="example2@gmail.com"
            await new User({username:"test2Username",email,password:"123456789"}).save()
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if username is already used",async()=>{
            username="test2Username"
            await new User({username,email:"example2@gmail.com",password:"123456789"}).save()
            const res = await exec()
            expect(res.status).toBe(400)
        })
        
        it("should not return password property",async()=>{
            const res = await exec()
            expect(res.body).not.toHaveProperty("password")
        })
        
        it("should return 400 if username less than 3 characters",async()=>{
            username="ab"
            const res = await exec()
            expect(res.status).toBe(400)
        })
        
        it("should return 400 if username more than 50 characters",async()=>{
            username=new Array(52).join("a")
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if email less than 7 characters",async()=>{
            email="abcedf"
            const res = await exec()
            expect(res.status).toBe(400)
        })
        
        it("should return 400 if email more than 50 characters",async()=>{
            email=new Array(52).join("a")
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if name less than 3 characters",async()=>{
            name="ab"
            const res = await exec()
            expect(res.status).toBe(400)
        })
        
        it("should return 400 if name more than 50 characters",async()=>{
            name=new Array(52).join("a")
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if surname less than 3 characters",async()=>{
            surname="ab"
            const res = await exec()
            expect(res.status).toBe(400)
        })
        
        it("should return 400 if surname more than 50 characters",async()=>{
            surname=new Array(52).join("a")
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if phone less than 7 characters",async()=>{
            phone="123456"
            const res = await exec()
            expect(res.status).toBe(400)
        })
        
        it("should return 400 if phone more than 13 characters",async()=>{
            phone=new Array(15).join("1")
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if city less than 2 characters",async()=>{
            city="a"
            const res = await exec()
            expect(res.status).toBe(400)
        })
        
        it("should return 400 if city more than 50 characters",async()=>{
            city=new Array(52).join("1")
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if country less than 2 characters",async()=>{
            country="a"
            const res = await exec()
            expect(res.status).toBe(400)
        })
        
        it("should return 400 if country more than 50 characters",async()=>{
            country=new Array(52).join("a")
            const res = await exec()
            expect(res.status).toBe(400)
        })
        it("should update if only email and username provided",async()=>{
            const res = await exec({email,username})
            expect(res.body).toMatchObject({email,username})
            expect(res.body).not.toHaveProperty("name","surname","country","city","phone")
        })

    })

    describe("POST /changePassword",()=>{

        let user
        let password
        let token
        let newPassword

        beforeEach(async()=>{
            password="password123"
            newPassword="newPassword123"
            user = new User({email:"example@gmail.com",username:"username",password})
            await user.save()

            token = user.generateAuthToken()
        })

        afterEach(async()=>{
            await User.deleteMany()
        })

        const checkUserPassword = async(password)=>{
            const updatedUser = await User.findById(user._id)
            return updatedUser.comparePassword(password)
        }

        const exec = async()=>{
            return await request(server).post("/api/users/changePassword")
                .set("x-auth-token",token)
                .send({oldPassword:password,newPassword})
        }

        it("should return 200 if update password",async()=>{
            const res = await exec()
            expect(res.status).toBe(200)
            expect(await checkUserPassword(newPassword)).toBeTruthy()
        })

        it("should return 400 if oldPassword incorrect",async()=>{
            password = "wrongPassword"
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 404 if user not found",async()=>{
            await user.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })

        it("should return 401 if token not provided",async()=>{
            token = ""
            const res = await exec()
            expect(res.status).toBe(401)
        })

        it("should return 400 if newPassword length is lower than 5 characters",async()=>{
            newPassword = "123"
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if newPassword length is greater than 30 characters",async()=>{
            newPassword = new Array(32).join("1")
            const res = await exec()
            expect(res.status).toBe(400)
        })

    })

    describe("POST /sendVerificationToken",()=>{

        let user
        let token

        beforeEach(async()=>{
            user = new User({email:"test@gmail.com",username:"username",password:"password"})
            await user.save()

            token = user.generateAuthToken()
        })

        afterEach(async()=>{
            await User.deleteMany()
        })

        const exec = ()=>{
            return request(server).post("/api/users/sendVerificationToken")
            .set("x-auth-token",token)
        }

        it("should return 200",async()=>{
            const res = await exec()
            expect(res.status).toBe(200)
        })

        it("should return 404 if user deleted",async()=>{
            await user.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })

        it("should return 400 if user is already verified",async()=>{
            user.isVerified = true
            await user.save()
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 401 if token not provided",async()=>{
            token=""
            const res = await exec()
            expect(res.status).toBe(401)
        })


    })

    describe("GET /verify/:id/:token",()=>{

        let Token

        let user
        let tokenModel
        let tokenId
        let userId
        let userGeneratedToken

        beforeEach(async()=>{

            Token = mongoose.model("Token")

            user = new User({email:"test@gmail.com",username:"username",password:"password"})
            await user.save()

            userGeneratedToken = user.generateVerificationToken()

            tokenModel = new Token({userId: user._id,token: userGeneratedToken})
            await tokenModel.save()

            tokenId = tokenModel._id.toString()
            userId = user._id.toString()
        })

        afterEach(async()=>{
            await User.deleteMany()
            await Token.deleteMany()
        })

        const exec = ()=>{
            return request(server).get(`/api/users/verify/${userId}/${userGeneratedToken}`)
        }

        it("should return 200",async()=>{
            const res = await exec()
            expect(res.status).toBe(200)
        })

        it("should return 404 if user deleted",async()=>{
            await user.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })

        it("should return 404 if tokenModel deleted",async()=>{
            await tokenModel.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })


        it("should verify unVerified User",async()=>{
            const res = await exec()
            const updatedUser = await User.findById(userId)

            expect(user.isVerified).not.toBeTruthy()
            expect(updatedUser.isVerified).toBeTruthy()
        })

        it("should delete token after verified user",async()=>{
            const firstToken = await Token.findById(tokenId)
            const res = await exec()
            const lastToken = await Token.findById(tokenId)

            expect(lastToken).toBeNull()
            expect(firstToken).not.toBeNull()
        })


    })

    describe("DELETE /:id",()=>{
        let user
        let user2
        let instructor
        let course
        let admin
        let Course
        let Instructor
        let Category
        let Admin
        let token
        let userId
        let coursePhoto
        let instructorPhoto
        let Files

        beforeEach(async()=>{
            Instructor = mongoose.model("Instructor")
            Course = mongoose.model("Course")
            Category = mongoose.model("Category")
            Admin = mongoose.model("Admin")
            Files = mongoose.model(`${config.get("bucketName")}.files`)

            const category = new Category({name:"category1"})
            await category.save()

            instructorPhoto = new Files({length:14,chunckSize:15,filename:"testPhoto.jpg",contentType:"image/jpeg"})
            await instructorPhoto.save()

            coursePhoto = new Files({length:14,chunckSize:15,filename:"testUserPhoto.jpg",contentType:"image/jpeg"})
            await coursePhoto.save()

            user = new User({username:"username",email:"test@gmail.com",password:"1234567"})
            user2 = new User({username:"username2",email:"test2@gmail.com",password:"12345678"})
            await user.save()
            await user2.save()

            instructor = new Instructor({userId: user._id,email: "test3@gmail.com",photoId: user._id,photoId: instructorPhoto._id})
            await instructor.save()
            
            course = new Course({instructorId: instructor._id,catId:category._id,name:"course",lessonType:"online",
                activeUntil:Date.now()+10000,price:50,photoId: coursePhoto._id})
            await course.save()

            admin = new Admin({email:"admin@gmail.com",password:"123456789"})

            token = user.generateAuthToken()
            userId = user._id.toString()
        })

        afterEach(async()=>{
            await User.deleteMany()
            await Course.deleteMany()
            await Category.deleteMany()
            await Instructor.deleteMany()
            await Admin.deleteMany()
            await Files.deleteMany()
        })

        const exec=async()=>{
            return await request(server).delete(`/api/users/${userId}`)
                .set("x-auth-token",token)
        }

        it("should return access denied if user delete other user",async()=>{
            token = user2.generateAuthToken()
            const res = await exec()
            expect(res.status).toBe(403)
        })

        it("should return success with deleted user",async()=>{
            const res = await exec()
            expect(res.status).toBe(200)
            expect(res.body._id).toBe(user._id.toString())
            
        })
        it("should remove related instructor and courses",async()=>{
            const res = await exec()
            
            const newInstructor = await Instructor.findById(instructor._id)
            const photoInstructor = await Files.findById(instructorPhoto._id)
            
            const course = await Course.findById(user._id)
            const photoCourse = await Files.findById(coursePhoto._id)
            const courses = await Course.find({instructorId:instructor._id.toString()})
            
            expect(courses.length).toBe(0)
            expect(course).toBeNull()
            expect(photoCourse).toBeNull()
            expect(newInstructor).toBeNull()
            expect(photoInstructor).toBeNull()              
            expect(res.status).toBe(200)
        })

        it("should remove user with admin token",async()=>{
            token = admin.generateAuthToken()
            const res = await exec()
            expect(res.status).toBe(200)
            expect(res.body._id).toBe(user._id.toString())
        })

        it("should return 404 if user not found",async()=>{
            await user.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })

        it("should return 401 if token not valid",async()=>{
            token=""
            const res = await exec()
            expect(res.status).toBe(401)
        })

    })


})