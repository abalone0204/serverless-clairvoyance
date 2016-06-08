'use strict'
const DOC = require('dynamodb-doc')
const dynamo = new DOC.DynamoDB()
const uuid = require('node-uuid')
const display = require('../libs/display.js')
const getUserDataUri = require('../libs/getUserDataUri.js')
const response_error = require('../libs/response_error.js')

module.exports.handler = (event, context) => {
    const fail = context.fail
    context.fail = (err) => {
        fail(response_error(err))
    }
    console.log('Event: ', display(event))
    console.log('Context: ', display(context))
    const operation = event.operation
    switch (operation) {
        case 'read':
            dynamo.query(event.payload, (err, data) => {
                if (err) {
                    context.fail(err)
                }
                context.succeed(data.Items)
            })
            break
        case 'create':
            const types = ['good', 'bad', 'normal']
            if (types.indexOf(event.type) === -1) {
                context.fail('Unknown type of comment')
            }
            const url = getUserDataUri(event.access_token)
            const fetch = require('node-fetch')
            fetch(url, {
                    mode: 'cors'
                })
                .then(response => response.json())
                .then(user => {
                    event.find_user_payload.ExpressionAttributeValues[':fb_id'] = user.id

                    dynamo.query(event.find_user_payload, (err, userData) => {
                        if (err) {
                            context.fail(err)
                        } else {
                            event.payload.Item.id = uuid.v1()
                            console.log('userData: ', userData);
                            if (event.anonymous === 'false') {
                                event.payload.Item.user_name = userData.Items[0].user_name
                                event.payload.Item.anonymous = false
                            } else {
                                event.payload.Item.anonymous = true
                            }
                            event.payload.Item.fb_id = userData.Items[0].fb_id
                            event.payload.Item.type = event.type
                            event.payload.Item.timestamp = Date.now()
                            dynamo.putItem(event.payload, (err, data) => {
                                if (err) {
                                    context.fail(err)
                                } else {
                                    context.succeed(event.payload.Item)
                                }
                            })

                        }
                    })
                })
            break
        default:
            context.fail('Unrecognized operation "' + operation + '"')

    }
}