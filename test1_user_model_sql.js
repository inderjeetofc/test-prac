'use strict';
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const CONFIG = require('../../../config/v1/config');

module.exports = class User extends Sequelize.Model {
    static init(sequelize, DataTypes) {
        return super.init({
            id: {
                type: DataTypes.UUID,
                allowNull: false,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
            },
            first_name: {
                type: DataTypes.STRING(255),
            },
            last_name: {
                type: DataTypes.STRING(255),
            },
            email: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            province: {
                type: DataTypes.STRING(255),
            },
            dob: {
                type: DataTypes.DATE,
                required: true,
            },
            phone: {
                type: DataTypes.STRING(255),
                defaultValue: null
            },
            password: {
                type: DataTypes.STRING(255),
                allowNull: true
            },
            favourite_locations: {
                type: DataTypes.STRING(255)
            },
            favourite_products: {
                type: DataTypes.STRING(255)
            },
            sms_notification: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            email_notification: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            marketing_notification: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            notification_updates: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            active: {
                type: DataTypes.BOOLEAN,
            },
            average_order_value: {
                type: DataTypes.DOUBLE(11, 2),
                defaultValue: 0,
            },
            total_order_value: {
                type: DataTypes.DOUBLE(11, 2),
                defaultValue: 0,
            },
            frequency_of_visits: {
                type: DataTypes.DOUBLE(11, 2),
                defaultValue: 0,
            },
            status: {
                type: DataTypes.ENUM('registered', 'verified', 'banned', 'guest'),
            },
            email_verification_status: {
                type: DataTypes.BOOLEAN,
            },
            phone_verification_status: {
                type: DataTypes.BOOLEAN,
            },
            registered_from: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: 'budler',
            },
            registered_by: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'user',
            },
            registered_by_id: {
                type: DataTypes.UUID,
                allowNull: true
            },
            created_at: {
                allowNull: false,
                type: DataTypes.DATE,
            },
            updated_at: {
                allowNull: false,
                type: DataTypes.DATE,
            },
            deleted_at: {
                type: DataTypes.DATE,
            }
        }, {
            modelName: 'User',
            tableName: 'users',
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            underscored: true,
            paranoid: true,
            timestamps: true,
            sequelize,
        })
    }

    static associate(models) {
        this.relationship = this.hasMany(models.UserUpdateTokens, {
            as: 'user_update_tokens',
            foreignKey: 'user_id',
        })

        this.beforeCreate(async function (user, options) {
            if (user.status != 'guest' && (user.password && user.password.trim().length > 0)) {
                let enc_password = await user.hashPassword(user.password);
                user.password = enc_password;
            }
        });

        this.prototype.toJSON = function () {
            var user = Object.assign({}, this.get());
            delete user.password;
            return user;
        }

        this.prototype.hashPassword = async function (password) {
            try {
                let hashedPassword = await bcrypt.hash(password, 10);
                if (!hashedPassword) {
                    throw Error('error saving user')
                }
                return hashedPassword
            } catch (err) {
                throw Error('error saving user')
            }
        }

        this.verifyLogin = async function (email, password) {
            let User = this;
            try {
                let user = await User.findOne({
                    where: {
                        email: email,
                        status: {
                            [Op.ne]: 'guest'
                        }
                    }
                })

                if (!user) {
                    return false
                }

                let validUser = await user.validatePassword(password);

                if (!validUser) {
                    return false
                }
                return user;
            } catch (err) {
                throw Error('Something went wrong please try again.')
            }
        }

        this.verifyLoginByEmail = async function (email) {
            let User = this;
            try {
                let user = await User.findOne({
                    where: {
                        email: email,
                        status: {
                            [Op.ne]: 'guest'
                        }
                    }
                })

                if (!user) {
                    return false
                }

                return user;
            } catch (err) {
                throw Error('Something went wrong please try again.')
            }
        }

        this.verifyLoginByPhone = async function (phone) {
            let User = this;
            try {
                let user = await User.findOne({
                    where: {
                        phone: phone,
                        status: {
                            [Op.ne]: 'guest'
                        }
                    }
                })

                if (!user) {
                    return false
                }

                return user;
            } catch (err) {
                throw Error('Something went wrong please try again.')
            }
        }

        this.prototype.validatePassword = async function (password) {
            let user = this;

            try {
                let passwordCheck = await bcrypt.compare(password, user.password);
                if (!passwordCheck) {
                    return false;
                };
                return true;
            } catch (err) {
                console.log(err)
                throw Error('Something went wrong please try again.')
            }
        }

        this.prototype.generateToken = async function () {
            let user = this;
            try {
                let token = jwt.sign({
                    user_id: user.id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                }, CONFIG.jwt_encryption, {
                    expiresIn: CONFIG.jwt_expiration
                });
                return token;
            } catch (err) {
                throw Error(err)
            }
        }
    }
}