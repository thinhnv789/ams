const User = require('../../models/User');
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);

exports.postRegister = (req, res, next) => {
	try {
		req.checkBody('firstName', 'firstName is required').notEmpty();
		req.checkBody('lastName', 'lastName is required').notEmpty();
		// req.checkBody('userName', 'userName is required').notEmpty();
		req.checkBody('phoneNumber', 'phoneNumber is required').notEmpty();
		req.checkBody('email', 'Email is invalid').isEmail();
		req.checkBody('password', 'Password must be at least 4 characters long').len(4);
		req.checkBody('confirmPassword', 'Passwords do not match').equals(req.body.password);
		req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });
	
		req.getValidationResult().then(function(errors) {
		  if (!errors.isEmpty()) {
			var errors = errors.mapped();

			return res.json({
				success: false,
				errorCode: '011',
				errors: errors,
            	data: req.body,
				message: 'Validate errors'
			})
		  } else {
			const user = new User();
			user.firstName = req.body.firstName;
			user.lastName = req.body.lastName;
			user.userName = req.body.userName ? req.body.userName : req.body.phoneNumber;
			user.email = req.body.email;
			user.avatar = req.body.avatar;
			user.phoneNumber = req.body.phoneNumber;
			user.password = req.body.password;
			user.gender = req.body.gender;
			user.status = 0;
		  
			User.findOne({ email: req.body.email }, (err, existingUser) => {
			  if (err) { return next(err); }
			  if (existingUser) {
				return res.json({
					success: false,
					errorCode: '012',
					message: 'Người dùng đã tồn tại'
				});
			  }
			  user.save((err) => {
				if (err) { 
					return res.json({
						success: false,
						errorCode: '013',
						message: 'Có lỗi xảy ra'
					});
				}
				return res.json({
					success: true,
					errorCode: 0,
					message: 'Đăng ký tài khoản thành công'
				});
			  });
			});
		  }
		});
	} catch (e) {
		return res.json({
			success: false,
			errorCode: '111',
			message: 'Server exception'
		})
	}
}
// Get all active sliders
exports.getInfo = function (req, res) {
    try {
		let currentUser = req.session.user;
		let clientKey = 'user_info_' + currentUser._id;

		client.get(clientKey, (err, user) => {
			if (err) {
				console.log('err', err);
				throw err;
			}
			if (user && process.env.CACHE_ENABLE === 1) {
				return res.json({
					success: true,
					errorCode: 0,
					data: JSON.parse(user)
				});
			} else {
				User.find({_id: currentUser._id})
				.select({
					'_id': 0,
					'firstName': 1,
					'lastName': 1,
					'userName': 1,
					'phoneNumber': 1,
					'email': 1,
					'gender': 1,
					'avatar': 1,
					'avatarUrl': 1,
					'address': 1
				})
				.exec(function (err, user) {
					if (err) {
						console.log('err', err)
						return done(err);
					}
					
					res.json({
						success: true,
						errorCode: 0,
						data: user
					});
					/**
					 * Set redis cache data
					 */
					client.set(clientKey, JSON.stringify(user), 'EX', process.env.REDIS_CACHE_TIME);
				});
			}
		});
	} catch (e) {
		return res.json({
			success: false,
			errorCode: '111',
			data: {},
			message: 'Exception'
		})
	}
};

exports.postFirebaseDeviceToken = (req, res, next) => {
	try {
		let currentUser = req.session.user;
		let deviceToken = req.body.token,
			os = req.body.os,
			version = req.body.version,
			deviceName = req.body.deviceName;
		User.findById(currentUser._id, (err, user) => {
			if (err) {
				return res.json({
					success: false,
					errorCode: 111,
					message: JSON.stringify(err)
				});
			}

			if (!deviceToken) {
				return res.json({
					success: false,
					errorCode: 112,
					message: 'Device token is required'
				});
			}

			// Add firebase device token when login new device
			let deviceInfo = JSON.stringify({
				token: deviceToken,
				os: os,
				version: version,
				deviceName: deviceName
			});
			
			if (user.firebaseDeviceToken.indexOf(deviceInfo) === -1) {
				user.firebaseDeviceToken.push(deviceInfo);

				user.save((err, u) => {
					if (err) {
						return res.json({
							success: false,
							errorCode: 111,
							message: JSON.stringify(err)
						});
					}
					return res.json({
						success: true,
						errorCode: 0,
						message: 'Update device token successfully'
					});
				})
			} else {
				return res.json({
					success: true,
					errorCode: 0,
					message: 'Update device token successfully'
				});
			}
		})
	} catch (e) {
		return res.json({
			success: false,
			errorCode: '111',
			message: 'Exception'
		})
	}
}

exports.postUpdateInfo = (req, res, next) => {
	try {
		let userId = req.session.user._id;

		User.findById(userId, (err, user) => {
			if (err) {
				return res.json({
					success: false,
					errorCode: 112,
					message: JSON.stringify(err)
				});
			}

			let data = req.body;
			if (user) {
				user.firstName = data.firstName ? data.firstName : user.firstName;
				user.lastName = data.lastName ? data.lastName : user.lastName;
				user.email = data.email ? data.email : user.email;
				user.phoneNumber = data.phoneNumber ? data.phoneNumber : user.phoneNumber;
				user.gender = data.gender ? data.gender : user.gender;
				user.avatar = data.avatar ? data.avatar : user.avatar;
				user.address = data.address ? data.address : user.address;

				user.save((err, user) => {
					if (err) {
						return res.json({
							success: false,
							errorCode: 112,
							message: JSON.stringify(err)
						});
					}

					return res.json({
						success: true,
						errorCode: 0,
						message: 'Update user info successfully'
					});
				})
			}
		});
	} catch (e) {
		return res.json({
			success: false,
			errorCode: '111',
			message: 'Exception'
		})
	}
}

exports.getSearch = (req, res, next) => {
	try {
		let keyword = req.query.keyword;
		User.find({
			$or: [
				{
					firstName: {
						$regex: new RegExp(keyword, "ig")
					}
				},
				{
					lastName: {
						$regex: new RegExp(keyword, "ig")
					}
				},
			]
		})
		.select({
			_id: 1,
			firstName: 1,
			lastName: 1,
			userName: 1,
			email: 1,
			address: 1
		})
		.exec((err, users) => {
			if (err) {
				return res.json({
					success: false,
					errorCode: '211',
					message: 'Có lỗi xảy ra'
				})
			}

			return res.send({
				success: true,
				errorCode: 0,
				data: users,
				message: 'Query user successfully'
			})
		})
	} catch (e) {
		return res.json({
			success: false,
			errorCode: '111',
			message: 'Exception'
		})
	}
}