module.exports = function getUserDataUri(access_token) {
    return `https://graph.facebook.com/me?access_token=${access_token}&fileds=email,id,name`
}
