const CollectionPoint = require('../models/collectionPoint');
const User = require('../models/user');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const APIFeatures = require('../utils/apiFeatures');
const expoSendNotification = require('../utils/expoSendNotification')
// Collection Point Today Page--------------------------------------------


const collectionPointTime = (collectionPoint) => {
	const startTimeArray = collectionPoint.startTime.split(":");
	const endTimeArray = collectionPoint.endTime.split(":");
	var ampmStartTime = startTimeArray[0] >= 12 ? 'PM' : 'AM';
	var ampmEndTime = endTimeArray[0] >= 12 ? 'PM' : 'AM';
	const hoursStartTime = (startTimeArray[0] % 12) == 0 ? 12 : startTimeArray[0] % 12;
	const minutesStartTime = startTimeArray[1];
	const hoursEndTime = (endTimeArray[0] % 12) == 0 ? 12 : endTimeArray[0] % 12;
	const minutesEndTime = endTimeArray[1];

	return hoursStartTime + ":" + minutesStartTime + " " + ampmStartTime + " - " + hoursEndTime + ":" + minutesEndTime + " " + ampmEndTime;
}

const scheduleCollectionPointsList = (collectionPoints) => {
	let collectionPointsList = "";

	for (let i = 0; i < collectionPoints.length; i++) {

		if (i != collectionPoints.length - 1) {
			collectionPointsList = collectionPointsList + collectionPoints[i] + ", "
		}
		else {
			collectionPointsList = collectionPointsList + collectionPoints[i]
		}
	}

	return collectionPointsList;
}

exports.getLandingPageTodayCollectionPointList = catchAsyncErrors(async (req, res, next) => {

	let dateToday = new Date(Date.now());

	const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
		"Saturday"];

	const day = days[dateToday.getDay()];

	let collectionPointsCount
	let collectionPoints

	collectionPointsCount = await CollectionPoint.find({ "repeats.repeat": ["Every " + day, day, "Once"] }).countDocuments();
	collectionPoints = await CollectionPoint.find({ "repeats.repeat": ["Every " + day, day, "Once"] }).sort({ startTime: 1 }).select("-collectionPerTruck");

	res.status(200).json({
		success: true,
		collectionPointsCount,
		collectionPoints
	})
})

exports.getTodayCollectionPointList = catchAsyncErrors(async (req, res, next) => {

	let dateToday = new Date(Date.now());

	const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
		"Saturday"];

	const day = days[dateToday.getDay()];

	let collectionPointsCount
	let collectionPoints
	if (req.user.role === 'garbageCollector') {
		collectionPointsCount = await CollectionPoint.find({ "repeats.repeat": ["Every " + day, day, "Once"] }).countDocuments();
		collectionPoints = await CollectionPoint.find({ "repeats.repeat": ["Every " + day, day, "Once"] }).sort({ startTime: 1 });
	} else {
		collectionPointsCount = await CollectionPoint.find({ "repeats.repeat": ["Every " + day, day, "Once"], "barangay": req.user.barangay }).countDocuments();
		collectionPoints = await CollectionPoint.find({ "repeats.repeat": ["Every " + day, day, "Once"], "barangay": req.user.barangay }).sort({ startTime: 1 }).select("-collectionPerTruck");

	}

	res.status(200).json({
		success: true,
		collectionPointsCount,
		collectionPoints
	})
})

// Upcoming Collection Point Page--------------------------------------------
exports.getUpcomingCollectionPointList = catchAsyncErrors(async (req, res, next) => {

	let collectionPointsCount
	let collectionPoints
	if (req.user.role === 'garbageCollector') {
		collectionPointsCount = await CollectionPoint.find().countDocuments();
		collectionPoints = await CollectionPoint.find();
	} else {
		collectionPointsCount = await CollectionPoint.find({ "barangay": req.user.barangay }).countDocuments();
		collectionPoints = await CollectionPoint.find({ "barangay": req.user.barangay });
	}



	res.status(200).json({
		success: true,
		collectionPointsCount,
		collectionPoints
	})
})




exports.getSingleCollectionPoint = catchAsyncErrors(async (req, res, next) => {
	const collectionPoint = await CollectionPoint.findById(req.params.id).populate("collectors.collector", "first_name last_name" );

	res.status(200).json({
		success: true,
		collectionPoint
	})
})

exports.getCollectors = catchAsyncErrors(async (req, res, next) => {

	let users
	if (req.user.role == 'administrator') {
		users = await User.find({ role: "garbageCollector" }).select('first_name last_name jobDesc barangay');
	} else {
		users = await User.find({ role: "garbageCollector", barangay: req.user.barangay }).select('first_name last_name jobDesc barangay');
	}
	let collectors = [];

	users.forEach(user => {
		collectors.push({
			value: user._id,
			label: user.first_name + " " + user.last_name + " (" + user.jobDesc + ", " + user.barangay + ") "
		})
	});

	res.status(200).json({
		success: true,
		collectors
	})
})

// Collection Point CRUD--------------------------------------------


exports.getCollectionPoints = catchAsyncErrors(async (req, res, next) => {

	const collectionPoints = await CollectionPoint.find().sort({ _id: -1 }).select('-collectors -repeats -district -collectionPerTruck');
	const collectionPointsCount = await CollectionPoint.countDocuments();

	const scheduleForCP = await CollectionPoint.find({},{"collectionPoints.collectionPoint":1}).distinct("collectionPoints.collectionPoint")
	let collectionPointsList = []

	scheduleForCP.forEach((collectionPoint)=>{
		collectionPointsList.push({
			value: collectionPoint,
			label: collectionPoint
		})
	})

	res.status(200).json({
		success: true,
		collectionPoints,
		collectionPointsList,
		collectionPointsCount
	})
})


exports.newCollectionPoint = catchAsyncErrors(async (req, res, next) => {
	const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
		"Saturday"];

	const setDate = (repeat) => {
		const today = new Date();
		const hoursNow = today.getHours();
		const minutesNow = today.getMinutes();
		const startTimeArray = req.body.startTime.split(":");
		let dateToday = new Date(Date.now());
		let upcomingDay = new Date();
		const indexToday = dateToday.getDay();
		const indexUpcoming = days.indexOf(repeat);

		if (repeat == "Once") {
			let timeNow = hoursNow + "" + minutesNow;
			if (hoursNow + "" + minutesNow < 1000) {
				timeNow = "0" + hoursNow + "" + minutesNow;
			}

			let checkTime = startTimeArray[0] + "" + startTimeArray[1] < "1359" && startTimeArray[0] + "" + startTimeArray[1] > timeNow;

			if (checkTime) {
				return upcomingDay.setDate(dateToday.getDate());
			}
			else {
				return upcomingDay.setDate(dateToday.getDate() + 1);
			}
		}

		if (indexToday < indexUpcoming) {
			return upcomingDay.setDate(dateToday.getDate() + (indexUpcoming - indexToday))
		}
		else {
			return upcomingDay.setDate(dateToday.getDate() + 7 + (indexUpcoming - indexToday))
		}
	}

	let collectors = [];

	if (typeof req.body.collectors == "string") {
		collectors.push({ collector: req.body.collectors })
	}
	else {
		for (let i = 0; i < req.body.collectors.length; i++) {
			const collector = req.body.collectors[i];
			collectors.push({ collector })
		}
	}


	let repeats = [];

	if (req.body.repeats) {
		if (typeof req.body.repeats == "string") {
			repeats.push({ repeat: req.body.repeats })
		}
		else {
			for (let i = 0; i < req.body.repeats.length; i++) {
				const repeat = req.body.repeats[i];
				const id = repeat;

				let dateNow = new Date(setDate(repeat));

				// console.log(dateNow)

				if (repeat == "Once") {
					repeats.push({ repeat: id, date: setDate(repeat) });
				}
				else if (days.includes(repeat)) {
					repeats.push({ repeat: id, date: setDate(repeat) })
				}
				else {
					repeats.push({ repeat: id })
				}
				// console.log(repeats)
			}
		}
	}

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
		district = 1
	}
	if (district2.includes(req.body.barangay)) {
		district = 2
	}

	let collectionPointsList = [];

    if(typeof req.body.collectionPoints == "string"){
		collectionPointsList.push({collectionPoint:req.body.collectionPoints})
		}
	else{
	    for (let i = 0; i < req.body.collectionPoints.length ; i++) {
	    	const collectionPoint = req.body.collectionPoints[i];
	        collectionPointsList.push({collectionPoint})
	    }
	}

	const { name, startTime, endTime, barangay, type, status } = req.body;
	const collectionPoints = await CollectionPoint.create({
		name,
		collectors,
		startTime,
		endTime,
		repeats,
		barangay,
		district,
		type,
		status,
		collectionPoints: collectionPointsList
	})



	collectionPoints.roomCode = collectionPoints._id + "-" + Math.floor(Math.random() * Date.now())

	await collectionPoints.save();

	


	const NotifTitle = `New Trash Collection Schedule Has Added To Your Barangay | Time: ${collectionPointTime({ startTime:req.body.startTime, endTime:req.body.endTime })} ${typeof req.body.repeats == "string" ? req.body.repeats : req.body.repeats.join()} | Collection Point: ${scheduleCollectionPointsList(req.body.collectionPoints)} | Type: ${type}`
	const NotifTitleForCollector = `The New Trash Collection Schedule Has Been Assign To You | Time: ${collectionPointTime({ startTime:req.body.startTime, endTime:req.body.endTime })} ${typeof req.body.repeats == "string" ? req.body.repeats : req.body.repeats.join()} | Collection Point: ${scheduleCollectionPointsList(req.body.collectionPoints)} | Type: ${type}`


	const bulk = await User.find({ barangay: barangay, _id: { $ne: req.user.id }, role: { $ne: "garbageCollector" } }).updateMany({
		$push: {
			notifications: {
				room: 'basurahunt-notification-3DEA5E28CE9B6E926F52AF75AC5F7-94687284AF4DF8664C573E773CF31',
				title: NotifTitle,
				sender_id: req.user.id,
				receiver_id: null,
				time: new Date(Date.now()),
				barangay: barangay,
				link: `/schedule/notification/${NotifTitle}/${req.body.notifCode}`,
				notifCode: req.body.notifCode,
				status: 'unread',
				category: 'schedule'
			}
		}
	});

	const userForPushNotification = await User.find({ barangay: barangay, _id: { $ne: req.user.id }, role: { $ne: "garbageCollector" } }).select('push_tokens activeChat')
	expoSendNotification(userForPushNotification, NotifTitle, 'SchedNotifView', null, req.body.notifCode)


	if (typeof req.body.collectors == "string") {
		const bulk1 = await User.find({ _id: req.body.collectors, role: "garbageCollector" }).updateMany({
			$push: {
				notifications: {
					room: 'basurahunt-notification-3DEA5E28CE9B6E926F52AF75AC5F7-94687284AF4DF8664C573E773CF31',
					title: NotifTitleForCollector,
					sender_id: req.user.id,
					receiver_id: req.body.collectors,
					time: new Date(Date.now()),
					barangay: barangay,
					link: `/schedule/notification/${NotifTitleForCollector}/${req.body.notifCode}`,
					notifCode: req.body.notifCode,
					status: 'unread',
					category: 'schedule'
				}
			}
		});

		const userForPushNotification = await User.find({ _id: req.body.collectors, role: "garbageCollector" }).select('push_tokens activeChat')
		expoSendNotification(userForPushNotification, NotifTitleForCollector, 'SchedNotifView', null, req.body.notifCode)

	}
	else {
		for (let i = 0; i < req.body.collectors.length; i++) {
			const collector = req.body.collectors[i];
			const bulk2 = await User.find({ _id: collector, role: "garbageCollector" }).updateMany({
				$push: {
					notifications: {
						room: 'basurahunt-notification-3DEA5E28CE9B6E926F52AF75AC5F7-94687284AF4DF8664C573E773CF31',
						title: NotifTitleForCollector,
						sender_id: req.user.id,
						receiver_id: collector,
						time: new Date(Date.now()),
						barangay: barangay,
						link: `/schedule/notification/${NotifTitleForCollector}/${req.body.notifCode}`,
						notifCode: req.body.notifCode,
						status: 'unread',
						category: 'schedule'
					}
				}
			});
		}
		for (let i = 0; i < req.body.collectors.length; i++) {
			const collector = req.body.collectors[i];
			const userForPushNotification = await User.find({ _id: collector, role: "garbageCollector" }).select('push_tokens activeChat')
			expoSendNotification(userForPushNotification, NotifTitleForCollector, 'SchedNotifView', null, req.body.notifCode)
		}
	}


	res.status(201).json({
		success: true,
		collectionPoints,
	})
})

exports.updateCollectionPoint = catchAsyncErrors(async (req, res, next) => {
	const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
		"Saturday"];

	const setDate = (repeat) => {
		const today = new Date();
		const hoursNow = today.getHours();
		const minutesNow = today.getMinutes();
		const startTimeArray = req.body.startTime.split(":");
		let dateToday = new Date(Date.now());
		let upcomingDay = new Date();
		const indexToday = dateToday.getDay();
		const indexUpcoming = days.indexOf(repeat);

		if (repeat == "Once") {
			let timeNow = hoursNow + "" + minutesNow;
			if (hoursNow + "" + minutesNow < 1000) {
				timeNow = "0" + hoursNow + "" + minutesNow;
			}

			let checkTime = startTimeArray[0] + "" + startTimeArray[1] < "1359" && startTimeArray[0] + "" + startTimeArray[1] > timeNow;

			if (checkTime) {
				return upcomingDay.setDate(dateToday.getDate());
			}
			else {
				return upcomingDay.setDate(dateToday.getDate() + 1);
			}
		}

		if (indexToday < indexUpcoming) {
			return upcomingDay.setDate(dateToday.getDate() + (indexUpcoming - indexToday))
		}
		else {
			return upcomingDay.setDate(dateToday.getDate() + 7 + (indexUpcoming - indexToday))
		}
	}

	let collectors = [];

	if (typeof req.body.collectors == "string") {
		collectors.push({ collector: req.body.collectors })
	}
	else {
		for (let i = 0; i < req.body.collectors.length; i++) {
			const collector = req.body.collectors[i];
			collectors.push({ collector })
		}
	}

	let repeats = [];

	if (req.body.repeats) {
		if (typeof req.body.repeats == "string") {
			repeats.push({ repeat: req.body.repeats })
		}
		else {
			for (let i = 0; i < req.body.repeats.length; i++) {
				const repeat = req.body.repeats[i];
				const id = repeat;

				if (repeat == "Once") {
					repeats.push({ repeat: id, date: setDate(repeat) });
				}
				else if (days.includes(repeat)) {
					repeats.push({ repeat: id, date: setDate(repeat) })
				}
				else {
					repeats.push({ repeat: id })
				}
			}
		}
	}

	// console.log(req.body)

	let collectionNumOfTruck = [];

	if (req.body.collectionPerTruck) {
		if (typeof req.body.collectionPerTruck == "string") {
			collectionNumOfTruck.push({ numOfTruck: req.body.collectionPerTruck, type: req.body.type })
		}
		else {
			for (let i = 0; i < req.body.collectionPerTruck.length; i++) {
				const numOfTruck = req.body.collectionPerTruck[i];
				collectionNumOfTruck.push({ numOfTruck: numOfTruck, type: req.body.type })
			}
		}
	}

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
		district = 1
	}
	if (district2.includes(req.body.barangay)) {
		district = 2
	}

	let collectionPointsList = [];

    if(typeof req.body.collectionPoints == "string"){
		collectionPointsList.push({collectionPoint:req.body.collectionPoints})
		}
	else{
	    for (let i = 0; i < req.body.collectionPoints.length ; i++) {
	    	const collectionPoint = req.body.collectionPoints[i];
	        collectionPointsList.push({collectionPoint})
	    }
	}

	const newCollectionPointData = {
		name: req.body.name,
		collectors: collectors,
		startTime: req.body.startTime,
		endTime: req.body.endTime,
		repeats: repeats,
		barangay: req.body.barangay,
		district: district,
		type: req.body.type,
		status: req.body.status,
		collectionPoints: collectionPointsList,
		collectionPerTruck: collectionNumOfTruck
	}


	let collectionPoint = await CollectionPoint.findByIdAndUpdate(req.params.id, newCollectionPointData, {
		new: true,
		runValidators: true,
		useFindandModify: false
	})

	const NotifTitle = `Collection Schedule Has Been Updated To Your Barangay | Time: ${collectionPointTime({ startTime:req.body.startTime, endTime:req.body.endTime })} ${typeof req.body.repeats == "string" ? req.body.repeats : req.body.repeats.join()} | Collection Point: ${scheduleCollectionPointsList(req.body.collectionPoints)} | Type: ${req.body.type}`
	const NotifTitleForCollector = `The Assigned Trash Collection Schedule To You Has Been Updated | Time: ${collectionPointTime({ startTime:req.body.startTime, endTime:req.body.endTime })} ${typeof req.body.repeats == "string" ? req.body.repeats : req.body.repeats.join()} | Collection Point: ${scheduleCollectionPointsList(req.body.collectionPoints)} | Type: ${req.body.type}`


	const bulk = await User.find({ barangay: req.body.barangay, _id: { $ne: req.user.id }, role: { $ne: "garbageCollector" } }).updateMany({
		$push: {
			notifications: {
				room: 'basurahunt-notification-3DEA5E28CE9B6E926F52AF75AC5F7-94687284AF4DF8664C573E773CF31',
				title: NotifTitle,
				sender_id: req.user.id,
				receiver_id: null,
				time: new Date(Date.now()),
				barangay: req.body.barangay,
				link: `/schedule/notification/${NotifTitle}/${req.body.notifCode}`,
				notifCode: req.body.notifCode,
				status: 'unread',
				category: 'schedule'
			}
		}
	});
	const userForPushNotification = await User.find({ barangay: req.body.barangay, _id: { $ne: req.user.id }, role: { $ne: "garbageCollector" } }).select('push_tokens activeChat')
	// console.log("userForPushNotification",userForPushNotification)
	expoSendNotification(userForPushNotification, NotifTitle, 'SchedNotifView', null, req.body.notifCode)


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
					link: `/schedule/notification/${NotifTitleForCollector}/${req.body.notifCode}`,
					notifCode: req.body.notifCode,
					status: 'unread',
					category: 'schedule'
				}
			}
		});
		const userForPushNotification = await User.find({ _id: req.body.collectors, role: "garbageCollector" }).select('push_tokens activeChat')
		expoSendNotification(userForPushNotification, NotifTitleForCollector, 'SchedNotifView', null, req.body.notifCode)
	}
	else {
		for (let i = 0; i < req.body.collectors.length; i++) {
			const collector = req.body.collectors[i];
			const bulk2 = await User.find({ _id: collector, role: "garbageCollector" }).updateMany({
				$push: {
					notifications: {
						room: 'basurahunt-notification-3DEA5E28CE9B6E926F52AF75AC5F7-94687284AF4DF8664C573E773CF31',
						title: NotifTitleForCollector,
						sender_id: req.user.id,
						receiver_id: collector,
						time: new Date(Date.now()),
						barangay: req.body.barangay,
						link: `/schedule/notification/${NotifTitleForCollector}/${req.body.notifCode}`,
						notifCode: req.body.notifCode,
						status: 'unread',
						category: 'schedule'
					}
				}
			});
		}

		for (let i = 0; i < req.body.collectors.length; i++) {
			const collector = req.body.collectors[i];
			const userForPushNotification = await User.find({ _id: collector, role: "garbageCollector" }).select('push_tokens activeChat')
			expoSendNotification(userForPushNotification, NotifTitleForCollector, 'SchedNotifView', null, req.body.notifCode)
		}
	}



	res.status(200).json({
		success: true,
		collectionPoint
	})
})

exports.deleteCollectionPoint = catchAsyncErrors(async (req, res, next) => {
	const collectionPoint = await CollectionPoint.findById(req.params.id);

	await collectionPoint.remove();
	res.status(200).json({
		success: true,
		message: 'Collection Point deleted'
	})
})

exports.addCollectionnumOfTruck = catchAsyncErrors(async (req, res, next) => {

	// const newCollectionPointData = {
	//        collectionMasses: req.body.collectionMasses
	// }

	// let collectionPoint = await CollectionPoint.findByIdAndUpdate(req.params.id,newCollectionPointData,{
	// 	new: true,
	// 	runValidators:true,
	// 	useFindandModify:false
	//   	})
	const collectionPoint = await CollectionPoint.findById(req.params.id);

	const newCollectionPointData = {
		numOfTruck: req.body.numOfTruck,
		type: collectionPoint.type,
	}


	collectionPoint.collectionPerTruck.push(newCollectionPointData);


	await collectionPoint.save({ validateBeforeSave: false });



	const NotifTitle = `New Record Has Been Added in Collection Point`

	const bulk = await User.find({ role: 'administrator' }).updateMany({
		$push: {
			notifications: {
				room: 'basurahunt-notification-3DEA5E28CE9B6E926F52AF75AC5F7-94687284AF4DF8664C573E773CF31',
				title: NotifTitle,
				sender_id: req.user.id,
				receiver_id: null,
				time: new Date(Date.now()),
				barangay: collectionPoint.barangay_hall,
				link: `/admin/schedule/${collectionPoint._id}`,
				notifCode: req.body.notifCode,
				status: 'unread',
				category: 'collection-mass-add'
			}
		}
	});

	res.status(200).json({
		success: true,
		collectionPoint
	})
})

exports.liveMapNotification = catchAsyncErrors(async (req, res, next) => {
	const collectionPoints = await CollectionPoint.findById(req.params.id)
	const NotifTitle = `Garbage Collector ${req.user.first_name} started a live Map`

	const bulk = await User.find({ barangay: collectionPoints.barangay, _id: { $ne: req.user.id }, role: { $ne: 'administrator' } }).updateMany({
		$push: {
			notifications: {
				room: 'basurahunt-notification-3DEA5E28CE9B6E926F52AF75AC5F7-94687284AF4DF8664C573E773CF31',
				title: NotifTitle,
				sender_id: req.user.id,
				receiver_id: null,
				time: new Date(Date.now()),
				barangay: req.user.barangay,
				link: `/schedule/view/${collectionPoints._id}/${collectionPoints.roomCode}`,
				notifCode: req.body.notifCode,
				status: 'unread',
				category: 'live'
			}
		}
	});
	const userForPushNotification = await User.find({ barangay: collectionPoints.barangay, _id: { $ne: req.user.id } }).select('push_tokens activeChat')
	expoSendNotification(userForPushNotification, NotifTitle, 'ScheduleView', collectionPoints._id, req.body.notifCode)

	res.status(200).json({
		success: true,
		collectionPoints
	})

})
