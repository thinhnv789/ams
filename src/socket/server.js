const User = require('./../models/User');
const Room = require('./../models/Room');
const Message = require('./../models/Message');
const Post = require('./../models/Post');

const passport = require('./../middleware/passport');

var count = 0;

var ioEvents = function(io) {
    io.on('connection', function(socket){
        // console.log('client connected');
        /**
         * Event only for admin identify: if user loged in allow chat else show popup login
         * if user loged in => exist socket.request.user
         */
        var token = socket.handshake.query.token;
        console.log('token', token);
        if (token) {
            console.log('has token');
            passport.jwtVerifyToken(token, user => {
        
                if (user && user.id) {
                    /**
                     * Change socket id was generated by server to user Id
                     */
                    let uRooms = user.groups;
                    console.log('uRooms', uRooms);
                    /**
                     * Join this room: using case 1 account login in many device
                     */
                    socket.join(user.id);
                    /**
                     * Join customer care room in order to reply customer's messages
                     */
                    for(let i=0; i<uRooms.length; i++) {
                        socket.join(uRooms[i].id);
                    }
                    /**
                     * Notification join chat success
                     */
                    let dataIdentification = {
                        id: user.id,
                        room: user.id,
                        avatar: user.avatar,
                        avatarUrl: user.avatarUrl,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        userName: user.userName,
                        phoneNumber: user.phoneNumber,
                        email: user.email
                    };
                    setTimeout(function(){
                        console.log('ttt');
                        socket.emit('join_chat_successfully', dataIdentification);
                    }, 10000);
                    socket.identification = dataIdentification;
    
                    /**
                     * Update online status
                     */
                    user.isOnline = 1;
                    user.save();
                } else {
                    console.log('client auth failed and server auto disconnected');
                    socket.emit('authenticate_failed');
                    socket.disconnect(true);
                }
            })
        } else {
            var user = socket.handshake.session ? socket.handshake.session.user : null;
            if (user && user.id) {
                /**
                 * Change socket id was generated by server to user Id
                 */
                let uRooms = user.groups;
                console.log('uRooms', uRooms);
                /**
                 * Join this room: using case 1 account login in many device
                 */
                socket.join(user.id);
                /**
                 * Join customer care room in order to reply customer's messages
                 */
                for(let i=0; i<uRooms.length; i++) {
                    socket.join(uRooms[i].id);
                }
                /**
                 * Notification join chat success
                 */
                let dataIdentification = {
                    id: user.id,
                    room: user.id,
                    avatar: user.avatar,
                    avatarUrl: user.avatarUrl,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    userName: user.userName,
                    phoneNumber: user.phoneNumber,
                    email: user.email
                };
                socket.emit('join_chat_successfully', dataIdentification);
                socket.identification = dataIdentification;

                /**
                 * Update online status
                 */
                User.updateOne({_id: user._id}, {isOnline: 1});
                // user.isOnline = 1;
                // user.save();
            }
        }
        /**
         * Event send message
         */
        socket.on('send_message', (data) => {
            console.log('data', data.sender.room);
            /**
             * Send message to recipient
             */
            
            io.to(data.to.room).emit('message', data);

            /**
             * Save message to database
             */
            let newMessage = new Message();
            newMessage.sender = data.sender.room;
            newMessage.recipient = data.to.room;
            newMessage.messageContent = data.messageContent;
            newMessage.status = 1;

            newMessage.save((err, newMessage) => {
                if (err) {
                    console.log(err);
                } else {
                    /**
                     * Send message to sender in order to confirm message send successfully
                     */
                    io.to(data.sender.room).emit('owner_message', data);
                }
            });
        })

        /**
         * Emit new comment
         */
        socket.on('new_comment', postId => {
            Post.findById(postId, {
                '_id': 1,
                'title': 1,
                'alias': 1,
                'image': 1,
                'imageUrl': 1,
                'description': 1,
                'content': 1,
                'category': 1,
                'comments': 1,
                'tags': 1,
                'seo': 1,
                'createdAt': 1
            })
            .populate({
                path: 'comments',
                model: 'Comment',
                populate: {
                    path: 'createdBy',
                    model: 'User',
                    select: { '_id': 0, 'userName': 1 }
                }
            })
            .exec(function (err, post) {
                if (err) {
                    console.log('err', err)
                    return done(err);
                }
                io.sockets.emit('comment', post);
            });
        })

        /**
         * Event client disconnect
         */
        socket.on('disconnect', () => {
            console.log('reason', socket.identification);
            let identification = socket.identification;

            if (identification && identification.id) {
                try {
                    User.findById({_id: identification.id}, (err, user) => {
                        if (user) {
                            user.isOnline = 0;
                            user.save();
                        }
                    })
                } catch (e) {

                }
            }
        });
    });
}

module.exports = ioEvents;