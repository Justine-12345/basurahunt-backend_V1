const Dump = require('../models/dump')
const User = require('../models/user');
const Chat = require('../models/chat');
const ErrorHandler = require('../utils/errorHandler')
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const APIFeatures = require('../utils/apiFeatures')
const AddExp = require('../utils/addExp')
const MinusExp = require('../utils/minusExp')
// const cloudinary = require('cloudinary');
const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const swearjarEng = require('swearjar-extended2');
const swearjarFil = require('swearjar-extended2');
const cloudinary = require('cloudinary');
const barangayStatuses = require('../utils/getBrgyStatuses')
const districtStatuses = require('../utils/getDistrictStatuses')
const expoSendNotification = require('../utils/expoSendNotification')
//******Add New Dumps (Admin)****** 
exports.newDump = catchAsyncErrors(async (req, res, next) => {
	let images = []

	if (typeof req.body.images === 'string') {
		images.push(req.body.images)
	} else {
		images = req.body.images
	}

	let imagesLinks = [];

	if (req.body.images) {
		for (let i = 0; i < images.length; i++) {
			const result = await cloudinary.v2.uploader.upload(images[i], {
				folder: 'BasuraHunt/Dump'
			});

			imagesLinks.push({
				public_id: result.public_id,
				url: result.secure_url
			})
		}
	}



	let types = [];


	if (typeof req.body.waste_type == "string") {
		types.push({ type: req.body.waste_type })
	}
	else {
		for (let i = 0; i < req.body.waste_type.length; i++) {
			const type = req.body.waste_type[i];
			types.push({ type })
		}
	}

	console.log(types)

	let coordinates = { latitude: req.body.latitude, longtitude: req.body.longtitude };

	req.body.images = imagesLinks
	req.body.waste_type = types;
	req.body.waste_desc = req.body.waste_type === "Other" || req.body.waste_type.includes("Other") ? req.body.waste_desc : ''
	req.body.coordinates = coordinates;
	req.body.user_id = req.user.id;
	req.body.report_using = req.body.reportUsing === "Alias" ? req.user.alias : req.body.reportUsing === "Real Name" ? req.user.first_name + " " + req.user.last_name : req.body.reportUsing === "Anonymous" ? "Anonymous" : "";

	let district

	const district1 = ["Bagumbayan",
		"Bambang",
		"Calzada",
		"Hagonoy",
		"Ibayo-Tipas",
		"Ligid-Tipas",
		"Lower Bicutan",
		"New Lower Bicutan",
		"Napindan",
		"Palingon",
		"San Miguel",
		"Santa Ana",
		"Tuktukan",
		"Ususan",
		"Wawa"]
	const district2 = ["Central Bicutan",
		"Central Signal Village",
		"Fort Bonifacio",
		"Katuparan",
		"Maharlika Village",
		"North Daang Hari",
		"North Signal Village",
		"Pinagsama",
		"South Daang Hari",
		"South Signal Village",
		"Tanyag",
		"Upper Bicutan",
		"Western Bicutan"]

	if (district1.includes(req.body.barangay)) {
		req.body.district = 1
	}
	if (district2.includes(req.body.barangay)) {
		req.body.district = 2
	}

	if (req.user.role == "administrator") {
		req.body.status = "Confirmed"
	}



	const dump = await Dump.create(req.body);
	const user = await User.findById(req.user.id);

	let reported_dumps = [...user.reported_dumps, { dump: dump._id }]

	user.reported_dumps = reported_dumps;

	await user.save();

	const chat = await Chat.create({
		room: dump._id + "-" + Math.floor(Math.random() * Date.now())
	})

	dump.chat_id = chat._id
	await dump.save();


	const NotifTitle = `New Illegal Dump Report In ${req.body.complete_address} Brgy.${req.body.barangay}`

	const bulk = await User.find({ role: "administrator" }).updateMany({
		$push: {
			notifications: {
				room: 'basurahunt-notification-3DEA5E28CE9B6E926F52AF75AC5F7-94687284AF4DF8664C573E773CF31',
				title: NotifTitle,
				sender_id: req.user.id,
				receiver_id: null,
				time: new Date(Date.now()),
				barangay: req.body.barangay,
				link: `/report/${dump._id}/${dump.coordinates.longtitude}/${dump.coordinates.latitude}`,
				notifCode: req.body.notifCode,
				status: 'unread',
				category: 'illegalDump-new'
			}
		}
	});


	const bulk1 = await User.find({ barangay: req.body.barangay, _id: { $ne: req.user.id }, role: "barangayAdministrator" }).updateMany({
		$push: {
			notifications: {
				room: 'basurahunt-notification-3DEA5E28CE9B6E926F52AF75AC5F7-94687284AF4DF8664C573E773CF31',
				title: NotifTitle,
				sender_id: req.user.id,
				receiver_id: null,
				time: new Date(Date.now()),
				barangay: req.body.barangay,
				link: `/report/${dump._id}/${dump.coordinates.longtitude}/${dump.coordinates.latitude}`,
				notifCode: req.body.notifCode,
				status: 'unread',
				category: 'illegalDump-new'
			}
		}
	});


	res.status(201).json({
		success: true,
		dump
	})

})



//******Get All Dumps (Not For Tables)******
exports.getDumps = catchAsyncErrors(async (req, res, next) => {

	const resPerPage = 5;
	const dumpsCount = await Dump.countDocuments();
	// const apiFeatures = new APIFeatures(Dump.find().sort({ _id: -1 }).populate('chat_id').populate('user_id'), req.query).search().filter();
	let apiFeatures
	if (req.query.ismobile == "true") {
		apiFeatures = new APIFeatures(Dump.find().sort({ _id: -1 }).select("complete_address additional_desciption images createdAt status"), req.query).search().filter();
		if (!req.query.keyword) {
			apiFeatures.pagination(resPerPage);
		}
	} else {
		apiFeatures = new APIFeatures(Dump.find().sort({ _id: -1 }).select("-barangay -district -landmark -waste_desc -waste_size -accessible_by -category_violation -report_using -comments -collectors"), req.query).search().filter();
		apiFeatures.pagination(resPerPage);
	}



	const dumps = await apiFeatures.query;

	let filteredDumpCount = dumps.length;

	if (!dumps) {
		return next(new ErrorHandler('Dumps not found', 404))
	}

	res.status(200).json({
		success: true,
		dumpsCount,
		resPerPage,
		filteredDumpCount,
		dumps
	})
})

exports.getDumpList = catchAsyncErrors(async (req, res, next) => {
	let dumps
	if (req.user.role == 'garbageCollector') {

		findDumps = await Dump.find().populate("user_id", "first_name last_name role barangay").sort({ _id: -1 }).sort({ _id: -1 });

		let dumpsArry = []

		findDumps.forEach(dump => {
			dump.collectors.forEach((collector) => {
				if (String(collector.collector) === String(req.user.id)) {
					dumpsArry.push(dump)
				}
			});
		});
		dumps = dumpsArry




	}else if (req.user.role == 'barangayAdministrator'){
		dumps = await Dump.find({barangayAssigned: req.user.barangay}).populate("user_id").populate("chat_id").sort({ _id: -1 });
	}
	else {
		dumps = await Dump.find().populate("user_id").populate("chat_id").sort({ _id: -1 });
	}
	res.status(200).json({
		success: true,
		dumps
	})
})

//******Get User List (Admin/table)******
exports.allDumps = catchAsyncErrors(async (req, res, next) => {
	const dumps = await Dump.find().sort({ _id: -1 }).populate('user_id', 'first_name last_name role').populate('chat_id', 'room').select('-images -landmark -waste_desc -additional_desciption -report_using -score -comments -collectors');
	res.status(200).json({
		success: true,
		dumps
	})
})



//******View Dump******
exports.getSingleDump = catchAsyncErrors(async (req, res, next) => {
	const dump = await Dump.findById(req.params.id).populate('user_id', 'role first_name last_name alias barangay').populate('chat_id', 'room').populate('collectors.collector', 'first_name last_name jobDesc barangay').populate('chat_id.chat.chats');


	if (!dump) {
		return next(new ErrorHandler('Dump not found', 404))
	}

	const dumpForChat = await Dump.findById(req.params.id).populate('chat_id');

	const chat = dumpForChat.chat_id.chats

	res.status(200).json({
		success: true,
		dump,
		chat
	})
})




//****** Update Dump******
exports.updateDump = catchAsyncErrors(async (req, res, next) => {

	let dump = await Dump.findById(req.params.id).populate('user_id');

	if (!dump) {
		return next(new ErrorHandler('Dump not found', 404));
	}

	let oldImages = []
	for (var i = 0; i < dump.images.length; i++) {
		oldImages.push(dump.images[i])
	}

	let remainingImages = []


	// Deleting images associated with the dump
	if (req.body.oldImagesPublic === undefined) {
		for (let i = 0; i < dump.images.length; i++) {
			const result = await cloudinary.v2.uploader.destroy(dump.images[i].public_id)
		}
	} else {
		for (let i = 0; i < oldImages.length; i++) {

			if (!req.body.oldImagesPublic.includes(oldImages[i].public_id)) {

				const result = await cloudinary.v2.uploader.destroy(oldImages[i].public_id)

			} else {
				remainingImages.push({
					public_id: oldImages[i].public_id,
					url: oldImages[i].url
				})

			}
		}

	}



	let imagesLinks = [];
	let images = []

	if (typeof req.body.images === 'string') {
		images.push(req.body.images)
	} else {
		images = req.body.images
	}
	if (images !== undefined) {
		for (let i = 0; i < images.length; i++) {
			const result = await cloudinary.v2.uploader.upload(images[i], {
				folder: 'BasuraHunt/Dump'
			});

			imagesLinks.push({
				public_id: result.public_id,
				url: result.secure_url
			})
		}
	}

	let allImages = []

	if (remainingImages.length > 0) {
		for (let i = 0; i < remainingImages.length; i++) {
			allImages.push(remainingImages[i])
		}
	}
	if (imagesLinks.length > 0) {
		for (let i = 0; i < imagesLinks.length; i++) {
			allImages.push(imagesLinks[i])
		}
	}

	req.body.images = allImages




	if (req.body.waste_type === "confirmOnly") {
		req.body.waste_type = dump.waste_type;
	} else {
		let types = [];
		if (req.body.waste_type) {
			if (typeof req.body.waste_type == "string") {
				types.push({ type: req.body.waste_type })
			}
			else {
				for (let i = 0; i < req.body.waste_type.length; i++) {
					const type = req.body.waste_type[i];
					types.push({ type })
				}
			}
		}
		req.body.waste_type = types;
	}



	let coordinates = { latitude: req.body.latitude, longtitude: req.body.longtitude };


	req.body.coordinates = coordinates;

	// if (req.user.id == dump.user_id._id) {
	// 	req.body.report_using = req.user.alias;
	// }else{
	req.body.report_using = dump.report_using
	// }

	let district

	const district1 = ["Bagumbayan",
		"Bambang",
		"Calzada",
		"Hagonoy",
		"Ibayo-Tipas",
		"Ligid-Tipas",
		"Lower Bicutan",
		"New Lower Bicutan",
		"Napindan",
		"Palingon",
		"San Miguel",
		"Santa Ana",
		"Tuktukan",
		"Ususan",
		"Wawa"]
	const district2 = ["Central Bicutan",
		"Central Signal Village",
		"Fort Bonifacio",
		"Katuparan",
		"Maharlika Village",
		"North Daang Hari",
		"North Signal Village",
		"Pinagsama",
		"South Daang Hari",
		"South Signal Village",
		"Tanyag",
		"Upper Bicutan",
		"Western Bicutan"]

	if (district1.includes(req.body.barangay)) {
		req.body.district = 1
	}
	if (district2.includes(req.body.barangay)) {
		req.body.district = 2
	}



	let collectors = [];
	if (req.body.collectors) {
		if (typeof req.body.collectors == "string") {
			collectors.push({ collector: req.body.collectors })
		}
		else {
			for (let i = 0; i < req.body.collectors.length; i++) {
				const collector = req.body.collectors[i];
				collectors.push({ collector })
			}
		}


	}

	req.body.collectors = collectors



	dump = await Dump.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
		useFindModify: false
	})


	const NotifTitle = `Your Reported Illegal Dump Details Has Been Updated`
	const NotifTitleForCollector = `An Illegal Dump Has Assigned To You Has Been Updated`

	//For User
	const bulk = await User.find({ _id: dump.user_id._id }).updateMany({
		$push: {
			notifications: {
				room: 'basurahunt-notification-3DEA5E28CE9B6E926F52AF75AC5F7-94687284AF4DF8664C573E773CF31',
				title: NotifTitle,
				sender_id: req.user.id,
				receiver_id: dump.user_id._id,
				time: new Date(Date.now()),
				barangay: req.body.barangay,
				link: `/report/${dump._id}/${dump.coordinates.longtitude}/${dump.coordinates.latitude}`,
				notifCode: req.body.notifCode,
				status: 'unread',
				category: 'illegalDump-update'
			}
		}
	});
	const userForPushNotification = await User.find({ _id: dump.user_id._id }).select('push_tokens activeChat')
	expoSendNotification(userForPushNotification, NotifTitle, 'MyPublicReportsView', dump._id, req.body.notifCode)


	if (typeof req.body.collectors == "string") {
		const bulk1 = await User.find({ _id: req.body.collectors, role: "garbageCollector" }).updateMany({
			$push: {
				notifications: {
					room: 'basurahunt-notification-3DEA5E28CE9B6E926F52AF75AC5F7-94687284AF4DF8664C573E773CF31',
					title: NotifTitleForCollector,
					sender_id: req.user.id,
					receiver_id: req.body.collectors,
					time: new Date(Date.now()),
					barangay: req.body.barangay,
					link: `/report/${dump._id}/${dump.coordinates.longtitude}/${dump.coordinates.latitude}`,
					notifCode: req.body.notifCode,
					status: 'unread',
					category: 'illegalDump-update'
				}
			}
		});
		if (dump.status === "Cleaned") {
			const userForPushNotification = await User.find({ _id: req.body.collectors, role: "garbageCollector" }).select('push_tokens activeChat')
			expoSendNotification(userForPushNotification, NotifTitleForCollector, 'Finished', dump._id, req.body.notifCode)
		} else {
			const userForPushNotification = await User.find({ _id: req.body.collectors, role: "garbageCollector" }).select('push_tokens activeChat')
			expoSendNotification(userForPushNotification, NotifTitleForCollector, 'Assigned Illegal Dumps', dump._id, req.body.notifCode)
		}
	}
	else {
		for (let i = 0; i < req.body.collectors.length; i++) {
			const collector = req.body.collectors[i];
			const bulk2 = await User.find({ _id: collector.collector, role: "garbageCollector" }).updateMany({
				$push: {
					notifications: {
						room: 'basurahunt-notification-3DEA5E28CE9B6E926F52AF75AC5F7-94687284AF4DF8664C573E773CF31',
						title: NotifTitleForCollector,
						sender_id: req.user.id,
						receiver_id: collector.collector,
						time: new Date(Date.now()),
						barangay: req.body.barangay,
						link: `/report/${dump._id}/${dump.coordinates.longtitude}/${dump.coordinates.latitude}`,
						notifCode: req.body.notifCode,
						status: 'unread',
						category: 'illegalDump-update'
					}
				}
			});
		}

		for (let i = 0; i < req.body.collectors.length; i++) {
			const collector = req.body.collectors[i];

			if (dump.status === "Cleaned") {
				const userForPushNotification = await User.find({ _id: collector.collector, role: "garbageCollector" }).select('push_tokens activeChat')
				expoSendNotification(userForPushNotification, NotifTitleForCollector, 'Finished', dump._id, req.body.notifCode)
			} else {
				const userForPushNotification = await User.find({ _id: collector.collector, role: "garbageCollector" }).select('push_tokens activeChat')
				expoSendNotification(userForPushNotification, NotifTitleForCollector, 'Assigned Illegal Dumps', dump._id, req.body.notifCode)
			}


		}
	}

	// let updatedDump = await Dump.findById(req.params.id).populate('user_id').populate('chat_id');

	let updatedDump = await Dump.findById(req.params.id).populate('chat_id', 'room');

	// console.log(dump)
	res.status(200).json({
		success: true,
		dump: updatedDump
	})

})



exports.deleteDump = catchAsyncErrors(async (req, res, next) => {
	const dump = await Dump.findById(req.params.id);

	if (!dump) {
		return next(new ErrorHandler('Dump not found', 404));
	}

	for (let i = 0; i < dump.images.length; i++) {
		const result = await cloudinary.v2.uploader.destroy(dump.images[i].public_id)
	}

	await dump.remove();
	res.status(200).json({
		success: true,
		message: 'Dump deleted'
	})
})



//****** Update Dump Status******
exports.updateDumpStatus = catchAsyncErrors(async (req, res, next) => {
	let dump = await Dump.findById(req.params.id);

	if (!dump) {
		return next(new ErrorHandler('Dump not found', 404));
	}

	let user
	let addedExp
	let minusExp
	if (dump.status !== "Cleaned") {
		if (req.body.new_status == "Cleaned") {
			user = await User.findById(dump.user_id);
			addedExp = AddExp(user.exp, req.body.rate);
			user.exp = addedExp[0];
			user.level = addedExp[1];
			dump.score = addedExp[2];
			dump.date_cleaned = Date();

			let images = []

			if (typeof req.body.accomplished_images === 'string') {
				images.push(req.body.accomplished_images)
			} else {
				images = req.body.accomplished_images
			}

			let imagesLinks = [];

			if (req.body.accomplished_images) {
				for (let i = 0; i < images.length; i++) {
					const result = await cloudinary.v2.uploader.upload(images[i], {
						folder: 'BasuraHunt/Dump'
					});

					imagesLinks.push({
						public_id: result.public_id,
						url: result.secure_url
					})
				}
			}

			dump.accomplished_images = imagesLinks

			await user.save();

		} else {

			dump.date_cleaned = null;

		}
	} else {

		if (req.body.new_status != "Cleaned") {

			user = await User.findById(dump.user_id);
			minusExp = MinusExp(user.exp, dump.score);
			user.exp = minusExp[0];
			user.level = minusExp[1];
			dump.score = 0;

			for (let i = 0; i < dump.accomplished_images.length; i++) {
				const result = await cloudinary.v2.uploader.destroy(dump.accomplished_images[i].public_id)
			}

			dump.accomplished_images = []

			await user.save();


		}

		if (req.body.new_status !== "Cleaned") {
			dump.date_cleaned = null;

		}
	}
	const approxDay = dump.approxDayToClean
	dump.approxDayToClean = approxDay
	if (req.body.purok) {
		dump.purok = req.body.purok
	}
	dump.status = req.body.new_status
	await dump.save();

	// dump = await Dump.findByIdAndUpdate(req.params.id, req.body, {
	// 	new: true,
	// 	runValidators: true,
	// 	useFindModify: false
	// })


	let updatedDump = await Dump.findById(req.params.id).populate('user_id');

	const userReporter = await User.findById(dump.user_id);
	if (req.body.new_status === "Cleaned" && userReporter.role === "newUser") {
		userReporter.role = "user"
		await userReporter.save();
		console.log("notifCode1", req.body.notifCode1)
		const notifTitle1 = "Congratulation you are now a verified user."
		const bulk1 = await User.find({ _id: updatedDump.user_id._id }).updateMany({
			$push: {
				notifications: {
					room: 'basurahunt-notification-3DEA5E28CE9B6E926F52AF75AC5F7-94687284AF4DF8664C573E773CF31',
					title: notifTitle1,
					sender_id: req.user.id,
					receiver_id: updatedDump.user_id._id,
					time: new Date(Date.now()),
					barangay: updatedDump.barangay,
					link: `/${userReporter.alias}`,
					notifCode: req.body.notifCode1,
					status: 'unread',
					category: 'user-verified',
					modelObj: { _id: updatedDump._id }
				}
			}
		});
		const userForPushNotification = await User.find({ _id: updatedDump.user_id._id });
		expoSendNotification(userForPushNotification, notifTitle1, 'MyPublicReportsView', updatedDump._id, req.body.notifCode1)

	}

	let NotifTitle
	if (req.body.new_status === "Confirmed") {
		NotifTitle = "Your Reported Illegal Dump Has Been Confirmed By The Admin"
	} if (req.body.new_status === "Unfinish") {
		NotifTitle = "Your Reported Illegal Dump Is Unfinish"
	} if (req.body.new_status === "Cleaned") {
		NotifTitle = "Congratulation Your Reported Illegal Dump Is Already Cleaned"
	} if (req.body.new_status === "newReport") {
		NotifTitle = "Your Reported Illegal Dumps is Pending"
	}

	const bulk = await User.find({ _id: updatedDump.user_id._id }).updateMany({
		$push: {
			notifications: {
				room: 'basurahunt-notification-3DEA5E28CE9B6E926F52AF75AC5F7-94687284AF4DF8664C573E773CF31',
				title: NotifTitle,
				sender_id: req.user.id,
				receiver_id: updatedDump.user_id._id,
				time: new Date(Date.now()),
				barangay: updatedDump.barangay,
				link: `/report/${updatedDump._id}/${updatedDump.coordinates.longtitude}/${updatedDump.coordinates.latitude}`,
				notifCode: req.body.notifCode,
				status: 'unread',
				category: 'illegalDump-update-status'
			}
		}
	});

	const userForPushNotification = await User.find({ _id: updatedDump.user_id._id })
	expoSendNotification(userForPushNotification, NotifTitle, 'MyPublicReportsView', updatedDump._id, req.body.notifCode)

	res.status(200).json({
		success: true,
		updatedDump
	})


})



//****** Top 10 barangay with most reported illegal dumps******
exports.rankings = catchAsyncErrors(async (req, res, next) => {

	let user = await User.findById(req.user.id);

	let mostReportedBrgyDone = await Dump.aggregate(
		[
			{ $match: { status: "Cleaned" } },
			{ $group: { _id: { barangay: "$barangay", purok: "$purok" }, counter: { $sum: 1 } } },
			{ $group: { _id: { barangay: "$_id.barangay" }, puroks: { $push: { purok: "$_id.purok", purokCount: "$counter" } } } },
			{ $group: { _id: { barangay: "$_id.barangay", puroks: "$puroks" }, count: { $sum: "$_id.purok" } } },
			{ $sort: { count: -1, _id: 1 } }
		]
	)

	for (let count = 0; count < mostReportedBrgyDone.length; count++) {
		let purokCount = 0;


		const sortedPurok = mostReportedBrgyDone[count]._id.puroks.sort((a, b) => b.purokCount - a.purokCount);
		mostReportedBrgyDone[count]._id.puroks = sortedPurok

		for (let purokIndex = 0; purokIndex < mostReportedBrgyDone[count]._id.puroks.length; purokIndex++) {
			purokCount += mostReportedBrgyDone[count]._id.puroks[purokIndex].purokCount;
		}
		// console.log("mostReportedBrgyDone",mostReportedBrgyDone[count]._id.puroks)
		mostReportedBrgyDone[count].count = purokCount;
	}

	mostReportedBrgyDone.sort((a, b) => b.count - a.count);





	let mostReportedBrgyUndone = await Dump.aggregate(
		[
			{ $match: { status: { $in: ["Confirmed", "Unfinish", "Cleaned"] } } },
			{ $group: { _id: { barangay: "$barangay", purok: "$purok" }, counter: { $sum: 1 } } },
			{ $group: { _id: { barangay: "$_id.barangay" }, puroks: { $push: { purok: "$_id.purok", purokCount: "$counter" } } } },
			{ $group: { _id: { barangay: "$_id.barangay", puroks: "$puroks" }, count: { $sum: "$_id.purok" } } },
			{ $sort: { count: -1, _id: 1 } }
		]
	)

	for (let count = 0; count < mostReportedBrgyUndone.length; count++) {
		let purokCount = 0;

		const sortedPurok = mostReportedBrgyUndone[count]._id.puroks.sort((a, b) => b.purokCount - a.purokCount);
		mostReportedBrgyUndone[count]._id.puroks = sortedPurok


		for (let purokIndex = 0; purokIndex < mostReportedBrgyUndone[count]._id.puroks.length; purokIndex++) {
			purokCount += mostReportedBrgyUndone[count]._id.puroks[purokIndex].purokCount;
		}
		// console.log(mostReportedBrgyUndone[count]._id.puroks)
		mostReportedBrgyUndone[count].count = purokCount;
	}

	mostReportedBrgyUndone.sort((a, b) => b.count - a.count);


	let topBrgyUser = await User.aggregate(
		[
			{ $match: { "level": { $gte: 1 }, "barangay": user.barangay, "role": "user" } },
			{ $group: { _id: { id: "$_id", alias: "$alias", level: "$level", exp: "$exp" } } }
		]
	).sort({ "_id.level": -1, "_id.exp": -1, "_id.alias": 1 }).limit(10)


	let topCityUser = await User.aggregate(
		[
			{ $match: { "level": { $gte: 1 }, "role": "user" } },
			{ $group: { _id: { id: "$_id", alias: "$alias", level: "$level", exp: "$exp" } } }
		]
	).sort({ "_id.level": -1, "_id.exp": -1, "_id.alias": 1 }).limit(10)


	//******For Dashboard******
	let cluster
	if (req.body.cluster) {
		cluster = req.body.cluster
	} else {
		cluster = "$barangay"
	}

	let listOfViolation = []
	if (req.body.rpbViolation) {
		listOfViolation = [req.body.rpbViolation]
	} else {
		listOfViolation = [
			"Littering, Illegal dumping, Illegal disposal of garbage",
			"Dirty frontage and immediate surroundings for establisments owners",
			"Improper and untimely stacking of garbage outside residence or establishment",
			"Obstruction",
			"Other"
		]
	}


	let barangaysOrDistrictStatuses = []
	if (cluster === "$barangay") {
		let mostReportedPerBrgyTotals = await Dump.aggregate(
			[
				{
					$match: {
						status: { $in: ["Confirmed", "Unfinish", "Cleaned"] },
						"createdAt": {
							$gte: new Date(req.body.rpbStartDate),
							$lte: new Date(req.body.rpbEndDate)
						}
					}
				},
				{
					$group: {
						_id: cluster,
						total: { $sum: 1 }
					}
				},
				{
					$sort: {
						total: -1,
						_id: 1
					}
				}
			]
		)



		for (const BrgyTotals of mostReportedPerBrgyTotals) {
			const result = await barangayStatuses(req.body.rpbStartDate, req.body.rpbEndDate, BrgyTotals._id, listOfViolation)
			barangaysOrDistrictStatuses.push(result)
		}

	} else if (cluster === "$district") {
		let mostReportedPerDistrictsTotals = await Dump.aggregate(
			[
				{
					$match: {
						status: { $in: ["Confirmed", "Unfinish", "Cleaned"] },
						"createdAt": {
							$gte: new Date(req.body.rpbStartDate),
							$lte: new Date(req.body.rpbEndDate)
						}
					}
				},
				{
					$group: {
						_id: cluster,
						total: { $sum: 1 }
					}
				},
				{
					$sort: {
						total: -1,
						_id: 1
					}
				}
			]
		)

		for (const districtTotals of mostReportedPerDistrictsTotals) {
			const result = await districtStatuses(req.body.rpbStartDate, req.body.rpbEndDate, districtTotals._id, listOfViolation)
			barangaysOrDistrictStatuses.push(result)
		}
	}

	let topUserForAdmin
	if (req.body.barangay == "All" || !req.body.barangay) {

		topUserForAdmin = await User.aggregate(
			[
				{
					$match: {
						"level": { $gt: 0 },
					}
				},
				{
					$group: {
						_id: { id: "$_id", alias: "$alias", level: "$level" },
					}
				},
				{
					$sort: {
						"_id.level": -1,
						"_id.alias": 1
					}
				}
			]
		).limit(10)

	} else {
		topUserForAdmin = await User.aggregate(
			[
				{
					$match: {
						"level": { $gt: 0 },
						"barangay": req.body.barangay
					}
				},
				{
					$group: {
						_id: { id: "$_id", alias: "$alias", level: "$level" },
					}
				},
				{
					$sort: {
						"_id.level": -1,
						"_id.alias": 1
					}
				}
			]
		).limit(10)
	}


	res.status(200).json({
		success: true,
		mostReportedBrgyDone,
		mostReportedBrgyUndone,
		topBrgyUser,
		topCityUser,
		barangaysOrDistrictStatuses,
		topUserForAdmin,
		userBarangay: user.barangay
	})


})



//****** Comment Dump Status******
exports.addComment = catchAsyncErrors(async (req, res, next) => {

	let findDump = await Dump.findById(req.params.id);

	if (!findDump) {
		return next(new ErrorHandler('Dump not found', 404));
	}

	swearjarEng.setLang("en");

	const cleanCommentEng = swearjarEng.censor(req.body.comment);
	const cleanTitleEng = swearjarEng.censor(req.body.title);
	swearjarFil.setLang("ph");
	const cleanCommentFil = swearjarEng.censor(cleanCommentEng);
	const cleanTitleFil = swearjarEng.censor(cleanTitleEng);


	const comments = [...findDump.comments, { user: req.user.id, author: req.body.author === "Alias" ? req.user.alias : req.body.author === "Real Name" ? req.user.first_name + " " + req.user.last_name : req.body.author === "Anonymous" ? "Anonymous" : "", comment: cleanCommentFil }]

	findDump.comments = comments;

	await findDump.save();

	let dump = await Dump.findById(req.params.id)

	let authorForNotif

	if (req.body.author === "Anonymous") {
		authorForNotif = "Anonymous"
	}
	else if (req.body.author === "Real Name") {
		authorForNotif = `${req.user.first_name} ${req.user.last_name}`
	}
	else if (req.body.author === "Alias") {
		authorForNotif = `${req.user.alias}`
	}

	const NotifTitle = `${authorForNotif} Commented On Your Reported Illegal Dump: ${cleanCommentFil}`

	if (req.user.id != dump.user_id) {
		const bulk = await User.find({ _id: dump.user_id }).updateMany({
			$push: {
				notifications: {
					room: 'basurahunt-notification-3DEA5E28CE9B6E926F52AF75AC5F7-94687284AF4DF8664C573E773CF31',
					title: NotifTitle,
					sender_id: req.user.id,
					receiver_id: dump.user_id,
					time: new Date(Date.now()),
					barangay: dump.barangay,
					link: req.body.link,
					notifCode: req.body.notifCode,
					status: 'unread',
					category: 'illegalDump-new-comment'
				}
			}
		});
		const userForPushNotification = await User.find({ _id: dump.user_id })
		expoSendNotification(userForPushNotification, NotifTitle, 'MyPublicReportsView', dump._id, req.body.notifCode)

	}



	let dumpComments = dump.comments

	res.status(200).json({
		success: true,
		dumpComments
	})


})


//****** Get Comment Dump Status******
exports.getComments = catchAsyncErrors(async (req, res, next) => {

	let dump = await Dump.findById(req.params.id).select('comments');
	let dumpComments = dump.comments

	res.status(200).json({
		success: true,
		dumpComments
	})


})




exports.deleteComment = catchAsyncErrors(async (req, res, next) => {
	const comment = await Dump.findById(req.params.id).update({
		"$pull": { comments: { _id: req.body.commentId } }
	});

	// console.log(req.params.id)
	// console.log(req.body.commentId)


	res.status(200).json({
		success: true,
		message: 'Comment deleted'
	})
})


exports.getDumpsCoordinates = catchAsyncErrors(async (req, res, next) => {

	let dumpsCoordinates = await Dump.find().select('coordinates status').sort({ _id: -1 });

	res.status(200).json({
		success: true,
		dumpsCoordinates
	})
})

