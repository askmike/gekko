var _ = require('lodash');
var Moment = require('moment');
var Ranger = require('ranger');

var config = require('../core/util').getConfig().campfire;

var Actor = function() {
  _.bindAll(this);

  this.commands = [{
    'handler': 'advice',
    'callback': this.sayAdvice,
    'description': "Advice on what position to take, depending on the current trend"
  }, {
    'handler': 'price',
    'callback': this.sayPrice,
    'description': "The current price of the asset in the configured currency"
  }, {
    'handler': 'donate',
    'callback': this.sayDonate,
    'description': "Where to send all of that extra coin that's weighing you down"
  }, {
    'handler': 'help',
    'callback': this.sayHelp,
    'description': "You are here"
  }];

  this.advice = null;
  this.adviceTime = Moment.utc();
  this.price = null;
  this.priceTime = Moment.utc();

  this.client = Ranger.createClient(config.account, config.apiKey);
  this.client.room(config.roomId, this.joinRoom);
};

Actor.prototype = {
  processTrade: function(trade) {
    this.price = trade.price;
    this.priceTime = Moment.unix(trade.date);
  },

  processAdvice: function(advice) {
    this.advice = advice.recommandation;
    this.adviceTime = Moment.utc();

    if (config.emitUpdates) {
      this.sayAdvice();
    }
  },

  sayAdvice: function() {
    var message;

    if (this.advice !== null) {
      message = ["We think you should", this.advice + ".", "(" + this.adviceTime.fromNow() + ")"];
    } else {
      message = ["We don't have any advice for you quite yet."];
    }

    this.room.speak(message.join(' '));
  },

  sayPrice: function() {
    var message;

    if (this.price !== null) {
      message = ["The price at the moment is", this.price + ".", "(" + this.priceTime.fromNow() + ")"];
    } else {
      message = ["We don't know the price right now."];
    }

    this.room.speak(message.join(' '));
  },

  sayDonation: function() {
    this.room.speak("If you'd like to donate a few coins, you can send them here: 13r1jyivitShUiv9FJvjLH7Nh1ZZptumwW");
  },

  sayHelp: function() {
    this.room.speak("I listen for the following inquiries...", this.pasteDescriptions);
  },

  pasteDescriptions: function() {
    var descriptions = _.map(this.commands, function(command) {
      return [command.handler + ':', command.description].join(' ');
    }, this).join('\n');

    this.room.paste(descriptions);
  },

  joinRoom: function(room) {
    this.room = room;
    this.room.join(this.listenForCommands);
  },

  listenForCommands: function() {
    this.room.listen(this.executeCommands);
  },

  executeCommands: function(message) {
    var nickname = new RegExp(config.nickname, 'i'), handler;

    _.each(this.commands, function(command) {
      handler = new RegExp(command.handler, 'i');

      if (message.body.match(nickname) && message.body.match(handler)) {
        command.callback();
      }
    }, this);
  }
};

module.exports = Actor;
