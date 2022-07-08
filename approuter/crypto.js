// @ts-nocheck
/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */

const approuter = require("@sap/approuter");

const jwtDecode = require("jwt-decode");
const crypto = require("crypto");

let ar = approuter();


ar.beforeRequestHandler.use((req, res, next) => {
  //console.log("the follow request made...");
  //console.log("Method: " + req.method);
  //console.log("URL : " + req.url);
  next();
});

ar.beforeRequestHandler.use("/getToken", (req, res) => {
  res.statusCode = 200;
  const decodedJWTToken = jwtDecode(req.user.token.accessToken);

  let vData = {
    userId: decodedJWTToken.user_name,
    token: encryptText(decodedJWTToken.user_name)
  };

  res.end(JSON.stringify(vData));
});

ar.start();


function encryptText(personId) {
	const key = crypto.scryptSync("passwd", "salt", 24);
	const iv = Buffer.alloc(16, 0);
	const cipher = crypto.createCipheriv("aes-192-cbc", key, iv);

	let result = cipher.update(personId, "utf8", "base64");
	result += cipher.final("base64");

	return result;
}