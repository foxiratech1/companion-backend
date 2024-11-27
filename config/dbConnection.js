const mongoose = require("mongoose");
const md5 = require("md5");
const moment = require("moment");
const humanize = require("string-humanize");

mongoose.set("strictQuery", true);
const connectDb = async () => {
  try {
    const connect = await mongoose.connect(process.env.CONNECTION_STRING, {
      usenewurlparser: true,
      useunifiedtopology: true,
    });
    console.log(
      "Database connected: ",
      connect.connection.host,
      connect.connection.name
    );

    // const checkAdmin = await Admin.countDocuments({});

    // if (!checkAdmin) {
    //   await Admin.create({
    //     firstName: humanize("admin"),
    //     lastName: humanize("companion"),
    //     email: "admin@companion.com",
    //     password: md5("Admin@11"),
    //     roles: "superAdmin",
    //     phone: "+911111111111",
    //     dob: moment(new Date("01/01/1998")).format(
    //       "YYYY-MM-DD[T00:00:00.000Z]"
    //     ),
    //   });
    // }
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

module.exports = connectDb;
