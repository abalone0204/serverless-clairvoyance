'use strict'

const DOC = require('dynamodb-doc')
const dynamo = new DOC.DynamoDB()
const uuid = require('node-uuid')

function display(object) {
    return JSON.stringify(object, null, 2)
}

module.exports.handler = (event, context) => {
    console.log('Event: ', display(event))
    console.log('Context: ', display(context))
    const operation = event.operation
    switch (operation) {
        case 'create':
            const queryCallback = (cb) => (err, data) => {
                if (err) {
                    context.fail(err)
                } else {
                    if (data.Items.length !== 0) {
                        context.fail(new Error('Job already exist'))
                    } else {
                        cb()
                    }
                }
            }
            dynamo.query(event.check_payload, queryCallback(() => {
                dynamo.query(event.e04_check_payload, queryCallback(() => {
                    event.payload.Item.id = uuid.v1()
                    console.log('Payload: ', display(event.payload))
                    dynamo.putItem(event.payload, (err, data) => {
                        if (err) {
                            context.fail(err)
                        }
                        context.succeed(event.payload.Item)
                    })
                }))
            }))
            break
        case 'read':
            dynamo.query(event.payload, (err, data) => {
                if (err) {
                    context.fail(err)
                }
                if (data.Items.length > 0) {
                    context.succeed(data.Items[0])
                } else {
                    dynamo.query(event.e04payload, (err, data) => {
                        if (err) {
                            context.fail(err)
                        } else {
                            context.succeed(data.Items[0])
                        }
                    })
                }
            })
            break
        default:
            context.fail(new Error('Unrecognized operation "' + operation + '"'))
    }

}