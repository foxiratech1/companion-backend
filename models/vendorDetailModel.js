const mongoose = require("mongoose");

const Vendor = new mongoose.Schema(
  {
    fullname: {
      type: String,
    },
    email: {
      type: String,
    },
    category: {
      type: String,
    },
    style: {
      type: String,
    },
    phone: {
      type: String,
    },
    zipcode: {
      type: String,
    },
    city: {
      type: String,
    },
    region: {
      type: String,
    },
    country: {
      type: String,
    },
    social_refrences: {
      type: String,
    },
    website: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    tokens: {
      type: [String],
    },
    roles: { type: String, default: "vendor" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("VendorDetail", Vendor);
