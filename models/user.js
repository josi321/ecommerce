var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs'); // bcrypt is a library to hash passwords before going to db, prevents us from storing the clear text of the password. its for security
var crypto = require('crypto'); // this is to make sure theres different/random profile pic for each user?
var Schema = mongoose.Schema;


/* The user schema attributes/characteristics/fields */
var UserSchema = new mongoose.Schema({
  email: {type: String, unique: true, lowercase: true},
  password: String,
  profile: {
    name: {type: String, default: ''},
    picture: {type: String, default: ''}
  },

  address: String,
  history: [{
    paid: { type: Number, default: 0},
    item: { type: Schema.Types.ObjectId, ref: 'Product'}
  }]
  });


/* Hash the password before we save it to the database */
UserSchema.pre('save', function(next){
  var user = this; // 'this' is refering to UserSchema
  if (!user.isModified('password')) return next();
  bcrypt.genSalt(10, function(err, salt){
    if (err) return next(err);
    bcrypt.hash(user.password, salt, null, function(err, hash){
      if(err) return next(err);
      user.password = hash;
      next();
    });
  });
})

/* Compare password in the database and the password the user typed in*/

UserSchema.methods.comparePassword = function(password){
  return bcrypt.compareSync(password, this.password); //password is the password user types in, and this.password is the password in the db or in line 8
}

//add profile picture
UserSchema.methods.gravatar = function(size){
  if(!this.size) size =200;
  if(!this.email) return 'https://gravatar.com/avatar/?s' + size + '&d=retro';
  var md5 = crypto.createHash('md5').update(this.email).digest('hex'); // crypto is a library
  return 'https://gravatar.com/avatar/' + md5 +'?s=' + size + '&d=retro';
}

/*export this user.js file to mongolab db*/
module.exports = mongoose.model('User', UserSchema);
