import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import multer from 'multer'
import path from 'path'

const app = express();
const static_path = path.join(path.resolve(), "./imageUpload");

app.use(express.static(static_path));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(cookieParser());
dotenv.config()

// DataBase Connection
mongoose.connect( process.env.DB , {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => {
    console.log("[ User Database Connected... ]");
}).catch((e) => {
    console.log("[ User Database Connection Error! ]");
})

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        required: true,
        unique: true,
        type: Number

    },
    address: {
        type: String,
        required: true
    },
    email: {
        unique: true,
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    confirmpassword: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required:true
    }, 
    imageupload: {
        type: String,
        
    }, 
    captcha:{
        type: String,
        required : true
    },
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }]
});

const User = new mongoose.model("User", userSchema);


// Sending a login Confirmation Email to the user i.e the user has sucessfully logined 
function sendEmailfun(email,name,phone) {
    var transporter= nodemailer.createTransport({
        service:process.env.services,
        tls:{
            rejectUnauthorized:false
        },
        auth:{
            user:process.env.user,
            pass:process.env.pass
        }
    })
        
    transporter.sendMail({
    from:process.env.from,
    to:email,
    subject:"Login Sucessful",
    text:`Hello ${name},
           Your Login is succesfull with us. 
           Kindly use your account and dont forget to Logout for your safety Reasons.
           
           
           With Best Regards from,
           Cbnits India Pvt Ltd.
           Username:${name}  
           Contact No:${phone}
           Thankyou `,
    },(err,res)=>{
        if(err){
            console.log(err);
        }else{
            res.status(201).send("Mail sent Sucessfully");
        }
    })
}

function sendEmailforverification(name, email) {
    var captchacode=captcha();
    var transporter= nodemailer.createTransport({
        service:process.env.services,
        tls:{
            rejectUnauthorized:false
        },
        auth:{
            user:process.env.user,
            pass:process.env.pass
        }
    })
        
    transporter.sendMail({
    from:process.env.from,
    to:email,
    subject:"Email Verification code",
    text:`Hello ${name},
        Your Email verification code is ${captchacode}.
        Kindly use this code to verify your email address.
                        
                        
            With Best Regards from,
            Cbnits India Pvt Ltd.
            Thankyou 
                        
            *This is an autogenerated Email please do not reply.*`,
    },(err,res)=>{
        if(err){
            console.log(err);
        }else{
            res.status(201).send("Mail sent Sucessfully");
        }
    })
    return captchacode
}


const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null, "./imageUpload/")
    },
    filename: function(req,file,cb){
        cb(null, Date.now()+"_"+file.originalname)
    }
})

var upload = multer({ storage: storage }).single('imageupload')


app.post("/sendverifcationemail", upload, (req, res) => {
    console.log("Email Verification function calling ...")
    const { name, email, phone, gender, address, password, confirmpassword, passportimage} = req.body;
    const imagedb=passportimage.name
            console.log(imagedb+"it is the image in verification")
    User.findOne({ email: email }, (err, user) => {
        if (user) {
            res.send({message:"User Already Registered..Kindly Login "});
        } else {
            const captchacode = sendEmailforverification(name, email);            
            const tempuser = new User({
                name: name,
                email: email,
                phone: phone,
                gender: gender,
                address: address,
                password: password,
                passportimage:imagedb,
                confirmpassword: confirmpassword,
                captcha:captchacode

            })
        res.send({tempuser:tempuser})
        console.log("Email Verification send")
        }
    })
})


//Route

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    User.findOne({ email: email }, (err, user) => {
        if (user) {
            if (bcrypt.compareSync(password,user.password)) {
                
                const tkn = user._id.toString()
                const token = jwt.sign({tkn},process.env.SECRETKEY)
                sendEmailfun(user.email,user.name,user.phone)
                user.tokens = user.tokens.concat({token})
                user.save(err => {
                    if (err) {
                        console.log(err)
                        res.send("Token Generating Error"+err)
                    }
                    else {
                        res.status(201).send({message:" you are Logined Successfully", user:user, token:token})
                    }
                })
            } else {
                res.status(201).send({message:"Invalid Credentials...Please Try Again!!"});
            }
        } else
            res.send({message:"User Not in the database .. Kindly Register... "});
     }); 
})


app.post("/register",(req, res) => {
    const { name, email, captcha, phone, gender, address, password, confirmpassword ,imageupload } = req.body;
    User.findOne({ email: email }, (err, user) => {
        if (user) {
            res.send({message:"User Already Registered..Kindly Login "});
        } else {
            
            const imagedb=passportimage.name
            console.log(imagedb+"it is the image")
            const user = new User({
                name: name,
                email: email,
                phone: phone,
                gender: gender,
                address: address,
                passportimage:imagedb,
                password: bcrypt.hashSync(password,10),
                confirmpassword: bcrypt.hashSync(confirmpassword,10),
                captcha : captcha
            })
            user.save(err => {
                if (err) {
                    console.log(err)
                    res.send(err)
                }
                else {
                    res.send({message:"user Registered Sucessfully ...Kindly Login"})
                }
            })
        }
  })
})


app.post("/emailexist", (req, res) => {
    const { email, phone , passportimage } = req.body;
    console.log(email)
    console.log(phone)
    console.log(passportimage)
    
    console.log(User.findOne({email:email}))
    console.log(User.findOne({phone:phone}))
    
    if (User.findOne({email:email}) || User.findOne({phone:phone})) {
        res.send({exist:true})
    } else {
        res.send({exist:false})
    }
})


function captcha(){
    const alphabets = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz";
    const first = alphabets[Math.floor(Math.random() * alphabets.length)];
    const third = Math.floor(Math.random() * 10);
    const fourth = alphabets[Math.floor(Math.random() * alphabets.length)];
    const fifth = alphabets[Math.floor(Math.random() * alphabets.length)];
    const sixth = Math.floor(Math.random() * 10);
    const second = Math.floor(Math.random() * 10);
    const  captcha1 = first.toString()+second.toString()+third.toString()+fourth.toString()+fifth.toString()+sixth.toString();  
    return captcha1;
}

app.listen(3400, () => {
    console.log("server started at 3400")
});
