# Backbone.AdviceFactory #

For use with [Backbone.Advice](https://github.com/rhysbrettbowen/Backbone.Advice).

When mixing inheritance models (Backbone's extends and Backbone.Advice's mixins) there are often cases when you may overwrite mixins unintentionally. Backbone.AdviceFactory helps set up the inheritance the way you want it to work.

For instance you may extend "initialize" in a latter class that will not only override the former "initialize" method but also all the other mixins that were put on that function. To prevent this happenning Backbone.AdviceFactory allows you to setup an inheritance structure that will compose all the extends THEN all the mixins together for that level rather than trying to just extend a constructor that already has mixins put on.

```javascript

define(['Backbone.AdviceFactory'], function(Factory) {

	// register a base:
	Factory.register('view', {
		base: Backbone.View
	});

	// you can extend and mixin
	// it will pass back the new constructor
	var myView = Factory.register('myView', {
		base: 'view',

		// non reserved keywords are mixed in if functions
		defaultSize: 10,

		// or you can pass in the extends
		// such as constructors (as they're functions you don't want mixed in)
		extend: {
			itemView: itemView
		},

		// functional mixins go here
		mixins: [
			myMixin1,
			myMixin2
		],

		// also any other advice keywords such as after, before & clobber
		addToObj: {
			events: {
				'click': 'onClick'
			}
		}
	});

	Factory.register('myView2', {
		base: 'myView',

		// this will mixin as "after" automatically
		initialize: function() {}
	});

	// to get the finished product:
	var myView2inst = new Factory.get('myView2')(arg1);

	// or better yet
	var myView2inst2 = Factory.inst('myView2', arg1);

});

```

This is still experimental the api may change (or more likely expand to be more flexible) and there are more features I'm working on such as converting functions so they take their "super" as the first argument.

##changelog

###v0.3.0

add in some keywords to always extend

###v0.2.0

if it's a function then use 'after' (constructor functions should go in extends)

###v0.1.1

add in prototype of base node as an extends
