$(function (){
  /*-------------Application----------*/
  var App = {
    Models: {},
    Collections: {},
    Views: {},
    User: {},
    start: function () {
      var loginModalView = new App.Views.LoginModal();
    },
    login: function (user) {
      App.User = user;
      var chatMessagesView = new App.Views.ChatMessages({ collection: chatMessages });
      var chatInputView = new App.Views.ChatInput({ collection: chatMessages });
      $.getJSON('getUsers?callback=?', function(users) {
        usersCollection.set(users);
        var dupe = usersCollection.where({ name: user.get('name') });
        if(dupe.length > 0) {
          var message = {
            type: 'update',
            data: {
              username: App.User.name,
              userobject: App.User
            }
          }
          pubnub.publish({
            channel : 'fuck_pubnub',
            message : message
          });
        } else {
          usersCollection.add(user);
        }
      });
      $.getJSON('getMessages?callback=?', function(messages) {
        chatMessages.set(messages);
      });
      var userslistView = new App.Views.UsersList({ collection: usersCollection });
    }
  };

  /*-------------Models --------------*/
  App.Models.User = Backbone.Model.extend({});
  App.Models.Message = Backbone.Model.extend({});

  /*------------Collections-----------*/
  var uuid = PUBNUB.uuid();

  var pubnub = PUBNUB.init({
    publish_key: 'pub-c-94687441-ef61-4ff5-a0eb-c852642a769a',
    subscribe_key: 'sub-c-e3c8bbee-926d-11e3-9979-02ee2ddab7fe',
    ssl: true,
    uuid: uuid
  });

  pubnub.subscribe({
    channel : 'fuck_pubnub',
    message : function(m){
      switch(m.type){
        case 'update':
          var userobject = m.data.userobject;
          var target = usersCollection.where({ name: userobject.name });
          if(target.length > 0) {
            $.each(target, function(k,v){
              console.log(v);
              v.set(userobject);
            })
          }
          break;
        case 'logoff':
          var target = usersCollection.where({ name: m.data.username });
          target[0].destroy();
          break;
      }
    }
  });

  App.Collections.Users = Backbone.PubNub.Collection.extend({
    name: 'UsersCollection',
    pubnub: pubnub,
    model: App.Models.User
  });

  App.Collections.Messages = Backbone.PubNub.Collection.extend({
    name: 'MessagesCollection',
    pubnub: pubnub,
    model: App.Models.Message
  });

  var usersCollection = new App.Collections.Users();
  var chatMessages = new App.Collections.Messages();

  /*------------Views----------------*/
  App.Views.LoginModal = Backbone.View.extend({
    el: '.login-modal',
    username: 'input.username',
    password: 'input.password',
    avatarSelector: '.avatar',
    colorSelector: '.color',
    user: {
      name: 'HowTheFuckDidYouBypassLogin?',
      title: 'Giant Faggot',
      avatar: 'assets/images/avatar_placeholder.jpg',
      color: '#959da6',
      status: 'offline'
    },
    events : {
      'click .login-btn' : 'setLogin',
      'click .avatar' : 'editAvatar'
    },
    initialize: function () {
      if(this.checkCookie('color')){
        this.user.color = urlDecode(this.checkCookie('color'));
      }
      if(this.checkCookie('avatar')){
        this.user.avatar = urlDecode(this.checkCookie('avatar'));
      }
      if(this.checkCookie('title')){
        this.user.title = urlDecode(this.checkCookie('title'));
      }
      if (this.checkCookie('newchatcookie')) {
        this.login();
      } else {
        this.render();
      }
    },
    render: function () {
      var source   = $("#login-modal").html();
      var template = Handlebars.compile(source);
      this.$el.html(template(this.user));
      $('#myModal',this.$el).modal({backdrop: 'static', keyboard: false});
      $('#color').ColorPicker({flat: true, color: this.user.color});

    },
    editAvatar: function () {
      var avatarURL = prompt('Enter the URL for your avatar',this.user.avatar);
      this.user.avatar = avatarURL;
      $(this.avatarSelector + ' img', this.el).attr('src',this.user.avatar);
    },
    setLogin: function () {
      this.user.title = $('.title').val();
      this.user.color = '#'+$('.colorpicker_hex input').val();
      this.setCookie('title',this.user.title,999);
      this.setCookie('avatar',this.user.avatar,999);
      this.setCookie('color',this.user.color,999);
      this.setCookie('newchatcookie','true',999);
      this.login();
    },
    login: function () {
      //lol. meh, only wook will understand this and he's admin anyway. not sure wtf some names get 7 À appended from haichat.
      //TODO: use real logins instead of hijacking blab chat.
      function getURLParameter(name) {
        return decodeURI(
            (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
        );
      }
      this.user.name = B64.decode(getURLParameter('hn')).replace('7 À','');
      var currentUser = new App.Models.User(this.user);
      App.login(currentUser);
      this.remove();
    },
    checkCookie: function (name) {
      var results = document.cookie.match ( '(^|;) ?' + name + '=([^;]*)(;|$)' );
      if (results) {
        return(results[2]);
      } else {
        return null;
      }
    },
    setCookie: function (cname, cvalue, exdays) {
      var d = new Date();
      d.setTime(d.getTime()+(exdays*24*60*60*1000));
      var expires = "expires="+d.toGMTString();
      document.cookie = encodeURI(cname) + "=" + encodeURI(cvalue) + "; " + expires;
    }
  });

  App.Views.UsersList = Backbone.View.extend({
    el: '.userslist',
    initialize: function () {
      this.listenTo(this.collection, "change reset add remove", this.render);
      this.render();
    },
    render: function() {
      var thisView = this;
      $(thisView.$el).empty();
      this.collection.each( function(user) {
        var userView = new App.Views.User({model: user});
        $(thisView.$el).append(userView.render().el);
      });
      return this;
    }
  });

  App.Views.User = Backbone.View.extend({
    events : {
      'click .widget_profile_top' : 'updateProfile'
    },
    attributes : function () {
      return {
        username : this.model.get('name')
      };
    },
    render: function () {
      var source   = $("#usercard").html();
      var template = Handlebars.compile(source);
      this.$el.html(template(this.model.toJSON()));
      return this;
    },
    updateProfile: function () {
      document.cookie = 'newchatcookie=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      location.reload();
    }
  });

  App.Views.ChatMessages = Backbone.View.extend({
    el: '.messages',
    initialize: function () {
      this.listenTo(this.collection, "change reset remove", this.render);
      this.listenTo(this.collection, "add", this.addLine);
      this.render();
    },
    render: function () {
      var thisView = this;
      $(thisView.$el).empty();
      this.collection.each( function(message) {
        thisView.addLine(message);
      });
    },
    addLine: function (message) {
      var messageView = new App.Views.Message({model: message});
      $(this.$el).append(messageView.render().el);
      $(this.$el).scrollTop($(this.$el)[0].scrollHeight);
    }
  });

  App.Views.Message = Backbone.View.extend({
    render: function () {
      var thisView = this;
      var source   = $("#chatline").html();
      var template = Handlebars.compile(source);
      this.$el.html(template(thisView.model.toJSON()));
      return this;
    }
  });

  App.Views.ChatInput = Backbone.View.extend({
    el: '.chat-input',
    events : {
      'click .send' : 'sendChat',
      'keyup .input-text' : 'sendChat'
    },
    initialize: function () {
      this.render();
    },
    render: function () {
      var source   = $("#chatinput").html();
      var template = Handlebars.compile(source);
      this.$el.html(template());
    },
    sendChat: function (e) {
      if (e.keyCode == 13 || e.type == 'click'){
        var message = $('.input-text',this.$el).val();
        if (message != '') {
          var time = (new Date).getTime();
          var newLine = new App.Models.Message({
            avatar: App.User.get('avatar'),
            sender: App.User.get('name'),
            color: App.User.get('color'),
            recipient: 'all',
            time: time,
            text: message
          })
          this.collection.add(newLine);
          $('.input-text',this.$el).val('');
        }
      }
    }
  });

  new App.start();
});