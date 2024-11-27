module.exports.generatePassword = () => {
    try {
        let length = 12,
            charset = "abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789 @/\_-&*#$!()",
            charsetArr = charset.split(' ');
        let retVal = "";
        charsetArr.forEach(chars => {
            for (let i = 0, n = chars.length; i < length / charsetArr.length; ++i) {
                retVal += chars.charAt(Math.floor(Math.random() * n));
            }
        })
        return retVal;
    } catch (error) {
        throw error;
    }
};

module.exports.paginationQuery = (data) => {
    try {
        let page = parseInt(data?.page) || 1;
        const pageSize = parseInt(data?.limit) || 3;
        const skip = (page - 1) * pageSize;

        return {
            page,
            pageSize,
            skip
        }
    } catch (error) {
        throw error
    }
};

module.exports.pagination = (data) => {
    try {
        let obj = {}
        const totalPages = Math.ceil(data.total / data.pageSize);

        if (data.page > totalPages) {
            data.page = 1
        }

        obj = {
            page: data.page,
            hasPrevious: data.page > 1,
            previous: data.page - 1,
            hasNext: data.page < totalPages,
            next: data.page < totalPages ? data.page + 1 : data.page,
            totalPages
        }

        return obj
    } catch (error) {
        throw error
    }
};


module.exports.generateRandomOTP = () => {
    try {
      const digits = "0123456789";
      let OTP = "";
      for (let i = 0; i < 6; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
      }
      return OTP;
    } catch (error) {
      throw error;
    }
};

  module.exports.createLog = (logName) => {
    try {
      return require("simple-node-logger").createRollingFileLogger({
        logDirectory: "logs", // NOTE: folder must exist and be writable...
        fileNamePattern: logName + "_<DATE>.log",
        dateFormat: "YYYY_MM_DD",
        timestampFormat: "YYYY-MM-DD HH:mm:ss",
      });
    } catch (error) {
      throw error;
    }
};
  