'use strict';

const DOC = require('dynamodb-doc')
const dynamo = new DOC.DynamoDB()
const fetch = require('node-fetch')

function display(object) {
    return JSON.stringify(object, null, 2)
}

function getUserDataUri(access_token, fileds) {
    return `https://graph.facebook.com/me?access_token=${access_token}&fileds=email,id,name`
}

function getUserHandler(params, context, callback) {
    dynamo.query(params, (err, data) => {
        if (err) {
            context.fail(err)
        } else {
            context.succeed(data.Items)
        }
    })
}

function createUserHandler(params, context) {
    dynamo.putItem(params, (err, data) => {
        if (err) {
            context.fail(new Error(err))
        } else {
            context.succeed(params)
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
                        context.fail(new Error(err))
                    } else {
                        if (data.Items.length > 0) {
                            context.fail(new Error('Duplicate fb user id'))
                        } else {
                            const uuid = require('node-uuid')
                            event.payload.Item.id = uuid.v1()
                            event.payload.Item.fb_id = user.id
                            event.payload.Item.user_name = user.name
                            createUserHandler(event.payload, context)
                        }
                    }
                })
                break
            default:
                context.fail(new Error('Unrecognized operation "' + operation + '"'))
        }
    }
}

module.exports.handler = (event, context) => {
    console.log('Event: ', display(event))
    console.log('Context: ', display(context))
    const url = getUserDataUri(event.access_token)
    fetch(url, {
            mode: 'cors'
        })
        .then(response => response.json())
        .then(eventHandler(event, context))
}