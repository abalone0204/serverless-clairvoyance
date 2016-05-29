'use strict'
const DOC = require('dynamodb-doc')
const dynamo = new DOC.DynamoDB()
const uuid = require('node-uuid')

function display(object) {
    return JSON.stringify(object, null, 2)
}

module.exports.handler = function(event, context) {
    console.log('Event: ', display(event))
    console.log('Context: ', display(context))
    const operation = event.operation
    switch (operation) {
        case 'create':
            event.payload.Item.id = uuid.v1()
            console.log('Payload: ', display(event.payload))
            dynamo.putItem(event.payload, (err, data) => {
                if (err) {
                    context.fail(err)
                }
                context.succeed(event.payload.Item)
            })
            break
        default:
            context.fail(new Error('Unrecognized operation "' + operation + '"'))

    }
}