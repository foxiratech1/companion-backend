const { default: mongoose } = require("mongoose");

const documentUploadModel = new mongoose.Schema(
  {
    document: {
      type: String,
    },
    documentOwner: {
      type: String,
    },
    documentType: {
      type: String,
    },
    comment: {
      type: String,
    },
  },
  { timestamps: true }
);


module.exports = mongoose.model('documentUploadModel',documentUploadModel)