const sendEmail = require("../services/email_service");
const config = require("config")
const mongoose = require("mongoose")

const Token = mongoose.model("Token")

const sendVerificationEmail = async function(user){

    if(config.get("isEmailVerificationEnabled")){
        const verificationToken = user.generateVerificationToken()
        let token = new Token({token: verificationToken,userId: user._id})
        
        await token.save()
        const link = `${config.get("baseUrl")}/api/users/verify/${user._id}/${token.token}`;
        const html = `<div>
            <p>You have ${config.get("tokenExpireSeconds")/60} minutes to verify this email</p>
            <a href="${link}">Verify your email</a>
        </div>`
        try{
            await sendEmail(user.email, "Verify Email", html);
        }catch(e){
            
        }
    }
}

module.exports = {sendVerificationEmail}