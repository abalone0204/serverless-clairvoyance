'use strict';

const DOC = require('dynamodb-doc')
const dynamo = new DOC.DynamoDB()
const fetch = require('node-fetch')
const display = require('../libs/display.js')
const getUserDataUri = require('../libs/getUserDataUri.js')
const response_error = require('../libs/response_error.js')



function getUserHandler(params, context, callback) {
    dynamo.query(params, (err, data) => {
        if (err) {
            context.fail(err)
        } else {
            context.succeed(data.Items[0])
        }
    })
}

function createUserHandler(params, context) {
    dynamo.putItem(params, (err, data) => {
        if (err) {
            context.fail(err)
        } else {
            context.succeed(params.Item)
        }
    })
}

function eventHandler(event, context) {
    return (user) => {
        switch (event.operation) {
            case 'get':
                event.payload.ExpressionAttributeValues[':fb_id'] = user.id
                getUserHandler(event.payload, context)
                break
            case 'create':
                console.log('User: ', display(user))
                event.check_params.ExpressionAttributeValues[':fb_id'] = user.id
                dynamo.query(event.check_params, (err, data) => {
                    if (err) {
                        context.fail(err)
                    } else {
                        if (data.Items.length > 0) {
                            context.fail('Duplicate fb user id')
                        } else {
                            const uuid = require('node-uuid')
                            event.payload.Item.id = uuid.v1()
                            event.payload.Item.fb_id = user.id
                            event.payload.Item.user_name = user.name
                            event.payload.Item.created_at = Date.now()
                            createUserHandler(event.payload, context)
                        }
                    }
                })
                break
            default:
                context.fail('Unrecognized operation "' + operation + '"')
        }
    }
}

module.exports.handler = (event, context) => {
    const fail = context.fail
    context.fail = (err) => {
        fail(response_error(err))
    }
    console.log('Event: ', display(event))
    console.log('Context: ', display(context))
    const url = getUserDataUri(event.access_token)
    fetch(url, {
            mode: 'cors'
        })
        .then(response => response.json())
        .then(eventHandler(event, context))
}