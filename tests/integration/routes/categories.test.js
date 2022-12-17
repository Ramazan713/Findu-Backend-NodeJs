const request = require("supertest")
const mongoose = require("mongoose")



describe("/api/categories",()=>{
    let server
    let Category

    beforeEach(async()=>{
        server = require("../../../index")
        Category = mongoose.model("Category")
        
    })

    afterEach(async()=>{
        await Category.deleteMany()
        server.close()
    })

    describe("GET /",()=>{
        let categories

        beforeEach(async()=>{
            const cat1 = new Category({name:"name1"})
            const cat2 = new Category({name:"name2"})
            const cat3 = new Category({name:"name3"})

            await cat1.save()
            await cat2.save()
            await cat3.save()

            categories = [cat1,cat2,cat3]
        })

        afterEach(async()=>{
            await Category.deleteMany()
        })

        const exec = async()=>{
            return await request(server).get("/api/categories")
        }

        it("should return all categories",async()=>{
            const res = await exec()
            const catIds = categories.map(e=>e._id.toString())
            const resCatIds = res.body.map(e=>e._id.toString())

            expect(res.body.length).toBe(categories.length)
            expect(resCatIds).toEqual(expect.arrayContaining(catIds))

        })
    })

})


