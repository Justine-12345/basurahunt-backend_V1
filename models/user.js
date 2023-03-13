const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
	first_name: {
		type: String,
		required: [true, 'Please enter your first name'],
		maxLength: [30, 'Your first name cannot exceed 30 character']
	},

	middle_name: {
		type: String,
		maxLength: [30, 'Your middle name cannot exceed 30 character']
	},

	last_name: {
		type: String,
		required: [true, 'Please enter your last name'],
		maxLength: [30, 'Your last name cannot exceed 30 character']
	},

	suffix: {
		type: String,
		maxLength: [30, 'Your suffix cannot exceed 30 character']
	},

	birthday: {
		type: Date,
		required: [true, 'Please enter your birthday']
	},

	phone_number: {
		type: String,
		required: false,
		maxLength: [30, 'Your phone number cannot exceed 30 numbers']
	},

	gender: {
		type: String,
		required: false
	},

	house_number: {
		type: String,
		required: [true, 'Please enter your house number']
	},

	street: {
		type: String,
		required: [true, 'Please enter your street']
	},


	barangay: {
		type: String,
		required: [true, 'Please enter your barangay']
	},

	avatar: {
		public_id: {
			type: String,
			default: 'Static/user-default_mdgd40'
		},
		url: {
			type: String,
			default: 'https://res.cloudinary.com/basurahunt/image/upload/v1663916552/BasuraHunt/Static/user-default_mdgd40.png'
		}
	},

	email: {
		type: String,
		required: [true, 'Please enter valid email'],
		unique: true,
		validate: [validator.isEmail, 'Please enter valid email address']
	},

	alias: {
		type: String,
		required: [true, 'Please enter your first alias'],
		maxLength: [30, 'Your alias cannot exceed 30 character']
	},

	password: {
		type: String,
		required: [true, 'Please enter your password'],
		minlength: [6, 'Your password must be longer than 6 character'],
		select: false
	},

	valid_id: {
		public_id: {
			type: String,
			required: false
		},
		url: {
			type: String,
			required: false
		}
	},


	reported_dumps: [
		{
			dump: {
				type: mongoose.Schema.ObjectId,
				ref: 'Dump'
			}

		}
	],

	donated_items: [
		{
			item: {
				type: mongoose.Schema.ObjectId,
				ref: 'Item'
			}

		}
	],

	received_items: [
		{
			item: {
				type: mongoose.Schema.ObjectId,
				ref: 'Item'
			}

		}
	],

	role: {
		type: String,
		default: 'newUser'
	},

	jobDesc: {
		type: String,
		enum: {
			values: [
				'Collector',
				'Driver',
				'Sweeper'
			]
		}
	},

	level: {
		type: Number,
		default: 0
	},

	exp: {
		type: Number,
		default: 0
	},

	otp: {
		type: String,
	},

	activeChat: {
		type: String,
		default: 'false'
	},


	push_tokens: [
		{
			push_token: {
				type: String,
			}

		}
	],

	allows_notification: {
		type: String,
	},

	otp_status: {
		type: String,
		enum: {
			values: [
				'Expired',
				'Verified',
				'Fresh'
			]
		}
	}
	,

	notifications: [
		{
			room: {
				type: String,
				required: true,
			},
			title: {
				type: String,
				trim: true
			},
			time: {
				type: String,
				trim: true
			},
			sender_id: {
				type: mongoose.Schema.ObjectId,
				ref: 'user'
			},
			receiver_id: {
				type: mongoose.Schema.ObjectId,
				ref: 'user'
			},
			barangay: {
				type: String,
				trim: true
			},
			link: {
				type: String,
				trim: true
			},
			notifCode: {
				type: String,
				trim: true
			},
			status: {
				type: String,
				trim: true
			},
			category: {
				type: String,
				trim: true
			},
			modelObj: {
				type:Object
			}

		}
	],

	createdAt: {
		type: Date,
		default: Date.now
	},

	resetPasswordToken: String,
	resetPasswordExpire: Date
})


userSchema.pre('save', async function (next) {
	if (!this.isModified('password')) {
		next()
	}
	this.password = await bcrypt.hash(this.password, 10)
});


userSchema.methods.getJwtToken = function () {
	return jwt.sign({ id: this._id }, process.env.JWT_SECRET);
}

userSchema.methods.comparePassword = async function (enteredPassword) {
	return await bcrypt.compare(enteredPassword, this.password)
}


userSchema.methods.getResetPasswordToken = function () {
	//Generate token
	const resetToken = crypto.randomBytes(20).toString('hex');

	//Hash and set to resetPasswordToken
	this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')

	//Set token expire time
	this.resetPasswordExpire = Date.now() + 30 * 60 * 1000

	return resetToken
}


userSchema.methods.getResetPasswordTokenMobile = function (code) {

	this.resetPasswordToken = code

	//Set token expire time
	this.resetPasswordExpire = Date.now() + 30 * 60 * 1000

	return code
}


module.exports = mongoose.model('user', userSchema);
