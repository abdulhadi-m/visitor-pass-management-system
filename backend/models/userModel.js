const mongoose = require("mongoose");

// validator and bcrypt here later
const bcrypt = require('bcrypt')
const validator = require('validator')


const Structure = mongoose.Schema;
const userStructure = new Structure({
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['Admin', 'Security', 'Employee', 'Visitor'],
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
  },
},{
    timestamps:true
});

// signup()
userStructure.statics.signup=async function (email, name, role, password){
  const exist = await this.findOne({email})

  if(!email || !password || !name || !role){
    throw Error('Please fill all the required fields!')
  }
  if(!validator.isEmail(email)){
    throw Error('Please enter a valid Email ID')
  }
  if(!validator.isStrongPassword(password)){
    throw Error('Please create a strong password')
  }
  if(exist){
    throw Error('Email already exists!')
  }

  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(password, salt)

  const user = await this.create({email, name, role, password:hash})

  return user
}

// login()
userStructure.statics.login = async function(email, password){
  if(!email || !password){
    throw Error('Please fill all the required fields!')
  }

  const user = await this.findOne({email})

  if(!user){
    throw Error('Incorrect Email!')
  }

  const match = await bcrypt.compare(password, user.password)

  if(!match){
    throw Error('Incorrect Password')
  }

  return user
}



module.exports = mongoose.model("User", userStructure);
