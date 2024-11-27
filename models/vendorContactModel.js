const { default: mongoose } = require("mongoose");

const vendorContactInfoModel = new mongoose.Schema({
   
        name:{
            type:String
        },
        email:{
            type:String
        },
        subject:{
            type:String
        },
        address:{
            type:String
        }
    
}, { timestamps: true });


module.exports = mongoose.model('vendorContactInfoModel',vendorContactInfoModel)