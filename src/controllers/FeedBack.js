const FeedBack = require('../models/FeedBack');

// Get all Categories
exports.getIndex = function (req, res) {
	let condition = {
		flag: {$ne: 1}
	};

	if (req.query.flag == 1) {
		condition = {
			flag: 1
		}
	}

	FeedBack.find(condition).populate({
		path: 'createdBy',
		model: 'User'
	}).sort('-createdAt').exec(function (err, fbs) {
		if (err) {
			console.log('err', err)
			return res.json({
				success: false,
				errorCode: '121',
				message: 'Lỗi không xác định'
			})
		}
		res.render('feedback/index', {
			title: req.query.flag == 1 ? 'Bao chay' : 'Bao cao sai pham',
			current: req.query.flag == 1 ? ['feedbackflag1', 'index'] : ['feedback', 'index'],
			data: fbs
		});
	});
};