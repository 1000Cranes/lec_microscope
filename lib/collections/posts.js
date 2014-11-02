Posts = new Mongo.Collection('posts');

Posts.allow({
  update: function(userId, post) { return ownsDocument(userId, post); },
  remove: function(userId, post) { return ownsDocument(userId, post); },
});

Posts.deny({
  update: function(userId, post, fieldNames) {
    // may only edit the following two fields:
    return (_.without(fieldNames, 'url', 'title').length > 0);
  }
});

Meteor.methods({
  postInsert: function(postAttributes) {
    check(Meteor.userId(), String);
    check(postAttributes, {
      title: String,
      url: String
    });
    
    var postWithSameLink = Posts.findOne({url: postAttributes.url});
    if (postWithSameLink) {
      return {
        postExists: true,
        _id: postWithSameLink._id
      }
    }
    
    var user = Meteor.user();
    var post = _.extend(postAttributes, {
      userId: user._id, 
      author: user.username, 
      submitted: new Date()
    });
    var postId = Posts.insert(post);
    return {
      _id: postId
    };
  },
  postEdit: function(postProperties){
    check(Meteor.userId(), String);
    check(postProperties, {
      currentPostId: String,
      title: String,
      url: String
    });
    
    var postWithSameLink = Posts.findOne({url: postProperties.url});
    if (postWithSameLink && (postWithSameLink._id != postProperties.currentPostId)) {
      return {
        URLChanged: true,
        _id: postWithSameLink._id
      }
    }
    
    var post = {
      url: postProperties.url,
      title: postProperties.title
    };
    
    Posts.update(postProperties.currentPostId, {$set: post});
    return {
       _id: postProperties.currentPostId
    }
  }
});