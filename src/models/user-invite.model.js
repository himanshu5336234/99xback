const mongoose = require('mongoose');
const validator = require('validator');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');
const { uuid } = require('@supercharge/strings/dist');

const userInviteSchema = mongoose.Schema(
    {
        inviter:{
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref:'User'
        },
        inviter_mode:{
            type: String, 
            enum:['BUYER','SELLER'],
            default:'BUYER'
        },
        email:{
            type: String, 
            required: true
        },
        team_id:{
            type: mongoose.Schema.Types.ObjectId,
            ref:'UserTeam'
        },
        status:{
            type: String,
            enum:[
                'PENDING',
                'ACCEPTED',
                'REJECTED',
                'EXPIRED'
            ],
            default:'PENDING'
        }
    },
    {
        timestamps: true
    }
)

userInviteSchema.plugin(toJSON)
userInviteSchema.plugin(paginate)

const userInvite = mongoose.model('UserInvite', userInviteSchema)
module.exports = userInvite
