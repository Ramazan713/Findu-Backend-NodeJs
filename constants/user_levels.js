
const UserLevels = Object.freeze({
    anonymous: "anonymous",
    user: "user",
    instructor: "instructor",
    admin: "admin",
    values:function(){
        return [this.admin,this.anonymous,this.instructor,this.anonymous,this.user]
    }
})

module.exports = UserLevels