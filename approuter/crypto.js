// @ts-nocheck
/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */

const approuter = require("@sap/approuter");
const jwtDecode = require("jwt-decode");
const crypto = require("crypto");
const dotenv = require("dotenv");

dotenv.config();
let ar = approuter();

ar.beforeRequestHandler.use((req, res, next) => {
	// console.log("the follow request made...");
	// console.log("Method: " + req.method);
	// console.log("URL : " + req.url);
	next();
});

ar.beforeRequestHandler.use("/getToken", (req, res) => {
	try {
		// console.log("*** getToken ***");
		//console.log(req);
		res.statusCode = 200;
		const decodedJWTToken = jwtDecode(req.user.token.accessToken);

		const vData = {
			userId: decodedJWTToken.user_name,
			token: encryptText(decodedJWTToken.user_name),
		};

		// console.log(vData);

		res.end(JSON.stringify(vData));
	} catch (err) {
		console.log("Err");
		console.log(err);
	}
});

ar.start();

function encryptText(personId) {
	// 1. 현재 시간(Locale)
	const curr = new Date();

	// 2. UTC 시간 계산
	const utc = curr.getTime() + curr.getTimezoneOffset() * 60 * 1000;

	// 3. UTC to KST (UTC + 9시간)
	const KR_TIME_DIFF = 9 * 60 * 60 * 1000;
	const kr_curr = new Date(utc + KR_TIME_DIFF);
	const datePostFix = kr_curr.getFullYear() + kr_curr.getMonth() + 1 + kr_curr.getDay();
	const year = kr_curr.getFullYear();
	const month = ("0" + (kr_curr.getMonth() + 1)).slice(-2);
	const day = ("0" + kr_curr.getDate()).slice(-2);

	const dateString = `${year}${month}${day}`;
	const privateKey = process.env.PRIVATE_KEY; // hdiprofile_${dateString}
	const finalKey = `${privateKey}${dateString}`;
	const cryptoKey = crypto.scryptSync(finalKey, "salt", 24);
	const iv = Buffer.alloc(16, 0);
	const cipher = crypto.createCipheriv("aes-192-cbc", cryptoKey, iv);

	let result = cipher.update(personId, "utf8", "base64");
	result += cipher.final("base64");

	return result;
}
