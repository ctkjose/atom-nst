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
		// Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    	this.subscriptions = new CompositeDisposable();

		this.nstView = this.getNSTViewInstance();

    	// Register command that toggles this view
    	this.subscriptions.add(atom.commands.add('atom-workspace', {
			//'nst:show': () => this.nstView.show(),
      		'nst:toggle': () => this.toggle()
    	}));


		this.subscriptions.add(atom.workspace.addOpener(uri => {
	        if (uri === 'atom://atom-nst') {
	          return this.nstView;
	        }
      	}));

		//this.subscriptions.add(atom.workspace.getCenter().observeActivePaneItem(item => {
		//	this.nstView.editorChanged(item);
		//}));

		const showOnAttach = !atom.workspace.getActivePaneItem();

		/*
    	this.nstViewOpenPromise = atom.workspace.open(this.nstView, {
      		activatePane: showOnAttach,
      		activateItem: showOnAttach
    	});
		*/



		/*
		this.nstView.panel = atom.workspace.addRightPanel({
            item: this.nstView.getElement(),
            visible: true
        });
		*/
		
		console.log('NST is active');

		var autoExpand = atom.config.get('nst.autoExpand');
		console.log("nst autoExpand=%s", autoExpand);
		atom.config.observe("nst.autoExpand", function(enabled){
			console.log("nst autoExpand ", enabled);

		});
  	},
	toggle: function(){
		atom.workspace.toggle('atom://atom-nst');
	},
	destroy: function() {
  		this.subscriptions.dispose();
	},
 	deactivate: function() {
		this.subscriptions.dispose();
		//await this.treeViewOpenPromise // Wait for Tree View to finish opening before destroying it
		//if (this.nstView) this.nstView.destroy();
  		//this.nstView = null;
 	},

	deserializeNSTView(serialized) {
    	return this.nstView;
  	}

};
