const express = require("express");
const validateToken = require("../middleware/validateTokenHandler");
const { userChangePassword } = require("../validations/validator");
const {
  vendorDetail,
  createAd,
  adsList,
  updateAds,
  deleteAds,
  adsDetail,
  registerVendor,
  login,
  sendForgotPasswordOTP,
  validOtp,
  resetPassword,
  changePassword,
  createBlog,
  getAllBlog,
  updateBlog,
  deleteBlog,
  vendorContactInfo,
  getVendorContactInfo,
  getSingleVendorContactInfo,
  uploadVendorDoc,
} = require("../controller/vendorController");
const upload = require("../functions/upload");

const router = express.Router();
router.post("/register", registerVendor);
router.post("/login", login);
router.post("/forgot-password-otp", sendForgotPasswordOTP);
router.post("/validate-otp", validOtp);
router.post("/reset-password", resetPassword);
router.post(
  "/change-password",
  validateToken,
  userChangePassword,
  changePassword
);
router.post("/vendorDetail", vendorDetail);
router.post("/create-ads", upload, createAd);
router.get("/ads-list",validateToken, adsList);
router.put("/update-ads/:id", validateToken , upload, updateAds);
router.delete("/delete-ads/:id", validateToken,  deleteAds);
router.get("/ads-detail/:id", validateToken ,adsDetail);
router.post("/create-blog",validateToken, upload, createBlog);
router.get("/all-blog", validateToken,getAllBlog);
router.post("/update-blog/:id", validateToken,upload, updateBlog);
router.delete("/delete-blog/:id", validateToken,deleteBlog);
router.post("/contact-info", validateToken,vendorContactInfo);
router.get("/get-contactinfo", validateToken,getVendorContactInfo);
router.get("/get-singlevendorcontact/:id", validateToken,getSingleVendorContactInfo);
router.post("/upload-document",validateToken, upload, uploadVendorDoc);

module.exports = router;
