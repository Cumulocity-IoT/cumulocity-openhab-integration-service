const WebSocket = require('ws');
const axios = require('axios');
const o5b = require('./o5b-forwarder')
const config = require('config');

//Cumulocity IoT Properties
const c8yUrl = config.get('c8y.c8yUrl');
const c8yAuthToken = config.get('c8y.c8yAuthToken');

//Subscription Properties
const subscriberName = config.get('c8y.subscriberName');
const subscriptionName = config.get('c8y.subscriptionName');
//Following can be ignored, if subscription already exists
const subscriptionDeviceId = config.get('c8y.subscriptionDeviceId');
const subscriptionApis = config.get('c8y.subscriptionApis');
const subscriptionTypeFilter = config.get('c8y.subscriptionTypeFilter');
const subscriptionFragmentsToCopy = config.get('c8y.subscriptionFragmentsToCopy');
const tokenExpireTime = config.get('c8y.tokenExpireTime');;

const createSubscription = async () => {
    try {
        const headers = {
            'Authorization': c8yAuthToken
        };
        const response = await axios.post(`https://${c8yUrl}/notification2/subscriptions`,
            {
                "source": {
                    "id": subscriptionDeviceId
                },
                "context": "mo",
                "subscription": subscriptionName,
                "subscriptionFilter": {
                    "apis": subscriptionApis.split(',')
                    ,
                    "typeFilter": subscriptionTypeFilter
                },
                "fragmentsToCopy": subscriptionFragmentsToCopy.split(',')
            },
            { headers });
        console.log('Subscription was created: ' + response.data.subscription);
        return response.data.subscription;
    } catch (error) {
        if (error.response.status == '409') {
            console.log(`Subscription already exists - skipping creation.`)
        }
        else console.error(`Error creating Subscription (maybe it already exists): ${error.data}`);
    }
}

const getNotificationToken = async () => {
    try {
        const headers = {
            'Authorization': c8yAuthToken
        };
        const response = await axios.post(`https://${c8yUrl}/notification2/token`, {
            "subscriber": subscriberName,
            "subscription": subscriptionName,
            "expiresInMinutes": tokenExpireTime
        }, { headers });
        console.log('Notification Token was created');
        return response.data.token;
    } catch (error) {
        console.error(`Error retrieving notification token from Cumulocity: ${error}`);
    }
}


async function connectWebsocket() {
    //Create subscription, if it does not exist
    createSubscription();

    //Retrieve Notification Token for subscription
    const notificationToken = await getNotificationToken();

    //Establish websocket connection
    const wsUrl = `wss://${c8yUrl}/notification2/consumer/?token=${notificationToken}`;
    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
        console.log('Cumulocity WebSocket connection opened');
    });

    ws.on('message', (data) => {
        console.log('Cumulocity WebSocket packet received');
        let event = data;
        let messageId;
        //Split String and parse JSON
        //console.log(event.toString());
        try {
            messageId = event.toString().split("\n")[0];
            console.log(`Incoming Message Id is ${messageId}`);
            event = JSON.parse(event.toString().split("\n")[4]);
            if (o5b.handleMeasurements(event)) {
                ws.send(messageId)
                console.log('Message queue updated')
            };
        } catch {
            console.error('Could not parse incoming JSON');
        }

    }
    );

    ws.on('close', () => {
        console.log('Cumulocity WebSocket connection closed');
        connectWebsocket();
    });
}

module.exports = { connectWebsocket }