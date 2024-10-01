import validator from "validator";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'
import userModel from "../models/userModel.js";



// {---token creation-----}
const createToken = (id)=>{
    return jwt.sign({id}, process.env.JWT_SECRET)
}


// {------Route for user login-------}

const loginUser = async (req, res)=>{

    try {
        const { email, password } = req.body;
        
        // {-----i want to find out if the email exists in the database----.}
        const user = await userModel.findOne({email});
        if (!user) {
            return res.json({success: false, message:'Email does not exist'})
        }
        // {---if the email does exist then i want to compare the email with the password against what we have in the database--}
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            // {---if password and email match what is in the database then create a token and login the user.}
            const token = createToken(user._id);
            return res.json({success: true, token})
        }
        else{
            return res.json({success: false, message:'Invalid Credentials'})
        }
    } catch (error) {
        console.log(error)
        return res.json({success:false, message:error.message})
    }
      

}


// {----route for user registration----}

const registerUser = async (req, res)=>{

    try {

        const { name, email, password } = req.body;

        // {-----i want to find out if the email has been used to register before----.}
        const exists = await userModel.findOne({email});

        if (exists) {
            return res.json({success:false, message:'Email already exists'})
        }

        // {-----i want to check if the user is providing a valid email and strong password-----.}
        if (!validator.isEmail(email)) {
            return res.json({success:false, message:'Provide a valid email'}); 
        }

        if (password.length < 8) {
            return res.json({success:false, message:'Provide a strong password'})
        }

        // {----if all the validations are passed, then i will create a new user in the database.

        // but first i need to encrpt the passwword.
        // hash password------}

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword
        })
        const user = await newUser.save();

        // {----after creating the user, i will generate a token and send it to the user-----}
        const token = createToken(user._id)
       return res.json({success:true, token})

    } catch (error) {
        console.log(error)
       return res.json({success:false, message:error.message})
    }   
}

// {----route for admin login-----}{the admin email and password has been set in the env, so just fetch it from there}

const adminLogin = async (req, res)=>{

    try {
        
       const {email, password} = req.body;
       if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
             const token = jwt.sign(email+password, process.env.JWT_SECRET);
             return res.json({success: true, token})
       } else{
         return res.json({success: false, message:'Invalid Credentials'})
       }

    } catch (error) {
        console.log(error)
        return res.json({success:false, message:error.message})
     }   
    }






export { loginUser, registerUser, adminLogin }