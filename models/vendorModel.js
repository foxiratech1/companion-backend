const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
    },
    email: {
      type: String,
    },
    dob: {
      type: Date,
    },
    password: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    tokens: {
      type: [String],
    },
    otp: {
      type: String,
    },
    token: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("authVendor", vendorSchema);
