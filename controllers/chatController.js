const Chat = require('../models/chat');
const Dump = require('../models/dump');
const User = require('../models/user');
const Item = require('../models/item');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const expoSendNotification = require('../utils/expoSendNotification')


exports.getChat = catchAsyncErrors(async (req, res, next) => {
	const chat = await Chat.findById(req.params.id);

	res.status(200).json({
		success: true,
		chat
	})

})


exports.newChat = catchAsyncErrors(async (req, res, next) => {

	let chats = [];

	chats.push({
		room: req.body.room,
		author: req.user.id,
		message: req.body.message,
		time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes()
	})

	const chat = await Chat.create({
		room: req.body.room,
		chats
	})


	res.status(201).json({
		success: true,
		chat
	})

})


exports.updateChat = catchAsyncErrors(async (req, res, next) => {


	const chat = await Chat.findById(req.params.id);

	let current_chats = [...chat.chats, {
		room: chat.room,
		author: req.user.id,
		message: req.body.message,
		time: req.body.time
	}]


	chat.chats = current_chats

	await chat.save();

	const updatedChat = await Chat.findById(req.params.id).populate('chats.author');

	const NotifTitle = `New Message From ${req.user.first_name}: ${req.body.message}`

	// console.log("req.body.receiver", req.body.receiver)
	// 	console.log("req.body", req.body)


	if (req.body.chatCategory == "donation") {

		const item = await Item.find({ chat_id: req.params.id }).populate('chat_id').populate("user_id");
		const chatDetail = { _id: item[0].chat_id._id, room: item[0].chat_id.room }
		const chatId = { _id: item[0].chat_id._id }
		const chatLength = { length: item[0].chat_id.chats.length }
		const itemId = { _id: item[0]._id }
		const itemName = { name: item[0].name }
		const itemObj = {
			barangay_hall: false,
			user_id: item[0].user_id._id,
			receiver_id: false,
			receiver_name: false,
			user_name: item[0].user_id.first_name
		}


		const obj = {
			chatDetail,
			chatId,
			chatLength,
			itemId,
			itemName,
			itemObj
		}
		if (req.body.receiver == "administrator") {
			const bulk = await User.find({ role: "administrator" }).updateMany({
				$push: {
					notifications: {
						room: 'basurahunt-notification-3DEA5E28CE9B6E926F52AF75AC5F7-94687284AF4DF8664C573E773CF31',
						title: NotifTitle,
						sender_id: req.user.id,
						time: new Date(Date.now()),
						barangay: req.user.barangay,
						link: req.body.link,
						notifCode: req.body.notifCode,
						status: 'unread',
						category: 'donation-new-message',
						modelObj: obj
					}
				}
			});
		} else {
			
			const bulk = await User.find({ _id: req.body.receiver }).updateMany({
				$push: {
					notifications: {
						room: 'basurahunt-notification-3DEA5E28CE9B6E926F52AF75AC5F7-94687284AF4DF8664C573E773CF31',
						title: NotifTitle,
						sender_id: req.user.id,
						receiver_id: req.body.receiver,
						time: new Date(Date.now()),
						barangay: req.user.barangay,
						link: req.body.link,
						notifCode: req.body.notifCode,
						status: 'unread',
						category: 'donation-new-message',
						modelObj: obj
					}
				}
			});

			// console.log("bulk", bulk)

		}


		const userForPushNotification = await User.find({ _id: req.body.receiver }).select('push_tokens activeChat')
		expoSendNotification(userForPushNotification, NotifTitle, 'PublicDonationsChat', obj, req.body.notifCode)


	} else {

		const dump = await Dump.find({ chat_id: req.params.id }).populate('chat_id');
		const chatDetail = { _id: dump[0].chat_id._id, room: dump[0].chat_id.room }
		const chatId = { _id: dump[0].chat_id._id }
		const chatLength = { length: dump[0].chat_id.chats.length }
		const dumpId = { _id: dump[0]._id }
		const dumpLocation = { location: dump[0].complete_address }
		const dumpObj = {
			dumpObj: {
				_id: dump[0]._id,
				coordinates: {
					longtitude: dump[0].coordinates.longtitude,
					latitude: dump[0].coordinates.latitude
				},
				barangay: dump[0].barangay,
			}
		}

		const obj = {
			chatDetail,
			chatId,
			chatLength,
			dumpId,
			dumpLocation,
			dumpObj
		}

		if (req.user.role == "user") {
			const bulk = await User.find({ role: "administrator" }).updateMany({
				$push: {
					notifications: {
						room: 'basurahunt-notification-3DEA5E28CE9B6E926F52AF75AC5F7-94687284AF4DF8664C573E773CF31',
						title: NotifTitle,
						sender_id: req.user.id,
						receiver_id: null,
						time: new Date(Date.now()),
						barangay: req.user.barangay,
						link: req.body.link,
						notifCode: req.body.notifCode,
						status: 'unread',
						category: 'illegalDump-new-message'
					}
				}
			});
		}
		if (req.user.role == "administrator") {


			const bulk = await User.find({ _id: req.body.receiver, activeChat: false }).updateMany({
				$push: {
					notifications: {
						room: 'basurahunt-notification-3DEA5E28CE9B6E926F52AF75AC5F7-94687284AF4DF8664C573E773CF31',
						title: NotifTitle,
						sender_id: req.user.id,
						receiver_id: req.body.receiver,
						time: new Date(Date.now()),
						barangay: req.user.barangay,
						link: req.body.link,
						notifCode: req.body.notifCode,
						status: 'unread',
						category: 'illegalDump-new-message',
						modelObj: obj
					}
				}
			});


			const userForPushNotification = await User.find({ _id: req.body.receiver }).select('push_tokens activeChat')
			expoSendNotification(userForPushNotification, NotifTitle, 'PublicReportsChat', obj, req.body.notifCode)

		}
	}



	// console.log("great", req.user.role)

	res.status(201).json({
		success: true,
		chat: updatedChat
	})

})


exports.activeChat = catchAsyncErrors(async (req, res, next) => {
	const user = await User.findById(req.user.id);
	user.activeChat = req.body.activeChat
	await user.save();

	res.status(200).json({
		success: true,
		user
	})

})
