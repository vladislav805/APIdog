/**
 * APIdog v6.5
 *
 * upd: -1
 */

var Likes = {

	// deprecated 09.01.2016
	Like: function(elem, type, ownerId, itemId, accessKey, fx) {
		Site.API("execute", {
			code: 'var p={type:"%t",item_id:%i,owner_id:%o,access_key:"%a"},me=API.likes.isLiked(p),act;act=me==0?API.likes.add(p):API.likes.delete(p);return[(-me)+1,act.likes,API.likes.getList(p+{filter:"copies"}).count];'
					.replace(/%o/ig, ownerId)
					.replace(/%i/ig, itemId)
					.replace(/%t/ig, type)
					.replace(/%a/ig, accessKey || "")
		}, function(result) {
			data = Site.isResponse(result);
			var e = $.element("like_" + type + "_" + ownerId + "_" + itemId);
			$.elements.clearChild(e);
			e.appendChild(Wall.LikeButton(type, ownerId, itemId, {
				count: data[1],
				user_likes: data[0]
			}, {
				count:data[2]
			}));

			if (fx) {
				fx({
					type: type,
					owner_id: ownerId,
					item_id: itemId,
					access_key: accessKey,
					likes: {
						user_likes: data[0],
						count: data[1]
					},
					reposts: {
						count: data[2]
					}
				});
			};

			window.onLikedItem && window.onLikedItem({
				type: type,
				ownerId: ownerId,
				itemId: itemId,
				likes: data[1],
				isLiked: data[0]
			});
		});
	},

    // deprecated 11.03.2016
	getLikers: function(type, owner_id, item_id, access_key, fx, filter) {
		var obj = {type: type, owner_id: owner_id, item_id: item_id, access_key: access_key, filter: filter ? filter : "likes"};
		Site.API("likes.getList", obj, function(data) {
			fx(Site.isResponse(data), obj);
		});
	}
};