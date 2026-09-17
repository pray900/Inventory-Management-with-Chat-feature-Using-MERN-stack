// Note: `role`, `isArchived` and `status` are intentionally NOT handled
// here. They're privileged fields set explicitly by the controller only
// when the requester is an admin (see controllers/users.controller.js) —
// `status` in particular gates login (see auth.controller.js), so a
// self-edit must never be able to touch it.
//
// A field counts as "provided" when it's neither undefined nor an empty
// string — an unfilled optional form field (e.g. an unselected gender
// radio) arrives as '', and assigning that to an enum/typed schema path
// throws a Mongoose ValidationError instead of just being skipped.
function isProvided(value) {
    return value !== undefined && value !== '';
}

module.exports = function (userData, user) {
    if (isProvided(userData.name))
        user.name = userData.name;
    if (isProvided(userData.username))
        user.username = userData.username;
    if (isProvided(userData.password))
        user.password = userData.password;
    if (isProvided(userData.email))
        user.email = userData.email;
    if (isProvided(userData.phoneNumber))
        user.phoneNumber = userData.phoneNumber;
    if (isProvided(userData.dob))
        user.dob = userData.dob;
    if (isProvided(userData.gender))
        user.gender = userData.gender;
    if (!user.address)
        user.address = {};
    if (isProvided(userData.tempAddress))
        user.address.temporaryAddress = typeof (userData.tempAddress) === 'string'
            ? userData.tempAddress.split(',')
            : userData.tempAddress;
    if (isProvided(userData.temporaryAddress))
        user.address.temporaryAddress = typeof (userData.temporaryAddress) === 'string'
            ? userData.temporaryAddress.split(',')
            : userData.temporaryAddress;
    if (isProvided(userData.permanentAddress))
        user.address.permanentAddress = userData.permanentAddress
    if (isProvided(userData.country))
        user.country = userData.country
    if (isProvided(userData.image))
        user.image = userData.image

    return user;
}
