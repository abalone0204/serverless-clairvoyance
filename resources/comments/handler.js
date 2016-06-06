'use strict'
const DOC = require('dynamodb-doc')
const dynamo = new DOC.DynamoDB()
const uuid = require('node-uuid')

function display(object) {
    return JSON.stringify(object, null, 2)
}

function getUserDataUri(access_token) {
    return `https://graph.facebook.com/me?access_token=${access_token}&fileds=email,id,name`
}

module.exports.handler = function(event, context) {
    console.log('Event: ', display(event))
    console.log('Context: ', display(context))
    const operation = event.operation
    switch (operation) {
        case 'read':
            dynamo.query(event.payload, (err, data) => {
                if (err) {
                    context.fail(err)
                }

                if (data.Items.length > 0) {
                    context.succeed(data.Items)
                } else {
                    context.succeed({
                        message: 'comments not found'
                    })
                }
            })
            break
        case 'create':
            const url = getUserDataUri(event.access_token)
            const fetch = require('node-fetch')
            fetch(url, {mode:'cors'})
            .then(response => response.json())
            .then(user => {
                event.find_user_payload.ExpressionAttributeValues[':fb_id'] = user.id

                dynamo.query(event.find_user_payload, (err, userData) => {
                    if (err) {
                        context.fail(new Error(err))
                    } else {
                        event.payload.Item.id = uuid.v1()
                        console.log('userData: ',userData);
                        if (event.anonymous === 'false') {
                            event.payload.Item.user_name = userData.Items[0].user_name
                            event.payload.Item.fb_id = userData.Items[0].fb_id
                            event.payload.Item.anonymous = false
                        } else {
                            event.payload.Item.anonymous = true
                        }
                        event.payload.Item.timestamp = Date.now()
                        dynamo.putItem(event.payload, (err, data) => {
                            if(err) {
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
            context.fail(new Error('Unrecognized operation "' + operation + '"'))

    }
}