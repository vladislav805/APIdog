if (Date.now() < 0) {
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
	 * @type {{year_from: int, year_to: int, class: string, name: string, type: int, type_str: string}}
	 */
	var School = {};



	/**
	 * @type {{
	 *  enabled: boolean,
	 *  images: {
	 *   url: string,
	 *   width: int,
	 *   height: int
	 *  }[]
	 * }}
	 */
	var GroupCover = {};

	/**
	 * @type {{
	 *  id: int,
	 *  url: string,
	 *  name: string,
	 *  desc: string,
	 *  photo_50: string=,
	 *  photo_100: string=
	 * }}
	 */
	var GroupLink = {};

	/**
	 * @type {{id: int, title: string, important: boolean=, area: string=, region: string=}}
	 */
	var City = {};

	/**
	 * @type {{id: int, title: string}}
	 */
	var Country = {};

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
	 * @type {{
	 *  owner_id: int,
	 *  id: int,
	 *  artist: string,
	 *  title: string,
	 *  duration: int,
	 *  no_search: boolean,
	 *  lyrics_id: int=,
	 *  album_id: int=,
	 *  date: int,
	 *  genre_id: int=,
	 *  added: boolean=
	 * }}
	 */
	var VKAudio = {};

	/**
	 * @type {{
	 *  owner_id: int,
	 *  id: int,
	 *  album_id: int,
	 *  date: int,
	 *  width: int,
	 *  height: int,
	 *  photo_75: string,
	 *  photo_130: string,
	 *  photo_604: string,
	 *  photo_807: string,
	 *  photo_1280: string,
	 *  photo_2560: string,
	 *  access_key: string=,
	 *  likes: {count: int, user_likes: boolean}
	 * }}
	 */
	var Photo = {};

	/**
	 * @type {{
	 *  id: int,
	 *  owner_id: int,
	 *  title: string,
	 *  description: string,
	 *  can_upload: boolean,
	 *  size: int,
	 *  thumb_id: int,
	 *  thumb_src: string,
	 *  created: int,
	 *  updated: int,
	 *  thumb_is_last: boolean,
	 *  privacy_view: string[],
	 *  privacy_comment: string[],
	 *  upload_by_admins_only: boolean=,
	 *  comments_disabled: boolean=
	 * }}
	 */
	var PhotoAlbum = {};

	/**
	 * @type {{lyrics_id: int, text: string}}
	 */
	var VKAudioLyrics = {};

	/**
	 * @type {{id: int, icon_150: string, title: string, published_date: int, members_count: int, section: string=, type: string=, banner_560: string, author_id: int=, author_group: int=}}
	 */
	var VKApp = {};

	/**
	 * @type {{stationId: int, title: string, frequency: real, streams: RadioStream[], cityId: int, cityName: string=, canResolveTrack: boolean, domain: string, _city}}
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

	/**
	 * @type {{
	 *  userId: int,
	 *  bitmask: int,
	 *  language: int,
	 *  themeId: int,
	 *  authKey: string,
	 *  authId: int,
	 *  date: int,
	 *  applicationId: int,
	 *  accessToken: string,
	 *  salt: string,
	 *  theme: null,
	 *  languageBuild: int,
	 *  ad: {
	 *   menu: object[],
	 *   feed: object[]
	 *  }
	 * }}
	 */
	var API = {};
	var ymaps = {
		Map: function () {},
		geoObjects: [],
		events: {},
		Placemark: function () {},
		setCenter: function () {}
	};
	var Hammer = {
		on: function() {},
		DIRECTION_LEFT: 1,
		DIRECTION_RIGHT: 1
	};

	var vlad805 = {api: { radio: { get: function(){}, getCurrentBroadcastingTrack: function(){} } }};
	function require() {}
	var Sugar = {
		Object: {
			forEach: function(array, callback) {},
			toQueryString: function(obj) {}
		}
	};

	Date.prototype.relative = function() {};
	Date.prototype.long = function() {};
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

}

/**
 * @type {{
	 *  id: int,
	 *  description: string,
	 *  wiki_page: string,
	 *  members_count: int,
	 *  links: GroupLink,
	 *  activity: string,
	 *  place: Place,
	 *  ban_info: BanInfo,
	 *  start_date: string,
	 *  finish_date: string,
	 *  sex: int,
	 *  photo_50: string,
	 *  photo_100: string,
	 *  photo_200: string,
	 *  friend_status: int,
	 *  photo_id: int,
	 *  maiden_name: string,
	 *  online: int,
	 *  online_mobile: boolean,
	 *  online_app: string,
	 *  last_seen: {time: int, platform: int},
	 *  counters: {notes, followers, subscriptions, pages},
	 *  activites: string,
	 *  bdate: string,
	 *  can_write_private_message: boolean,
	 *  status: string,
	 *  can_post: boolean,
	 *  is_closed: boolean,
	 *  is_admin: boolean,
	 *  is_member: boolean,
	 *  city: City,
	 *  country: Country,
	 *  screen_name: string,
	 *  blacklisted: boolean,
	 *  blacklisted_by_me: boolean,
	 *  are_friends: boolean,
	 *  first_name_acc: string,
	 *  first_name_abl: string,
	 *  first_name_gen: string,
	 *  first_name_ins: string,
	 *  first_name_dat: string,
	 *  last_name_acc: string,
	 *  last_name_abl: string,
	 *  last_name_gen: string,
	 *  last_name_ins: string,
	 *  last_name_dat: string,
	 *  site: string,
	 *  common_count: int,
	 *  contacts: User[],
	 *  relation: int,
	 *  relation_partner: User,
	 *  nickname: string,
	 *  home_town: string,
	 *  verified: boolean,
	 *  can_see_gifts: boolean,
	 *  is_favorite: boolean,
	 *  friend_status: int,
	 *  crop_photo: object,
	 *  member_status: int,
	 *  type: string,
	 *  first_name: string,
	 *  last_name: string,
	 *  name: string,
	 *  status_audio: Audio,
	 *  deactivated: string,
	 *  invited_by: int,
	 *  mobile_phone: string,
	 *  home_phone: string,
	 *  twitter: string,
	 *  facebook: string,
	 *  facebook_name: string,
	 *  instagram: string,
	 *  livejournal: string,
	 *  rate: int,
	 *  skype: string,
	 *  schools: School[],
	 *  religion: string,
	 *  political: int,
	 *  life_main: int,
	 *  people_main: int,
	 *  smoking: int,
	 *  alcohol: int,
	 *  inspired: string,
	 *  interests: string,
	 *  music: string,
	 *  movies: string,
	 *  tv: string,
	 *  books: string,
	 *  games: string,
	 *  about: string,
	 *  quotes: string,
	 *  grandparent,
	 *  child,
	 *  grandchild,
	 *  relatives: User[],
	 *  can_add_topics: boolean,
	 *  is_friend: int,
	 *  cover: GroupCover,
	 *
	 *  r, e
	 * }}
 */
var User = {
	PLATFORM: {
		M_VK_COM: 1,
		IPHONE: 2,
		IPAD: 3,
		ANDROID: 4,
		WINDOWS_PHONE: 5,
		WINDOWS: 6,
		WEB: 7,
		VK_MOBILE: 8
	}
};

/**
 * @type {{
 *  id,
 *  name,
 *  screen_name,
 *  is_closed: boolean,
 *  deactivated: string=,
 *  is_admin: boolean,
 *  admin_level: int,
 *  is_member: boolean,
 *  invited_by: int,
 *  type: string,
 *  photo_50: string=,
 *  photo_100: string=,
 *  photo_200: string=,
 *  activity: string=,
 *  age_limits: int=,
 *  ban_info: BanInfo=,
 *  can_create_topic: boolean=,
 *  can_message: boolean=,
 *  can_post: boolean=,
 *  can_see_all_posts: boolean=,
 *  can_upload_doc: boolean=,
 *  can_upload_video: boolean=,
 *  city: City=,
 *  contacts: GroupContact[]=,
 *  counters: object=,
 *  country: Country=,
 *  cover: GroupCover,
 *  crop_photo: object=,
 *  description: string=,
 *  fixed_post: string=,
 *  has_photo: boolean=,
 *  is_favorite: boolean=,
 *  is_hidden_from_feed: boolean=,
 *  is_messages_blocked: boolean=,
 *  links: GroupLink[]=,
 *  main_album_id: int=,
 *  main_section: int=,
 *  member_status: int=,
 *  place: Place=,
 *  public_date_label: string=,
 *  site: string=,
 *  start_date: string=,
 *  finish_date: string=,
 *  status: string=,
 *  verified: boolean,
 *  wall: int,
 *  wiki_page: string
 * }}
 */
var Group = {
	MEMBER_STATUS: {
		NOT_MEMBER: 0,
		MEMBER: 1,
		NOT_SURE: 2,
		REJECTED_INVITE: 3,
		REQUESTED_JOIN: 4,
		INVITED_BY_SOMEBODY: 5
	}
};

/**
 * @type {{
 *  end_date: int,
 *  comment: string,
 *
 *  admin_id: int=,
 *  date: int=,
 *  reason: int=,
 *  comment_visible: boolean=
 * }}
 */
var BanInfo = {
	REASON: {
		OTHER: 0,
		SPAM: 1,
		VERBAL_ABUSE: 2,
		STRONG_LANGUAGE: 3,
		IRRELEVANT_MESSAGES: 4
	}
};

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