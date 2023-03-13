const Feedback = require('../models/feedback');
const User = require('../models/user');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const cloudinary = require('cloudinary');



//******Add New FeedBack****** 
exports.newFeedback = catchAsyncErrors(async(req, res, next) => {
	let images = []

    if (typeof req.body.images === 'string') {
        images.push(req.body.images)
    } else {
        images = req.body.images
    }

    let imagesLinks = [];

    if(req.body.images){
	    for (let i = 0; i < images.length; i++) {
	        const result = await cloudinary.v2.uploader.upload(images[i], {
	            folder: 'BasuraHunt/Feedback'
	        });

	        imagesLinks.push({
	            public_id: result.public_id,
	            url: result.secure_url
	        })
	    }
	}

	req.body.images = imagesLinks
	req.body.user_id = req.user.id
	const feedback = await Feedback.create(req.body);

 	const NotifTitle = `New Feedback Has Been Added In List`

	const bulk = await User.find( { role: "administrator" } ).updateMany( { $push: { notifications: {
		room:'basurahunt-notification-3DEA5E28CE9B6E926F52AF75AC5F7-94687284AF4DF8664C573E773CF31', 
		title:NotifTitle, 
		sender_id:req.user.id, 
		receiver_id:null,
		time:new Date(Date.now()),
		barangay:req.user.barangay, 
		link:`/feedback/`,
		notifCode:req.body.notifCode, 
		status:'unread',
		category:'feedback-new'} } }  );

	res.status(201).json({
		success: true,
		feedback
	})
	
})

exports.getFeedbacks = catchAsyncErrors(async(req,res,next) => {
	const feedbacks = await Feedback.find().sort({_id: -1}).populate('user_id',"first_name last_name")

	res.status(200).json({
	 	success: true,
	 	feedbacks
	})

})

exports.getUserFeedbacks = catchAsyncErrors(async(req,res,next) => {
	const feedbacks = await Feedback.find({user_id:req.user.id}).sort({_id: -1}).populate('user_id', 'first_name last_name')

	res.status(200).json({
	 	success: true,
	 	feedbacks
	})

})

exports.getFeedback = catchAsyncErrors(async(req,res,next) => {
	const feedback = await Feedback.findById(req.params.id).populate('user_id')

	res.status(200).json({
	 	success: true,
	 	feedback
	})

})


