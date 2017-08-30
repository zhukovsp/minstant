// methods that provide write access to the data
Meteor.methods({
	addChat:function(otherUserId){
		var id = Chats.insert({"user1Id":this.userId, "user2Id":otherUserId});
		return id;
	},
	updChat:function(id, chat){
		Chats.update(id, chat);
	}
})