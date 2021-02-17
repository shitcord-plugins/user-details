import { Plugin } from '@vizality/entities';
import { get } from '@vizality/http';
import { patch, unpatch } from '@vizality/patcher';
import { joinClassNames } from '@vizality/util/dom';
import { findInReactTree, forceUpdateElement, getOwnerInstance, waitForElement } from '@vizality/util/react';
import { constants, getModule, getModuleByDisplayName } from '@vizality/webpack';
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
      this.patchUserProfile();
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
      this.patches.push(() => unpatch('ud-get-userpopout'));
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

   async patchUserProfile() {
      const AnalyticsContext = getModuleByDisplayName('AnalyticsContext');
      const plugin = this;
      patch('ud-userprofile', AnalyticsContext.prototype, 'render', function (_, res) {
         if (this.props.section !== constants.AnalyticsSections.PROFILE_MODAL) return res;
         const tree = findInReactTree(this.props.children, m => m?.className?.indexOf('headerInfo') > -1);
         const {user} = findInReactTree(this.props.children, m => m?.user) || {};
         if (!Array.isArray(tree?.children)) return res;
         if (!user) return res;
         const WrappedJoinedAt = plugin.joinedApi.task(user.id);
         const WrappedCreatedAt = plugin.createdApi.task(user.id);
         const WrappedLastMessage = plugin.lastMessageApi.task(user);
         
         tree.children.push(<div className={joinClassNames('ud-container userProfile', plugin.settings.get('useIcons', true) ? 'icons' : 'text')}>
            <WrappedCreatedAt />
            <WrappedJoinedAt />
            <WrappedLastMessage />
         </div>);

         return res;
      });

      this.patches.push(() => unpatch('ud-userprofile'));
   }

   stop() {
      this.patches.forEach(patch => patch());
   }
}