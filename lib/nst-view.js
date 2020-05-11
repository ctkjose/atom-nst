'use babel';
import { CompositeDisposable, Disposable, TextEditor } from 'atom';
import parser from './nst-parser';

export default class NstView {

 	constructor(serializedState) {
		this.editorSubscriptions = new CompositeDisposable();
		this.currentEditor = undefined;

		this.panel = undefined;
		this.visible = false;
		this.currentTextFilter = "";
		var _view = this;

		// Create root element
		this.element = document.createElement('div');
		this.element.classList.add('nst-view');

		// Create toolbar
		var tb = this.toolbar = document.createElement('div');
		tb.classList.add('nst-bar', 'tool-bar', 'tool-bar-top', 'tool-bar-horizontal', 'tool-bar-12px');
		this.element.appendChild(tb);


		var txt = document.createElement('input');
		txt.setAttribute("type","text");
		txt.setAttribute("placeholder","filter");
		txt.setAttribute("title","filter symbols...");
		txt.classList.add('nst-filter-txt', 'native-key-bindings');
		tb.appendChild(txt);


		txt.addEventListener('blur', function(e){
			_view.handleFilter(txt.value);
		});
		txt.addEventListener('keypress', function(e){
			if(e.keyCode == 13 || e.keyCode == 10){
				_view.handleFilter(txt.value);
			}
		});
		//this.editorSubscriptions.add();



		var btn = document.createElement('button');
		btn.classList.add('btn', 'btn-default','tool-bar-btn','nst-btn','nst-btn-close');
		tb.appendChild(btn);

		btn.addEventListener("click", function(e){
			if(txt.value == "") return;
			txt.value = "";
			_view.handleFilter("");
		});

		//<button data-original-title="" title="" class=""></button>

		this.itemsView = document.createElement('div');
		this.itemsView.classList.add('items-views');

		this.root = document.createElement('div');
		this.root.classList.add('tool-panel', 'focusable-panel', 'nst-tree-view');
		this.element.appendChild(this.root);
		//this.appendEntry(0,"doThis()", null, 2);
		//this.appendEntry(0,"doThat()", null, 2);
	}


	// Returns an object that can be retrieved when package is activated
	serialize() {}

	// Tear down any state and detach
	destroy() {
		this.editorSubscriptions.dispose();
		this.currentEditor = undefined;
		this.element.remove();
	}
	isVisible(){
		if(!this.element) return false;
		return (this.offsetWidth != 0 || this.element.offsetHeight != 0);
	}
	getElement() {
		return this.element;
	}
	focus(){
		this.element.focus();
	}
	show(focus){
		var _this;
		this.panel = atom.workspace.addRightPanel({
            item: this.element,
            visible: true
        });
		this.focus();

	}
	toggle(){
		if(this.visible){
			this.panel.hide();
		}else{
			this.panel.show();
		}
		this.visible = !this.visible;
	}
	getDefaultLocation() {
   		return 'right';
 	}

 	getAllowedLocations() {
   		return ['right'];
 	}
	updateSelection(selection){
		if(!this.currentEditor) return;
	}
	handleFilter(text){
		if(!text){
			if(this.currentTextFilter.length){
				this.currentTextFilter = "";
				this.populateList();
			}
			return;
		}
		if(this.currentTextFilter == text) return;

		this.filterList(text);
	}
	handleEntryClick(editor, line){
		//console.log("click %d:%d", line);
		//if(editor != atom.workspace.getActiveTextEditor()) return;
		editor.scrollToBufferPosition([line, 1]);
		editor.setCursorBufferPosition([line, 1]);
        editor.moveToFirstCharacterOfLine();
	}
	clear(){
		this.root.innerHTML = "";
	}
	createEntry(type, caption, icon, editor, row){
		var div = document.createElement('div');
		div.classList.add('nst-entry', 'nst-icon', icon);
		div.setAttribute('is', 'space-pen-div');
		div.setAttribute('data-nst-row', row);
		div.classList.add('nst-type-' + type);
		div.innerHTML = '<div class="nst-entry-body"><span class="nst-entry-caption">' + caption + '</span></div>';

		div.addEventListener('click', (e) => {
      		if(e.target.classList.contains('nst-entry-items') ){
				return;
			}
			if(e.shiftKey || e.metaKey || e.ctrlKey){
				return;
			}
			e.stopImmediatePropagation();
			e.preventDefault();

			this.handleEntryClick(editor, row);
      	});
		return div;
	}
	filterList(text){
		this.currentTextFilter = text;
		if(!parser.list) return;

		this.clear();
		this.populateChilds(this.root, parser.list.items, {text:text});
	}
	populateList(){
		this.currentTextFilter = "";

		this.clear();
		if(!parser.list) return;
		this.populateChilds(this.root, parser.list.items, {parentID:0});
	}
	populateChilds(rowNode, items, filter){
		if(!rowNode) return;
		var view = this;

		var list = items.filter(function(e, idx){
			var flgNoChilds = false;
			if(filter.hasOwnProperty("parentID")){
				if(e.parent != filter.parentID) return false;
			}
			if(filter.text){
				flgNoChilds = true;
				if(e.text.toLowerCase().indexOf(filter.text.toLowerCase()) < 0 ) return false;
			}

			if(e.ignore) return false;
			var o = view.createEntry(e.type, e.text, e.icon, view.currentEditor, e.line);

			e.classes.forEach(cls => {
				o.classList.add(cls);
			});

			rowNode.appendChild(o);

			if(!flgNoChilds && e.childCount > 0){
				o.classList.add('nst-with-childs');
				var div = document.createElement('div');
				div.classList.add('nst-entry-items');
				div.setAttribute('is', 'space-pen-div');

				o.appendChild(div);
				view.populateChilds(div, items, {parentID:e.id});
			}

			return true;
		});

	}
	pupulateMarks(){
		if(!this.currentEditor) return;
		var ed = this.currentEditor;
		var lng = ed.getGrammar().id;
		this.lng = lng;
		console.log("@pupulateMarks[%s]=========", lng);

		if(!parser.langs.hasOwnProperty(lng)){
			parser.list = undefined;
			this.clear();
			return;
		}

		parser.parse(this, ed.getText());
		this.populateList();
	}
	selectClosestToRow(row){
		if(!parser.list) return;
		var list = parser.list.items.filter(function(e, idx){
			return e.line <= row;
		});
		var o = this.root.querySelector('.nst-entry.nst-selected');
		if(o){
			o.classList.remove("nst-selected");
		}

		if(list.length > 0){
			var e = list.slice(-1)[0];

			o = this.root.querySelector('.nst-entry[data-nst-row="' + e.line + '"]');
			if(o){
				o.classList.add("nst-selected");
			}
		}
	}
	editorChanged(item){
		if (!atom.workspace.isTextEditor(item)) {
   		 	console.log('[NST] not a text editor');
   			return;
 		}
		if(this.currentEditor && this.currentEditor == item){
			return;
		}

		this.editorSubscriptions.dispose();

		this.currentEditor = item;
		this.editorSubscriptions.add(item.observeSelections(selection => {
			this.updateSelection(selection);
		}));
		this.editorSubscriptions.add(item.onDidSave(v => {
			if(!this.currentEditor) return;
			if(this.currentEditor.isModified()) return;
			this.pupulateMarks();
		}));

		this.editorSubscriptions.add(item.onDidChangeCursorPosition(e => {
			if(!this.currentEditor) return;
			if(e.oldBufferPosition.row == e.newBufferPosition.row) return;


			this.selectClosestToRow(e.newBufferPosition.row);
		}));



		var file = item.getFileName();
		console.log("editor %o", item);

		this.pupulateMarks();
	}
}
