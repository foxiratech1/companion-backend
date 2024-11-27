const mongoose = require("mongoose");

const AdsModel = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    pickUpLine: {
      type: String,
    },
    country: {
      type: String,
    },
    city: { type: String },
    states: { type: String },
    location: {
      type: String,
    },
    postCode: {
      type: String,
    },
    description: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    age: {
      type: Number,
    },
    ethnicity: {
      type: String,
    },
    nationality: {
      type: String,
    },
    language: {
      type: Array,
    },
    bust: {
      type: String,
    },
    height: {
      type: String,
    },
    sexOrientation: {
      type: String,
    },
    available: {
      type: Array,
    },
    myService: {
      type: Array,
    },
    service: {
      type: Array,
    },
    persontype: {
      type: String,
    },
    adsImg: {
      type: [String],
    },
    adsVideo: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    whatsappNumber: {
      type: String,
    },
    rates: {
      type: Object,
    },
    verificationAds: {
      type: String,
      enum: ["regular", "vip", "feature"],
    },
    views: { type: Number, default: 0 },
  },

  { timestamps: true }
);

module.exports = mongoose.model("ads", AdsModel);
