// v0.3.0

// ==========================================
// Copyright 2013 Dataminr
// Licensed under The MIT License
// http://opensource.org/licenses/MIT
// ==========================================

define([
	'backbone',
	'underscore',
	'Backbone.Advice'
], function(Backbone, _) {

	var cache = {};

	var adviceKeywords = [
		'after',
		'before',
		'around',
		'clobber',
		'addToObj',
		'setDefaults',
		'mixin'
	];

	var reserved = adviceKeywords.concat([
		'mixins',
		'extend',
		'base',
		'super',
		'options'
	]);

	var extendKeys = [
		'itemView',
		'content',
		'header',
		'endorsed',
		'parse',
		'model',
		'template',
		'widget'
	];

	/**
	 * @constructor
	 * @param {string|function(new:Object)} base
	 * @param {Object=} ext
	 * @param {Object=} mixins
	 * @param {Object=} options
	 */
	var BaseNode = function BaseNode(base, ext, mixins, options) {
		this.base = _.isString(base) ? cache[base] : base;
		this.ext = ext || {};
		this.mixins = mixins || {};
		this.options = options || {};
		this.main = null;
	};

	return {
		/**
		 * register a type with the factory
		 * @param {string} name
		 * @param {Object} options
		 * @return {function(new:Object)}
		 */
		register: function(name, options) {
			var opts = {};

			opts.base = _.isString(options.base) ?
				cache[options.base] :
				new BaseNode(options.base);

			_.extend(opts, {
				extend: _.clone(options.extend) || {},
				mixins: _.clone(_.isArray(options.mixins) ?
					{mixin: options.mixins,
						after: {},
						before: {}
					} :
					options.mixins) || {},
				options: _.clone(options.options) || {}
			});
			var base = this.getBase(opts.base);
			var proto = this.getBase(opts.base).prototype;
			var ext = this.getExt(opts.base);
			var all = _.extend({}, ext, proto);
			for (var key in options) {
				if (!_.contains(reserved, key)) {
					if (_.isFunction(options[key]) &&
								!_.contains(extendKeys, key)) {
						opts.mixins.after = opts.mixins.after || {}
						opts.mixins.after[key] = options[key];
					} else {
						opts.extend[key] = options[key];
					}
				}
				if (_.contains(adviceKeywords, key)) {
					opts.mixins[key] = opts.mixins[key] || {};
					_.extend(opts.mixins[key], options[key]);
				}
			}
			cache[name] = new BaseNode(opts.base, opts.extend, opts.mixins, opts.options);
			cache[name].main = this.create(name);
			return cache[name].main;
		},
		/**
		 * @param {string} name
		 * @return {function(new:Object)}
		 */
		get: function(type) {
			return cache[type].main;
		},
		/**
		 * @param {string} name
		 * @oaram {...*} var_args
		 * @return {Object}
		 */
		inst: function(type) {
			if (arguments.length == 1)
				return new (this.get(type))();
			if (arguments.length == 2)
				return new (this.get(type))(arguments[1]);
			if (arguments.length == 3)
				return new (this.get(type))(arguments[1], arguments[2]);
			if (arguments.length == 4)
				return new (this.get(type))(arguments[1], arguments[2], arguments[3]);
			if (arguments.length == 5)
				return new (this.get(type))(arguments[1], arguments[2], arguments[3], arguments[4]);
		},
		/**
		 * EXPERIMENTAL
		 * mark a function to use super
		 * @param {Function} fn
		 */
		super: function(fn) {
			fn.super = true;
		},
		/**
		 * EXPERIMENTAL
		 * return a function that gets passed it's super function
		 * @param {string} BaseNode [description]
		 * @param {string} name of function
		 * @param {Function} fn
		 * @return {Function}
		 */
		getSuper: function(BaseNode, name, fn) {
			var newBase = BaseNode.base;
			var earlier = getExt(newBase)[name];
			while (earlier == fn) {
				newBase = newBase.base;
				earlier = getExt(newBase)[name];
			}
			earlier = earlier || _.identity;
			if (earlier.super)
				earlier = this.getSuper(newBase, name, earlier);
			return function() {
				return fn.apply(this, [earlier].concat([].slice.call(arguments, 0)));
			};
		},
		/**
		 * extends mixin objects
		 * @param {Object} obj
		 * @param {Object} mixin
		 * @return {Object}
		 */
		extendMixinObj: function(obj, mixin) {
			for (var i = 0; i < adviceKeywords.length; i++) {
				var key = adviceKeywords[i];
				if (mixin[key]) {
					if (key != 'mixin') {
						obj[key] = obj[key] || {};
						_.extend(obj[key], mixin[key]);
					} else {
						obj[key] = _.union(obj[key] || [], mixin[key]);
					}
				}
			}
			return obj;
		},
		/**
		 * extends objects
		 */
		extend: function(obj, ext) {
			if (arguments.length > 2) {
				for (var i = arguments.length - 1; i > 1; i--) {
					Factory.extend(obj, arguments[i]);
				}
				return obj;
			}
			for (var key in ext) {
				if (_.isArray(ext[key]) && _.isArray(obj[key]))
					obj[key].push.apply(obj[key], ext[key]);
				else if (_.isObject(ext[key]) && _.isObject(obj[key]))
					_.extend(obj[key], ext[key]);
				else
					obj[key] = ext[key];
			}
			return obj;
		},
		/**
		 * get mixin object for a BaseNode
		 * @param {BaseNode} node
		 * @return {Object}
		 */
		getMixins: function(node) {
			if (!(node instanceof BaseNode)) {
				return {}
			}
			return this.extendMixinObj(this.getMixins(node.base), node.mixins);
		},
		/**
		 * get the options for mixins for a BaseNode
		 * @param {BaseNode} node
		 * @return {Object}
		 */
		getOptions: function(node) {
			if (!(node instanceof BaseNode)) {
				return {}
			}
			return _.extend({}, this.getOptions(node.base), node.options);
		},
		/**
		 * get the extends for a BaseNode
		 * @param {BaseNode} node
		 * @return {Object}
		 */
		getExt: function(node) {
			if (!(node instanceof BaseNode)) {
				return {};
			}
			return _.extend({}, this.getExt(node.base), node.ext);
		},
		/**
		 * get the base constructor for a BaseNode
		 * @param {BaseNode} node
		 * @return {function(new:Object)}
		 */
		getBase: function(node) {
			if (!(node.base instanceof BaseNode)) {
				return node.base;
			}
			return this.getBase(node.base);
		},
		/**
		 * create a constructor using a BaseNode
		 * @param {string} type
		 * @param {Object=} options
		 * @return {function(new:Object)}
		 */
		create: function(type, options) {
			return this.getBase(cache[type])
				.extend(this.getExt(cache[type]))
				.mixin(this.getMixins(cache[type]),
					_.extend({}, this.getOptions(cache[type]), options));
		}

	};

});