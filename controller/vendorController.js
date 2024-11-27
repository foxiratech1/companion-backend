const AdsModel = require("../models/AdsModel");
const { validationResult } = require("express-validator");
const { checkValidations } = require("../functions/checkValidation");
const {
  createLog,
  generateRandomOTP,
  paginationQuery,
  pagination,
} = require("../functions/common");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const md5 = require("md5");
const vendorModel = require("../models/vendorModel");
const { sendMail } = require("../functions/mailer");
const { default: mongoose } = require("mongoose");
const blogModel = require("../models/blogModel");
const vendorContactModel = require("../models/vendorContactModel");
const documentModel = require("../models/documentModel");
const APIErrorLog = createLog("API_error_log");

const registerVendor = async (req, res) => {
  try {
    const errors = validationResult(req);
    const checkValid = await checkValidations(errors);
    if (checkValid.type === "error") {
      return res.status(400).send({
        message: checkValid.errors.msg,
      });
    }
    const { fullName, email, password, dob } = req.body;
    if (!password) {
      return res.status(400).send({
        message: "Password is required.",
      });
    }
    const isEmail = await vendorModel.countDocuments({
      email: email?.toLowerCase()?.trim(),
    });
    if (isEmail) {
      return res.status(400).send({
        message:
          "Email is already registered, please add a different email address.",
      });
    }
    const data = await vendorModel.create({
      fullName: fullName?.trim(),
      email: email?.toLowerCase()?.trim(),
      password: md5(password),
      dob: dob,
    });

    const tokenSecret =
      process.env.ACCESS_TOKEN_SECRET || "QYUIIJKKEJEJEJKJKEJKEJKE";
    const token = jwt.sign({ user: data }, tokenSecret, {
      expiresIn: "5d",
    });
    await vendorModel.updateOne(
      { _id: data._id, isDeleted: false },
      { $push: { tokens: token } }
    );
    return res
      .status(201)
      .send({ status: 201, token, message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).send({ message: "Something went wrong" });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    const checkValid = await checkValidations(errors);
    if (checkValid.type === "error") {
      return res.status(400).send({
        message: checkValid.errors.msg,
      });
    }
    const { email, password } = req.body;
    const users = await vendorModel
      .findOne(
        { email: email?.toLowerCase()?.trim(), isDeleted: false },
        { tokens: 0, createdAt: 0, updatedAt: 0 }
      )
      .lean(true);
    if (users && users.password === md5(password)) {
      const tokenSecret =
        process.env.ACCESS_TOKEN_SECRET || "QYUIIJKKEJEJEJKJKEJKEJKE";
      const token = jwt.sign({ user: users }, tokenSecret, {
        expiresIn: "5d",
      });
      const updatedVendor = await vendorModel.findOneAndUpdate(
        {
          _id: users._id,
          isDeleted: false,
        },
        { $push: { tokens: token } },
        { new: true }
      );
      return res.status(200).send({
        user: updatedVendor,
        token: token,
        message: "Login Successfully",
      });
    }
    return res.status(400).send({ message: "Invalid Username and Password" });
  } catch (error) {
    return res.status(500).send({ message: "Something went wrong" });
  }
};

const sendForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const vendor = await vendorModel.findOne({
      email: email?.toLowerCase(),
      isDeleted: false,
    });

    if (!vendor) {
      return res.status(400).send({ message: "Vendor not found" });
    }
    const otp = await generateRandomOTP();
    const mailVaribles = {
      "%fullName%": vendor.firstName,
      "%email%": vendor.email,
      "%otp%": otp,
    };
    await sendMail("send-forgotpassword-otp", mailVaribles, vendor.email);
    await vendorModel.updateOne(
      { _id: vendor._id, isDeleted: false },
      { $set: { otp: otp } }
    );
    return res.status(200).send({
      id: vendor._id,
      email: email,
      message: "OTP sent Successfully",
    });
  } catch (error) {
    APIErrorLog.error("Error while register the user information");
    APIErrorLog.error(error);
    return res.status(500).send({ message: "Something went wrong" });
  }
};

const validOtp = async (req, res) => {
  try {
    const {email} = req.query
    const { otp } = req.body;
    const vendor = await vendorModel
      .findOne({ email: email, isDeleted: false })
      .lean(true);

    const token = uuidv4();
    if (!vendor) {
      return res.status(400).send({ message: "User not found" });
    }
    if (!vendor.otp) {
      return res.status(400).send({ message: "Invalid OTP" });
    }
    if (vendor.otp !== otp) {
      return res.status(400).send({ message: "Invalid OTP" });
    }
    await vendorModel.updateOne(
      { _id: vendor._id, isDeleted: false },
      { $set: { token: token } },
      { $unset: { otp: null } }
    );
    return res.status(200).send({
      message: "OTP verified successfully",
      id: vendor._id,
      token: token,
    });
  } catch (error) {
    APIErrorLog.error("Error while submitting the OTP");
    APIErrorLog.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.query;
    const { newPassword, confirmPassword } = req.body;
    if (!newPassword || !confirmPassword) {
      return res.status(400).send({
        message: "New password and confirm password must be provided.",
      });
    }
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .send({ message: "New password and confirm password do not match." });
    }

    const sanitizedToken = token === "null" ? null : token;
    const vendor = await vendorModel.findOne({
      token: sanitizedToken,
      isDeleted: false,
    });
    if (!vendor) {
      return res
        .status(404)
        .send({ message: "User not found or invalid token." });
    }
    await vendorModel.updateOne(
      { _id: vendor._id },
      {
        $set: {
          password: md5(newPassword),
          token: null,
        },
      }
    );

    return res.status(200).send({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Error while resetting the password:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    const checkValid = await checkValidations(errors);
    if (checkValid.type === "error") {
      return res.status(400).send({
        message: checkValid.errors.msg,
      });
    }
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (req?.user?.password != md5(currentPassword)) {
      return res.status(400).send({
        message:
          "The current password you provided does not match. Please double-check and try again",
      });
    }
    if (newPassword != confirmPassword) {
      return res.status(400).send({
        message:
          "The new password and confirm password entries must match. Please ensure they are identical",
      });
    }

    vendorModel
      .updateOne(
        { _id: req.user._id },
        { $set: { password: md5(newPassword), tokens: [] } }
      )
      .then();

    return res.status(201).send({
      status: 201,
      message: "Your password has been successfully changed",
    });
  } catch (error) {
    APIErrorLog.error("Error while changing the user password");
    APIErrorLog.error(error);
    return res.status(500).send({ message: "Something went wrong" });
  }
};

const vendorDetail = async (req, res) => {
  try {
    const {
      fullname,
      email,
      category,
      style,
      phone,
      zipcode,
      city,
      region,
      country,
      social_refrences,
      website,
    } = req.body;

    const payload = {
      fullname,
      email,
      category,
      style,
      phone,
      zipcode,
      city,
      region,
      country,
      social_refrences,
      website,
    };
    const vendorDetail = await authVendor.create(payload);
    return res.status(201).json({
      message: "authVendor Details Submit Successfully !",
      data: vendorDetail,
    });
  } catch (error) {
    APIErrorLog.error(
      "There was an issue while trying to submit the vendor details."
    );
    APIErrorLog.error(error);
  }
};

const adStorage = {};
const createAd = async (req, res) => {
  try {
    let fileData;
    if (req.files && req.files.length > 0) {
      fileData = await fileUploadFunc(req, res);
      if (fileData.type !== "success") {
        return res.status(fileData.status).send({
          message:
            fileData?.type === "fileNotFound"
              ? "Please upload the image"
              : fileData.type,
        });
      }
    }
    const errors = validationResult(req);
    const checkValid = await checkValidations(errors);
    if (checkValid.type === "error") {
      return res.status(400).send({
        message: checkValid.errors.msg,
      });
    }
    const step = parseInt(req.body.step);

    if (!adStorage.stepData) {
      adStorage.stepData = {};
      adStorage.completedSteps = [];
    }
    let ad = adStorage.stepData;
    if (![1, 2, 3, 4].includes(step)) {
      return res.status(400).send({ message: "Invalid step" });
    }
    if (!adStorage.completedSteps.includes(step - 1) && step > 1) {
      return res.status(400).send({
        message: `Please complete step ${
          step - 1
        } before proceeding to step ${step}.`,
      });
    }

    switch (step) {
      case 1:
        ad = {
          ...ad,
          name: req.body.name,
          pickUpLine: req.body.pickUpLine,
          country: req.body.country,
          city: req.body.city,
          states: req.body.states,
          location: req.body.location,
          postCode: req.body.postCode,
        };
        adStorage.completedSteps.push(1);
        break;

      case 2:
        ad = {
          ...ad,
          description: req.body.description,
          gender: req.body.gender,
          age: req.body.age,
          ethnicity: req.body.ethnicity,
          nationality: req.body.nationality,
        };
        adStorage.completedSteps.push(2);
        break;

      case 3:
        ad = {
          ...ad,
          language: req.body.language.split(","),
          bust: req.body.bust,
          height: req.body.height,
          sexOrientation: req.body.sexOrientation,
          available: req?.body?.available.split(","),
          myService: req?.body?.myService.split(","),
          service: req?.body?.service.split(","),
          persontype: req.body.persontype,
        };
        adStorage.completedSteps.push(3);
        break;

      case 4:
        if (req.files) {
          if (req.files["adsImg"] && req.files["adsImg"].length > 0) {
            ad["adsImg"] = req.files["adsImg"].map(
              (file) => `uploads/adsImg/${file.filename}`
            );
          } else {
            ad["adsImg"] = [];
          }

          if (req.files["adsVideo"] && req.files["adsVideo"].length > 0) {
            ad[
              "adsVideo"
            ] = `uploads/adsVideo/${req.files["adsVideo"][0].filename}`;
          } else {
            ad["adsVideo"] = null;
          }
        }
        ad = {
          ...ad,
          video: req.body.video,
          phoneNumber: req.body.phoneNumber.replace(/[- )(]/g, "").trim(),
          whatsappNumber: req.body.whatsappNumber.replace(/[- )(]/g, "").trim(),
          rates: {
            oneHour: {
              inCall: req.body.rates?.oneHour?.inCall,
              outCall: req.body.rates?.oneHour?.outCall,
            },
            additionalHour: {
              inCall: req.body.rates?.additionalHour?.inCall,
              outCall: req.body.rates?.additionalHour?.outCall,
            },
            overNight: {
              inCall: req.body.rates?.overNight?.inCall,
              outCall: req.body.rates?.overNight?.outCall,
            },
            dinnerTable: {
              inCall: req.body.rates?.dinnerTable?.inCall,
              outCall: req.body.rates?.dinnerTable?.outCall,
            },
          },
          verificationAds: req.body.verificationAds,
        };

        const newAd = await AdsModel.create(ad);
        adStorage.stepData = {};
        adStorage.completedSteps = [];
        return res
          .status(201)
          .send({ message: "Ad created successfully", ad: newAd });

      default:
        return res.status(400).send({ message: "Invalid step" });
    }
    adStorage.stepData = ad;
    return res
      .status(200)
      .send({ message: "Data collected for step " + step, ad });
  } catch (error) {
    APIErrorLog.error("There was an issue while attempting to create the ad.");
    APIErrorLog.error(error);
    return res.status(500).send({ message: "Something went wrong" });
  }
};

const adsList = async (req, res) => {
  try {
    let condition = {
      isDeleted: false,
    };
    const { mostview, persontype, topEscorts, newAds, country, city, states } =
      req.query;
    let query = { ...condition };
    let sortOption = {};
    if (mostview === "true") {
      sortOption = { views: -1 };
    } else {
      sortOption = { createdAt: -1 };
    }
    if (persontype) {
      query.persontype = persontype;
    }

    if (newAds === "true") {
      sortOption = { _id: -1 };
    }

    if (country) {
      query.country = country;
    }
    if (city) {
      query.city = city;
    }
    if (states) {
      query.states = states;
    }
    const paginationData = await paginationQuery(req.query);

    const [adsData, totalCount] = await Promise.all([
      AdsModel.find(query)
        .skip(paginationData.skip)
        .limit(paginationData.pageSize)
        .sort(sortOption)
        .lean(true),
      AdsModel.countDocuments(query),
    ]);

    let paginationObj = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
      total: totalCount,
    };

    const getPagination = await pagination(paginationObj);
    if (adsData.length) {
      return res.status(200).send({
        data: adsData,
        current: adsData.length,
        totalCount,
        pagination: getPagination,
        message: "All ads details retrieved successfully.",
      });
    }

    return res.status(200).send({
      data: [],
      message: "No ads found.",
    });
  } catch (error) {
    console.log("error", error);

    APIErrorLog.error(
      "There was an issue while trying to retrieve the ads list"
    );
    APIErrorLog.error(error);
    return res.status(500).json({ message: "Error retrieving ads" });
  }
};

const updateAds = async (req, res) => {
  try {
    const { id } = req.params;
    let fileData;
    if (req.files && req.files.length > 0) {
      fileData = await fileUploadFunc(req, res);
      if (fileData.type !== "success") {
        return res.status(fileData.status).send({
          message:
            fileData?.type === "fileNotFound"
              ? "Please upload the image"
              : fileData.type,
        });
      }
    }

    const imageUpdate = req.files?.adsImg
      ? `uploads/adsImg/${req.files.adsImg.map((file) => file.filename)}`
      : undefined;
    const videoUpdate = req.files?.adsVideo
      ? `uploads/adsVideo/${req.files.adsVideo[0].filename}`
      : undefined;

    const {
      name,
      pickUpLine,
      country,
      location,
      postCode,
      description,
      gender,
      age,
      ethnicity,
      nationality,
      language,
      bust,
      height,
      sexOrientation,
      available,
      myService,
      service,
      phoneNumber,
      whatsappNumber,
      verificationAds,
    } = req.body;

    const updateAdsData = {
      name,
      pickUpLine,
      country,
      location,
      postCode,
      description,
      gender,
      age,
      ethnicity,
      nationality,
      language,
      bust,
      height,
      sexOrientation,
      available,
      myService,
      service,
      phoneNumber,
      whatsappNumber,
      verificationAds,
      adsImg: imageUpdate,
      adsVideo: videoUpdate,
    };
    await AdsModel.updateOne({ _id: id }, { $set: updateAdsData });
    return res.status(200).json({
      message: "Ads data updated successfully!",
    });
  } catch (error) {
    APIErrorLog.error("There was an issue while attempting to update the ad");
    APIErrorLog.error(error);
    return res
      .status(500)
      .json({ message: "An error occurred while updating the ad." });
  }
};

const deleteAds = async (req, res) => {
  try {
    const { id } = req.params;
    await AdsModel.deleteOne({ _id: id });
    return res.status(201).json({
      message: "Ads Data Deleted Successfully !",
    });
  } catch (error) {
    APIErrorLog.error("There was an issue while trying to delete the ad");
    APIErrorLog.error(error);
  }
};

const adsDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await AdsModel.findById(id).lean(true);
    if (!ad) {
      return res.status(404).json({ message: "Ad not found" });
    }
    ad.views += 1;
   
    return res.status(200).json({
      message: "Ads Details fetched successfully!",
      data: ad,
    });
  } catch (error) {
    console.log('errorerrorerror',error);
    
    APIErrorLog.error("Error while getting ads detail");
    APIErrorLog.error(error);
    return res.status(500).json({ message: "Error fetching ad details" });
  }
};

const createBlog = async (req, res) => {
  try {
    let fileData;
    if (req.files && req.files.length > 0) {
      fileData = await fileUploadFunc(req, res);
      console.log("fileData", fileData);

      if (fileData.type !== "success") {
        return res.status(fileData.status).send({
          message:
            fileData?.type === "fileNotFound"
              ? "Please upload the image"
              : fileData.type,
        });
      }
    }
      console.log('req.filesreq.files',req.files);
      
    const userAvtar = `uploads/userAvtar/${req.files["userAvtar"][0].filename}`;
    const blogImg = `uploads/blogImg/${req.files["blogImg"][0].filename}`;
    const { name, description, category, tags, postUser } = req.body;
    const payload = {
      name,
      description,
      category,
      tags,
      postUser,
      userAvtar,
      blogImg,
    };
    const blogData = await blogModel.create(payload);
    return res.status(201).json({
      message: "Blog created successfully!",
      data: blogData,
    });
  } catch (error) {
    console.log("errorerror", error);
  }
};

const getAllBlog = async (req, res) => {
  try {
    const data = await blogModel.find().lean();
    return res.status(201).json({
      message: "All blogs details retrived successfully!",
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};

const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    let fileData;
    if (req.files && req.files.length > 0) {
      fileData = await fileUploadFunc(req, res);
      if (fileData.type !== "success") {
        return res.status(fileData.status).send({
          message:
            fileData?.type === "fileNotFound"
              ? "Please upload the image"
              : fileData.type,
        });
      }
    }
    const imageUpdate = req.files?.blogImg
      ? `uploads/blogImg/${req.files.blogImg.map((file) => file.filename)}`
      : undefined;
    console.log("fileDatafileData", imageUpdate);

    const { name, description, category, tags, postUser } = req.body;
    const payload = {
      name,
      description,
      category,
      tags,
      postUser,
      blogImg: imageUpdate,
    };
    const data = await blogModel.updateOne(
      {
        _id: id,
      },
      { $set: payload }
    );
    return res.status(201).json({
      message: "blog data update successfully !",
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};

const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    await blogModel.deleteOne({ _id: id });
    return res.status(201).json({
      message: "Blog deleted successfully!",
    });
  } catch (error) {
    console.log(error);
  }
};

const vendorContactInfo = async (req, res) => {
  try {
    const { name, email, subject, address } = req.body;
    const payload = {
      name,
      email,
      subject,
      address,
    };
    const data = await vendorContactModel.create(payload);
    return res.status(201).json({
      message: "vendor contact information save successfully!",
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};

const getVendorContactInfo = async (req, res) => {
  try {
    const data = await vendorContactModel.find().lean();
    return res.status(201).json({
      message: "vendor contact information get successfully !",
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};

const getSingleVendorContactInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await vendorContactModel.findById({ _id: id });
    return res.status(201).json({
      message: "single vendor information get successfully !",
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};

const uploadVendorDoc = async (req, res) => {
  try {
    let fileData;
    if (req.files && req.files.length > 0) {
      fileData = await fileUploadFunc(req, res);
      console.log("fileData", fileData);

      if (fileData.type !== "success") {
        return res.status(fileData.status).send({
          message:
            fileData?.type === "fileNotFound"
              ? "Please upload the document"
              : fileData.type,
        });
      }
    }

    const uploadDocument = `uploads/document/${req?.files["document"][0].filename}`;
    const { documentOwner, documentType, comment } = req.body;
    const payload = {
      documentOwner,
      documentType,
      comment,
      document: uploadDocument,
    };
    const data = await documentModel.create(payload);
    return res.status(201).json({
      message: "Document Upload Successfully !",
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};
module.exports = {
  registerVendor,
  login,
  sendForgotPasswordOTP,
  validOtp,
  resetPassword,
  changePassword,
  vendorDetail,
  createAd,
  adsList,
  updateAds,
  deleteAds,
  adsDetail,
  createBlog,
  getAllBlog,
  updateBlog,
  deleteBlog,
  vendorContactInfo,
  getVendorContactInfo,
  getSingleVendorContactInfo,
  uploadVendorDoc,
};
