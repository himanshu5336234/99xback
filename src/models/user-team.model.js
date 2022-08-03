const mongoose = require('mongoose');
const { toJSON } = require('./plugins');
const { SITES } = require("../constants");

const userTeamSchema = mongoose.Schema(
  {
    site_id:{
        type: Number,
        enum: Object.values(SITES),
        default: SITES.X99_STARTUP
    },
    owner: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    team_name:{
        type: String
    },
    team_type:{
        type: String,
        enum:['BUYER','SELLER'],
        default:'BUYER'
    },
    members:[
        {
            user:{
                type: mongoose.SchemaTypes.ObjectId, 
                ref: 'User',
                required: true
            },
            team_role:{
                type: Number, 
                default: 4 //  1 - Owner and Admin, 2 - Admin, 3 - Normal Members, 4 - Guest
            },
            role:[
                {
                    type: String
                }
            ],
            is_active:{
                type: Boolean, 
                default: false,
            },
            is_confirmed:{
                type: Boolean, 
                default: false
            }
        }
    ]
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userTeamSchema.plugin(toJSON);

/**
 * @typedef UserTeam
 */
const UserTeam = mongoose.model('UserTeam', userTeamSchema);
module.exports = UserTeam;
