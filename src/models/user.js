const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "password"')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a postive number')
            }
        }
    },
    tokens: [{
        token:{
            type: String,
            required: true
        }
    }],
    avatar:{
        type: Buffer
    }
},
    {
    timestamps: true
})


userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})


userSchema.methods.toJSON = function(){
    const user = this
    const user_object = user.toObject()

    delete user_object.password
    delete user_object.tokens
    delete user_object.avatar
    
    return user_object
}

userSchema.methods.generate_auth_token = async function(){
    
    console.log('in generate auth token')
    const user = this
    const token = jwt.sign({_id:user._id.toString() }, process.env.JWT_SECRET)
    console.log('after create token: '+token)

    user.tokens = user.tokens.concat({token})
    console.log('after concat')
    await user.save()
    console.log(token)
    return token
}

userSchema.statics.find_by_credentials = async (email, password)=>{
    const user = await User.findOne({email})

    if(!user){
        throw new Error('Unable to login')
    }

    const is_match=await bcrypt.compare(password, user.password)

    if(!is_match){
        throw new Error('Unable to login')
    }

    return user
}

//hash the plain text password before saving
userSchema.pre('save', async function (next) {
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})


userSchema.pre('remove', async function(next){
    const user = this

    await Task.deleteMany({owner:user._id})

    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User