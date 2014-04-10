/*
  globals
 */
$.ajaxSetup({ cache: false });
function showPreview(target, type) {
  mouseoff = false;
  if(previewEnable.toString() == 'false' && type == 'nsfw'){
    $('.preview-img').attr('src', 'assets/images/150px-Bawwwww_bunny.jpg');
    $('.preview-container').show();
  } else {
    var imageExtensions = ['gif','jpg','png','iff','bmp','peg'];
    if(imageExtensions.indexOf(target.substring((target.length-3),(target.length))) != -1){
      if($('#enableSafePreview').prop('checked')){
        getSafePreview(target);
      } else {
        $('.preview-img').attr('src',target);
        $('.preview-container').show();
      }
    }
  }
}
function getSafePreview(src) {
  $.getJSON(
      "/sp?callback=?&quoteID="+encodeURIComponent(B64.encode(src)),
      function (data) {
        if(data.error) {
          alert('something fucked up.');
          alert(data.error);
        } else if (data.ix) {
          if(mouseoff == false){
            $('.preview-img').attr('src', B64.decode(data.ix));
            $('.preview-container').show();
          }
        }
      }
  );
}
function hidePreview() {
  mouseoff = true;
  $('.preview-img').attr('src', '');
  $('.preview-container').hide();
}

var time = new Date().getTime();
//sync everyone's timestamps
function getServerTime() {
  $.ajax({
    type: "HEAD",
    url: '/',
    success: function(data, status, xhr) {
      time = new Date(xhr.getResponseHeader('Date')).getTime();
    },
    async: false
  });
}

function sendMessage(message){
  $.post('/messages',message).done(function(d){console.log(d)});
}

var messageCounter = 0;
var scrollEnable = true;
var previewEnable = true;
var mouseoff = true;

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
      setInterval(checkin,1000);

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
      if(m.command == 'reload') {
        location.reload();
      }
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
      this.user.title = $('.title').val().substring(0,21);
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
      setInterval(this.getMessages, 2000);
    },
    getMessages: function () {
      var endpoint = '/catchUp?lastID=' + messageCounter;
      $.getJSON(endpoint,function(data) {
        console.log(data);
        if(data.messages && data.messages.length > 0){
          for(var i in data.messages){
            var msg = new App.Models.Message(data.messages[i]);
            var messageView = new App.Views.Message({model: msg});
            var message = $(messageView.render().el).attr('class','message-line');
          }
          var last = data.messages.pop();
          messageCounter = last.msgID;
        }
      });
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
      var message = $(messageView.render().el).attr('class','message-line');
      var lastMessage = $('.message-line').last()
      if(message.html() != lastMessage.html()){
        if($('.link-author', message).text() == $('.link-author', lastMessage).text()) {
          if($('.comment-entry', lastMessage).last().text() != $('.comment-entry', message).last().text())
          {
            $('.comment-entry', message).appendTo($('.comment-text', lastMessage));
            if(scrollEnable) {
              $(this.$el).scrollTop($(this.$el)[0].scrollHeight);
            }
          }
        } else {
          $(this.$el).append(message);
          if(scrollEnable) {
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
      'keyup .input-text' : 'sendChat',
      'change #enableScroll' : 'toggleAutoscroll',
      'change #enableNSFW' : 'togglePreview'
    },
    initialize: function () {
      this.render();
    },
    render: function () {
      var source   = $("#chatinput").html();
      var template = Handlebars.compile(source);
      this.$el.html(template());
    },
    toggleAutoscroll: function (e) {
      scrollEnable = $(e.target).prop('checked');
    },
    togglePreview: function (e) {
      previewEnable = $(e.target).prop('checked');
    },
    sendChat: function (e) {
      if (e.keyCode == 13 || e.type == 'click'){
        getServerTime();
        $(this.$el).scrollTop($(this.$el)[0].scrollHeight);
        var message = $('.input-text',this.$el).val();
        if (message != '') {
          message = this.filterMessage(message);
          if(message != false) {
            var line = {
              avatar: App.User.get('avatar'),
              sender: App.User.get('name'),
              color: App.User.get('color'),
              recipient: 'all',
              time: time,
              text: message
            }
            var newLine = new App.Models.Message(line);
            this.collection.add(newLine);
            sendMessage(line);
          }
          $('.input-text',this.$el).val('');
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
      if(message == '/gonewild'){
        this.getReddit('gonewild');
        return false;
      }
      if(message.substring(0,4) == '/me '){
        this.sendMe(message);
        return false;
      }
      if((message.toLowerCase().indexOf('http') != -1) || (message.toLowerCase().indexOf('www.') != -1)){
        var messageArray = message.split(' ');
        var flag = '';
        if(messageArray.indexOf('nsfw') != -1 || messageArray.indexOf('NSFW') != -1){
          flag = 'nsfw';
        }
        for(var i in messageArray) {
          if(messageArray[i].toLowerCase().substring(0,4) == 'http' || messageArray[i].toLowerCase().substring(0,4) == 'www') {
            messageArray[i] = '<a href="'+messageArray[i]+'" target="_blank" onmouseover="showPreview(this.href,\''+flag+'\')" onmouseout="hidePreview()">'+messageArray[i]+' <img src="assets/images/camera.png"/></a>';
          }
        }
        return messageArray.join(' ');
      } else {
        return message;
      }
    },
    sendMe: function (message) {
      var that = this;
      var line = {
        avatar: App.User.get('avatar'),
        sender: App.User.get('name') + message.substring(3),
        color: App.User.get('color'),
        recipient: 'all',
        time: time
      }
      var newLine = new App.Models.Message(line);
      that.collection.add(newLine);
      sendMessage(line);
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
              var line = {
                avatar: App.User.get('avatar'),
                sender: App.User.get('name'),
                color: App.User.get('color'),
                recipient: 'all',
                time: time,
                text: '<a href="'+node.url+'" target="_blank" onmouseover="showPreview(this.href,\'nsfw\')" onmouseout="hidePreview()">'+type+'! NSFW <img src="assets/images/camera.png"/></a>'
              }
              var newLine = new App.Models.Message(line);
              that.collection.add(newLine);
              sendMessage(line);
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