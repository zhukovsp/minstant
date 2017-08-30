Meteor.subscribe("userData");
Meteor.subscribe("chats");

Router.configure({
  layoutTemplate: 'ApplicationLayout'
});

Router.route('/', function () {
  this.render("mainbox", {to:"main"});  
  this.render("chat_page_start", {to:"schat"});  
});

Router.route('/chat/:_id', function () {
  if (Meteor.userId()){
    var otherUserId = this.params._id;
    var filter = {$or:
                    [
                      {user1Id:Meteor.userId(), user2Id:otherUserId}, 
                      {user2Id:Meteor.userId(), user1Id:otherUserId}
                    ]
                  };
    var chat = Chats.findOne(filter);

    if (!chat){// no chat matching the filter - need to insert a new one
      chatId = Meteor.call("addChat", otherUserId,function(){
        Session.set("chatId",chatId);
      });


      //chatId = Chats.insert({user1Id:Meteor.userId(), user2Id:otherUserId});
    }
    else {// there is a chat going already - use that. 
      chatId = chat._id;
      Session.set("chatId",chatId);
    }  
    this.render("mainbox", {to:"main"});  
    this.render("chat_page", {to:"schat"});
  }
  else
  {
    Router.go('/');
    $(".nochat").effect("shake");
  }
});

///
// helper functions 
/// 
Template.available_user_list.helpers({
  users:function(){
    return Meteor.users.find();
  }
})
Template.available_user.helpers({
  getUsername:function(userId){
    user = Meteor.users.findOne({_id:userId});
    return user.profile.username;
  }, 
  isNotMyUser:function(userId){
    if (userId == Meteor.userId()){
      return false;
    }
    else {
      return true;
    }
  },
  getlastMessage:function(userId){
    var lastMsg = "no messages yet...";
    if (Meteor.userId()){
      var filter = {$or:
                      [
                        {user1Id:Meteor.userId(), user2Id:userId}, 
                        {user2Id:Meteor.userId(), user1Id:userId}
                      ]
                    };
      chat = Chats.findOne(filter);
      if (chat){
        msgArray = Chats.findOne( {"_id": chat._id}).messages;
        if (msgArray){
          lastMsg = msgArray.pop().text.trim();
          if (lastMsg.length > 39){
            lastMsg = lastMsg.replace(/(\r\n|\n|\r)/gm, ' ') + "...";
          }
        }
      }
    }
    else{
      lastMsg = "Please sign in to chat"
    }
    return lastMsg;
  } 
})

Template.chat_page.rendered = function (){
  $(document).ready(function(){
    $('.emojiable-question').emojiPicker({
      width: '300px',
      height: '185px',
      button: false
    });
    //scroll messagin window to bottom
    $('.msg-wrap').animate(
      {scrollTop: $('.msg-wrap')[0].scrollHeight}
      , 2000
    );
    // hide emoticons window
    $(document).mouseup(function (e)
    {
        var container = $(".emojiPicker");
        var container2 = $(".js-emoji-toggle");

        if (
          (!container.is(e.target) && container.has(e.target).length === 0)
          &&
          (!container2.is(e.target) && container2.has(e.target).length === 0)

        ) // ... nor a descendant of the container
        {
            container.hide();
        }
    });
  }); 




    
}
Template.mainbox.rendered = function (){
  $(document).ready(function(){
   /* divH = $(".message-wrap").height();
    divW = $(".conversation-wrap.col-lg-3").width() + $(".message-wrap.col-lg-8").width();
    console.log("H="+divH+",W="+divW);
    $(".boxwrapper").height(divH);
    $(".boxwrapper").width(divW);*/
  }); 
}

Template.chat_page.helpers({
  messages:function(){
    var chat = Chats.findOne({_id:Session.get("chatId")});
    return chat.messages;
  },
  other_user:function(){
    var chat = Chats.findOne({_id:Session.get("chatId")});
    var otherUserId;
    if (Meteor.userId() == chat.user1Id){
      otherUserId = chat.user2Id;
    }
    else {
      otherUserId = chat.user1Id;
    }
    var other_user = Meteor.users.findOne({_id:otherUserId});
    return other_user.profile;
  }, 
  getDate:function(date){
    return moment(date).format('MM-DD-YYYY hh:mm');
  },
  getUserName:function(userId){
    user1 = Meteor.users.findOne({_id:userId});
    return user1.profile.username;
  },
  getUserAvatar:function(userId){
    user1 = Meteor.users.findOne({_id:userId});
    return user1.profile.avatar;
  },
  getText:function(text){
    str = text.replace(/(\r\n|\n|\r)/gm, '<br>');
    return str;
  }
})
Template.chat_page_start.helpers({
  curUser:function(){
    user1 = Meteor.users.findOne({_id:Meteor.userId()});
    return user1.profile;
  }
})
Template.chat_page.events({
  // this event fires when the user sends a message on the chat page
  'submit .js-send-chat':function(event){
    event.preventDefault();
    if(event.target.chat.value !== ""){
      // see if we can find a chat object in the database
      // to which we'll add the message
      var chat = Chats.findOne({_id:Session.get("chatId")});
      if (chat){// ok - we have a chat to use
        var msgs = chat.messages; // pull the messages property
        if (!msgs){// no messages yet, create a new array
          msgs = [];
        }
        // is a good idea to insert data straight from the form
        // (i.e. the user) into the database?? certainly not. 
        // push adds the message to the end of the array
        var msgtext = emojione.toShort(event.target.chat.value);

        msgs.push({text: msgtext,userBy:Meteor.userId(), sentOn: new Date()} );

        // reset the form
        event.target.chat.value = "";
        // put the messages array onto the chat object
        chat.messages = msgs;
        // update the chat object in the database.
        //Chats.update(chat._id, chat);
        Meteor.call("updChat", chat._id, chat);
        //UpdChat
        //scroll chat window to bottom
        $('.msg-wrap').animate(
          {scrollTop: $('.msg-wrap')[0].scrollHeight}
          , 2000
        );
      }
    }
  },
  'click .js-emoji-toggle':function(event){
    event.preventDefault();
    $('#question').emojiPicker('toggle');
  }
})