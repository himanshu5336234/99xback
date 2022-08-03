const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const teamInviteSchema = mongoose.Schema(
  {
    from: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    to:{
        user:{
            type: mongoose.SchemaType.ObjectId, 
            ref: 'User'
        },
        email:{
            type: String, 
            required: true
        },
        is_user_exists:{
            type: Boolean,
            default: false
        }
    },
    team:{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'UserTeam'
    },
    invite_code:{
        type: String, 
        required: true
    },
    invite_status:{
        type: String, 
        enum:['SENT','REJECTED','ACCEPTED'],
        default: 'SENT'
    }
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
teamInviteSchema.plugin(toJSON);

/**
 * @typedef UserConfig
 */
const UserConfig = mongoose.model('TeamInvite', teamInviteSchema);

module.exports = UserConfig;
