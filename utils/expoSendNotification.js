
const { Expo } = require('expo-server-sdk')

const sendNotification = async (userTokens, message, screen, object_id, code) => {
	let expo = new Expo();
	let messages = [];

	let somePushTokens = []
	userTokens.forEach(user => {
		const userPushTokens = user.push_tokens

		// console.log(user.email,userPushTokens)


		if (user.activeChat === "false") {
			userPushTokens.forEach(push_token => {
				somePushTokens.push(push_token.push_token)
			})
		} else {
			if (screen !== 'PublicDonationsChat' && screen !== 'PublicReportsChat') {
				userPushTokens.forEach(push_token => {
					if (push_token !== undefined) {
						if (!somePushTokens.includes(push_token)) {
							somePushTokens.push(push_token.push_token)
						}
					}
				})
			}
		}


	})
	console.log("somePushTokens", somePushTokens)
	for (let pushToken of somePushTokens) {
		if (!Expo.isExpoPushToken(pushToken)) {
			console.error(`Push token ${pushToken} is not a valid Expo push token`);
			continue;
		}

		// Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
		messages.push({
			to: pushToken,
			sound: 'default',
			body: message,
			data: { screen: screen, message: message, object: object_id, code: code },
		})


	}

	let chunks = expo.chunkPushNotifications(messages);
	let tickets = [];
	(async () => {
		// Send the chunks to the Expo push notification service. There are
		// different strategies you could use. A simple one is to send one chunk at a
		// time, which nicely spreads the load out over time:
		for (let chunk of chunks) {
			try {
				let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
				// console.log(ticketChunk);
				tickets.push(...ticketChunk);
				// NOTE: If a ticket contains an error code in ticket.details.error, you
				// must handle it appropriately. The error codes are listed in the Expo
				// documentation:
				// https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
			} catch (error) {
				console.error(error);
			}
		}
	})();

}

module.exports = sendNotification