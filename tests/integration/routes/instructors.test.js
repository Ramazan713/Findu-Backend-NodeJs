const request = require("supertest")
const mongoose = require("mongoose")
const config = require("config")
const _ = require("lodash")

describe("/api/instructors",()=>{
    let server
    let User
    let Instructor
    let Files

    beforeEach(async()=>{
        server = require("../../../index")
        User = mongoose.model("User")
        Instructor = mongoose.model("Instructor")
        Files = mongoose.model(`${config.get("bucketName")}.files`)
    })

    afterEach(async()=>{
        await User.deleteMany()
        await Instructor.deleteMany()
        await Files.deleteMany()
        server.close()
    })

    describe("GET /:id",()=>{
        let instructor
        let instructorId

        beforeEach(async()=>{
            let user = new User({email:"example@gmail.com",username:"username",password:"password"})
            await user.save()

            instructor = new Instructor({userId: user._id,email: user.email,occupation: "Developer",name:"name1"})
            await instructor.save()
            instructorId = instructor._id
        })

        afterEach(async()=>{
            await User.deleteMany()
            await Instructor.deleteMany()
        })

        const exec = async()=>{
            return await request(server).get(`/api/instructors/${instructorId}`)
        }

        it("should return instructor if valid inputs",async()=>{
            const res = await exec()
            expect(res.body._id.toString()).toEqual(instructor._id.toString())
        })

        it("should return 404 if instructor not found",async()=>{
            await instructor.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })

        it("should return 404 if id invalid",async()=>{
            instructorId="1154asdasda"
            const res = await exec()
            expect(res.status).toBe(404)
        })

    })

    describe("GET /me",()=>{
        let instructor
        let token

        beforeEach(async()=>{
            let user = new User({email:"example@gmail.com",username:"username",password:"password"})
            await user.save()

            instructor = new Instructor({userId: user._id,email: user.email,occupation: "Developer",name:"name1"})
            await instructor.save()

            token = instructor.generateAuthToken()
        })

        afterEach(async()=>{
            await User.deleteMany()
            await Instructor.deleteMany()
        })

        const exec = async()=>{
            return await request(server).get("/api/instructors/me")
                .set("x-auth-token",token)
        }

        it("should return instructor if valid inputs",async()=>{
            const res = await exec()
            expect(res.body._id.toString()).toEqual(instructor._id.toString())
        })

        it("should return 401 if token not provided",async()=>{
            token=""
            const res = await exec()
            expect(res.status).toBe(401)
        })

        it("should return 404 if instructor not found",async()=>{
            await instructor.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })

    })

    describe("GET /",()=>{
        let instructors = []
        let occupation
        let name

        beforeEach(async()=>{
            let user = new User({email:"example@gmail.com",username:"username",password:"password"})
            let user2 = new User({email:"example2@gmail.com",username:"username2",password:"password"})
            let user3 = new User({email:"example3@gmail.com",username:"username3",password:"password"})

            await user.save()
            await user2.save()
            await user3.save()

            let instructor1 = new Instructor({userId: user._id,email: user.email,occupation: "Developer",name:"name1"})
            let instructor2 = new Instructor({userId: user2._id,email: user2.email,occupation: "Developer2",name:"name2"})
            let instructor3 = new Instructor({userId: user3._id,email: user3.email,occupation: "Developer",name:"name3"})

            await instructor1.save()
            await instructor2.save()
            await instructor3.save()

            instructors.push(instructor1,instructor2,instructor3)
            occupation=""
            name=""
        })

        afterEach(async()=>{
            await User.deleteMany()
            await Instructor.deleteMany()
            instructors=[]
        })

        const exec = async()=>{
            return await request(server).get("/api/instructors").query({occupation,name})
        }


        it("should return all instructors",async()=>{
            const res = await exec()
            expect(res.body.length).toBe(instructors.length)
            let responseIds = res.body.map(e=>e._id.toString())
            let instructorIds = instructors.map(e=>e._id.toString())

            expect(responseIds).toEqual(expect.arrayContaining(instructorIds))
        })

        it("should return instructors with filtered occupation field",async()=>{
            occupation="DevelOPer2"
            const res = await exec()
            let instructorIds = instructors.filter(e=>e.occupation.match(new RegExp(occupation,"i"))).map(e=>e._id.toString())
            let responseIds = res.body.map(e=>e._id.toString())

            expect(instructorIds.length).not.toBe(0)
            expect(res.body.length).toBe(instructorIds.length)
            expect(responseIds).toEqual(expect.arrayContaining(instructorIds))
        })

        it("should return instructors with filtered Upper case name field",async()=>{
            name="NaME1"
            const res = await exec()
            let instructorIds = instructors.filter(e=>e.name.match(new RegExp(name,"i"))).map(e=>e._id.toString())
            let responseIds = res.body.map(e=>e._id.toString())

            expect(instructorIds.length).not.toBe(0)
            expect(responseIds.length).toBe(instructorIds.length)
            expect(responseIds).toEqual(expect.arrayContaining(instructorIds))
        })

        it("should not return comments attribute",async()=>{
            const res = await exec()
            res.body.forEach(e=>{
                expect(e.comments).toBeUndefined()
            })  
        })
    })


    describe("PATCH /",()=>{
        let instructor
        let instructor2
        let token

        beforeEach(async()=>{

            let user = new User({email:"example@gmail.com",username:"username",password:"password"})
            await user.save()

            let user2 = new User({email:"example2@gmail.com",username:"username2",password:"password"})
            await user2.save()

            instructor = new Instructor({userId: user._id,email: user.email,occupation: "Developer",name:"name1"})
            await instructor.save()
            token = instructor.generateAuthToken()

            instructor2 = new Instructor({userId: user2._id,email: user2.email})
            await instructor2.save()
        })

        afterEach(async()=>{
            await User.deleteMany()
            await Instructor.deleteMany()
        })

        const exec = async function(args,photoData){
            if(!photoData){
                return await request(server).patch(`/api/instructors/`)
                    .set("x-auth-token",token)
                    .send(args)
            }else{
                return await request(server).patch(`/api/instructors/`)
                    .set("x-auth-token",token)
                    .type("multipart/form-data")
                    .field(args)
                    .attach("photo",Buffer.from(photoData),{
                        filename:"index.jpg"
                    })
            }  
        }

        it("should return 401 if token not provided",async()=>{
            token=""
            const res = await exec()
            expect(res.status).toBe(401)
        })

        it("should return 404 if instructor not found",async()=>{
            await instructor.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })

        it("should return 400 if email address is already used",async()=>{
            const res = await exec({email:instructor2.email})
            expect(res.status).toBe(400)
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
            expect(res.body.email).not.toEqual(instructor.email)
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
            expect(res.body.name).not.toEqual(instructor.name)
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
            expect(res.body.surname).not.toEqual(instructor.surname)
        })

        it("should return 400 if occupation less than 3 characters",async()=>{
            let occupation="12"
            const res = await exec({occupation})
            expect(res.status).toBe(400)
        })
        
        it("should return 400 if occupation more than 100 characters",async()=>{
            let occupation=new Array(102).join("1")
            const res = await exec({occupation})
            expect(res.status).toBe(400)
        })

        it("should return updated occupation",async()=>{
            let occupation = "newOccupation"
            const res = await exec({occupation})
            expect(res.body.occupation).toEqual(occupation)
            expect(res.body.occupation).not.toEqual(instructor.occupation)
        })

        it("should return 400 if introText less than 2 characters",async()=>{
            let introText="a"
            const res = await exec({introText})
            expect(res.status).toBe(400)
        })
        
        it("should return 400 if introText more than 10000 characters",async()=>{
            let introText=new Array(10002).join("1")
            const res = await exec({introText})
            expect(res.status).toBe(400)
        })

        it("should return updated introText",async()=>{
            let introText = "newIntroText"
            const res = await exec({introText})
            expect(res.body.introText).toEqual(introText)
            expect(res.body.introText).not.toEqual(instructor.introText)
        })

        it("should remove old photo when new one uploaded",async()=>{

            const res = await exec({},"photoData")
            const oldPhotoId = res.body.photoId

            const newRes = await exec({},"newPhotoData")
            const photo = await Files.findById(oldPhotoId)
            expect(photo).toBeNull()
            expect(newRes.body.photoId).not.toEqual(oldPhotoId)
        })

        it("should add new photo when new one uploaded",async()=>{
            await exec({},"photoData")
            const newRes = await exec({},"newFotoData")
            const newPhotoId = newRes.body.photoId
            const photo = await Files.findById(newPhotoId)
            expect(photo).not.toBeNull()
            expect(newPhotoId.toString()).toEqual(photo._id.toString())
        })

    })


    describe("PUT /",()=>{
        let token
        let email
        let name
        let surname
        let introText
        let occupation
        let user
        let instructor
        let photoData
        let instructor2

        beforeEach(async()=>{
            name="newName"
            surname="newSurname"
            email="newtest@gmail.com"
            introText="newintroText"
            occupation="newoccupation"
            
            photoData="hello"


            user = new User({email:"test@gmail.com",username:"username",password:"password"})
            await user.save()


            instructor = new Instructor({userId: user._id,email: user.email,
                name:"name",surname:"surname",occupation:"occupation",introText:"introText"          
            })

            await instructor.save()
            token = instructor.generateAuthToken()

            instructor2 = new Instructor({userId: user._id,email: "testx@gmail.com"})
            await instructor2.save()
            
        })

        afterEach(async()=>{
            await User.deleteMany()
            await Instructor.deleteMany()
        })

        const exec = async function(args={name,surname,email,introText,occupation}){
            return await request(server).put(`/api/instructors/`)
                .set("x-auth-token",token)
                .type("multipart/form-data")
                .field(args)
                .attach("photo",Buffer.from(photoData),{
                    filename:"index.jpg",
                    contentType: 'text/plain',
                    knownLength: photoData.length
                })
        }

        it("should return 401 if token not provided",async()=>{
            token=""
            const res = await exec()
            expect(res.status).toBe(401)
        })

        it("should return updated instructor",async()=>{
            const res = await exec()
            expect(res.body).toMatchObject({name,surname,email,introText,occupation})
            expect(res.body).toHaveProperty("photoId")
            expect(res.status).toBe(200)
        })

        it("should do not change userId property",async()=>{
            const res = await exec()
            const updatedInstructor = await Instructor.findById(instructor._id)
            expect(updatedInstructor.userId.toString()).toEqual(instructor.userId.toString())
        })

        it("should return 404 if instructor not found",async()=>{
            await instructor.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })

        it("should return 400 if email address is already used",async()=>{
            email = instructor2.email
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

        it("should return 400 if occupation less than 3 characters",async()=>{
            occupation="12"
            const res = await exec()
            expect(res.status).toBe(400)
        })
        
        it("should return 400 if occupation more than 100 characters",async()=>{
            occupation=new Array(102).join("1")
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if introText less than 3 characters",async()=>{
            introText="a"
            const res = await exec()
            expect(res.status).toBe(400)
        })
        
        it("should return 400 if introText more than 10000 characters",async()=>{
            introText=new Array(10002).join("1")
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should remove old photo  when new one uploaded",async()=>{
            const res = await exec()
            const oldPhotoId = res.body.photoId

            photoData="newFotoData"
            const newRes = await exec()
            const oldPhoto = await Files.findById(oldPhotoId)
            expect(oldPhoto).toBeNull()
            expect(newRes.body.photoId).not.toEqual(oldPhotoId)
        })

        it("should add new photo when new one uploaded",async()=>{
            await exec()
            photoData="newFotoData"
            const newRes = await exec()
            const newPhotoId = newRes.body.photoId
            const newPhoto = await await Files.findById(newPhotoId)
            expect(newPhoto._id).not.toBeNull()
            expect(newPhotoId.toString()).toEqual(newPhoto._id.toString())
        })

    })

    describe("DELETE /:id",()=>{
        let user
        let instructor
        let instructor2
        let course
        let admin
        let Course
        let Category
        let Admin
        let token
        let instructorId
        let instructorPhoto
        let coursePhoto

        beforeEach(async()=>{
            Course = mongoose.model("Course")
            Category = mongoose.model("Category")
            Admin = mongoose.model("Admin")

            const category = new Category({name:"category1"})
            await category.save()

            instructorPhoto = new Files({length:14,chunckSize:15,filename:"testPhoto.jpg",contentType:"image/jpeg"})
            await instructorPhoto.save()

            coursePhoto = new Files({length:14,chunckSize:15,filename:"testCoursePhoto.jpg",contentType:"image/jpeg"})
            await coursePhoto.save()

            user = new User({username:"username",email:"test@gmail.com",password:"1234567"})
            await user.save()
        

            instructor = new Instructor({userId: user._id,email: user.email,photoId: instructorPhoto._id})
            await instructor.save()

            instructor2 = new Instructor({userId: user._id,email: "examplexx@gmail.com",photoId: instructorPhoto._id})
            await instructor2.save()
            
            course = new Course({instructorId: instructor._id,catId:category._id,name:"course",lessonType:"online",
                activeUntil:Date.now()+10000,price:50,photoId:coursePhoto._id})
            await course.save()

            admin = new Admin({email:"admin@gmail.com",password:"123456789"})

            token = instructor.generateAuthToken()
            instructorId = instructor._id.toString()
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
            return await request(server).delete(`/api/instructors/${instructorId}`)
                .set("x-auth-token",token)
        }
        it("should delete instructor and return deleted instructor",async()=>{
            const res = await exec()            
            expect(res.body).toMatchObject(_.pick(instructor,["_id","userId","photoId","email"]))
        })

        it("should return access denied if user delete instructor",async()=>{
            token = user.generateAuthToken()
            const res = await exec()
            expect(res.status).toBe(403)
        })

        it("should return access denied if instructor delete other instructor",async()=>{
            token = instructor2.generateAuthToken()
            const res = await exec()
            expect(res.status).toBe(403)
        })

        it("should remove courses and related with photos",async()=>{
            const res = await exec()
            
            const courses = await Course.find({instructorId})
            const newCoursePhoto = await Files.findById(coursePhoto._id)
            expect(courses.length).toBe(0)
            expect(newCoursePhoto).toBeNull()                 
            expect(res.status).toBe(200)
        })

        it("should remove instructor with admin token",async()=>{
            token = admin.generateAuthToken()
            const res = await exec()
            expect(res.status).toBe(200)
            expect(res.body._id).toBe(instructorId)
        })

        it("should return 404 if instructor not found",async()=>{
            await instructor.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })

        it("should return 401 if token not valid",async()=>{
            token=""
            const res = await exec()
            expect(res.status).toBe(401)
        })

        it("should remove instructor photo when instructor deleted",async()=>{
            const beforePhoto = await Files.findById(instructorPhoto._id) 
            const res = await exec()
            const afterPhoto = await Files.findById(instructorPhoto._id) 

            expect(beforePhoto).not.toBeNull()
            expect(afterPhoto).toBeNull()
        })

    })

})
