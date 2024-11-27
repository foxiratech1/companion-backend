const { default: mongoose } = require("mongoose");

const blogModel = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
    },
    tags: {
      type: String,
    },
    postUser: {
      type: String,
    },
    blogImg: {
      type: String,
    },
    userAvtar: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("blog", blogModel);
