const multer = require("multer");
const mongoose = require("mongoose");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file?.fieldname === "document") {
      cb(null, "./public/uploads/document");
    } else if (file?.fieldname === "adsImg") {
      cb(null, "./public/uploads/adsImg");
    } else if (file?.fieldname === "adsVideo") {
      cb(null, "./public/uploads/adsVideo");
    } else if (file?.fieldname === "blogImg") {
      cb(null, "./public/uploads/blogImg");
    } else if (file?.filename === "userAvtar") {
      cb(null, "./public/upload/userAvtar");
    } else {
      if (
        ["additionalVideo", "mainVideo", "otherVideo"].includes(file?.fieldname)
      ) {
        cb(null, "./public/uploads/videos");
      } else {
        cb(null, "./public/uploads/users");
      }
    }
  },

  filename: function (req, file, cb) {
    const fileExtension = file.originalname.substr(
      file.originalname.lastIndexOf(".") + 1,
      file.originalname.length
    );
    let data = req?.user?._id;
    if (
      [
        "profileImage",
        "additionalImage",
        "images",
        "inProcessImage",
        "document",
        "additionalVideo",
        "mainImage",
        "mainVideo",
        "otherVideo",
        "backImage",
        "insigniaImage",
        "avatar",
        "adsImg",
        "adsUser",
        "adsVideo",
        "blogImg",
        "userAvtar",
      ].includes(file?.fieldname)
    ) {
      data = new mongoose.Types.ObjectId();
    }
    cb(null, `${data}.${fileExtension}`);
  },
});

const fileFilter = (req, file, cb) => {
  console.log("file?.fieldnamefile?.fieldname", file?.fieldname);

  if (file?.fieldname === "document") {
    const fileExtension = file.originalname.substr(
      file.originalname.lastIndexOf(".") + 1,
      file.originalname.length
    );
    if (
      ["docx", "xlsx"].includes(fileExtension) ||
      file.mimetype === "application/pdf"
    ) {
      return cb(null, true);
    }
  }

  if (file?.fieldname === "adsVideo") {
    // Add validation for adsVideo
    if (file.mimetype === "video/mp4") {
      // Add more formats if needed
      return cb(null, true);
    }
  } else if (
    ["additionalVideo", "mainVideo", "otherVideo"].includes(file?.fieldname)
  ) {
    if (file.mimetype === "video/mp4") {
      return cb(null, true);
    }
  } else if (file?.fieldname === "document") {
    return cb(null, true);
  } else {
    if (
      ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
        file.mimetype
      )
    ) {
      return cb(null, true);
    }
  }

  req.fileValidationError = "Please upload valid video format";
  return cb(null, false, req.fileValidationError);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
}).fields([
  { name: "profileImage", maxCount: 1 },
  { name: "additionalImage", maxCount: 5 },
  { name: "inProcessImage", maxCount: 1 },
  { name: "mainVideo", maxCount: 1 },
  { name: "mainImage", maxCount: 1 },
  { name: "additionalVideo", maxCount: 5 },
  { name: "document", maxCount: 1 },
  { name: "insigniaImage", maxCount: 1 },
  { name: "avatar", maxCount: 1 },
  { name: "images", maxCount: 5 },
  { name: "otherVideo", maxCount: 1 },
  { name: "backImage", maxCount: 1 },
  { name: "adsImg", maxCount: 5 },
  { name: "adsVideo", maxCount: 1 },
  { name: "blogImg", maxCount: 1 },
  { name: "userAvtar", maxCount: 1 },
]);

module.exports = upload;
