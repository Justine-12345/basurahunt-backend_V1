const Item = require('../models/item');
const User = require('../models/user');
const Chat = require('../models/chat');
const AddExp = require('../utils/addExp')
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const APIFeatures2 = require('../utils/apiFeatures2');
const cloudinary = require('cloudinary');
const expoSendNotification = require('../utils/expoSendNotification')
// Donation Items Page--------------------------------------------
exports.getItemList = catchAsyncErrors(async (req, res, next) => {

	const resPerPage = 5;
	// const itemsCount = await Item.countDocuments();
	const itemsCount = await Item.find({ status: "Unclaimed" }).count();

	// const items = await Item.find({status: {$ne: "Received"}}).sort({_id:-1}).populate("user_id");
	let apiFeatures2
	if (req.query.ismobile == "true") {
		apiFeatures2 = new APIFeatures2(Item.find({ status: "Unclaimed" }).sort({ _id: -1 }).select("addional_desciption name images createdAt status item_type"), req.query).search().filter();
		if (!req.query.keyword) {
			apiFeatures2.pagination(resPerPage);
		}
	} else {
		apiFeatures2 = new APIFeatures2(Item.find({ status: "Unclaimed" }).sort({ _id: -1 }).select("images name addional_desciption createdAt"), req.query).search().filter();
		apiFeatures2.pagination(resPerPage);
	}


	const items = await apiFeatures2.query;
	let filteredItemCount = items.length;

	if (!items) {
		return next(new ErrorHandler('Items not found', 404))
	}

	res.status(200).json({
		success: true,
		itemsCount,
		resPerPage,
		filteredItemCount,
		items
	})
})

exports.getSingleItem = catchAsyncErrors(async (req, res, next) => {
	const item = await Item.findById(req.params.id).populate("user_id", "first_name last_name alias barangay").populate("receiver_id", "first_name last_name alias barangay").populate("chat_id", "room");
	const receiver = await User.findById(item.receiver_id).select('first_name last_name level barangay');

	res.status(200).json({
		success: true,
		item,
		receiver
	})
})

// Add Donation Page--------------------------------------------
exports.addItem = catchAsyncErrors(async (req, res, next) => {

	let images = []

	if (typeof req.body.images === 'string') {
		images.push(req.body.images)
	} else {
		images = req.body.images
	}



	let imagesLinks = [];

	if (req.body.images) {
		for (let i = 0; i < images.length; i++) {
			const result = await cloudinary.uploader.upload(images[i], {
				folder: 'BasuraHunt/Item',
				width: 150,
				crop: "scale"
			});

			imagesLinks.push({
				public_id: result.public_id,
				url: result.secure_url
			})
		}
	}

	let item_types = [];

	if (typeof req.body.item_types == "string") {
		item_types.push({ type: req.body.item_types })
	}
	else {
		for (let i = 0; i < req.body.item_types.length; i++) {
			const item_type = req.body.item_types[i];
			item_types.push({ type: item_type })
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

	if (district1.includes(req.body.barangay_hall)) {
		district = 1
	}
	if (district2.includes(req.body.barangay_hall)) {
		district = 2
	}

	const { barangay_hall, item_desc, name, addional_desciption, donate_using, status, date_recieved } = req.body;
	const item = await Item.create({
		images: imagesLinks,
		item_desc,
		barangay_hall,
		item_type: item_types,
		name,
		addional_desciption,
		donate_using,
		district,
		// status,
		// date_recieved,
		user_id: req.user.id,
		code: Math.random().toString(36).substring(2, 20)
	})

	const chat = await Chat.create({
		room: item._id + "-" + Math.floor(Math.random() * Date.now())
	})

	item.chat_id = chat._id
	await item.save();

	const user = await User.findById(req.user.id);
	let donated_items = [...user.donated_items, { item: item._id }]

	user.donated_items = donated_items;
	await user.save();

	const NotifTitle = "New donated item has been added"

	const bulk = await User.find({ _id: { $ne: req.user.id }, role: { $in: ['user', 'administrator'] } }).updateMany({
		$push: {
			notifications: {
				room: 'basurahunt-notification-3DEA5E28CE9B6E926F52AF75AC5F7-94687284AF4DF8664C573E773CF31',
				title: NotifTitle,
				sender_id: req.user.id,
				receiver_id: null,
				time: new Date(Date.now()),
				barangay: barangay_hall,
				link: `/donation/${item._id}`,
				notifCode: req.body.notifCode,
				status: 'unread',
				category: 'donation-new'
			}
		}
	});

	// const userForPushNotification = await User.find({ _id: { $ne: req.user.id }, role: { $in: ['user'] } })
	// expoSendNotification(userForPushNotification, NotifTitle, 'PublicDonationsView', item._id)


	res.status(201).json({
		success: true,
		item
	})
})

exports.claimItem = catchAsyncErrors(async (req, res, next) => {

	const newItemData = {
		status: "Claimed",
		receiver_id: req.user.id,
		date_claimed: Date.now()
	}

	let item = await Item.findByIdAndUpdate(req.params.id, newItemData, {
		new: true,
		runValidators: true,
		useFindandModify: false
	}).populate('receiver_id')

	let itemForChat = await Item.findById(req.params.id)

	const chat = await Chat.create({
		room: req.params.id + "-" + Math.floor(Math.random() * Date.now())
	})


	itemForChat.chat_id = chat._id
	await itemForChat.save();

	const NotifTitle = `Your donated item has claimed by ${item.receiver_id.first_name}`

	const bulk = await User.find({ _id: item.user_id }).updateMany({
		$push: {
			notifications: {
				room: 'basurahunt-notification-3DEA5E28CE9B6E926F52AF75AC5F7-94687284AF4DF8664C573E773CF31',
				title: NotifTitle,
				sender_id: req.user.id,
				receiver_id: item.user_id,
				time: new Date(Date.now()),
				barangay: item.barangay_hall,
				link: `/donation/${item._id}`,
				notifCode: req.body.notifCode,
				status: 'unread',
				category: 'donation-update-claim'
			}
		}
	});

	const userForPushNotification = await User.find({ _id: item.user_id })
	expoSendNotification(userForPushNotification, NotifTitle, 'MyPublicDonationsView', item._id)

	res.status(200).json({
		success: true,
		item
	})
})

exports.cancelItem = catchAsyncErrors(async (req, res, next) => {

	let findItem = await Item.findById(req.params.id)
	let receiverID = findItem.receiver_id

	const newItemData = {
		status: "Unclaimed",
		receiver_id: null,
		code: null
	}

	let item = await Item.findByIdAndUpdate(req.params.id, newItemData, {
		new: true,
		runValidators: true,
		useFindandModify: false
	})

	let itemForChat = await Item.findById(req.params.id)
	itemForChat.chat_id = null
	await itemForChat.save();


	if (String(req.user._id) == String(item.user_id)) {
		const NotifTitle = `The donation has been cancelled by ${req.user.first_name}`
		const bulk = await User.find({ _id: receiverID }).updateMany({
			$push: {
				notifications: {
					room: 'basurahunt-notification-3DEA5E28CE9B6E926F52AF75AC5F7-94687284AF4DF8664C573E773CF31',
					title: NotifTitle,
					sender_id: req.user.id,
					receiver_id: receiverID,
					time: new Date(Date.now()),
					barangay: item.barangay_hall,
					link: `/donation/${item._id}`,
					notifCode: req.body.notifCode,
					status: 'unread',
					category: 'donation-update-cancel'
				}
			}
		});

		const userForPushNotification = await User.find({ _id: receiverID })
		expoSendNotification(userForPushNotification, NotifTitle, 'MyPublicClaimedDonationsView', item._id)

	} else {
		const NotifTitle = `Claiming of your donated item has been cancelled by ${req.user.first_name}`
		const bulk1 = await User.find({ _id: item.user_id }).updateMany({
			$push: {
				notifications: {
					room: 'basurahunt-notification-3DEA5E28CE9B6E926F52AF75AC5F7-94687284AF4DF8664C573E773CF31',
					title: NotifTitle,
					sender_id: req.user.id,
					receiver_id: item.user_id,
					time: new Date(Date.now()),
					barangay: item.barangay_hall,
					link: `/donation/${item._id}`,
					notifCode: req.body.notifCode,
					status: 'unread',
					category: 'donation-update-cancel'
				}
			}
		});
		const userForPushNotification = await User.find({ _id: item.user_id })
		expoSendNotification(userForPushNotification, NotifTitle, 'MyPublicDonationsView', item._id)
	}

	res.status(200).json({
		success: true,
		item
	})



	res.status(200).json({
		success: true,
		item
	})
})

exports.confirmItem = catchAsyncErrors(async (req, res, next) => {

	const newItemData = {
		status: "Confirmed",
		code: Math.random().toString(36).substring(2, 20)
	}

	let item = await Item.findByIdAndUpdate(req.params.id, newItemData, {
		new: true,
		runValidators: true,
		useFindandModify: false
	})


	const NotifTitle = `The donation has been confirmed by ${req.user.first_name}`
	const bulk = await User.find({ _id: item.receiver_id }).updateMany({
		$push: {
			notifications: {
				room: 'basurahunt-notification-3DEA5E28CE9B6E926F52AF75AC5F7-94687284AF4DF8664C573E773CF31',
				title: NotifTitle,
				sender_id: req.user.id,
				receiver_id: item.receiver_id,
				time: new Date(Date.now()),
				barangay: item.barangay_hall,
				link: `/donation/${item._id}`,
				notifCode: req.body.notifCode,
				status: 'unread',
				category: 'donation-update-confirm'
			}
		}
	});

	const userForPushNotification = await User.find({ _id: item.receiver_id })
	expoSendNotification(userForPushNotification, NotifTitle, 'MyPublicClaimedDonationsView', item._id)


	res.status(200).json({
		success: true,
		item
	})
})

exports.receiveItem = catchAsyncErrors(async (req, res, next) => {

	// const newItemData = {
	// 	status: "Received",
	// 	date_recieved: Date.now()
	// }

	// let item = await Item.findByIdAndUpdate(req.params.id, newItemData, {
	// 	new: true,
	// 	runValidators: true,
	// 	useFindandModify: false
	// })

	let item = await Item.findById(req.params.id)

	let images = []

	if (typeof req.body.images === 'string') {
		images.push(req.body.images)
	} else {
		images = req.body.images
	}

	let imagesLinks = [];

	if (req.body.images) {
		for (let i = 0; i < images.length; i++) {
			const result = await cloudinary.uploader.upload(images[i], {
				folder: 'BasuraHunt/Item',
				width: 150,
				crop: "scale"
			});

			imagesLinks.push({
				public_id: result.public_id,
				url: result.secure_url
			})
		}
	}

	item.received_images = imagesLinks
	item.status = "Received"
	item.date_recieved =  Date.now()
	item.receiver_name =  req.body.receiver_name
	item.score =  req.body.rate
	await item.save();

	const user = await User.findById(item.user_id);
	const addedExp = AddExp(user.exp, req.body.rate);
	user.exp = addedExp[0];
	user.level = addedExp[1];
	await user.save();


	// receiver = await User.findById(item.receiver_id);
	// let receiveItems = [...receiver.received_items, { item: item._id }]
	// receiver.received_items = receiveItems
	// await receiver.save();

	const NotifTitle = `Your donated item has been received by ${req.user.first_name}`
	const bulk1 = await User.find({ _id: item.user_id }).updateMany({
		$push: {
			notifications: {
				room: 'basurahunt-notification-3DEA5E28CE9B6E926F52AF75AC5F7-94687284AF4DF8664C573E773CF31',
				title: NotifTitle,
				sender_id: req.user.id,
				receiver_id: item.user_id,
				time: new Date(Date.now()),
				barangay: item.barangay_hall,
				link: `/donation/${item._id}`,
				notifCode: req.body.notifCode,
				status: 'unread',
				category: 'donation-update-receive'
			}
		}
	});

	const userForPushNotification = await User.find({ _id: item.user_id })
	expoSendNotification(userForPushNotification, NotifTitle, 'MyPublicDonationsView', item._id)

	res.status(200).json({
		success: true,
		item
	})
})

// Donation Items CRUD--------------------------------------------
exports.getItems = catchAsyncErrors(async (req, res, next) => {

	const items = await Item.find().populate("user_id", "first_name last_name").select('-images -district -item_type -item_desc -addional_desciption -donate_using -receiver_id').sort({ _id: -1 });
	const itemsCount = await Item.countDocuments();

	res.status(200).json({
		success: true,
		items,
		itemsCount
	})
})



exports.newItem = catchAsyncErrors(async (req, res, next) => {

	let images = []

	if (typeof req.body.images === 'string') {
		images.push(req.body.images)
	} else {
		images = req.body.images
	}

	let imagesLinks = [];

	if (req.body.images) {
		for (let i = 0; i < images.length; i++) {
			const result = await cloudinary.uploader.upload(images[i], {
				folder: 'BasuraHunt/Item',

				width: 150,
				crop: "scale"
			});

			imagesLinks.push({
				public_id: result.public_id,
				url: result.secure_url
			})
		}
	}

	let item_types = [];

	if (typeof req.body.item_types == "string") {
		item_types.push({ type: req.body.item_types })
	}
	else {
		for (let i = 0; i < req.body.item_types.length; i++) {
			const item_type = req.body.item_types[i];

			item_types.push({ type: item_type })
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

	if (district1.includes(req.body.barangay_hall)) {
		district = 1
	}
	if (district2.includes(req.body.barangay_hall)) {
		district = 2
	}

	const { barangay_hall, name, addional_desciption, donate_using, item_desc, status, date_recieved } = req.body;

	const item = await Item.create({
		images: imagesLinks,
		barangay_hall,
		item_type: item_types,
		name,
		addional_desciption,
		donate_using,
		item_desc,
		district,
		// status,
		// date_recieved,
		user_id: req.user.id,
		code: Math.random().toString(36).substring(2, 20)
	})

	const user = await User.findById(req.user.id);
	let donated_items = [...user.donated_items, { item: item._id }]

	user.donated_items = donated_items;
	await user.save();

	res.status(201).json({
		success: true,
		item
	})
})

exports.updateItem = catchAsyncErrors(async (req, res, next) => {



	let item = await Item.findById(req.params.id);

	if (!item) {
		return next(new ErrorHandler('item not found', 404));
	}


	let oldImages = []
	if (item.images) {
		for (var i = 0; i < item.images.length; i++) {
			oldImages.push(item.images[i])
		}
	}


	let remainingImages = []
	// Deleting images associated with the item
	if (req.body.oldImagesPublic === undefined) {
		if (item.images) {
			for (let i = 0; i < item.images.length; i++) {
				const result = await cloudinary.v2.uploader.destroy(item.images[i].public_id)
			}
		}
	} else {
		if (item.images) {
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
				folder: 'BasuraHunt/Item'
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

	console.log(allImages)

	let item_types = [];

	if (typeof req.body.item_types == "string") {
		item_types.push({ type: req.body.item_types })
	}
	else {
		for (let i = 0; i < req.body.item_types.length; i++) {
			const item_type = req.body.item_types[i];
			item_types.push({ type: item_type })
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

	const newItemData = {
		images: allImages,
		barangay_hall: req.body.barangay,
		district,
		item_type: item_types,
		item_desc: req.body.item_desc,
		name: req.body.name,
		addional_desciption: req.body.addional_desciption,
		donate_using: req.body.donate_using,
		status: req.body.status,
		date_recieved: req.body.date_recieved
	}


	let updateItem = await Item.findByIdAndUpdate(req.params.id, newItemData, {
		new: true,
		runValidators: true,
		useFindandModify: false
	})

	res.status(200).json({
		success: true,
		updateItem
	})
})

exports.deleteItem = catchAsyncErrors(async (req, res, next) => {
	const item = await Item.findById(req.params.id);

	for (let i = 0; i < item.images.length; i++) {
		const result = await cloudinary.v2.uploader.destroy(item.images[i].public_id)
	}

	await item.remove();
	res.status(200).json({
		success: true,
		message: 'Item deleted'
	})
})

