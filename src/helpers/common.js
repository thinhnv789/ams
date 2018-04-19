/**
 * 
 * @param {*} data Firebase tokens array
 */
exports.sendAndroidNotification = (tokens = [], noticeData = {}) => {
    const axios = require('axios');

    let url = 'https://fcm.googleapis.com/fcm/send';
    let sendData = {
        registration_ids: tokens,
        notification: {
            title: noticeData.title,
            body: noticeData.content,
            sound: 'default'
        },
        data: {},
        priority: 'high'
    }

    try {
        axios.post(
            url,
            sendData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': process.env.ANDROID_FCM_KEY
                }
            }
        )
        .then((res) => {
            console.log('res', res.data);
        })
        .catch(e => {
            console.log('exception', e);
        })
    } catch (e) {
        console.log('eee', e);
    }
}

exports.sendIosNotification = (tokens = [], noticeData = {}) => {
    const axios = require('axios');

    let url = 'https://fcm.googleapis.com/fcm/send';
    let sendData = {
        registration_ids: tokens,
        notification: {
            title: noticeData.title,
            body: noticeData.content,
            sound: 'default'
        },
        data: {},
        priority: 'high'
    }

    try {
        axios.post(
            url,
            sendData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': process.env.IOS_FCM_KEY
                }
            }
        )
        .then((res) => {
            console.log('res', res.data);
        })
        .catch(e => {
            console.log('exception', e);
        })
    } catch (e) {
        console.log('eee', e);
    }
}