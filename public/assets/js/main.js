/*
  globals
 */
function showPreview(target) {
  var imageExtensions = ['gif','jpg','peg','iff','bmp'];
  if(imageExtensions.indexOf(target.substring((target.length-3),(target.length))) != -1){
    $('.preview-img').attr('src', target);
    $('.preview-container').show();
  }
}
function hidePreview() {
  $('.preview-img').attr('src', '');
  $('.preview-container').hide();
}

var scrollDisable = false;

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
      function checkin() {
        var checkinurl = 'stillHere?name='+encodeURI(App.User.get('name'))+'&color='+encodeURI(App.User.get('color'))+'&avatar='+encodeURI(App.User.get('avatar'))+'&title='+encodeURI(App.User.get('title'))+'&callback=?';
        $.getJSON(checkinurl, function(data){
          var current = JSON.stringify(usersCollection);
          var server = JSON.stringify(data);
          if(current != server) {
            usersCollection.set(data);
          }
        });
      }
      setInterval(checkin,1500);

      $.getJSON( "getMessages?callback=?", function( data ) {
        chatMessages.set(data);
      });

      if(user.get('wintitle')){
        document.title = user.get('wintitle');
      }

      var chatMessagesView = new App.Views.ChatMessages({ collection: chatMessages });
      var chatInputView = new App.Views.ChatInput({ collection: chatMessages });
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
      console.log(m);
    }
  });

  App.Collections.Users = Backbone.Collection.extend({
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
      color: '959da6',
      wintitle: 'Microsoft Outlook Web Access'
    },
    events : {
      'click .login-btn' : 'setLogin',
      'click .avatar' : 'editAvatar'
    },
    initialize: function () {
      if(this.checkCookie('color')){
        this.user.color = decodeURI(this.checkCookie('color')).replace('#','');
      }
      if(this.checkCookie('avatar')){
        this.user.avatar = decodeURI(this.checkCookie('avatar'));
      }
      if(this.checkCookie('title')){
        this.user.title = decodeURI(this.checkCookie('title'));
      }
      if(this.checkCookie('wintitle')){
        this.user.wintitle = decodeURI(this.checkCookie('wintitle'));
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
      this.user.color = $('.colorpicker_hex input').val();
      this.user.wintitle = $('.wintitle').val();
      this.setCookie('title',this.user.title,999);
      this.setCookie('avatar',this.user.avatar,999);
      this.setCookie('color',this.user.color,999);
      this.setCookie('wintitle',this.user.wintitle,999);
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
      var message = {
        type: 'logoff',
        data: {
          username: App.User.name
        }
      }
      pubnub.publish({
        channel : 'fuck_pubnub',
        message : message
      });
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

      var posWas;

      $('.messages').scroll(function(){
        var pos = $('.messages').scrollTop();
        if(pos < posWas) {
          if(!scrollDisable){
            scrollDisable = true;
            $('.popover').show().delay(1000).fadeOut();
          }
        }
        posWas = pos;
      });

    },
    addLine: function (message) {
      var messageView = new App.Views.Message({model: message});
      var message = $(messageView.render().el).attr('class','message-line');
      var lastMessage = $('.message-line').last()
      if(message.html() != lastMessage.html()){
        if($('.link-author', message).text() == $('.link-author', lastMessage).text()) {
          if($('.comment-entry', lastMessage).last().text() != $('.comment-entry', message).last().text())
          {
            $('.comment-entry', message).appendTo($('.comment-text', lastMessage));
            if(!scrollDisable) {
              $(this.$el).scrollTop($(this.$el)[0].scrollHeight);
            }
          }
        } else {
          $(this.$el).append(message);
          if(!scrollDisable) {
            $(this.$el).scrollTop($(this.$el)[0].scrollHeight);
          }
        }
      }
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
        scrollDisable = false;
        $(this.$el).scrollTop($(this.$el)[0].scrollHeight);
        var message = $('.input-text',this.$el).val();
        if (message != '') {
          message = this.filterMessage(message);
          if(message != false) {
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
    },
    filterMessage: function (message) {
      message = message.replace(/gay/g, "M@");
      if(message == '/tits'){
        this.getReddit('boobies');
        return false;
      }
      if(message == '/datass'){
        this.getReddit('ass');
        return false;
      }
      if(message == '/random'){
        this.getReddit('nsfw');
        return false;
      }
      if((message.toLowerCase().indexOf('http') != -1) || (message.toLowerCase().indexOf('www.') != -1)){
        var messageArray = message.split(' ');
        for(var i in messageArray) {
          if(messageArray[i].toLowerCase().substring(0,4) == 'http' || messageArray[i].toLowerCase().substring(0,4) == 'www') {
            messageArray[i] = '<a href="'+messageArray[i]+'" target="_blank" onmouseover="showPreview(this.href)" onmouseout="hidePreview()">'+messageArray[i]+'</a>';
          }
        }
        return messageArray.join(' ');
      } else {
        return message;
      }
    },
    getReddit: function (type) {
      var that = this;
      $.getJSON(
        "http://www.reddit.com/r/"+type+".json?limit=100&jsonp=?",
        function(data)
        {
          var nodes = data.data.children;
          var selected = Math.round(Math.random() * (100));
          var node = nodes[selected].data;
          for(var i=0;i<5;i++){
            if(node.domain == 'i.imgur.com'){
              var time = (new Date).getTime();
              var newLine = new App.Models.Message({
                avatar: App.User.get('avatar'),
                sender: App.User.get('name'),
                color: App.User.get('color'),
                recipient: 'all',
                time: time,
                text: '<a href="'+node.url+'" target="_blank" onmouseover="showPreview(this.href)" onmouseout="hidePreview()">'+type+'! NSFW</a>'
              })
              that.collection.add(newLine);
              break;
            } else {
              node = nodes[Math.round(Math.random() * (100))].data;
            }
          }
        }
      )
    }
  });

  new App.start();
});