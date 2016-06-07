module.exports = function response_error(error_message) {
    return JSON.stringify({
        status: 400,
        error: error_message
    })
}
