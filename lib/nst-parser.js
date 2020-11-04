'use babel';

export default (function(){

var mark = function(text, line, type){
	this.line = line; // code line number pointer
	this.parent = 0;

	this.text = text; // node text

	this.type = type; // node type (used for different node icons only)

	this.items = [];
	this.classes = [];

	this.icon = 'nst-icn-' + type.toLocaleLowerCase();

	this.last = function(n={}){
		if(this.items.length) return this.items[this.items.length-1];
		return undefined;
	};
	this.hasItems = function(items) {
		for (var i in items) if (items[i].parent == this.id) return true;
		return false;
	};
	this.search = function(match, items) {
		var i, parents = [ this.id ], found = false;
		var mode = (typeof(match) !== 'string') * 1;  //1=regex,0=text
		for (i in items){
			if(!items[i]) continue;
			if(parents.indexOf(items[i].parent) < 0) continue; //is a child

			if (items[i].parent) parents.push(items[i].id);
			if (
				(mode === 0 && items[i].text.toLocaleLowerCase().indexOf(match.toLocaleLowerCase()) >= 0) ||
				(mode === 1 && items[i].text.match(match))
			) {
				found = true;
				break;
			}
		}
		return found;
	};
};

var markList = function(){
	//#MARK:IGNORE add,openScope
	this.parents = [0]; //root is id=0

	this.root = new mark('SOURCE', 0 ,'ROOT', 0);
	this.root.id = 0;
	this.root.childCount = 0;
	this.root.parent = -1;

	this.items = [this.root];
	this.currentScope = this.root;

	this.scope = function(){
		return this.parents[this.parents.length - 1];
	};

	this.add = function(item){
		var id = this.items.length;
		item.id = id;
		item.parent = this.parents[this.parents.length - 1];
		item.childCount = 0;

		if(item.parent > 0){
			this.items[item.parent].childCount++;
		}
		this.items.push(item);
		return item.id;
	};

	this.openScope = function(item) {
		var id = this.add(item);
		this.parents.push(id);
		this.currentScope = item;
	};
	this.closeScope = function(n) {
		this.parents.pop();
		//console.log("closeScope() current=%d", this.parents.slice(-1)[0]);
	};
	this.resetScope = function() {
		this.parents = [0];
	};
};

var parser = {
	langs:{},
	grammer: undefined,
	position: 0,
	getRegEx: function(grammer, def){

		if(def.re){
			return def.re;
		}

		var s = def.p;
		//comment here
		for(var i in grammer.re){
			var e = grammer.re[i];
			s = s.replace(e['m'], e['p']);
		}


		//console.log("RegEx: %s", s);
		return new RegExp('^\\s*' + s);
	},
	parseLine: function(line, idx){

	},
//#TODO Fix here and there
	parse: function(o, src){
		if(!o || !o.lng) return;
		if(!this.langs.hasOwnProperty(o.lng)){
			console.log("[NST][ERROR] No grammer for %s", o.lng);
			return;
		}

		var _this = this;

		var state = {
			parser:  this,
			doc: o,
			lng: o.lng,
			position: -1,
			line_idx: -1,
			scope: 0,
			currentScope: 0,
			flgIgnoring: false,
			ignoreSymbols: [],
		};

		state.grammer = this.langs[o.lng];
		state.lines = src.split(/\r?\n|\r/);
		state.list = new markList();

		state.blockLevels = [0];
		state.shouldOpenScope = false;


		var id=0, lastScope=0, lc=0;
		var s = "";

		do{
			s = this.getNextLine(state);
            id = false;

			if(state.grammer.processComments(state, state.line_idx, s)) continue;

			if(state.line_idx >= state.lines.length){
				console.log("reached end of file");
				break;
			}


			if(state.grammer.hasOwnProperty('ignore_region_marks')){
				if(state.flgIgnoring){
					if(state.grammer.ignore_region_marks.end.exec(s)){
						state.flgIgnoring = false;
						console.log("end ignoring...\n%s", s);
						continue;
					}
				}
				if(state.flgIgnoring) continue;
				if(state.grammer.ignore_region_marks.start.exec(s)){
					state.flgIgnoring = true;
					console.log("start ignoring...\n%s", s);
					continue;
				}
			}

			if(state.grammer.ignore_symbol){
				var m1 = state.grammer.ignore_symbol.exec(s);
				if(m1){
					state.ignoreSymbols = [];
					var a = m1[1].split(/,/);
					if(a && a.length > 0){
						a.forEach(function(item){
							state.ignoreSymbols.push(item.trim());
						});

						//console.log("ignore %o", this.ignoreSymbols);
					}
					continue;
				}
			}
			//console.log("LINE[%d] [SCOPE %d] %s", this.line_idx,this.scope, s);

			//if(this.grammer.end_scope && this.grammer.end_scope.exec(s)){
			//	console.log("found close scope %s", s);
			//}

			//console.log("currentScope=%d nextScope=%d lc=%d", this.blockLevels.slice(-1)[0],this.scope, lc);

			var def, r, re, m;
			var e = undefined;
			var item = undefined;
			for(var i in state.grammer.marks){
				def = state.grammer.marks[i];
				re = this.getRegEx(state.grammer,def);
				//console.log("%o %o", def,re);

				m = re.exec(s);
				if(!m) continue;

				if(def.exclude){
					for(var j in def.exclude){
						var re = def.exclude[j];
						if( re.test((m[1]) ? m[1] : m[0])){
							m = undefined;
							break;
						}
					}
					if(!m) continue;
				}

				e = {text:s, label:"", line: state.line_idx, position: state.position, type: def.t, hb:false};
				e.label = (m[1]) ? m[1] : m[0];
				if(def.hasOwnProperty("hb")) e.hb = def.hb;

				if( state.grammer.hasOwnProperty("processMark" + def.t ) ){
					//state.grammer["processMark" + def.t].call(state.grammer, e, this);
				}

				//console.log("mark[%s]", def.t, e);
				//console.log("SCOPE=%d", this.scope);

				item = new mark(e.label, e.line, e.type);
				if(def.o){
					if(def.o.icon){
						item.icon = def.o.icon;
					}
					if(def.o.text){
						item.text = def.o.text;
					}
					if(def.o.class){
						if(Array.isArray(def.o.class)){
							item.classes = item.classes.concat(def.o.class);
						}else if(typeof(def.o.class) == "string"){
							item.classes.push(def.o.class);
						}

					}
				}

				break;
			}


			if(item && state.grammer.processMark){
				if(!state.grammer.processMark(item, s)) continue;
			}

			//is a property
			if(['prop-obj', 'prop-fn'].indexOf(def.t) >= 0){

			}

			if(item && state.ignoreSymbols.length){
				var lbl = item.text.replace(/\(\)/,'');
				if(state.ignoreSymbols.indexOf(lbl) >= 0){
					state.ignoreSymbols = state.ignoreSymbols.filter(function(v){ return (v != lbl);});
					item.ignore = true;
				}
			}

			lastScope = state.scope;
			if(state.grammer.processNexting){
				lc = state.grammer.processNexting(state, s);
				//console.log("scope=%d + %d = %d [%s]", state.scope, lc, (state.scope+ lc), s );
				if( item && e.hb && lc == 0 && (!e.text.match(state.grammer.start_scope) && !e.text.match(state.grammer.end_scope)) ){
					parser.skipUntil(state, state.grammer.start_scope);
					lc = 1;
				}
				state.scope += lc;

			}else{
				ls = 0;
			}

			if(!e && (state.scope > lastScope)){
				e = {text:s, label:"anonymous", line: state.line_idx, position: state.position, type: 'obj', hb:true};
				item = new mark('anonymous', state.line_idx, 'obj');
				item.ignore = true;
			}

			if(e){
				if(lc > 0){
					//console.log("openScope(%s) scope=%d", s, lastScope);
					state.list.openScope(item);
					item.scope = lastScope;
					state.blockLevels.push(lastScope);
				}else{
					item.scope = this.scope;
					state.list.add(item);
				}
			}

			if(lc<0){
				var sc = lastScope;
				for(var i = lc; i < 0; i++){
					if(--sc == state.blockLevels.slice(-1)[0]){
						//console.log("closeScope() scope=%d", sc);
						state.list.closeScope();
						state.blockLevels.pop();
					}
				}
			}



		}while(state.line_idx < state.lines.length);

		return state;
		//console.log(this.list);
	},
	skipUntil: function(state, re, condition){
		if(typeof(condition) == "undefined") condition=true;
		var matched = false;
		var eof = false;
		var s = "";
		do{
			state.line_idx++;
			if(state.line_idx >= state.lines.length){
				eof = true;
				break;
			}

			s = state.lines[state.line_idx];
			if(/^\s*$/.exec(s)) continue;

			//console.log("skipUntil[%d]== %s", this.line_idx, s);
			if(re.exec(s)){
				matched = condition;
			}

		}while(matched!=condition && !eof);

		if(eof) return false;
		return true;
	},
	getNextLine: function(state){
		var s = "";
		do{
			state.line_idx++;
			if(state.line_idx >= state.lines.length){
				return false;
			}
			state.position += state.lines[state.line_idx].length + 1;
			s = state.grammer.preflight(state.lines[state.line_idx]);

			if(/^\s*$/.exec(s)) continue;
			//if(this.grammer.line_comment && this.grammer.line_comment.exec(s)){
			//	continue;
			//}
			break;
		}while(state.line_idx < state.lines.length);


		//strip escapes
	   	s = s.replace(/\\'/g, String.fromCharCode(0))
			.replace(/\\"/g, String.fromCharCode(1))
			.replace(/\\\//g, String.fromCharCode(2)); // strip escapes

		//literals
		var literals = [], lm;
		if ((lm = s.match(/'.*?'/g))) literals = literals.concat(lm);
		if ((lm = s.match(/".*?"/g))) literals = literals.concat(lm);
		if ((lm = s.match(/\/.+?\//g))) literals = literals.concat(lm);

		// remove literals from code
		s = s.replace(/'.*?'/g, "'...'")
            .replace(/".*?"/g, '"..."')
			.replace(/\/.+?\//g, '/.../');


		for (i in literals){
			literals[i] = literals[i].replace(/\x00/g, "\\'")
		    	.replace(/\x01/g, '\\"')
				.replace(/\x02/g, '\\/');
		}

		s = s.replace(/^\s+/, '');
		//console.log("getNextLine[%d]== %s", this.line_idx, s);
		return s;
	}
};

//#MARK JavaScript
parser.langs['source.js'] = {
	lng:'source.js',
	start_scope: /\s*{\s*(\/\/.*)?$/,
	end_scope: /\s*}\s*[,;]?/,
	comments: {
		block_start: /^\s*\/\*/,
		block_end: /\s*\*\/$/,
		single_line: /^\s*\/\//,
	},


	empty_line: /^\s*/,
	ignore_symbol: /^\s*\/\/\#MARK\:IGNORE\s+([a-zA-Z0-9\-_\.\,]+)\s?$/,
	ignore_region_marks: {'start': /^\s*\/\/\#MARK\:IGNORE-START\s?/, 'end': /^\s*\/\/\#MARK\:IGNORE-END\s?/},
	//#MARK:OBJ JavaScript.Marks
	marks: [
		{t:'mark', p: '//#MARK name', o: {icon:'nst-icn-mark'}},
		{t:'todo', re: /^\s*\/\/\#TODO\s+([a-zA-Z0-9\-_\.]+)\s+.*?$/},
		{t:'todo', re: /^\s*\/\/\#TODO\s+([a-zA-Z0-9\-_\.]+)$/},
		{t:'todo', re: /^\s*\/\/\#(TODO)\s+.*?$/},
		{t:'obj', p: '//#MARK\\:OBJ name'},
		{t:'fn', p: '//#MARK\\:FN name'},
		{t:'data', p: '//#MARK\\:DATA name'},
		{t:'cfg', p: '//#MARK\\:CONFIG name'},

		//properties
		{t:'prop-obj', hb: true, p: 'name : {'},
        {t:'prop-fn', hb: true, p: 'name : function() {', o: {class:'nst-icn-function'}},
		{t:'prop-fn', hb: true, re: /^\s*([\_\$a-zA-Z][a-zA-z0-9\_]+)\s*\((?![\(\)])[\_\$a-zA-Z0-9\s\,]+\)\s*\{\s*$/, o: {class:'nst-icn-function'},
			exclude: [/if/i, /do/i, /while/i, /for/i]
		},
		{t:'prop-fn', hb: true, re: /^\s*([\_\$a-zA-Z][a-zA-z0-9\_]+)\s*\(\s*\)\s*\{\s*$/, o: {class:'nst-icn-function'},
			exclude: [/if/i, /do/i, /while/i, /for/i]
		},

		{t:'module', p: '\\/\\/\\#MARK\\:MODULE name'},
		{t:'module', p:'export default class name'},
		{t:'module', p:'export (default) *'},

		{t:'obj', hb: true, p: 'var name = {'},
		{t:'obj', hb: true, p: 'var name = {'},
		{t:'obj', hb: true, p: 'let name = {'},
		{t:'obj', hb: true, p: 'self.name = {'},
		{t:'obj', hb: true, p: 'name = {'},
		{t:'obj', hb: true, re: /^\s*class\s+([a-zA-z0-9\_]+)\s*/},

		{t:'obj', hb: true, p: '*name = \\(function() {'},
		{t:'obj', hb: true, re: /^\s*([a-zA-z0-9\_\.]+)\s*(?=\[).+\]\s*\=\s*\{/ },
		{t:'obj', hb: true, re: /^\s*var.*\=\s*([a-zA-z0-9\_\.]+)\s*\=\s*\{/ },


		{t:'proto', hb: true, p: 'id.prototype.name = function()'},
		{t:'proto', hb: true, p: 'name.prototype = {'},

		{t:'jq', hb: true, re: /^\s*\$\.fn\.([a-zA-z0-9\_]+)\s*\=\s*function(?=\().+\)\s*\{/},
		{t:'jq', hb: true, re: /^\s*jQuery\.fn\.([a-zA-z0-9\_]+)\s*\=\s*function(?=\().+\)\s*\{/},

		{t:'fn',hb: true,  p: '\\(function() {', o :{"text": "IIFE", class:['nst-italic']}},

        {t:'fn', hb: true, p: 'function name() {', o: {class:'nst-icn-function'}},
        {t:'fn', hb: true, p: '*name = function() {', o: {class:'nst-icn-function'}},



	],
	re: [
		{m: /\./g, p: '\\.'},
		{m: /\*/g, p: '.*?'},
		{m: / : /g, p: '\\s*\\:\\s*'},
		{m: / = /g, p: '\\s*\\=\\s*'},
		{m: / \}/g, p: '\\}' },
        {m: / \{$/g, p: '(?:\\s*\\{\\s*$|\s*$|\\s*\\{.*?\\}\\s*[,;]?\\s*$)' },
		{m: /name/g, p: '(id)'},
		{m: /id/g, p: '[a-zA-Z_$][.a-zA-Z0-9_$]*'},
		{m: /:type/, p:'(?:\\s*:\\s*[a-zA-Z\\*]+\\s*)?'},
		{m: /\(\)/g, p:'\\s*(?=\\().+\\)\\s*'},
		{m: /\/\/\#/g, p:'\\/\\/\\#'}
	],
	preflight: function(line){
		if( line.match(/\s?\{\s?\/\/.*$/) ){
			//end of line comments
			line = line.replace(/\/\/.*$/, "");
			//console.log("cleaning comments " + this.line);
		}
		if( line.match(/\s?\{\s?\#.*$/) ){
			//end of line comments
			line = line.replace(/\#.*$/, "");
			//console.log("cleaning comments " + this.line);
		}

		return line;
	},

	processMark: function(mark, fullText){
		if(!mark) return false;
		if(/^this\.[a-zA-Z0-9_]*$/){
			mark.text = mark.text.replace("this.","");
		}
		if(mark.type == "fn"){
			mark.text += '()';
		}


		return true; //return true to add
	},
	processComments: function(state, line, text){
		var m;
		if((m = this.comments.block_start.exec(text))){
			console.log("block_comment_start %s", m[0]);
			state.parser.skipUntil(state, this.comments.block_end);
			return true; //skip line
		}

		return false; //no comment to skip
	},
	processNexting: function(state, text){
		var i, lc = 0;


		for(i =0;i< text.length;i++){
			if (text.charAt(i) == '{') lc++;
			if (text.charAt(i) == '}') lc--;
		}

		//return numer of scope/locks, negative is closed, positve is openned
		return lc;
	}
};
//#MARK PHP
parser.langs['text.html.php'] = {
	lng:'text.html.php',

	start_scope: /\s*{\s*((\/\/|\#).*)?$/,
	end_scope: /\s*}\s*[,;]?/,
	comments: {
		block_start: /^\s*\/\*/,
		block_end: /\s*\*\/$/,
		single_line: /^\s*\/\//,
	},


	empty_line: /^\s*/,
	ignore_symbol: /^\s*\/\/\#MARK\:IGNORE\s+([a-zA-Z0-9\$\-_\.\,]+)\s?$/,
	ignore_region_marks: {'start': /^\s*\/\/\#MARK\:IGNORE-START\s?/, 'end': /^\s*\/\/\#MARK\:IGNORE-END\s?/},
	//#MARK PHP.Marks
	marks: [
		{t:'mark', re: /^\s*\/\/\#MARK\s+([a-zA-Z_$][.a-zA-Z0-9_$]*)/, o: {icon:'nst-icn-mark'}},
		{t:'todo', re: /^\s*\/\/\#TODO\s+([a-zA-Z0-9\-_\.]+)\s+.*?$/},
		{t:'todo', re: /^\s*\/\/\#TODO\s+([a-zA-Z0-9\-_\.]+)$/},
		{t:'todo', re: /^\s*\/\/\#(TODO)\s+.*?$/},
		{t:'obj', re: /^\s*\/\/\#MARK\:OBJ\s+([a-zA-Z_$][.a-zA-Z0-9_$]*)/},
		{t:'fn', re: /^\s*\/\/\#MARK\:FN\s+([a-zA-Z_$][.a-zA-Z0-9_$]*)/},
		{t:'data', re: /^\s*\/\/\#MARK\:DATA\s+([a-zA-Z_$][.a-zA-Z0-9_$]*)/},
		{t:'cfg', re: /^\s*\/\/\#MARK\:CONFIG\s+([a-zA-Z_$][.a-zA-Z0-9_$]*)/},

		{t:'obj', hb: true, re: /^\s*abstract\s+class\s+([a-zA-z0-9\_]+)\s*/},
		{t:'obj', hb: true, re: /^\s*namespace\s*([a-zA-z\_\\][a-zA-z0-9\_\\]+)\s*/},
		{t:'obj', hb: true, re: /^\s*class\s+([a-zA-z0-9\_]+)\s*/},
		{t:'obj', hb: true, re: /^\s*class\s+([a-zA-z0-9\_]+)\s*extends\s*([a-zA-z\_\\][a-zA-z0-9\_\\]+)\s*/},
		{t:'obj', hb: true, re: /^\s*trait\s+([a-zA-z0-9\_]+)\s*/},
		{t:'obj', hb: true, re: /^\s*interface\s+([a-zA-z0-9\_]+)\s*/, o :{class:['nst-italic']} },

		{t:'fn', hb: true, re: /^\s*(\$[.a-zA-Z0-9_$]*)\s*\=\s*function\s*(?=\().+\)\s*\{/},
        {t:'fn', hb: true, re: /^\s*private\s+function\s*([a-zA-z0-9\_]+)\s*(?=\().+\)/},
		{t:'fn', hb: true, re: /^\s*public\s+function\s*([a-zA-z0-9\_]+)\s*(?=\().+\)/},
		{t:'fn', hb: true, re: /^\s*protected\s+function\s*([a-zA-z0-9\_]+)\s*(?=\().+\)/},
		{t:'fn', hb: true, re: /^\s*function\s*([a-zA-z0-9\_]+)\s*(?=\().+\)/},
		{t:'fn', hb: true, re: /^\s*private\s+static\s+function\s*([a-zA-z0-9\_]+)\s*(?=\().+\)/},
		{t:'fn', hb: true, re: /^\s*public\s+static\s+function\s*([a-zA-z0-9\_]+)\s*(?=\().+\)/},
	],
	re: [
		{m: /\./g, p: '\\.'},
		{m: /\*/g, p: '.*?'},
		{m: / : /g, p: '\\s*\\:\\s*'},
		{m: / = /g, p: '\\s*\\=\\s*'},
		{m: / \}/g, p: '\\}' },
        {m: / \{$/g, p: '(?:\\s*\\{\\s*$|\s*$|\\s*\\{.*?\\}\\s*[,;]?\\s*$)' },
		{m: /name/g, p: '(id)'},
		{m: /id/g, p: '[a-zA-Z_$][.a-zA-Z0-9_$]*'},
		{m: /:type/, p:'(?:\\s*:\\s*[a-zA-Z\\*]+\\s*)?'},
		{m: /\(\)/g, p:'\\s*(?=\\().+\\)\\s*'},
		{m: /\/\/\#/g, p:'\\/\\/\\#'}
	],
	preflight: function(line){
		if( line.match(/\s?\{\s?\/\/.*$/) ){
			//end of line comments
			line = line.replace(/\/\/.*$/, "");
			console.log("cleaning comments " + line);
		}
		if( line.match(/\s?\/\/.*$/) ){
			//end of line comments
			line = line.replace(/\/\/.*$/, "");
			console.log("cleaning comments " + line);
		}
		if( line.match(/\s?\{\s?\#.*$/) ){
			//end of line comments
			line = line.replace(/\#.*$/, "");
			console.log("cleaning comments " + line);
		}

		return line;
	},

	processMark: function(mark, fullText){
		if(!mark) return false;

		if(mark.type == "fn"){
			mark.text += '()';
		}


		return true; //return true to add
	},
	processComments: function(state, line, text){
		var m;
		if((m = this.comments.block_start.exec(text))){
			console.log("block_comment_start %s", m[0]);
			state.parser.skipUntil(state, this.comments.block_end);
			return true; //skip line
		}

		return false; //no comment to skip
	},
	processNexting: function(state, text){
		var o, i, lc = 0;
		for(i =0;i< text.length;i++){
			if (text.charAt(i) == '{') lc++;
			if (text.charAt(i) == '}') lc--;
		}

		//return numer of scope/locks, negative is closed, positve is openned
		return lc;
	}
};
//#MARK CSS
parser.langs['source.css'] = {
	lng:'source.css',

	end_scope: /\s*}\s*[,;]?/,
	comments: {
		block_start: /^\s*\/\*/,
		block_end: /^\s*\*\//,
		single_line: /^\s*\/\//,
	},


	empty_line: /^\s*/,
	//#MARK CSS.Marks
	marks: [
		{t:'style', re: /^\s*([#\.]([^{]+))\s*\{\s*$/},
		//{t:'scssimport', re: /^\s*\@import\s+['"](([a-zA-Z0-9\.\/\-\_]+))['"]\;/},
		{t:'style', re: /^\s*(([^{]+))\s*\{\s*$/},
		{t:'scssvar', re: /^\s*(\$([^\:]+))\s*\:/},
		{t:'scssvar', re: /^\s*@mixin\s+([a-zA-z0-9\_\-]+)\s*(?=\().+\)\s*\{/},
	],
	re: [
	],
	preflight: function(line){
		if( line.match(/\s?\{\s?\/\*.*$/) ){
			//end of line comments
			line = line.replace(/\/\*.*$/, "");
			//console.log("cleaning comments " + this.line);
		}
		return line;
	},
	processMark: function(mark, fullText){
		if(!mark) return false;
		if(/^this\.[a-zA-Z0-9_]*$/){
			mark.text = mark.text.replace("this.","");
		}
		if(mark.type == "scssimport"){
			mark.text = '@import(' + mark.text + ')';
		}
		if(mark.type == "fn"){
			mark.text += '()';
		}


		return true; //return true to add
	},
	processComments: function(state, line, text){
		var m;
		if((m = this.comments.block_start.exec(text))){
			state.parser.skipUntil(state, this.comments.block_end);
			return true; //skip line
		}

		return false; //no comment to skip
	},
	processNexting: function(state, text){
		var o, i, lc = 0;
		for(i =0;i< text.length;i++){
			if (text.charAt(i) == '{') lc++; else
			if (text.charAt(i) == '}') lc--;
		}

		//return numer of scope/locks, negative is closed, positve is openned
		return lc;
	}
};
parser.langs['source.css.less'] = parser.langs['source.css'];
parser.langs['source.css.scss'] = parser.langs['source.css'];

return parser;



})();
