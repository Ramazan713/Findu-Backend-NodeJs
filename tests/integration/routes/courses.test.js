const request = require("supertest")
const mongoose = require("mongoose")
const config = require("config")
const _ = require("lodash")


describe("/api/courses",()=>{
    let server
    let User
    let Instructor
    let Files
    let Course
    let Category


    beforeEach(async()=>{
        server = require("../../../index")
        User = mongoose.model("User")
        Instructor = mongoose.model("Instructor")
        Course = mongoose.model("Course")
        Category = mongoose.model("Category")
        Files = mongoose.model(`${config.get("bucketName")}.files`)
    })

    afterEach(async()=>{
        await User.deleteMany()
        await Instructor.deleteMany()
        await Files.deleteMany()
        await Course.deleteMany()
        await Category.deleteMany()
        server.close()
    })


    describe("GET /",()=>{
        let Admin

        let user
        let category
        let courses

        let catId1
        let catId2
        let counter
        let token
        
        beforeEach(async()=>{
            Admin = mongoose.model("Admin")

            user = new User({email:"test@gmail.com",username:"username",password:"password"})
            await user.save()

            counter=0

            category = new Category({name:"Cat1"})
            await category.save()
            catId1 = category._id.toString()

            const category2 = new Category({name:"Cat2"})
            await category2.save()
            catId2 = category2._id.toString()

            const course1 = await createCourseWithInstructor({city:"city1_c2",country:"country2"})
            const course2 = await createCourseWithInstructor({city:"city1_c1",country:"country1",
                lessonType:"inPerson",instructorId: course1.instructorId})
            const course3 = await createCourseWithInstructor({city:"city2_c1",country:"country1",catId:catId2})
            const course4 = await createCourseWithInstructor({city:"city2_c1",country:"country1",lessonType:"inPerson",catId:catId2})
            const course5 = await createCourseWithInstructor({city:"city1_c2",country:"country2",lessonType:"inPerson"})
            const course6 = await createCourseWithInstructor({city:"city1_c1",country:"country1",catId:catId2})

            const course7 = await createCourseWithInstructor({isApproved: false,lessonType:"inPerson"})
            const course8 = await createCourseWithInstructor({isApproved: false,city:"city1_c1",catId:catId2})
            const course9 = await createCourseWithInstructor({activeUntil: Date.now()-500})
            const course10 = await createCourseWithInstructor({})

            courses = [course1,course2,course3,course4,course5,course6,course7,course8,course9,course10]
            token=""
            
        })

        afterEach(async()=>{
            await User.deleteMany()
            await Instructor.deleteMany()
            await Course.deleteMany()
            await Category.deleteMany()
            await Admin.deleteMany()
        })

        async function createCourseWithInstructor({lessonType="online",isApproved=true,activeUntil = Date.now() + 10000,
            city="city1_c1",country="country1",catId=catId1}){
            const instructor = new Instructor({userId: user._id,email: `${++counter}@gmail.com`})
            await instructor.save()
            return await createCourse({instructorId:instructor._id.toString(),lessonType,isApproved,activeUntil,catId,city,country})
        }

        const createCourse = async({instructorId,lessonType="online",isApproved=true,activeUntil = Date.now() + 10000,
            city="city",country="country",catId})=>{
            const course = new Course({catId,lessonType:lessonType,name:`${++counter}name`,city:city,country:country,price:100,
                instructorId: instructorId,activeUntil: activeUntil,isApproved: isApproved})
            await course.save()
            return course
        }

        const getActiveCourses = (arrCourses=courses)=>{
            return arrCourses.filter(e=>e.isApproved&&Date.parse(e.activeUntil)>Date.now())
        }

        const exec = async(queries={})=>{
            return await request(server).get(`/api/courses`)
                .set("x-auth-token",token)
                .query(queries)
        }

        it("should return all approved courses",async()=>{
            const activeCourses = getActiveCourses()
            const res = await exec()
            expect(res.body.length).toBe(activeCourses.length)
        })

        it("should return lessonType of inPerson courses",async()=>{
            const arrCourses = getActiveCourses().filter(x=>x.lessonType==="inPerson")
            const res = await exec({lessonType:"inPerson"})
            expect(arrCourses.length).not.toBe(0)
            expect(res.body.length).toBe(arrCourses.length)
        })

        it("should return lessonType of online courses",async()=>{
            const arrCourses = getActiveCourses().filter(x=>x.lessonType==="online")
            const res = await exec({lessonType:"online"})
            expect(arrCourses.length).not.toBe(0)
            expect(res.body.length).toBe(arrCourses.length)
        })

        it("should return courses with city parameter",async()=>{
            const arrCourses = getActiveCourses()
            const city = arrCourses[0].city
            const cityFilteredCourses = arrCourses.filter(e=>e.city.match(new RegExp(city,"i")))
            const res = await exec({city})
            expect(cityFilteredCourses.length).not.toBe(0)
            expect(res.body.length).toBe(cityFilteredCourses.length)
        })

        it("should return courses with Upper case city parameter",async()=>{
            const arrCourses = getActiveCourses()
            const city = arrCourses[0].city
            const cityFilteredCourses = arrCourses.filter(e=>e.city===city)
            const res = await exec({city:city.toUpperCase()})
            expect(cityFilteredCourses.length).not.toBe(0)
            expect(res.body.length).toBe(cityFilteredCourses.length)
        })

        it("should return courses with country parameter",async()=>{
            const arrCourses = getActiveCourses()
            const country = arrCourses[0].country
            const countryFilteredCourses = arrCourses.filter(e=>e.country.match(new RegExp(country,"i")))
            const res = await exec({country})
            expect(countryFilteredCourses.length).not.toBe(0)
            expect(res.body.length).toBe(countryFilteredCourses.length)
        })

        it("should return courses with catId parameter",async()=>{
            const arrCourses = getActiveCourses()
            const catId = arrCourses[0].catId.toString()
            const catIdFilteredCourses = arrCourses.filter(e=>e.catId.toString()===catId.toString())
            const res = await exec({catId})
            expect(catIdFilteredCourses.length).not.toBe(0)
            expect(res.body.length).toBe(catIdFilteredCourses.length)
        })

        it("should return courses with instructorId parameter",async()=>{
            const arrCourses = getActiveCourses()
            const instructorId = arrCourses[0].instructorId.toString()
            const instructorIdFilteredCourses = arrCourses.filter(e=>e.instructorId.toString()===instructorId.toString())
            const res = await exec({instructorId})
            expect(instructorIdFilteredCourses.length).not.toBe(0)
            expect(res.body.length).toBe(instructorIdFilteredCourses.length)
        })

        it("should return courses with name parameter",async()=>{
            const arrCourses = getActiveCourses()
            const name = arrCourses[0].name
            const nameFilteredCourses = arrCourses.filter(e=>e.name.match(new RegExp(name,"i")))
            const res = await exec({name})
            expect(nameFilteredCourses.length).not.toBe(0)
            expect(res.body.length).toBe(nameFilteredCourses.length)
        })

        it("should return unapproved courses if token is admin token",async()=>{
            admin = await new Admin({email:"admin@gmail.com",password:"123456789"}).save()
            token = admin.generateAuthToken()
            const res = await exec({isApproved:false})
            const unApprovedCourses = courses.filter(e=>!e.isApproved)
            expect(unApprovedCourses.length).not.toBe(0)
            expect(res.body.length).toBe(unApprovedCourses.length)
        })

        it("should return approved courses if token is admin token and isApprove parameter omitted",async()=>{
            admin = await new Admin({email:"admin@gmail.com",password:"123456789"}).save()
            token = admin.generateAuthToken()
            const res = await exec()
            const activeCourses = getActiveCourses()
            expect(activeCourses.length).not.toBe(0)
            expect(res.body.length).toBe(activeCourses.length)
        })

        it("should return approved courses even if isApproved is false",async()=>{
            const res = await exec({isApproved:false})
            const unApprovedCourses = courses.filter(e=>!e.isApproved)
            expect(unApprovedCourses.length).not.toBe(0)
            expect(res.body.length).not.toBe(unApprovedCourses.length)
            expect(res.body.length).toBe(getActiveCourses().length)
        })

        it("should not return isApproved true but activeUntil behind current date courses",async()=>{
            const res = await exec()
            const unActiveCourses = courses.filter(e=>e.isApproved&&Date.parse(e.activeUntil)<Date.now())
            const activeCourseIds = res.body.map(e=>e._id.toString())
            const unActiveCourseIds = unActiveCourses.map(e=>e._id.toString())
            
            expect(unActiveCourses.length).not.toBe(0)
            expect(activeCourseIds).not.toEqual(expect.arrayContaining(unActiveCourseIds))
        })
    })

    describe("GET /:id",()=>{
        let user
        let category
        let courses

        let catId
        let counter
        
        beforeEach(async()=>{

            user = new User({email:"test@gmail.com",username:"username",password:"password"})
            await user.save()

            counter=0

            category = new Category({name:"Cat1"})
            await category.save()

            catId = category._id.toString()

            const course1 = await createCourseWithInstructor({})
            const course2 = await createCourseWithInstructor({isApproved: false})
            const course3 = await createCourseWithInstructor({activeUntil: Date.now()-500})
            const course4 = await createCourseWithInstructor({})

            courses = [course1,course2,course3,course4]
            
        })

        afterEach(async()=>{
            await User.deleteMany()
            await Instructor.deleteMany()
            await Files.deleteMany()
            await Course.deleteMany()
            await Category.deleteMany()
        })

        async function createCourseWithInstructor({lessonType="online",isApproved=true,activeUntil = Date.now() + 10000}){
            const instructor = new Instructor({userId: user._id,email: `${++counter}@gmail.com`})
            await instructor.save()
            return await createCourse({instructorId:instructor._id.toString(),lessonType:lessonType,isApproved: isApproved,activeUntil: activeUntil})
        }

        const createCourse = async({instructorId,lessonType="online",isApproved=true,activeUntil = Date.now() + 10000})=>{
            const course = new Course({catId,lessonType:lessonType,name:"name",city:"city",country:"country",price:100,
                instructorId: instructorId,activeUntil: activeUntil,isApproved: isApproved})
            await course.save()
            return course
        }

        const getActiveCourses = (arrCourses=courses)=>{
            return arrCourses.filter(e=>e.isApproved&&Date.parse(e.activeUntil)>Date.now())
        }

        const exec = async(courseId)=>{
            return await request(server).get(`/api/courses/${courseId}`)
        }


        it("should return course if course is isApproved and active",async()=>{
            const sample = getActiveCourses()[0]
            const res = await exec(sample._id.toString())
            expect(res.body).toMatchObject(_.pick(sample,["catId","lessonType","name","city","country","price","instructorId"]))
            expect(res.body).toHaveProperty("_id")
        })

        it("should return 404 if course is not approved",async()=>{
            const sample = courses.filter(e=>!e.isApproved)[0]
            const res = await exec(sample._id.toString())
            expect(res.status).toBe(404)
        })

        it("should return 404 if course is deleted",async()=>{
            const sample = getActiveCourses()[0]
            await sample.remove()
            const res = await exec(sample._id.toString())
            expect(res.status).toBe(404)
        })

        it("should return 404 if course activeUntil is less than current date",async()=>{
            const sample = courses.filter(e=>Date.parse(e.activeUntil)<Date.now())[0]
            const res = await exec(sample._id.toString())
            expect(sample).not.toBeNull()
            expect(res.status).toBe(404)
        })
    })


    describe("POST /",()=>{
        let user
        let instructor
        let token
        let category

        let catId
        let name
        let city
        let country
        let price
        let activeUntil
        let lessonType
        let photoData
        let body
        
        beforeEach(async()=>{
            user = new User({email:"test@gmail.com",username:"username",password:"password"})
            await user.save()

            instructor = new Instructor({userId: user._id,email: user.email})
            await instructor.save()

            category = new Category({name:"Cat1"})
            await category.save()


            token = instructor.generateAuthToken()
            catId = category._id.toString()
            photoData = "sampleData"

            name = "sampleName"
            city = "city"
            country = "myCountry"
            price = 13
            activeUntil = Date.now() + 10000
            lessonType = "online"
            body = {catId,name,city,country,price,activeUntil,lessonType}

        })

        afterEach(async()=>{
            await User.deleteMany()
            await Instructor.deleteMany()
            await Files.deleteMany()
            await Course.deleteMany()
            await Category.deleteMany()
        })


        const exec = async(bodyReq={catId,name,city,country,price,activeUntil,lessonType},photo=photoData)=>{

            if(photo==null){
                return await request(server).post("/api/courses")
                .set("x-auth-token",token)
                .send(bodyReq)
            }else{
                return await request(server).post("/api/courses")
                .set("x-auth-token",token)
                .field(bodyReq)
                .type("multipart/form-data")
                .attach("photo",Buffer.from(photo),{filename:"test.jpg",contentType: 'text/plain',}) 
            }
            
        }


        it("should return added course",async()=>{
            const res = await exec()
            expect(res.body).toMatchObject({catId,name,city,country,price,lessonType})
            expect(res.body).toHaveProperty("photoId")
            expect(res.body).toHaveProperty("instructorId")
            expect(res.body).toHaveProperty("_id")
            expect(res.body).toHaveProperty("isApproved")
        })

        it("should added to db",async()=>{
            const res = await exec()
            const course = await Course.findById(res.body._id)
            expect(course).not.toBeNull()
        })

        it("should return added course without add photo",async()=>{
            const res = await exec(bodtyReq=body,photo=null)
            expect(res.body).toMatchObject({catId,name,city,country,price,lessonType})
            expect(res.body).not.toHaveProperty("photoId")
            expect(res.body).toHaveProperty("instructorId")
            expect(res.body).toHaveProperty("_id")
            expect(res.body).toHaveProperty("isApproved")
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

        it("should return 404 if category not found",async()=>{
            await category.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })

        it("should return 400 if name length less than 1",async()=>{
            name=""
            const res = await exec()
            expect(res.status).toBe(400)
        })
        it("should return 400 if name length greater than 50",async()=>{
            name = new Array(52).join("a")
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if price less than 0",async()=>{
            price=-1
            const res = await exec()
            expect(res.status).toBe(400)
        })
        it("should return 400 if price greater than 10000",async()=>{
            price=10001
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if city length less than 2",async()=>{
            city="a"
            const res = await exec()
            expect(res.status).toBe(400)
        })
        it("should return 400 if city length greater than 50",async()=>{
            city = new Array(52).join("a")
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if country length less than 2",async()=>{
            country="a"
            const res = await exec()
            expect(res.status).toBe(400)
        })
        it("should return 400 if country length greater than 50",async()=>{
            country = new Array(52).join("a")
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if lessonType not 'inPerson' or 'online'",async()=>{
            lessonType = "asdqwe"
            let res = await exec()
            expect(res.status).toBe(400)

            lessonType = "inPerson"
            res = await exec()
            expect(res.status).toBe(200)

            lessonType = "online"
            res = await exec()
            expect(res.status).toBe(200)
        })

        it("should add course without city when lessonType online",async()=>{
            body.lessonType = "online"
            delete body.city
            const res = await exec(body)
            expect(res.status).toBe(200)
        })

        it("should add course without country when lessonType online",async()=>{
            body.lessonType = "online"
            delete body.country
            const res = await exec(body)
            expect(res.status).toBe(200)
        })

        it("should return 400 if city not provided when lessonType is inPerson",async()=>{
            body.lessonType = "inPerson"
            delete body.city
            const res = await exec(body)
            expect(res.status).toBe(400)
        })

        it("should return 400 if country not provided when lessonType is inPerson",async()=>{
            body.lessonType = "inPerson"
            delete body.country
            const res = await exec(body)
            expect(res.status).toBe(400)
        })
    })


    describe("PUT /:id",()=>{
        let user
        let instructor
        let token
        let category
        let course
        let courseId

        let photoId
        let catId
        let name
        let city
        let country
        let price
        let activeUntil
        let lessonType
        let photoData
        let body
        
        beforeEach(async()=>{
            user = new User({email:"test@gmail.com",username:"username",password:"password"})
            await user.save()

            instructor = new Instructor({userId: user._id,email: user.email})
            await instructor.save()

            category = new Category({name:"Cat1"})
            await category.save()

            const coursePhoto = new Files({length:14,chunckSize:15,filename:"testCoursePhoto.jpg",contentType:"image/jpeg"})
            await coursePhoto.save()

            catId = category._id.toString()
            photoId = coursePhoto._id.toString()

            course = new Course({catId,photoId,lessonType:"online",name:"name",city:"city",country:"country",price:100,
                instructorId: instructor._id.toString(),activeUntil: Date.now() + 10000})
            await course.save()

            courseId = course._id.toString()
            token = instructor.generateAuthToken()
            
            photoData = "sampleData"

            name = "newName"
            city = "newcity"
            country = "newCountry"
            price = 13
            activeUntil = Date.now() + 10000
            lessonType = "online"
            body = {catId,name,city,country,price,activeUntil,lessonType}
        })

        afterEach(async()=>{
            await User.deleteMany()
            await Instructor.deleteMany()
            await Files.deleteMany()
            await Course.deleteMany()
            await Category.deleteMany()
        })

        const exec = async(bodyReq={catId,name,city,country,price,activeUntil,lessonType},photo=photoData)=>{

            if(photo==null){
                return await request(server).put(`/api/courses/${courseId}`)
                .set("x-auth-token",token)
                .send(bodyReq)
            }else{
                return await request(server).put(`/api/courses/${courseId}`)
                .set("x-auth-token",token)
                .field(bodyReq)
                .type("multipart/form-data")
                .attach("photo",Buffer.from(photo),{filename:"test.jpg",contentType: 'text/plain',}) 
            }
            
        }
    
        it("should return updated course",async()=>{
            const res = await exec()
            expect(res.body).toMatchObject({catId,name,city,country,price,lessonType})
            expect(res.body).toHaveProperty("photoId")
            expect(res.body).toHaveProperty("instructorId")
            expect(res.body).toHaveProperty("_id")
            expect(res.body).toHaveProperty("isApproved")
        })

        it("should return updated course when photo not provided",async()=>{
            const res = await exec(bodyReq=body,photo=null)
            expect(res.body).toMatchObject({catId,name,city,country,price,lessonType})
            expect(res.body).not.toHaveProperty("photoId")
            expect(res.body).toHaveProperty("instructorId")
            expect(res.body).toHaveProperty("_id")
            expect(res.body).toHaveProperty("isApproved")
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

        it("should return 404 if category not found",async()=>{
            await category.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })

        it("should return 404 if course not found",async()=>{
            await course.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })

        it("should return 403 access denied if another instructer request to update course",async()=>{
            const ins = new Instructor({userId: user._id,email:"testx@gmail.com"})
            token = ins.generateAuthToken()
            const res = await exec()
            expect(res.status).toBe(403)
        })

        it("should return unchanged isApproved after success",async()=>{
            await Course.findByIdAndUpdate(course._id,{isApproved:true})
            const res = await exec()
            expect(res.body.isApproved).toBeTruthy()
        })

        it("should return unchanged createdAt after success",async()=>{
            const oldCourse = await Course.findById(course._id)
            const res = await exec()
            const updatedCourse = await Course.findById(course._id)
            expect(Date.parse(updatedCourse.createdAt)).toEqual(Date.parse(oldCourse.createdAt))
        })

        it("should remove old photo and add new photo to db",async()=>{
            const oldPhoto = await Files.findById(photoId)
            const res = await exec()
            
            const oldNewPhoto = await Files.findById(photoId)
            const newAddedPhoto = await Files.findById(res.body.photoId)

            expect(oldPhoto).not.toBeNull()
            expect(oldNewPhoto).toBeNull()
            expect(newAddedPhoto).not.toBeNull()
        })

        it("should return 400 if name length less than 1",async()=>{
            name=""
            const res = await exec()
            expect(res.status).toBe(400)
        })
        it("should return 400 if name length greater than 50",async()=>{
            name = new Array(52).join("a")
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if price less than 0",async()=>{
            price=-1
            const res = await exec()
            expect(res.status).toBe(400)
        })
        it("should return 400 if price greater than 10000",async()=>{
            price=10001
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if city length less than 2",async()=>{
            city="a"
            const res = await exec()
            expect(res.status).toBe(400)
        })
        it("should return 400 if city length greater than 50",async()=>{
            city = new Array(52).join("a")
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if country length less than 2",async()=>{
            country="a"
            const res = await exec()
            expect(res.status).toBe(400)
        })
        it("should return 400 if country length greater than 50",async()=>{
            country = new Array(52).join("a")
            const res = await exec()
            expect(res.status).toBe(400)
        })

        it("should return 400 if lessonType not 'inPerson' or 'online'",async()=>{
            lessonType = "asdqwe"
            let res = await exec()
            expect(res.status).toBe(400)

            lessonType = "inPerson"
            res = await exec()
            expect(res.status).toBe(200)

            lessonType = "online"
            res = await exec()
            expect(res.status).toBe(200)
        })

        it("should update course without city when lessonType online",async()=>{
            body.lessonType = "online"
            delete body.city
            const res = await exec(body)
            expect(res.status).toBe(200)
        })

        it("should update course without country when lessonType online",async()=>{
            body.lessonType = "online"
            delete body.country
            const res = await exec(body)
            expect(res.status).toBe(200)
        })

        it("should return 400 if city not provided when lessonType is inPerson",async()=>{
            body.lessonType = "inPerson"
            delete body.city
            const res = await exec(body)
            expect(res.status).toBe(400)
        })

        it("should return 400 if country not provided when lessonType is inPerson",async()=>{
            body.lessonType = "inPerson"
            delete body.country
            const res = await exec(body)
            expect(res.status).toBe(400)
        })
        
    })

    describe("PATCH /:id",()=>{
        let user
        let instructor
        let token
        let category
        let course
        let courseId

        let photoId
        let catId
        
        beforeEach(async()=>{
            user = new User({email:"test@gmail.com",username:"username",password:"password"})
            await user.save()

            instructor = new Instructor({userId: user._id,email: user.email})
            await instructor.save()

            category = new Category({name:"Cat1"})
            await category.save()

            const coursePhoto = new Files({length:14,chunckSize:15,filename:"testCoursePhoto.jpg",contentType:"image/jpeg"})
            await coursePhoto.save()

            catId = category._id.toString()
            photoId = coursePhoto._id.toString()

            course = new Course({catId,photoId,lessonType:"online",name:"name",city:"city",country:"country",price:100,
                instructorId: instructor._id.toString(),activeUntil: Date.now() + 10000})
            await course.save()

            courseId = course._id.toString()
            token = instructor.generateAuthToken()
        })

        afterEach(async()=>{
            await User.deleteMany()
            await Instructor.deleteMany()
            await Files.deleteMany()
            await Course.deleteMany()
            await Category.deleteMany()
        })

        const exec = async(args,photo=null)=>{
            if(photo==null){
                return await request(server).patch(`/api/courses/${courseId}`)
                .set("x-auth-token",token)
                .send(args)
            }else{
                return await request(server).patch(`/api/courses/${courseId}`)
                .set("x-auth-token",token)
                .field(args)
                .type("multipart/form-data")
                .attach("photo",Buffer.from(photo),{filename:"test.jpg",contentType: 'text/plain',}) 
            }
            
        }

        it("should return 200 response",async()=>{
            const res = await exec()
            expect(res.status).toBe(200)
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

        it("should return 404 if category not found",async()=>{
            const res = await exec(args={catId: mongoose.Types.ObjectId()})
            expect(res.status).toBe(404)
        })

        it("should return 404 if course not found",async()=>{
            await course.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })

        it("should return 403 access denied if another instructer request to update course",async()=>{
            const ins = new Instructor({userId: user._id,email:"testx@gmail.com"})
            token = ins.generateAuthToken()
            const res = await exec()
            expect(res.status).toBe(403)
        })

        it("should remove old photo and add new photo to db",async()=>{
            const oldPhoto = await Files.findById(photoId)
            const res = await exec(args={},photo="newData")
            
            const oldNewPhoto = await Files.findById(photoId)
            const newAddedPhoto = await Files.findById(res.body.photoId)

            expect(oldPhoto).not.toBeNull()
            expect(oldNewPhoto).toBeNull()
            expect(newAddedPhoto).not.toBeNull()
        })

        it("should return updated catId if catId updated",async()=>{
            const newCat = new Category({name:"newCat"})
            await newCat.save()

            const res = await exec(args={catId:newCat._id})

            expect(res.body.catId.toString()).toEqual(newCat._id.toString())
        })

        it("should return updated name if name updated",async()=>{
            let name = "myNewName"
            const res = await exec(args={name})
            expect(res.body.name).toEqual(name)
        })

        it("should return updated price if price updated",async()=>{
            let price = 521
            const res = await exec(args={price})
            expect(res.body.price).toEqual(price)
        })

        it("should return updated activeUntil if activeUntil updated",async()=>{
            let activeUntil = Date.now() + 515200
            const res = await exec(args={activeUntil})
            expect(Date.parse(res.body.activeUntil)).toEqual(activeUntil)
        })

        it("should return updated city if city updated",async()=>{
            let city = "myNewCity"
            const res = await exec(args={city})
            expect(res.body.city).toEqual(city)
        })
        
        it("should return updated country if country updated",async()=>{
            let country = "myNewCountry"
            const res = await exec(args={country})
            expect(res.body.country).toEqual(country)
        })

        it("should return 400 if city not provided and lessonType is 'InPerson'",async()=>{
            let lessonType = "InPerson"
            delete course.city
            await course.save()

            const res = await exec(args={lessonType})
            expect(res.status).toBe(400)
        })

        it("should return 400 if country not provided and lessonType is 'InPerson'",async()=>{
            let lessonType = "InPerson"
            await Course.update({_id: course._id},{$unset: {country:1}})

            const res = await exec(args={lessonType})
            expect(res.status).toBe(400)
        })

        it("should return 400 if lessonType not one of these ('inPerson','online')",async()=>{
            lessonType = "different"
            const resDifferent = await exec(args={lessonType,city:"city",country:"country",catId,name:"name"
                ,price:40,activeUntil:Date.now()+1000})
            expect(resDifferent.status).toBe(400)
        })


        it("should return 400 if name length less than 1",async()=>{
            let name=""
            const res = await exec(args={name})
            expect(res.status).toBe(400)
        })
        it("should return 400 if name length greater than 50",async()=>{
            let name = new Array(52).join("a")
            const res = await exec(args={name})
            expect(res.status).toBe(400)
        })

        it("should return 400 if price less than 0",async()=>{
            let price=-1
            const res = await exec(args={price})
            expect(res.status).toBe(400)
        })
        it("should return 400 if price greater than 10000",async()=>{
            let price=10001
            const res = await exec(args={price})
            expect(res.status).toBe(400)
        })

        it("should return 400 if city length less than 2",async()=>{
            let city="a"
            const res = await exec(args={city})
            expect(res.status).toBe(400)
        })
        it("should return 400 if city length greater than 50",async()=>{
            let city = new Array(52).join("a")
            const res = await exec(args={city})
            expect(res.status).toBe(400)
        })

        it("should return 400 if country length less than 2",async()=>{
            let country="a"
            const res = await exec(args={country})
            expect(res.status).toBe(400)
        })
        it("should return 400 if country length greater than 50",async()=>{
            let country = new Array(52).join("a")
            const res = await exec(args={country})
            expect(res.status).toBe(400)
        })
    })


    describe("DELETE /:id",()=>{
        let user
        let instructor
        let token
        let category
        let course
        let courseId
        let Admin

        let photoId
        let catId
        
        beforeEach(async()=>{
            Admin = mongoose.model("Admin")

            user = new User({email:"test@gmail.com",username:"username",password:"password"})
            await user.save()

            instructor = new Instructor({userId: user._id,email: user.email})
            await instructor.save()

            category = new Category({name:"Cat1"})
            await category.save()

            const coursePhoto = new Files({length:14,chunckSize:15,filename:"testCoursePhoto.jpg",contentType:"image/jpeg"})
            await coursePhoto.save()

            catId = category._id.toString()
            photoId = coursePhoto._id.toString()

            course = new Course({catId,photoId,lessonType:"online",name:"name",city:"city",country:"country",price:100,
                instructorId: instructor._id.toString(),activeUntil: Date.now() + 10000})
            await course.save()

            courseId = course._id.toString()
            token = instructor.generateAuthToken()
        })

        afterEach(async()=>{
            await User.deleteMany()
            await Instructor.deleteMany()
            await Files.deleteMany()
            await Course.deleteMany()
            await Category.deleteMany()
            await Admin.deleteMany()
        })

        const exec = async()=>{
            return await request(server).delete(`/api/courses/${courseId}`)
                .set("x-auth-token",token)
        }


        it("should return deleted course",async()=>{
            const res = await exec()
            expect(res.body).toMatchObject(_.pick(course,["lessonType","name","city","country","price","instructorId","photoId","catId"]))
        })

        it("should return 404 if course not found",async()=>{
            await course.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })

        it("should return 401 if token not provided",async()=>{
            token=""
            const res = await exec()
            expect(res.status).toBe(401)
        })

        it("should return deleted course if admin token used",async()=>{
            const admin = new Admin({email:"admin@gmail.com",password:"password"})
            await admin.save()
            token = admin.generateAuthToken()
            const res = await exec()
            expect(res.status).toBe(200)
            expect(res.body._id.toString()).toEqual(course._id.toString())
        })

        it("should return 403 access denied if another instructor request to delete",async()=>{
            const ins = new Instructor({userId: user._id,email:"insTest@gmail.com"})
            await ins.save()
            token = ins.generateAuthToken()
            const res = await exec()
            expect(res.status).toBe(403)
        })

        it("should remove course photo",async()=>{
            const res = await exec()
            const photo = await Files.findById(photoId)
            expect(photo).toBeNull()
        })
    })
})
