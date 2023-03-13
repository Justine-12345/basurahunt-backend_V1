const User = require('../models/user');
const Item = require('../models/item');
const ErrorHandler = require('../utils/errorHandler');
const crypto = require('crypto');
const sendToken = require('../utils/jwtToken');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const sendEmail = require('../utils/sendEmail');
const { ObjectId } = require('mongodb');
const cloudinary = require('cloudinary');
const Dump = require('../models/dump')
const APIFeatures = require('../utils/apiFeatures')

// const fetch = require('node-fetch');
// const {OAuth2Client} = require('google-auth-library');
// const client = new OAuth2Client("101367040621-btgoj7nqib3bps5592vv9ng9l43ld88k.apps.googleusercontent.com")





//******Register (Slide 19-23)******
exports.registerUser = catchAsyncErrors(async (req, res, next) => {

	let result

	if (req.body.avatar) {
		result = await cloudinary.v2.uploader.upload(req.body.avatar, {
			folder: 'BasuraHunt/Avatar',
			width: 500,
			crop: "scale"
		})
	}

	// const result_validId = await cloudinary.v2.uploader.upload(req.body.valid_id, {
	//     folder: 'BasuraHunt/Valid_Id',
	//     width: 500,
	//     crop: "scale"
	// })


	let otp;
	let user_find_otp;
	let count_otp;

	do {
		otpPartial = Math.floor((Math.random() * 999999) + 100000);
		otp = String(otpPartial).substring(0, 6);
		user_find_otp = await User.find({ otp });
		count_otp = user_find_otp.length
	}
	while (count_otp > 0);


	const { first_name, middle_name, last_name, suffix, birthday, phone_number, gender, house_number, street, barangay, email, alias, password, jobDesc } = req.body;


	let user

	if (req.body.avatar) {
		user = await User.create({
			first_name,
			middle_name,
			last_name,
			suffix,
			birthday,
			phone_number,
			gender,
			house_number,
			street,
			barangay,
			avatar: {
				public_id: result.public_id,
				url: result.secure_url
			},
			email,
			alias,
			password,
			otp,
			otp_status: "Fresh",
			jobDesc
		})
	} else {

		user = await User.create({
			first_name,
			middle_name,
			last_name,
			suffix,
			birthday,
			phone_number,
			gender,
			house_number,
			street,
			barangay,
			email,
			alias,
			password,
			otp,
			otp_status: "Fresh",
			jobDesc
		})


	}




	// test token
	// const token = user.getJwtToken();

	// res.status(201).json({
	// 	success:true,
	// 	user,
	// 	token
	// })

	//Send Email OTP

	// const html = `<body style=" background: rgb(255,255,255);background: linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(210,255,236,1) 53%, rgba(169,246,255,1) 100%);"><br/><br/><div style="width:350px; text-align: center; margin: auto;font-family: arial; line-height: 25px;background: white;padding: 24px;box-shadow: 2px 2px 7px #9e9e9e;"><img src="https://static.vecteezy.com/system/resources/thumbnails/001/312/428/small/monitor-with-password-and-shield-free-vector.jpg"/><p>${otp}</p><br/></div></body>`
	// const message = `<body style=" background: rgb(255,255,255);background: linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(210,255,236,1) 53%, rgba(169,246,255,1) 100%);"><br/><br/><div style="width:350px; text-align: center; margin: auto;font-family: arial; line-height: 25px;background: white;padding: 24px;box-shadow: 2px 2px 7px #9e9e9e;"><img src="https://static.vecteezy.com/system/resources/thumbnails/001/312/428/small/monitor-with-password-and-shield-free-vector.jpg"/><p>${otp}</p><br/></div></body>`
	const html = `<body style="height: 100%; color: #1E5128; font-family: 'Helvetica'; padding: 2em 0;">
					<div style="max-width: 500px; margin: auto; background: #f0faf0; padding: 1em;">
						<div style="height: 50px; background: #f7faf7; width: 90%; margin: auto; border: 1px solid #1E5128; border-radius: 100em; display: flex;">
							<img
								style="height: 50px; width: 50px;"
								src="https://res.cloudinary.com/basurahunt/image/upload/v1659267361/BasuraHunt/Static/288365377_590996822453374_4511488390632883973_n_1_odzuj0.png"/>
							<p style="margin: auto 0; font-weight: bold; padding: 0 .2em;">BasuraHunt</p>
						</div>
						<div style="background: #f7faf7; padding: 1em .3em; margin-top: .5em; border-radius: 1em; text-align: center;">
							<i>To complete your registration, enter this code to <strong>BasuraHunt</strong>:</i>
							<h2 style="margin: 3em 0">${otp}</h2>
							<hr/>
								<small>Warning: Do not share this code to anyone. If this is not you, please disregard this e-mail.</small>
							<hr/>
							<small>${req.body.dateTimeNow}.</small>
						</div>
					</div>
				</body>`

	const message = `<body style="height: 100%; color: #1E5128; font-family: 'Helvetica'; padding: 2em 0;">
					<div style="max-width: 500px; margin: auto; background: #f0faf0; padding: 1em;">
						<div style="height: 50px; background: #f7faf7; width: 90%; margin: auto; border: 1px solid #1E5128; border-radius: 100em; display: flex;">
							<img
								style="height: 50px; width: 50px;"
								src="https://res.cloudinary.com/basurahunt/image/upload/v1659267361/BasuraHunt/Static/288365377_590996822453374_4511488390632883973_n_1_odzuj0.png"/>
							<p style="margin: auto 0; font-weight: bold; padding: 0 .2em;">BasuraHunt</p>
						</div>
						<div style="background: #f7faf7; padding: 1em .3em; margin-top: .5em; border-radius: 1em; text-align: center;">
							<i>To complete your registration, enter this code to <strong>BasuraHunt</strong>:</i>
							<h2 style="margin: 3em 0">${otp}</h2>
							<hr/>
								<small>Warning: Do not share this code to anyone. If this is not you, please disregard this e-mail.</small>
							<hr/>
							<small>${req.body.dateTimeNow}.</small>
						</div>
					</div>
				</body>`

	await sendEmail({
		email: user.email,
		subject: 'BasuraHunt OTP',
		message,
		html
	})


	sendToken(user, 200, res)
})


//******Refresh OTP******
exports.refreshOtp = catchAsyncErrors(async (req, res, next) => {

	let otp;
	let user_find_otp;
	let count_otp;

	do {
		otp = Math.floor((Math.random() * 999999) + 100000);
		user_find_otp = await User.find({ otp });
		count_otp = user_find_otp.length
	}
	while (count_otp > 0);

	const user = await User.findById(req.user.id);

	if (user.otp_status == "Verified") {
		res.status(201).json({
			message: "OTP is already Verified",
		})
	} else {

		user.otp = otp;
		user.otp_status = "Fresh";
		await user.save();

		let dateNow = new Date();

		// const html = `<body style=" background: rgb(255,255,255);background: linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(210,255,236,1) 53%, rgba(169,246,255,1) 100%);"><br/><br/><div style="width:350px; text-align: center; margin: auto;font-family: arial; line-height: 25px;background: white;padding: 24px;box-shadow: 2px 2px 7px #9e9e9e;"><img src="https://static.vecteezy.com/system/resources/thumbnails/001/312/428/small/monitor-with-password-and-shield-free-vector.jpg"/><p>${otp}</p><br/></div></body>`
		// const message = `<body style=" background: rgb(255,255,255);background: linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(210,255,236,1) 53%, rgba(169,246,255,1) 100%);"><br/><br/><div style="width:350px; text-align: center; margin: auto;font-family: arial; line-height: 25px;background: white;padding: 24px;box-shadow: 2px 2px 7px #9e9e9e;"><img src="https://static.vecteezy.com/system/resources/thumbnails/001/312/428/small/monitor-with-password-and-shield-free-vector.jpg"/><p>${otp}</p><br/></div></body>`

		const html = `<body style="height: 100%; color: #1E5128; font-family: 'Helvetica'; padding: 2em 0;">
					<div style="max-width: 500px; margin: auto; background: #f0faf0; padding: 1em;">
						<div style="height: 50px; background: #f7faf7; width: 90%; margin: auto; border: 1px solid #1E5128; border-radius: 100em; display: flex;">
							<img
								style="height: 50px; width: 50px;"
								src="https://res.cloudinary.com/basurahunt/image/upload/v1659267361/BasuraHunt/Static/288365377_590996822453374_4511488390632883973_n_1_odzuj0.png"/>
							<p style="margin: auto 0; font-weight: bold; padding: 0 .2em;">BasuraHunt</p>
						</div>
						<div style="background: #f7faf7; padding: 1em .3em; margin-top: .5em; border-radius: 1em; text-align: center;">
							<i>To complete your registration, enter this code to <strong>BasuraHunt</strong>:</i>
							<h2 style="margin: 3em 0">${otp}</h2>
							<hr/>
								<small>Warning: Do not share this code to anyone. If this is not you, please disregard this e-mail.</small>
							<hr/>
							<small>${dateNow.toLocaleString("en-US")}.</small>
						</div>
					</div>
				</body>`

		const message = `<body style="height: 100%; color: #1E5128; font-family: 'Helvetica'; padding: 2em 0;">
					<div style="max-width: 500px; margin: auto; background: #f0faf0; padding: 1em;">
						<div style="height: 50px; background: #f7faf7; width: 90%; margin: auto; border: 1px solid #1E5128; border-radius: 100em; display: flex;">
							<img
								style="height: 50px; width: 50px;"
								src="https://res.cloudinary.com/basurahunt/image/upload/v1659267361/BasuraHunt/Static/288365377_590996822453374_4511488390632883973_n_1_odzuj0.png"/>
							<p style="margin: auto 0; font-weight: bold; padding: 0 .2em;">BasuraHunt</p>
						</div>
						<div style="background: #f7faf7; padding: 1em .3em; margin-top: .5em; border-radius: 1em; text-align: center;">
							<i>To complete your registration, enter this code to <strong>BasuraHunt</strong>:</i>
							<h2 style="margin: 3em 0">${otp}</h2>
							<hr/>
								<small>Warning: Do not share this code to anyone. If this is not you, please disregard this e-mail.</small>
							<hr/>
							<small>${dateNow.toLocaleString("en-US")}.</small>
						</div>
					</div>
				</body>`

		await sendEmail({
			email: user.email,
			subject: 'BasuraHunt OTP',
			message,
			html
		})


		const updatedUser = await User.findById(req.user.id);

		sendToken(updatedUser, 200, res)
	}
})


//******Check OTP******
exports.checkOtp = catchAsyncErrors(async (req, res, next) => {
	const { otp } = req.body;

	const findUser = await User.findById(req.user.id).select('otp push_tokens');


	if (findUser.otp !== otp) {
		return next(new ErrorHandler('Invalid OTP', 401));
	}
	else {


		findUser.otp = "";
		findUser.otp_status = "Verified";


		const allUserTokens = findUser.push_tokens
		const newPushToken = req.body.pushToken
		let newSetsOfTokens = []
		let sameTokenCounter = 0



		allUserTokens.forEach(userToken => {
			if (userToken.push_token === newPushToken) {
				sameTokenCounter += 1
			}
		})


		if (sameTokenCounter <= 0) {
			newSetsOfTokens = [...allUserTokens, { push_token: newPushToken }]
			findUser.push_tokens = newSetsOfTokens
		}

		await findUser.save();

		const user = await User.findById(req.user.id);

		sendToken(user, 200, res)
	}
})



//******Check Email If Exist (Slide 21)******
exports.findEmail = catchAsyncErrors(async (req, res, next) => {
	const user = await User.find({ email: req.body.email }).select('email');

	res.status(201).json({
		count: user.length
	})

})



//******Login (Slide 15)******
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return next(new ErrorHandler('Please enter email & password', 400))
	}

	const user = await User.findOne({ email }).select('password otp_status role first_name last_name avatar alias barangay push_tokens')

	if (!user) {
		return next(new ErrorHandler('Invalid Email or Password', 401));
	}

	// Checks if password is correct or not
	const isPasswordMatched = await user.comparePassword(password);

	if (!isPasswordMatched) {
		return next(new ErrorHandler('Invalid Email or Password', 401));
	}


	const allUserTokens = user.push_tokens
	const newPushToken = req.body.pushToken
	let newSetsOfTokens = []
	let sameTokenCounter = 0



	allUserTokens.forEach(userToken => {
		if (userToken.push_token === newPushToken) {
			sameTokenCounter += 1
		}
	})


	if (sameTokenCounter <= 0) {
		newSetsOfTokens = [...allUserTokens, { push_token: newPushToken }]
		user.push_tokens = newSetsOfTokens
		await user.save();
	}


	sendToken(user, 200, res)
})

//******Logout******
exports.logout = catchAsyncErrors(async (req, res, next) => {
	if (req.body.ismobile) {
		const user = await User.findById(req.body.user_id);
		const userToken = req.body.pushToken
		const userTokens = user.push_tokens
		let newSetOfTokens = []

		userTokens.forEach((push_token) => {
			if (push_token.push_token !== userToken) {
				newSetOfTokens.push({ push_token: push_token.push_token })
			}
		})

		user.push_tokens = newSetOfTokens;
		await user.save();
	}


	res.cookie('token', null, {
		expires: new Date(Date.now()),
		httpOnly: true
	})

	res.status(200).json({
		success: true,
		message: 'Logged out'
	})
})

//******View User's Profile******
exports.getUserProfile = catchAsyncErrors(async (req, res, next) => {
	let user
	if (req.query.forNotification == true || req.query.forNotification == "true") {
		user = await User.findById(req.user.id).populate('notifications').select('-reported_dumps -donated_items -received_items');
	} else {
		user = await User.findById(req.user.id).populate('notifications').select('-reported_dumps -donated_items -received_items');
	}



	let usersBrgyRank = await User.aggregate(
		[
			{ $match: { "barangay": user.barangay, "level": { $gte: 1 }, "role": "user" } },
			{ $group: { _id: { id: "$_id", alias: "$alias", level: "$level", exp: "$exp" } } }
		]
	).sort({ "_id.level": -1, "_id.exp": -1, "_id.alias": 1 })
	let usersCityRank = await User.aggregate(
		[
			{ $match: { "level": { $gte: 1 }, "role": "user" } },
			{ $group: { _id: { id: "$_id", alias: "$alias", level: "$level", exp: "$exp" } } }
		]
	).sort({ "_id.level": -1, "_id.exp": -1, "_id.alias": 1 })


	let userBrgyRank = 0
	let brgyCount = 0

	usersBrgyRank.forEach((userRank) => {
		brgyCount += 1
		if (String(userRank._id.id) === String(user._id)) {
			userBrgyRank = brgyCount
		}
	})


	let userCityRank = 0
	let cityCount = 0


	usersCityRank.forEach((userRankCity) => {
		cityCount += 1
		if (String(userRankCity._id.id) === String(user._id)) {
			userCityRank = cityCount
		}
	})




	if (!user) {
		return next(new ErrorHandler(`User does not found with id: ${req.params.id}`))
	}

	let token
	if (req.headers.token) {
		token = req.headers.token
	} else {
		token = req.cookies.token
	}

	const dumps = await Dump.find({ "user_id": req.user.id });
	const items = await Item.find({ "user_id": req.user.id });
	const reportedDumpCounts = dumps.length
	const donatedItemsCount = items.length
	res.status(200).json({
		success: true,
		user,
		userBrgyRank,
		userCityRank,
		otp_status: user.otp_status,
		reportedDumpCounts,
		donatedItemsCount,
		token
	})

})


//******Update User's Password******
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
	const user = await User.findById(req.user.id).select('password');

	// Check previous user password
	const isMatched = await user.comparePassword(req.body.oldPassword)

	if (!isMatched) {
		return next(new ErrorHandler('Old password is incorrect'));
	}

	user.password = req.body.password;
	await user.save();

	const updatedUser = await User.findById(req.user.id);

	sendToken(updatedUser, 200, res)
})




//******Update User's Profile******
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {

	const newUserData = {
		first_name: req.body.first_name,
		middle_name: req.body.middle_name,
		last_name: req.body.last_name,
		suffix: req.body.suffix,
		birthday: req.body.birthday,
		phone_number: req.body.phone_number,
		gender: req.body.gender,
		house_number: req.body.house_number,
		street: req.body.street,
		barangay: req.body.barangay,
		email: req.body.email,
		alias: req.body.alias,
		// password: req.body.password,
	}


	// Update avatar
	if (req.body.avatar) {
		const user = await User.findById(req.user.id)

		const image_id = user.avatar.public_id;
		const res = await cloudinary.v2.uploader.destroy(image_id);

		const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
			folder: 'avatars',
			width: 150,
			crop: "scale"
		})

		newUserData.avatar = {
			public_id: result.public_id,
			url: result.secure_url
		}
	}

	console.log("newUserData", newUserData)

	const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
		new: true,
		runValidators: true,
	});

	res.status(200).json({
		success: true,
		user
	})

})

//******Get User List (Admin)******
exports.allUsers = catchAsyncErrors(async (req, res, next) => {
	const users = await User.find().sort({ _id: -1 }).select('-avatar -suffix -birthday -alias -level -exp -otp -activeChat -otp_status -reported_dumps -donated_items -received_items -push_tokens -notifications -gender -phone_number');

	res.status(200).json({
		success: true,
		users
	})
})


//******Get User Details (Admin)******
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
	const user = await User.findById(req.params.id).select('-valid_id -received_items -notifications -activeChat -push_tokens');

	let usersBrgyRank = await User.aggregate(
		[
			{ $match: { "barangay": user.barangay, "level": { $gte: 1 }, "role": "user" } },
			{ $group: { _id: { id: "$_id", alias: "$alias", level: "$level", exp: "$exp" } } }
		]
	).sort({ "_id.level": -1, "_id.exp": -1, "_id.alias": 1 })


	let usersCityRank = await User.aggregate(
		[
			{ $match: { "level": { $gte: 1 }, "role": "user" } },
			{ $group: { _id: { id: "$_id", alias: "$alias", level: "$level", exp: "$exp" } } }
		]
	).sort({ "_id.level": -1, "_id.exp": -1, "_id.alias": 1 })


	let userBrgyRank = 0
	let brgyCount = 0

	usersBrgyRank.forEach((userRank) => {
		brgyCount += 1
		if (String(userRank._id.id) === String(user._id)) {
			userBrgyRank = brgyCount
		}
	})


	let userCityRank = 0
	let cityCount = 0

	usersCityRank.forEach((userRankCity) => {
		cityCount += 1
		if (String(userRankCity._id.id) === String(user._id)) {
			userCityRank = cityCount
		}
	})




	if (!user) {
		return next(new ErrorHandler(`User does not found with id: ${req.params.id}`))
	}

	res.status(200).json({
		success: true,
		user,
		userBrgyRank,
		userCityRank
	})

})


//******User Fogot Password******
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
	const user = await User.findOne({ email: req.body.email });

	if (!user) {
		return next(new ErrorHandler('User not found with this email', 404));
	}

	// Get reset token
	let resetToken;
	if (req.body.ismobile) {

		let code;
		let user_find_passCode;
		let count_passCode;
		let passCodePartial;
		do {
			passCodePartial = Math.floor((Math.random() * 999999) + 100000);
			code = String(passCodePartial).substring(0, 6);
			user_find_passCode = await User.find({ resetPasswordToken: code });
			count_passCode = user_find_passCode.length
		}
		while (count_passCode > 0);
		resetToken = user.getResetPasswordTokenMobile(code);

	} else {
		resetToken = user.getResetPasswordToken();
	}


	await user.save({ validationBeforeSave: false });

	//Create reset password url
	const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}/${user.email}`;

	// const html = `<body style=" background: rgb(255,255,255);background: linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(210,255,236,1) 53%, rgba(169,246,255,1) 100%);"><br/><br/><div style="width:350px; text-align: center; margin: auto;font-family: arial; line-height: 25px;background: white;padding: 24px;box-shadow: 2px 2px 7px #9e9e9e;"><img src="https://static.vecteezy.com/system/resources/thumbnails/001/312/428/small/monitor-with-password-and-shield-free-vector.jpg"/><p>Your password reset token is below.If you have not requested this email, then ignore it.</p><br/><a href="${resetUrl}" style="background: #33cabb;padding: 12px;color:white;text-decoration: unset;box-shadow: 1px 1px 10px #c7c7c7;"><b>Reset Password</b></a></div></body>`

	// const message = `<body style=" background: rgb(255,255,255);background: linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(210,255,236,1) 53%, rgba(169,246,255,1) 100%);"><br/><br/><div style="width:350px; text-align: center; margin: auto;font-family: arial; line-height: 25px;background: white;padding: 24px;box-shadow: 2px 2px 7px #9e9e9e;"><img src="https://static.vecteezy.com/system/resources/thumbnails/001/312/428/small/monitor-with-password-and-shield-free-vector.jpg"/><p>Your password reset token is below.If you have not requested this email, then ignore it.</p><br/><a href="${resetUrl}" style="background: #33cabb;padding: 12px;color:white;text-decoration: unset;box-shadow: 1px 1px 10px #c7c7c7;"><b>Reset Password</b></a></div></body>`

	let html
	let message

	if (req.body.ismobile) {
		html = `<body style="height: 100%; color: #1E5128; font-family: 'Helvetica'; padding: 2em 0;">
					<div style="max-width: 500px; margin: auto; background: #f0faf0; padding: 1em;">
						<div style="height: 50px; background: #f7faf7; width: 90%; margin: auto; border: 1px solid #1E5128; border-radius: 100em; display: flex;">
							<img
								style="height: 50px; width: 50px;"
								src="https://res.cloudinary.com/basurahunt/image/upload/v1659267361/BasuraHunt/Static/288365377_590996822453374_4511488390632883973_n_1_odzuj0.png"/>
							<p style="margin: auto 0; font-weight: bold; padding: 0 .2em;">BasuraHunt</p>
						</div>
						<div style="background: #f7faf7; padding: 1em .3em; margin-top: .5em; border-radius: 1em; text-align: center;">
							<i>To reset your password, use this 6-digit code:</i>
							<h2 style="margin: 3em 0"><span style="text-decoration: none; color: #1E5128; padding: .5em; ">${resetToken}</span></h2>
							<hr/>
								<small>Warning: If you did not request to reset your password, please disregard this e-mail.</small>
							<hr/>
							<small>${req.body.dateTimeNow}.</small>
						</div>
					</div>
				</body>`

		message = `<body style="height: 100%; color: #1E5128; font-family: 'Helvetica'; padding: 2em 0;">
				<div style="max-width: 500px; margin: auto; background: #f0faf0; padding: 1em;">
					<div style="height: 50px; background: #f7faf7; width: 90%; margin: auto; border: 1px solid #1E5128; border-radius: 100em; display: flex;">
						<img
							style="height: 50px; width: 50px;"
							src="https://res.cloudinary.com/basurahunt/image/upload/v1659267361/BasuraHunt/Static/288365377_590996822453374_4511488390632883973_n_1_odzuj0.png"/>
						<p style="margin: auto 0; font-weight: bold; padding: 0 .2em;">BasuraHunt</p>
					</div>
					<div style="background: #f7faf7; padding: 1em .3em; margin-top: .5em; border-radius: 1em; text-align: center;">
						<i>To reset your password, use this 6-digit code:</i>
						<h2 style="margin: 3em 0"><span style="text-decoration: none; color: #1E5128; padding: .5em; ">${resetToken}</span></h2>
						<hr/>
							<small>Warning: If you did not request to reset your password, please disregard this e-mail.</small>
						<hr/>
						<small>${req.body.dateTimeNow}.</small>
					</div>
				</div>
			</body>`

	} else {
		html = `<body style="height: 100%; color: #1E5128; font-family: 'Helvetica'; padding: 2em 0;">
					<div style="max-width: 500px; margin: auto; background: #f0faf0; padding: 1em;">
						<div style="height: 50px; background: #f7faf7; width: 90%; margin: auto; border: 1px solid #1E5128; border-radius: 100em; display: flex;">
							<img
								style="height: 50px; width: 50px;"
								src="https://res.cloudinary.com/basurahunt/image/upload/v1659267361/BasuraHunt/Static/288365377_590996822453374_4511488390632883973_n_1_odzuj0.png"/>
							<p style="margin: auto 0; font-weight: bold; padding: 0 .2em;">BasuraHunt</p>
						</div>
						<div style="background: #f7faf7; padding: 1em .3em; margin-top: .5em; border-radius: 1em; text-align: center;">
							<i>To reset your password, click this link:</i>
							<h2 style="margin: 3em 0"><a href="${resetUrl}" style="background: #1E5128; text-decoration: none; color: #f7faf7; padding: .5em; border-radius: 1em;">Reset Password</a></h2>
							<hr/>
								<small>Warning: If you did not request to reset your password, please disregard this e-mail.</small>
							<hr/>
							<small>${req.body.dateTimeNow}.</small>
						</div>
					</div>
				</body>`

		message = `<body style="height: 100%; color: #1E5128; font-family: 'Helvetica'; padding: 2em 0;">
					<div style="max-width: 500px; margin: auto; background: #f0faf0; padding: 1em;">
						<div style="height: 50px; background: #f7faf7; width: 90%; margin: auto; border: 1px solid #1E5128; border-radius: 100em; display: flex;">
							<img
								style="height: 50px; width: 50px;"
								src="https://res.cloudinary.com/basurahunt/image/upload/v1659267361/BasuraHunt/Static/288365377_590996822453374_4511488390632883973_n_1_odzuj0.png"/>
							<p style="margin: auto 0; font-weight: bold; padding: 0 .2em;">BasuraHunt</p>
						</div>
						<div style="background: #f7faf7; padding: 1em .3em; margin-top: .5em; border-radius: 1em; text-align: center;">
							<i>To reset your password, click this link:</i>
							<h2 style="margin: 3em 0"><a href="${resetUrl}" style="background: #1E5128; text-decoration: none; color: #f7faf7; padding: .5em; border-radius: 1em;">Reset Password</a></h2>
							<hr/>
								<small>Warning: If you did not request to reset your password, please disregard this e-mail.</small>
							<hr/>
							<small>${req.body.dateTimeNow}.</small>
						</div>
					</div>
				</body>`


	}





	try {

		await sendEmail({
			email: user.email,
			subject: 'BasuraHunt Password Recovery Email',
			message,
			html
		})

		res.status(200).json({
			success: true,
			message: `Email sent to: ${user.email}`
		})

	} catch (error) {
		user.resetPasswordToken = undefined;
		user.resetPasswordExpire = undefined;

		await user.save({ validationBeforeSave: false });

		return next(new ErrorHandler(error.message, 500))
	}

})


//******User Reset Password******
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {

	//Hash URL token
	let resetPasswordToken

	if (req.body.ismobile) {
		resetPasswordToken = req.params.token
	} else {
		resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')

	}

	const user = await User.findOne({
		resetPasswordToken,
		resetPasswordExpire: { $gt: Date.now() }
	})

	if (!user) {
		return next(new ErrorHandler('Password reset token is invalid or has been expired', 400))
	}

	if (req.body.password !== req.body.confirmPassword) {
		return next(new ErrorHandler('Password does not match', 400))
	}

	//Setup new password
	user.password = req.body.password;

	user.resetPasswordToken = undefined;
	user.resetPasswordExpire = undefined;

	await user.save();

	sendToken(user, 200, res);

})



//******Update User(Admin)******
exports.updateUser = catchAsyncErrors(async (req, res, next) => {



	const newUserData = {
		first_name: req.body.first_name,
		middle_name: req.body.middle_name,
		last_name: req.body.last_name,
		suffix: req.body.suffix,
		birthday: req.body.birthday,
		phone_number: req.body.phone_number,
		gender: req.body.gender,
		house_number: req.body.house_number,
		street: req.body.street,
		barangay: req.body.barangay,
		email: req.body.email,
		alias: req.body.alias,
		password: req.body.password,
		role: req.body.role,
		jobDesc: req.body.jobDesc
	}

	const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
		new: true,
		runValidators: true,
		useFindAndModify: false
	})

	res.status(200).json({
		user,
		success: true
	})

})

//******Delete User (Admin)******
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
	const user = await User.findById(req.params.id);

	if (!user) {
		return next(new ErrorHandler('User not found', 404));
	}

	// const image_id = user.avatar.public_id;
	//    await cloudinary.v2.uploader.destroy(image_id);

	await user.remove();
	res.status(200).json({
		success: true,
		message: 'User deleted'
	})
})



//******Reported Dumps By User******
exports.reportedDumps = catchAsyncErrors(async (req, res, next) => {


	const resPerPage = 5;
	const currentPath = Number(req.query.page) || 1;
	const skip = resPerPage * (currentPath - 1)

	let userDumpsFind

	if (req.query.ismobile == "true") {
		userDumpsFind = await User.findById(req.user.id).select('reported_dumps').populate({
			path: 'reported_dumps',
			populate: {
				path: 'dump',
				populate: {
					path: 'chat_id',
					select: { 'room': 1 }
				},
				select: { '_id': 1, 'complete_address': 1, 'status': 1, 'images': 1, 'complete_address': 1, 'additional_desciption': 1, 'createdAt': 1 },
			}
		})
	} else {
		userDumpsFind = await User.findById(req.user.id).select('reported_dumps').populate({
			path: 'reported_dumps',
			populate: {
				path: 'dump',
				populate: {
					path: 'chat_id',
					select: { 'room': 1 }
				},
				select: { '_id': 1, 'complete_address': 1, 'status': 1, 'images': 1, 'complete_address': 1, 'additional_desciption': 1, 'waste_type': 1, 'coordinates': 1, 'createdAt': 1 },
			}
		})
	}


	if (!userDumpsFind) {
		return next(new ErrorHandler('User Dumps not found', 404));
	}

	let userDumpsP = []
	let userDumps = []
	let dumpsCount
	let filteredDumpCount
	if (req.query.ismobile == "true") {
		userDumpsFind.reported_dumps.reverse().forEach(dump => {
			if (dump.dump !== null) {
				userDumpsP.push(dump)
			}
		})

		dumpsCount = userDumpsP.length
		userDumps = userDumpsP.slice(skip, skip + resPerPage)
		filteredDumpCount = userDumps.length
	} else {
		userDumpsFind.reported_dumps.reverse().forEach(dump => {
			if (dump.dump !== null) {
				userDumps.push(dump)
			}
		})
	}



	res.status(200).json({
		success: true,
		dumpsCount,
		resPerPage,
		filteredDumpCount,
		userDumps
	})
})


//******Receive Items By User******
exports.receiveItems = catchAsyncErrors(async (req, res, next) => {
	// const userReceiveItems = await User.findById(req.user.id).populate('received_items.item').select('received_items');

	const resPerPage = 3;
	const currentPath = Number(req.query.page) || 1;
	const skip = resPerPage * (currentPath - 1)

	const userReceiveItemsFind = await User.findById(req.user.id).populate({
		path: 'received_items',
		populate: {
			path: 'item',
			// populate: [
			// 	{
			// 		path: 'chat_id',
			// 	},
			// 	{
			// 		path: 'user_id',
			// 	},
			// 	{
			// 		path: 'receiver_id',
			// 	}
			// ]
			select: { 'images': 1, "createdAt": 1, "status": 1, "name": 1, "additional_description": 1, "item_type": 1, "date_recieved": 1 }
		}
	}).select('received_items');


	if (!userReceiveItemsFind) {
		return next(new ErrorHandler('User Receive Items not found', 404));
	}

	let userReceiveItemsP = []
	let userReceiveItems = []
	let itemsCount
	let filteredItemCount

	if (req.query.ismobile == "true") {
		userReceiveItemsFind.received_items.reverse().forEach(item => {
			if (item.item !== null) {
				userReceiveItemsP.push(item)
			}
		})

		itemsCount = userReceiveItemsP.length
		userReceiveItems = userReceiveItemsP.slice(skip, skip + resPerPage)
		filteredItemCount = userReceiveItems.length
	} else {
		userReceiveItemsFind.received_items.reverse().forEach(item => {
			if (item.item !== null) {
				userReceiveItems.push(item)
			}
		})
	}

	res.status(200).json({
		success: true,
		resPerPage,
		itemsCount,
		filteredItemCount,
		userReceiveItems
	})
})

//******Donated Items By User******
exports.donatedItems = catchAsyncErrors(async (req, res, next) => {
	// const userDonatedItems = await User.findById(req.user.id).populate('donated_items.item').select('donated_items');
	const resPerPage = 5;
	const currentPath = Number(req.query.page) || 1;
	const skip = resPerPage * (currentPath - 1)

	const userDonatedItemsfind = await User.findById(req.user.id).populate({
		path: 'donated_items',
		populate: {
			path: 'item',
			// populate: [
			// 	{
			// 		path: 'chat_id',
			// 	},
			// 	{
			// 		path: 'user_id',
			// 	},
			// 	{
			// 		path: 'receiver_id',
			// 	}
			// ],
			select: { 'images': 1, "createdAt": 1, "status": 1, "name": 1, "additional_description": 1, "item_type": 1 }

		}

	})
		.select('donated_items');


	if (!userDonatedItemsfind) {
		return next(new ErrorHandler('User Donated Items not found', 404));
	}

	let userDonatedItemsP = []
	let userDonatedItems = []
	let itemsCount
	let filteredItemCount

	if (req.query.ismobile == "true") {
		userDonatedItemsfind.donated_items.reverse().forEach(item => {
			if (item.item !== null) {
				userDonatedItemsP.push(item)
			}
		})

		itemsCount = userDonatedItemsP.length
		userDonatedItems = userDonatedItemsP.slice(skip, skip + resPerPage)
		filteredItemCount = userDonatedItems.length
	} else {
		userDonatedItemsfind.donated_items.reverse().forEach(item => {
			if (item.item !== null) {
				userDonatedItems.push(item)
			}
		})
	}
	res.status(200).json({
		success: true,
		resPerPage,
		itemsCount,
		filteredItemCount,
		userDonatedItems
	})
})



//******Claimed Items By User******
exports.claimedItems = catchAsyncErrors(async (req, res, next) => {


	// const userClaimedItems = await Item.find({ receiver_id: req.user.id, status: ["Claimed", "Confirmed"] }).populate('chat_id').populate("receiver_id").populate("user_id").sort({ "date_claimed": -1 });
	const itemsCount = await Item.find({ receiver_id: req.user.id, status: ["Claimed", "Confirmed"] }).select("addional_desciption name images createdAt status item_type").sort({ "date_claimed": -1 }).countDocuments();
	const resPerPage = 5;

	let apiFeatures

	apiFeatures = new APIFeatures(Item.find({ receiver_id: req.user.id, status: ["Claimed", "Confirmed"] }).select("addional_desciption name images createdAt status item_type date_claimed").sort({ "date_claimed": -1 }), req.query);

	apiFeatures.pagination(resPerPage);

	const userClaimedItems = await apiFeatures.query;
	filteredItemCount = userClaimedItems.length
	if (!userClaimedItems) {
		return next(new ErrorHandler('User Donated Items not found', 404));
	}

	// let userClaimedItems = []

	// userDumpsFind.reported_dumps.reverse().forEach(dump => {
	// 	if (dump.dump !== null) {
	// 		userDumps.push(dump)
	// 	}
	// })

	res.status(200).json({
		success: true,
		itemsCount,
		resPerPage,
		filteredItemCount,
		userClaimedItems
	})
})



exports.readNofication = catchAsyncErrors(async (req, res, next) => {

	const user = await User.findById(req.user.id);

	notifications = []
	for (var i = 0; i < user.notifications.length; i++) {
		notification = user.notifications[i]
		if (String(req.body.notifCode).trim() == String(notification.notifCode).trim()) {
			notification.status = 'read'
			notifications.push(notification)
			// console.log(notification)
		} else {
			notifications.push(notification)
		}


	}


	if (!user) {
		return next(new ErrorHandler('User Notification not found', 404));
	}

	await user.save();

	res.status(200).json({
		success: true,
		user
	})
})


// exports.readNofication = catchAsyncErrors(async (req, res, next) => {

// 	const user = await User.findById(req.user.id);

// 	notifications = []

// 	for (var i = 0; i < user.notifications.length; i++) {
// 		notification = user.notifications[i]

// 		if (req.body.notifCode == notification.notifCode) {
// 			notification.status = 'read'
// 			notifications.push(notification)
// 		} else {
// 			notifications.push(notification)
// 		}


// 	}


// 	if (!user) {
// 		return next(new ErrorHandler('User Notification not found', 404));
// 	}

// 	await user.save();

// 	res.status(200).json({
// 		success: true,
// 		user
// 	})
// })



exports.getLevelExp = catchAsyncErrors(async (req, res, next) => {

	const user = await User.findById(req.user.id, { level: 1, exp: 1 });

	res.status(200).json({
		success: true,
		levelExp: user
	})
})

