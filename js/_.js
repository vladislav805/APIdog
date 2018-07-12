var API = {
	userId: 1,
	bitmask: 1,
	language: 0,
	themeId: 0,
	authKey: "1",
	authId: 1,
	date: 1505504624,
	applicationId: 1,
	accessToken: "1",
	salt: null,
	theme: null,
	languageBuild: 1506798466,
	ad: {
		menu: [],
		feed: []
	}
};

var Sugar = {
	Object: {
		forEach: function(array, callback) {},
		toQueryString: function(obj) {}
	}
};

Date.prototype.relative = function() {};

/**
 * @type {{
 *  owner_id: int,
 *  from_id: int,
 *  to_id: int.
 *  source_id: int,
 *  id: int,
 *  post_id: int,
 *  type: string,
 *  post_type: string,
 *  text: string,
 *  date: int,
 *  attachments: Attachment[],
 *  post_source: PostSource,
 *  copy_history: Post[]=,
 *  signer_id: int,
 *  geo: Geo,
 *  is_pinned: boolean,
 *  friends_only: boolean,
 *  final_post: boolean,
 *
 *  comments: CommentsData,
 *  likes: LikesData,
 *  reposts: RepostsData,
 *  views: ViewsData,
 *  marked_as_ads,
 *
 *  can_pin: boolean,
 *  can_edit: boolean,
 *  can_delete: boolean
 * }}
 */
var Post = {};

/**
 * @type {{count: int, can_comment: boolean, items: Comment=}}
 */
var CommentsData = {};

/**
 * @type {{count: int, user_likes: boolean, can_like: boolean, can_publish: boolean}}
 */
var LikesData = {};

/**
 * @type {{count: int, user_reposted: boolean}}
 */
var RepostsData = {};

/**
 * @type {{count: int}}
 */
var ViewsData = {};

/**
 * @type {{
 *  platform: string,
 *  type: string
 * }}
 */
var PostSource = {};

/**
 * @type {{coordinates: string, showmap: boolean=, place: Place, title: string=, onClick: function=}}
 */
var Geo = {};

/**
 * @type {{title: string, address: string, id: int}}
 */
var Place = {};

/**
 * @type {{
 *  id,
 *  description,
 *  wiki_page,
 *  members_count,
 *  links,
 *  activity,
 *  place,
 *  ban_info,
 *  start_date,
 *  finish_date,
 *  sex,
 *  photo_50,
 *  photo_100,
 *  photo_200,
 *  friend_status,
 *  photo_id,
 *  maiden_name,
 *  online,
 *  online_mobile,
 *  online_app,
 *  last_seen,
 *  counters: {notes, followers, subscriptions, pages},
 *  activites,
 *  bdate,
 *  can_write_private_message,
 *  status,
 *  can_post,
 *  is_closed,
 *  is_admin,
 *  is_member,
 *  city,
 *  country,
 *  exports,
 *  screen_name,
 *  blacklisted,
 *  blacklisted_by_me,
 *  are_friends,
 *  first_name_acc,
 *  first_name_abl,
 *  first_name_gen,
 *  first_name_ins,
 *  first_name_dat,
 *  last_name_acc,
 *  last_name_abl,
 *  last_name_gen,
 *  last_name_ins,
 *  last_name_dat,
 *  site,
 *  common_count,
 *  contacts,
 *  relation,
 *  relation_partner,
 *  nickname,
 *  home_town,
 *  verified,
 *  can_see_gifts,
 *  is_favorite,
 *  friend_status,
 *  crop_photo,
 *  member_status,
 *  type,
 *  first_name,
 *  last_name,
 *  name,
 *  last_seen: {time, platform},
 *  status_audio,
 *  deactivated,
 *  invited_by,
 *  mobile_phone,
 *  home_phone,
 *  personal,
 *  twitter,
 *  facebook,
 *  facebook_name,
 *  instagram,
 *  livejournal,
 *  rate,
 *  skype,
 *  schools,
 *  religion,
 *  political,
 *  life_main,
 *  people_main,
 *  smoking,
 *  alcohol,
 *  inspired,
 *  activities
 *  interests,
 *  music,
 *  movies,
 *  tv,
 *  books,
 *  games,
 *  about,
 *  quotes,
 *  grandparent,
 *  child,
 *  grandchild,
 *  relatives: User[],
 *  can_add_topics,
 *  is_friend,
 *  cover,
 *
 *  r, e
 * }}
 */
var User = {

};

/**
 * @type {{year_from: int, year_to: int, class: string, name: string, type: int, type_str: string}}
 */
var School = {};

/**
 * @type {{
 *  count: int,
 *  items: object[],
 *  profiles: object[],
 *  groups: object[]
 * }}
 */
var VkList = {};

/**
 * @type {{
 *  id: int,
 *  title: string,
 *  left: boolean=,
 *  kicked: boolean,
 *  users: User[]=,
 *  admin_id: int
 * }}
 */
var Chat = {};

/**
 * @type {{
 *  id: int,
 *  chat_id: int,
 *  peer_id: int,
 *  user_id: int,
 *  title: string,
 *  body: string,
 *  date: int,
 *  attachments: Attachment[]=,
 *  geo: string,
 *  fwd_messages: Message[]=,
 *  read_state: boolean,
 *  important: boolean,
 *  out: boolean,
 *  photo_50: string=,
 *  photo_100: string=,
 *  photo_200: string=,
 *  action: string,
 *  action_mid: string,
 *  in_read: int,
 *  out_read: int
 * }}
 */
var Message = {};

/**
 * @type {{
 *  id: int,
 *  from_id: int,
 *  text: string,
 *  attachments: Attachment[],
 *  date: int,
 *  reply_to_user: int,
 *  reply_to_comment: int,
 *  can_edit: boolean,
 *  can_delete: boolean
 * }}
 */
var Comment = {};

/**
 * @type {{type: string}}
 */
var Attachment = {};

/**
 * @type {{id: int, title: string, type: string, purchased: boolean, active: boolean, base_url, stickers: {sticker_ids: int[]}, items: int[]}}
 */
var StickerPack = {};

/**
 * @type {{owner_id: int, id: int, title: string, size: int, ext: string, url: string, type: int, date: int, preview: {photo: object}=}}
 */
var VkDocument = {};

/**
 * @type {{error_msg: string, error_code: int, captcha_img: string, captcha_sid: int, confirmation_text: string=}}
 */
var VkError = {};

/**
 * @type {{themeId: int, title: string, changelog: string, fileCSS: string, date: int, installCount: int, authorId: int, isPrivate: boolean, isVerified: boolean, version: string}}
 */
var APIdogTheme = {};

/**
 * @type {{owner_id: int, id: int, artist: string, title: string, duration: int, no_search: boolean, lyrics_id: int=, album_id: int=, date: int genre_id: int=, added: boolean=}}
 */
var VKAudio = {};

/**
 * @type {{lyrics_id: int, text: string}}
 */
var VKAudioLyrics = {};

/**
 * @type {{stationId: int, title: string, frequency: float, streams: RadioStream[], cityId: int, cityName: string=, canResolveTrack: boolean, domain: string, _city}}
 */
var RadioStation = {};

/**
 * @type {{cityId: int, title: string, country: string}}
 */
var RadioCity = {};

/**
 * @type {{user_id: int, name: string, phone: string, email: string, desc: string, photo_50: string, url: string}}
 */
var GroupContact = {};

/**
 * @type {{url: string, bitrate: int, streamId: int, format: int}}
 */
var RadioStream = {};

var ymaps = {
	Map: function() {},
	geoObjects: [],
	events: {},
	Placemark: function() {},
	setCenter: function() {}
};

var Hammer = {
	on: function() {},
	DIRECTION_LEFT: 1,
	DIRECTION_RIGHT: 1
};

var vlad805 = {api: { radio: { get: function(){}, getCurrentBroadcastingTrack: function(){} } }};

/**
 * @type {{
 *  id: int,
 *  title: string,
 *  updated: int,
 *  is_fixed: boolean
 *  is_closed: boolean,
 *  updated_by: int,
 *  updated: int
 * }}
 */
var Topic = {};

function require() {};

/*var item = event.clipboardData && event.clipboardData.items[0] && event.clipboardData.items[0].getAsFile && event.clipboardData.items[0].getAsFile();

							if (!item || loadingFile) {
								return;
							};

							if (item.size > 26214400) { // 5MB
								Site.Alert({text: "image uploading was passed because size more than 5MB"});
							};

							var title = "Загрузка изображения...",
								modal = new Modal({
									title: title,
									content: "Подключение...",
									unclosableByBlock:  true,
									width: 260
								}).show(),
								upload = new VKUpload(f)
									.onUploading(function (e) {
										modal.setContent(e.percent + "%");
									})
									.onUploaded(function (e) {
										modal.close();

										var id = ["photo", i.owner_id, i.pid || i.id];
										Photos.photos[id[1] + "_" + id[2]] = Photos.v5normalize(i);

										IM.attachs[to] = (IM.attachs[to] || []).push(id);

										nodeAttachs.value = IM.getHiddenInputWithAttachments(null, IM.attachs[to], true);
										$.elements.clearChild(nodeAttachsUI).appendChild(IM.explainAttachments(IM.attachs[to]));
										loadingFile = false;
									})
									.upload("photos.getMessagesUploadServer", {}, {});
							loadingFile = true;*/


/*
opts.smiles
	? $.e("div", {"class": "fr imdialog-attach-icon-wrap", append: [
		$.e("div", {"class": "imdialog-icon-general imdialog-icon-smile-button"})
	], onclick: function () {
		if (!smbx) return;
		$.elements.toggleClass(smbx, "hidden");
	}})
	: null,*/