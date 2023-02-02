const axios = require('axios');
const config = require('config');


//var message = { "self": "https://t15925584.eu-latest.cumulocity.com/measurement/measurements/52701515", "time": "2023-01-11T15:22:49.957+01:00", "id": "52701515", "source": { "self": "https://t15925584.eu-latest.cumulocity.com/inventory/managedObjects/52616633", "id": "52616633" }, "type": "c8y_Notification_Temperature", "c8y_Notification_Temperature": { "Temperature": { "unit": "C", "value": 55 }, "Temperature2": { "unit": "C", "value": 45 } }, "c8y_Notification_Pressure": { "Pressure": { "unit": "C", "value": 55 }, "Pressure2": { "unit": "C", "value": 45 } } }

var items = {}

function handleMeasurements(object) {
    var level = 1;
    var key;
    var o5b_item_name
    var o5b_item_value

    //Check if there is any object with depth 3 as this would be just measurements
    for (key in object) {
        if (!object.hasOwnProperty(key)) continue;

        if (typeof object[key] == 'object') {
            var depth = handleMeasurements(object[key]) + 1;
            level = Math.max(depth, level);
        }

        //Put measurements in items object, if not already existent and send values to openhab
        if (level == 3) {
            for (const [subKey, value] of Object.entries(object[key])) {
                if (!(`c8y_${object.source.id}_${key}_${subKey}` in items)) {
                    items[`c8y_${object.source.id}_${key}_${subKey}`] = `${value["value"]}`
                    console.log(`New Measurement Key c8y_${object.source.id}_${key}_${subKey} was added to items collection`)
                }
                o5b_item_name = `c8y_${object.source.id}_${key}_${subKey}`
                o5b_item_value = `${value["value"]}`

                //Send to openhab
                o5bUpdateItem(o5b_item_name, o5b_item_value)
            }
        }
    }
    return level;
}


const o5bUpdateItem = async (item, value) => {

    // Forward the data to the OpenHAB REST API and confirm Message handling in C8Y
    const headers = {
        'Content-Type': 'text/plain'
    };
    await axios.post(`${config.get('o5b.url')}:${config.get('o5b.port')}/rest/items/${item}`, value, { headers })
        .then(response => {
            console.log(`Data forwarded to OpenHAB:\n${item} : ${value}`);
            return true;
        })
        .catch(error => {
            console.error(`Error forwarding data to OpenHAB: ${error}`);
            if (error.response.status == '404') {
                o5bCreateItem(item);
            }
        });
};

const o5bCreateItem = async (item) => {
    console.log(`Item ${item} does not exist yet and will be created in Openhab`)
    var o5bAuthToken = config.get('o5b.authToken');
    const headers = {
        'Content-Type': 'application/json', 'Authorization': o5bAuthToken
    };
    await axios.put(`${config.get('o5b.url')}:${config.get('o5b.port')}/rest/items/${item}`, {
        "name": item.toString(),
        "label": item.toString(),
        "category": "",
        "type": "String",
        "groupNames": [],
        "tags": [],
        "created": false
    }, { headers })
        .then(response => {
            console.log(`Item created in Openhab:${item}`);
        })
        .catch(error => {
            console.error(`Error creating item in Openhab: ${error}`);
        });
}

module.exports = { handleMeasurements }
