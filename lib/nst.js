'use babel';

import NstView from './nst-view';
import { CompositeDisposable } from 'atom';



export default {

	config: {
   		markPatterns: {
	 		type: 'string',
	 		default: '',
	 		description: 'List of patterns for marks.'
		},
   		autoExpand: {
	 		type: 'boolean',
	 		default: true,
	 		description: 'If this option is enabled the symbol tree is expanded by default.'
		}
	},
	nstView: null,
  	modalPanel: null,
  	subscriptions: null,

 	getNSTViewInstance: function(state={}) {
      if (this.nstView == null) {
        this.nstView = new NstView(state)
        //this.nstView.onDidDestroy(() => { this.nstView = null })
      }
      return this.nstView
    },
 	activate: function(state) {
		this.nstView = this.getNSTViewInstance();

    	// Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    	this.subscriptions = new CompositeDisposable();

    	// Register command that toggles this view
    	this.subscriptions.add(atom.commands.add('atom-workspace', {
			'nst:show': () => this.nstView.show(),
      		'nst:toggle': () => this.nstView.toggle()
    	}));
		this.subscriptions.add(atom.workspace.getCenter().observeActivePaneItem(item => {
			this.nstView.editorChanged(item);

		}));
		const showOnAttach = !atom.workspace.getActivePaneItem();

		/*
    	this.nstViewOpenPromise = atom.workspace.open(this.nstView, {
      		activatePane: showOnAttach,
      		activateItem: showOnAttach
    	});
		*/

		this.nstView.panel = atom.workspace.addRightPanel({
            item: this.nstView.getElement(),
            visible: true
        });
		console.log('Nst is active');

		var autoExpand = atom.config.get('nst.autoExpand');
		console.log("nst autoExpand=%s", autoExpand);
		atom.config.observe("nst.autoExpand", function(enabled){
			console.log("nst autoExpand ", enabled);

		});
  	},
	show: function() {

	},
	destroy: function() {
  		this.nstView.destroy();
  		this.subscriptions.dispose();
	},
 	deactivate: function() {
		this.subscriptions.dispose();
		//await this.treeViewOpenPromise // Wait for Tree View to finish opening before destroying it
		if (this.nstView) this.nstView.destroy();
  		this.nstView = null;
 	},

 	serialize: function() {
    	return {
      		nstViewState: this.nstView.serialize()
    	};
  	}

};
