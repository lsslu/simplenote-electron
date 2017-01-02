import React, { PropTypes } from 'react'
import { connect } from 'react-redux';
import TagChip from './tag-chip'
import classNames from 'classnames';
import analytics from './analytics';
import { get } from 'lodash';
import appState from './flux/app-state';
import filterNotes from './utils/filter-notes';

const { updateNoteTags } = appState.actionCreators;

export const TagField = React.createClass( {

	propTypes: {
		tags: PropTypes.array,
		onUpdateNoteTags: PropTypes.func.isRequired
	},

	getDefaultProps: function() {
		return {
			tags: []
		};
	},

	getInitialState: function() {
		return {
			selectedTag: -1
		};
	},

	componentWillReceiveProps: function() {
		this.setState( { selectedTag: -1 } );
	},

	componentDidUpdate: function() {
		if ( this.hasSelection() ) {
			this.refs.hiddenTag.focus();
		}
	},

	clearTextField: function() {
		this.refs.tag.value = '';
	},

	addTag: function( tags ) {
		tags = tags.trim().replace( /\s+/g, ',' ).split( ',' );
		tags = this.props.tags.concat( tags );
		this.props.onUpdateNoteTags( this.props.note, tags );
		analytics.tracks.recordEvent( 'editor_tag_added' );
	},

	onSelectTag: function( tag, index ) {
		this.setState( { selectedTag: index } );
	},

	hasSelection: function() {
		return this.state.selectedTag !== -1;
	},

	deleteTag: function( index ) {
		var tags = this.props.tags.concat( [] );
		tags.splice( this.state.selectedTag, 1 );

		// var state = {tags: tags};
		let state = {};

		if ( this.state.selectedTag === index ) {
			state.selectedTag = -1;
		}

		this.props.onUpdateNoteTags( this.props.note, tags );

		this.setState( state );
		analytics.tracks.recordEvent( 'editor_tag_removed' );
	},

	deleteSelection: function() {
		if ( this.hasSelection() ) {
			this.deleteTag( this.state.selectedTag );
		}
	},

	selectLastTag: function() {
		this.setState( {
			selectedTag: this.props.tags.length - 1
		} );
	},

	preventTyping: function( e ) {
		e.preventDefault();
	},

	onKeyDown: function( e ) {
		var tag = this.refs.tag.value.trim();
		switch ( e.which ) {
			case 13: // return key
			case 9: // tab key
				e.preventDefault();
				// commit the value of the tag
				if ( tag === '' ) return;
				this.addTag( tag );
				this.clearTextField();
				break;
			case 8: // backspace
				// if a tag is selected, delete it, if no tag is select select right-most tag
				if ( this.hasSelection() ) {
					this.deleteSelection();
				}
				if ( tag !== '' ) return;
				// this.getDOMNode().focus();
				this.selectLastTag();
				e.preventDefault();
				break;
			default:
				break;
		}
	},

	onBlur: function() {
		// only deselect if we're not inside the hidden tag
		// this.setState({selectedTag: -1});
		setTimeout( () => {
			var h = this.refs.hiddenTag;
			if ( h !== document.activeElement ) {
				this.setState( { selectedTag: -1 } );
			}
		}, 1 );
	},

	render: function() {
		var { selectedTag } = this.state;

		return (
			<div className="tag-entry theme-color-border">
				<div className={classNames( 'tag-editor', { 'has-selection': this.hasSelection() } )}
					tabIndex="-1"
					onKeyDown={this.onKeyDown}
					onBlur={this.onBlur}>
					<input className="hidden-tag" tabIndex="-1" ref="hiddenTag" onKeyDown={this.preventTyping} />
					{this.props.tags.map( ( tag, index ) =>
						<TagChip key={tag} tag={tag}
							selected={index === selectedTag}
							onSelect={this.onSelectTag.bind( this, tag, index )} />
					)}
					<div className="tag-field">
						<input ref="tag" type="text" tabIndex="0" placeholder="Add tags &hellip;" />
					</div>
				</div>
			</div>
		);
	}

} );

const mapStateToProps = ( {
	appState: state,
	revision: { selectedRevision },
} ) => {
	const filteredNotes = filterNotes( state );
	const noteIndex = Math.max( state.previousIndex, 0 );
	const note = state.note ? state.note : filteredNotes[ noteIndex ];
	const revision = selectedRevision || note;
	return {
		note,
		tags: get( revision, 'data.tags', [] ),
	};
};

const mapDispatchToProps = ( dispatch, { noteBucket, tagBucket } ) => ( {
	onUpdateNoteTags: ( note, tags ) =>
		dispatch( updateNoteTags( { noteBucket, tagBucket, note, tags } ) ),
} );

export default connect( mapStateToProps, mapDispatchToProps )( TagField );
