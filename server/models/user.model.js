import mongoose from "mongoose";
const schema = new mongoose.Schema({
    username:{
        type: 'string',
        required: true,
        min:3,
        max:20,
        unique: true
    },
    email:{
        type: 'string',
        required: true,
        max:50,
        unique: true
    },
    password:{
        type: 'string',
        min:6,
    },
    profileImage:{
        type: 'string',
        default:"" 
    }
});

const model = mongoose.model('Users' , schema)
export default model;
