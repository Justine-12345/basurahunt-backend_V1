const Newsfeed = require('../models/newsfeed');
const User = require('../models/user');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const APIFeatures = require('../utils/apiFeatures');
const cloudinary = require('cloudinary').v2;
const expoSendNotification = require('../utils/expoSendNotification')

// Newsfeed Page--------------------------------------------
exports.getNewsfeedList = catchAsyncErrors(async(req,res,next) => {
	const resPerPage = 4;
	const newsfeedsCount = await Newsfeed.countDocuments();

	const apiFeatures = new APIFeatures(Newsfeed.find().sort({createdAt: -1}).select("-content -tags"),req.query).search().filter();

	apiFeatures.pagination(resPerPage);
	const newsfeeds = await apiFeatures.query;


    res.status(200).json({
        success: true,
        newsfeedsCount,
        resPerPage,
        newsfeeds
    })
})

exports.getSingleNewsfeed = catchAsyncErrors(async(req,res,next) => {
	const newsfeed = await Newsfeed.findById(req.params.id).populate("user_id", "first_name last_name");

	// const newsFeedForTags = await Newsfeed.find({},{"tags.tag":1}).distinct("tags.tag")
	// let tags = []

	// 	newsFeedForTags.forEach((tag)=>{
		
	// 			tags.push({
	// 				value: tag,
	// 				label: tag
	// 			})

	// })

	res.status(200).json({
	 	success: true,
	 	newsfeed,
	 	// tags
	})
})

// Newsfeed CRUD--------------------------------------------
exports.getNewsfeeds = catchAsyncErrors(async (req, res, next) => {

    const newsfeeds = await Newsfeed.find().sort({createdAt: -1}).select("-content -tags");
	const newsfeedsCount = await Newsfeed.countDocuments();

	const newsFeedForTags = await Newsfeed.find({},{"tags.tag":1}).distinct("tags.tag")
	let tags = []

		newsFeedForTags.forEach((tag)=>{
		
				tags.push({
					value: tag,
					label: tag
				})

		})
	
    res.status(200).json({
        success: true,
        newsfeeds,
		newsfeedsCount,
		tags
    })
})

//////////////////////////
exports.getTags = catchAsyncErrors(async (req, res, next) => {

    const newsfeeds = await Newsfeed.find();

    res.status(200).json({
        success: true,
        newsfeeds
    })
})

/////////////////////////////////
exports.newNewsfeed = catchAsyncErrors(async(req,res,next) => {

	let images = []

    if (typeof req.body.images === 'string') {
        images.push(req.body.images)
    } else {
        images = req.body.images
    }

    let imagesLinks = [];

    if(req.body.images){
        for (let i = 0; i < images.length; i++) {
            const result = await cloudinary.uploader.upload(images[i], {
                folder: 'BasuraHunt/Newsfeed',
				width: 150,
        		crop: "scale"
            });

            imagesLinks.push({
                public_id: result.public_id,
                url: result.secure_url
            })
        }
    }

	let tags = [];

    if(typeof req.body.tags == "string"){
		tags.push({tag:req.body.tags})
		}
	else{
	    for (let i = 0; i < req.body.tags.length ; i++) {
	    	const tag = req.body.tags[i];
	        tags.push({tag})
	    }
	}

	const { title, content } = req.body;
	const newsfeed = await Newsfeed.create({
		images: imagesLinks,
        title,
        content,
		tags: tags,
		user_id: req.user.id
    })


	const NotifTitle = title

	const bulk = await User.find( { role: "user" } ).updateMany( { $push: { notifications: {
		room:'basurahunt-notification-3DEA5E28CE9B6E926F52AF75AC5F7-94687284AF4DF8664C573E773CF31', 
		title:NotifTitle, 
		sender_id:req.user.id, 
		receiver_id:null,
		time:new Date(Date.now()),
		barangay:req.user.barangay, 
		link:`/post/${newsfeed._id}`,
		notifCode:req.body.notifCode, 
		status:'unread',
		category:'newsfeeds-add'} } }  );

		const userForPushNotification = await User.find( { role: "user" } ).select('push_tokens activeChat')
		expoSendNotification(userForPushNotification, NotifTitle, 'NewsfeedNav', newsfeed._id,  req.body.notifCode)


	
	res.status(201).json({
		success:true,
		newsfeed 
	})
})

exports.updateNewsfeed = catchAsyncErrors(async(req,res,next) => {
	let tags = [];

    if(typeof req.body.tags == "string"){
		tags.push({tag:req.body.tags})
		}
	else{
	    for (let i = 0; i < req.body.tags.length ; i++) {
	    	const tag = req.body.tags[i];
	        tags.push({tag})
	    }
	}

	const newNewsfeedData = {
        title: req.body.title,
        content: req.body.content,
		tags: tags,
		updatedAt: Date.now()
	}

	let newsfeed = await Newsfeed.findByIdAndUpdate(req.params.id,newNewsfeedData,{
		new: true,
		runValidators:true,
		useFindandModify:false
   	})
	
	res.status(200).json({
	 	success:true,
	 	newsfeed
	})
})

exports.deleteNewsfeed = catchAsyncErrors(async(req,res,next) =>{
	const newsfeed = await Newsfeed.findById(req.params.id);

	await newsfeed.remove();
	res.status(200).json({
	 	success: true,
	 	message: 'Newsfeed deleted'
	})
})

// Public Newsfeed Page--------------------------------------------
exports.getNewsfeedListPublic = catchAsyncErrors(async(req,res,next) => {
	const newsfeeds = await Newsfeed.find().sort({createdAt: -1}).select("-content -tags");
	
    res.status(200).json({
        success: true,
        newsfeeds
    })
})

exports.getSingleNewsfeedPublic = catchAsyncErrors(async(req,res,next) => {
	const newsfeed = await Newsfeed.findById(req.params.id).populate("user_id", "first_name last_name");

	res.status(200).json({
	 	success: true,
	 	newsfeed,
	})
})
