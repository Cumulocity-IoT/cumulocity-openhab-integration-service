# Intro

This project is an node.js based event integration service for Cumulocity IoT into OpenHAB. It makes use of the Cumulocity IoT Notification API and creates/updates items in OpenHAB via its REST API.

# Content
- [Intro](#intro)
- [Content](#content)
- [Solution components](#solution-components)
- [Set Configuration](#set-configuration)
- [Start Service](#start-service)

There is one device being created and the decoded measurements will be attached.

# Solution components

The service consists of 3 components and one configuration file:
* `./main.js` Initiates websocket connection to Cumulocity IoT Pulsar
* `./c8y-subscription.js` Contains functions for initiating the websocket connection including token retrieval and subscription creation. See [documentation](https://cumulocity.com/guides/reference/notifications/) for more details.
* `./o5b-forwarder.js` Contains functions for forwarding data to OpenHAB.
* `./config/default.json` Contains all configurations.

# Set Configuration

If there is already a valid subscription you want to use in place, your just have to set following config parameters:
*  c8y.c8yUrl: Cumulocity IoT Tenant Url without http(s)               
*  c8y.c8yAuthToken: Cumulocity IoT Basic Auth Header Token
*  c8y.subscriberName: Configurable name of your subscriber
*  c8y.subscriptionName: Configurable name of your subscription
*  o5b.url: Full Url of OpenHAB
*  o5b.port: Port of OpenHAB
*  o5b.authToken: OpenHAB Basic Auth Header Token

If you want to create a subscripton you have to set all properties:

*  c8y.subscriptionDeviceId: Device Id oder * for device scope of subscription
*  c8y.subscriptionApis: APIs of subscription, eg measurements or events 
*  c8y.subscriptionTypeFilter: Managed Object Types, which should be included
*  c8y.subscriptionFragmentsToCopy: Custom fragments, which should be copied
*  c8y.tokenExpireTime: Subscription token validity time

For more details also see https://cumulocity.com/api/core/10.15.0/#operation/postNotificationSubscriptionResource

# Start Service

Install required node dependencies via npm: ws, axios, config

Just run node ./main inside root directory. For every incoming measurement fragment.series combination per device an item c8y_{{deviceId}}_{{fragment}}_{{series}} in OpenHAB will be created and/or updated accordingly.

------------------------------

These tools are provided as-is and without warranty or support. They do not constitute part of the Software AG product suite. Users are free to use, fork and modify them, subject to the license agreement. While Software AG welcomes contributions, we cannot guarantee to include every contribution in the master project.
_____________________
For more information you can Ask a Question in the [TECHcommunity Forums](https://tech.forums.softwareag.com/tags/c/forum/1/cumulocity-iot).

You can find additional information in the [Software AG TECHcommunity](https://tech.forums.softwareag.com/tag/cumulocity-iot).