'use strict'
const response_error = require('../libs/response_error.js')
const display = require('../libs/display.js')
const DOC = require('dynamodb-doc')
const dynamo = new DOC.DynamoDB()
const uuid = require('node-uuid')

module.exports.handler = (event, context) => {
    try {
        const fail = context.fail
        context.fail = (err) => {
            fail(response_error(err))
        }
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
                            context.fail('Already existed')
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
                                context.fail('Failed to create')
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
                context.fail('Unrecognized operation "' + operation + '"')
        }
    } catch (error) {
        context.fail(error)
    }
}