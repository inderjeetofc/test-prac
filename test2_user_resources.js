'use strict';
const _ = require('lodash');
const Sequelize = require('sequelize');
const Op = require('sequelize').Op;
const DataHelper = require('../../../helpers/v1/data.helpers');
const _DataHelper = new DataHelper();

const User = require('./User.model');
const UserUpdateTokens = require('../UserUpdateTokens/UserUpdateTokens.model');
const UserAuthToken = require('../UserAuthTokens/UserAuthToken.model');
const UserVerification = require('../UserVerifications/UserVerification.model');
const UserForgotPasswordToken = require('../UserForgotPasswordTokens/UserForgotPasswordToken.model');
const UserToken = require('../UserTokens/UserToken.model');

const UserLocationResource = require('../UserLocation/UserLocation.resources')
const _UserLocationResource = new UserLocationResource()

const Pubnub = require('../../../services/v1/pubnub.service');
module.exports = class UsersResource {
    async createOne(data = null) {
        console.log('UsersResource@createOne');
        if (!data || data === '') {
            throw new Error('Data is required!');
        }

        let results;

        try {
            results = await User.create(data);
        } catch (err) {
            Error.payload = err.errors ? err.errors : err.message;
            throw new Error();
        }

        if (!results) {
            return false;
        }

        return results;
    }

    async getOne(userId) {
        console.log('UsersResource@getOne');
        if (!userId || userId === '') {
            throw new Error('User id is required!');
        }

        let results;
        try {
            results = await User.findByPk(userId);
        } catch (err) {
            Error.payload = err.errors ? err.errors : err.message;
            throw new Error();
        }

        if (!results) {
            return false;
        }

        return results;
    }
    async getUserUpdateDetails(user_id) {
        console.log('UsersResource@getUserUpdateDetails');
        if (!user_id || user_id === '') {
            throw new Error('User id is required!');
        }
        let results;
        try {
            results = await User.findOne({
                where: {
                    id:user_id
                },
                include: {
                    model: UserUpdateTokens,
                    as: 'user_update_tokens',
                    where: {
                        user_id,
                        used: false,
                        expiry: {
                            [Op.gt]: new Date()
                        }
                    },
                    required: false,
                    attributes: [
                        'value_type',
                        'old_value',
                        'new_value',
                        'used',
                    ]
                }
            });
        } catch (err) {
            Error.payload = err.errors ? err.errors : err.message;
            throw new Error();
        }

        if (!results) {
            return false;
        }

        return results;
    }

    async getByEmail(email) {
        console.log('UsersResource@getByEmail');
        if (!email || email === '') {
            throw new Error('Email is required!');
        }

        let results;
        try {
            results = await User.findOne({
                where: {
                    email: email
                }
            });
        } catch (err) {
            Error.payload = err.errors ? err.errors : err.message;
            throw new Error();
        }

        if (!results) {
            return false;
        }

        return results;
    }

    async verifyLogin(email, password) {
        console.log('UsersResource@verifyLogin');
        if (!email || password === '') {
            throw new Error('Email and Password are required!');
        }

        let results;
        try {
            results = await User.verifyLogin(email, password);
        } catch (err) {
            Error.payload = err.errors ? err.errors : err.message;
            throw new Error();
        }

        if (!results) {
            return false;
        }

        return results;
    }

    async verifyLoginByEmail(email) {
        console.log('UsersResource@verifyLoginByEmail');
        if (!email ) {
            throw new Error('Email is required!');
        }

        let results;
        try {
            results = await User.verifyLoginByEmail(email);
        } catch (err) {
            Error.payload = err.errors ? err.errors : err.message;
            throw new Error();
        }

        if (!results) {
            return false;
        }

        return results;
    }

    async verifyLoginByPhone(phone) {
        console.log('UsersResource@verifyLoginByPhone');
        if (!phone ) {
            throw new Error('Phone number is required!');
        }

        let results;
        try {
            results = await User.verifyLoginByPhone(phone);
        } catch (err) {
            Error.payload = err.errors ? err.errors : err.message;
            throw new Error();
        }

        if (!results) {
            return false;
        }

        return results;
    }

    async updateOne(userId = null, data = null) {
        console.log('UsersResource@updateOne');
        if (!userId || userId === '' || !data || data === '') {
            throw new Error('user id and data both are required');
        }

        try {
            await User.update(data, {
                where: {
                    id: userId
                }
            });
        } catch (err) {
            Error.payload = err.errors ? err.errors : err.message;
            throw new Error();
        }

        return true;
    }

    async getAllRegisterdUserWithCount() {
        console.log('UsersResource@getByEmail');

        let results;
        try {
            results = await User.findAndCountAll({
                where: {
                    status: 'registered'
                },
                attributes: [
                    [Sequelize.fn("concat", Sequelize.col("first_name"), ' ', Sequelize.col("last_name")), 'name'], 'email', 'phone'
                ],
            });
        } catch (err) {
            Error.payload = err.errors ? err.errors : err.message;
            throw new Error();
        }

        if (!results) {
            return false;
        }

        return results;
    }

    async getOneByParams(data) {
        console.log('UsersResource@getOneByParams');
        if (!data || data === '') {
            throw new Error('Data is required!');
        }

        let results;
        try {
            results = await User.findOne({
                where: data
            });
        } catch (err) {
            Error.payload = err.errors ? err.errors : err.message;
            throw new Error();
        }

        if (!results) {
            return false;
        }

        return results;
    }
    async getAllByParams(data) {
        console.log('UsersResource@getAllByParams');
        if (!data || data === '') {
            throw new Error('Data is required!');
        }

        let results;
        try {
            results = await User.findAll(data);
        } catch (err) {
            Error.payload = err.errors ? err.errors : err.message;
            throw new Error();
        }

        if (!results) {
            return false;
        }

        return results;
    }
    async deleteOne(user_id) {
        console.log('UsersResource@deleteOne');
        if (!user_id || user_id === '') {
            throw new Error('user_id is required!');
        }
        let results;
        try {
            await UserAuthToken.destroy({ where: { user_id }, force: true })
            await UserVerification.destroy({ where: { user_id }, force: true })
            await UserForgotPasswordToken.destroy({ where: { user_id }, force: true })
            await UserToken.destroy({ where: { user_id }, force: true })
            results = await User.destroy({
                where: {
                    id: user_id
                },
                force: true
            });
        } catch (err) {
            Error.payload = err.errors ? err.errors : err.message;
            throw new Error();
        }

        if (!results) {
            return false;
        }

        return results;

    }

    async updateBudtenderTodayGuestsLocationStatus() {
        console.log('UsersResource@updateBudtenderTodayGuestsLocationStatus');
        try {

            const users = await User.findAll({
                where: {
                    status: 'guest',
                    registered_from: 'budtender',
                },
                attributes: ['id'],
                raw: true
            });

            if(users.length > 0){

                let user_ids = _.map(users, 'id');
                if(user_ids.length > 0){
                    // update user location flags: before last 30 min budtender guests will be updated
                    await _UserLocationResource.updateMany({
                        user_id: user_ids,
                        [Op.and]: sequelize.literal(' DATE_ADD(updated_at, INTERVAL 30 MINUTE) < NOW()'),
                        [Op.or]: {
                            activity_status: 1,
                            in_store: 1
                        }
                    }, {
                        activity_status: 0,
                        in_store: 0,
                    })
                }
            }


        } catch (err) {
            Error.payload = err.errors ? err.errors : err.message;
            throw new Error();
        }

        return true;
    }

    async updateBudtenderUsersInStoreOnlineLocationStatus() {
        console.log('UsersResource@updateBudtenderUsersInStoreOnlineLocationStatus');
        try {
            let userLocations = await _UserLocationResource.getAllByParams({
                [Op.or]:{
                    in_store: 1,
                    activity_status: 1
                },
                [Op.and]: sequelize.literal(' DATE_ADD(last_activity, INTERVAL 5 MINUTE) < NOW()')
            });

            if(userLocations){
                let ids = _.map(userLocations, 'id');
                if(ids.length > 0) {
                    // update user location flags: In store
                    await _UserLocationResource.updateMany({id: ids}, {
                        in_store: 0,
                        activity_status: 0,
                    });

                    userLocations.forEach(userLocation => {
                        let emitData = {
                            id: userLocation.user_id,
                            first_name: userLocation.user.first_name,
                            last_name: userLocation.user.last_name,
                            email: userLocation.user.email,
                            phone: userLocation.user.phone,
                            status: userLocation.user.status,
                            email_verification_status: userLocation.user.email_verification_status,
                            dob: userLocation.user.dob,
                            created_at: userLocation.user.created_at,
                            updated_at: userLocation.user.updated_at,
                            activity_status: false,
                            last_seen: userLocation.last_seen,
                            last_activity: userLocation.last_activity,
                            in_store: false,
                            sms_notification: userLocation.user.sms_notification,
                            email_notification: userLocation.user.email_notification,
                            marketing_notification: userLocation.user.marketing_notification,
                            total_order_value: userLocation.user.total_order_value,
                            average_order_value: userLocation.user.average_order_value,
                            frequency_of_visits: userLocation.user.frequency_of_visits,
                        }

                        Pubnub.publishMessage(`${userLocation.location_id}-admin`, `user presence`, emitData, 'user_presence')
                    });

                }

            }

        } catch (err) {
            Error.payload = err.errors ? err.errors : err.message;
            throw new Error();
        }

        return true;
    }

    async updateUserLocationLastActivity(user_id, location_id) {
        console.log('UsersResource@updateUserLocationLastActivity');
        try {
            let userLocation = await _UserLocationResource.getByParams({
                user_id: user_id,
                location_id: location_id
            });

            if(userLocation){
                userLocation.activity_status = 1;
                userLocation.last_seen = Date();
                userLocation.last_activity = Date();
                userLocation.save();
            }
            else{
                await _UserLocationResource.createOne({
                    user_id: user_id,
                    location_id: location_id,
                    activity_status: 1,
                    last_seen: Date(),
                    last_activity: Date(),
                })
            }

        } catch (err) {
            Error.payload = err.errors ? err.errors : err.message;
            throw new Error();
        }

        return true;
    }
}