const request = require("supertest")
const mongoose = require("mongoose")
const config = require("config")



describe("/api/photos",()=>{
    let server
    let Files

    beforeEach(async()=>{
        server = require("../../../index")
        Files = mongoose.model(`${config.get("bucketName")}.files`)
        
    })

    afterEach(async()=>{
        await Files.deleteMany()
        server.close()
    })

    describe("GET /:id",()=>{
        let photo
        let photoId

        beforeEach(async()=>{
            photo  = new Files({length:14,chunckSize:15,filename:"testPhoto.jpg",contentType:"image/jpeg"})
            await photo.save()
            photoId = photo._id.toString()
        })

        afterEach(async()=>{
            await Files.deleteMany()
        })

        const exec = async()=>{
            return await request(server).get(`/api/photos/${photoId}`)
        }

        it("should return photo",async()=>{
            const res = await exec()
            expect(res.status).toBe(200)
        })

        it("should return 404 if not found",async()=>{
            await photo.remove()
            const res = await exec()
            expect(res.status).toBe(404)
        })
    })

})


