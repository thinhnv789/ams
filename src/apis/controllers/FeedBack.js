const FeedBack = require('./../../models/FeedBack');
const User = require('./../../models/User');
const Notification = require('./../../models/Notification');

exports.postCreate = (req, res, next) => {
	try {
        req.checkBody('content', 'Nội dung phản hồi không được để trống').notEmpty();
	
        var errors = req.getValidationResult().then(function(errors) {
            if (!errors.isEmpty()) {
                return res.json({
                    success: false,
                    errorCode: '011',
                    message: errors,
                });
            } else {
                let data = req.body;
                let newFeedBack = new FeedBack();
                
                newFeedBack.title = data.title;
                newFeedBack.content = data.content;
                newFeedBack.image = data.image;
                newFeedBack.status = data.status;
                newFeedBack.flag = data.flag || null;
                newFeedBack.createdBy = req.session.user._id;
                newFeedBack.save(function (err, feedback) {
                    if (err) {
                        return res.json({
                            success: false,
                            errorCode: '010',
                            message: errors,
                            data: req.body
                        })
                    } else {
                        /**
                         * Push notification to admin and building manager
                         */
                        User.findById(req.session.user._id)
                        .populate({
                            path: 'building',
                            model: 'ApartmentBuilding',
                            populate: {
                                path: 'apartmentBuildingGroup',
                                model: 'ApartmentBuildingGroup'
                            }
                        }).exec((err, user) => {
                            if (user && user.building) {
                                let newNoti = new Notification();
                                if (feedback.flag == 1) {
                                    newNoti.type = 5;
                                    newNoti.title = 'Báo cháy từ ' + user.firstName + ' ' + user.lastName;
                                } else {
                                    newNoti.type = 3;
                                    newNoti.title = 'Báo cáo sai phạm từ ' + user.firstName + ' ' + user.lastName;
                                }
                                newNoti.recipient = user.building.manager;
                                newNoti.building = user.building._id,
                                newNoti.buildingGroup = user.building.apartmentBuildingGroup._id;
                                newNoti.createdBy = user._id;
                                newNoti.objId = feedback._id;
                                newNoti.save((er, nt) => {
                                    if (newNoti.type == 5) {
                                        try {
                                            global.io.to(user.building.manager).emit('noti_fire_alarm', nt);
                                        } catch (e) {
    
                                        }
                                    }
                                });
                            }
                            User.find({
                                role: 'ADMIN',
                                _id: {
                                    $ne: (user && user.building) ? user.building.manager : null
                                }
                            }).exec((err, admins) => {
                                
                                for (let i=0; i<admins.length; i++) {
                                    let newNoti = new Notification();
                                    if (feedback.flag == 1) {
                                        newNoti.type = 5;
                                        newNoti.title = 'Báo cháy từ ' + user.firstName + ' ' + user.lastName;
                                    } else {
                                        newNoti.type = 3;
                                        newNoti.title = 'Báo cáo sai phạm từ ' + user.firstName + ' ' + user.lastName;
                                    }
                                    newNoti.recipient = admins[i]._id;
                                    newNoti.building = (user.building) ? user.building._id : null,
                                    newNoti.buildingGroup = user.building ? user.building.apartmentBuildingGroup._id : null;
                                    newNoti.createdBy = user._id;
                                    newNoti.objId = feedback._id;
                                    newNoti.save((er, nt) => {
                                        if (newNoti.type == 5) {
                                            try {
                                                global.io.to(admins[i]._id).emit('noti_fire_alarm', nt);
                                            } catch (e) {
        
                                            }
                                        }
                                    });
                                }
                            })
                        });
                        return res.json({
                            success: true,
                            errorCode: 0,
                            data: feedback,
                            message: 'Gửi phản hồi thành công'
                        });
                    }
                })
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