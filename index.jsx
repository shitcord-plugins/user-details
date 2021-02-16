import { Plugin } from '@vizality/entities';
import { patch, unpatch } from '@vizality/patcher';
import { joinClassNames } from '@vizality/util/dom';
import { findInReactTree, forceUpdateElement } from '@vizality/util/react';
import { getModule } from '@vizality/webpack';
import React from 'react';
import UserConnections from './apis/connections';
import CreatedAt from './apis/creationDate';
import JoinedAt from './apis/joinedDate';
import LastMessage from './apis/lastMessage';

const getClass = (props = [], items = props, exclude = [], selector = false) => {
	const module = getModule(m => m && props.every(prop => m[prop] !== undefined) && exclude.every(e => m[e] == undefined));
	if (!module) return '';
	return (selector ? '.' : '') + items.map(item => module[item]).join(selector ? '.' : ' ');
};

export default class UserDetails extends Plugin {
   patches = [];

   start() {
      // Bind stylesheet
      this.injectStyles('style.scss');

      // Api's
      this.createdApi = new CreatedAt(this);
      this.joinedApi = new JoinedAt(this);
      this.lastMessageApi = new LastMessage(this);
      this.connectionsApi = new UserConnections(this);
      
      // Patches
      this.patchUserPopout();
   }

   getUserPopout() {
		return new Promise(resolve => {
			patch('ud-get-userpopout', getModule(m => m.default?.displayName == "ConnectedUserPopout"), "default", (_, ret) => {
				resolve(ret.type);
				unpatch('ud-get-userpopout');
				return ret;
			});
         this.patches.push(() => unpatch('ud-get-userpopout'));
		});
	}

   async patchUserPopout() {
      const UserPopout = await this.getUserPopout();

      const plugin = this;

      patch('ud-user-popout-header', UserPopout.prototype, 'renderHeader', function (_, res) {
         const tree = findInReactTree(res, e => e && e.direction);
         if (!Array.isArray(tree?.children)) return res;

         const WrappedJoinedAt = plugin.joinedApi.task(this.props.user.id);
         const WrappedCreatedAt = plugin.createdApi.task(this.props.user.id);
         const WrappedLastMessage = plugin.lastMessageApi.task(this.props.user);
         tree.children.splice(2, 0, <div className={joinClassNames('ud-container', plugin.settings.get('useIcons', true) ? 'icons' : 'text')}>
            <WrappedCreatedAt />
            <WrappedJoinedAt />
            <WrappedLastMessage />
         </div>);

         return res;
      });
      const titleClassName = getClass(['bodyTitle'], ['bodyTitle']);
      patch('ud-user-popout-body', UserPopout.prototype, 'renderBody', function (_, res) {
         const tree = findInReactTree(res, e => e && e.className && Array.isArray(e.children));
         if (!Array.isArray(tree?.children)) return res;
         const Connections = plugin.connectionsApi.task(this.props.user.id);

         tree.children.unshift(
            <Connections titleClassName={titleClassName} />
         );
         return res;
      });

      this.patches.push(
         () => unpatch('ud-user-popout-header'),
         () => unpatch('ud-user-popout-body')
      );
      
      forceUpdateElement(getClass(["userPopout"], ["userPopout"], [], true));
   }

   stop() {
      this.patches.forEach(patch => patch());
   }
}