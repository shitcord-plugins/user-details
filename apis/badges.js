import { joinClassNames } from '@vizality/util/dom';
import { constants } from '@vizality/webpack';
import React, { useState, useEffect } from 'react';
import Badge from '../components/badge';
import defaultbadges from '../data/defaultbadges';
import ApiModule from './api';

export default class UserBadges extends ApiModule {
   task(userId) {
      return React.memo(({titleClassName}) => {
         const [badges, setBadges] = useState([]);
         
         useEffect(() => {
            const promise = this.get({
               url: constants.Endpoints.USER_PROFILE(userId)
            }, userId, userId);
            promise.then(data => {
               if (!data || !Array.isArray(data.body?.connected_accounts)) return;
               const badges = data.body.connected_accounts.filter(e => this.plugin.settings.get('shownBadges', defaultbadges)[e.type]);
               if (!badges.length) return;
               setBadges(badges);
            });

            return () => promise.cancel();
         }, [true]);

         if (!badges.length) return null;
         return [
            <div className={joinClassNames(titleClassName, 'ud-container')}>Badges</div>,
            <div className="ud-badges">{badges.map(badge => <Badge {...badge} />)}</div>
         ];
      });
   }
}