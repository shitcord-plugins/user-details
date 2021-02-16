import { joinClassNames } from '@vizality/util/dom';
import { constants } from '@vizality/webpack';
import React, { useState, useEffect } from 'react';
import Badge from '../components/badge';
import defaultconnections from '../data/defaultConnections';
import ApiModule from './api';

export default class Userconnections extends ApiModule {
   task(userId) {
      return React.memo(({titleClassName}) => {
         const [connections, setconnections] = useState([]);
         
         useEffect(() => {
            const promise = this.get({
               url: constants.Endpoints.USER_PROFILE(userId)
            }, userId, userId);
            promise.then(data => {
               if (!data || !Array.isArray(data.body?.connected_accounts)) return;
               const connections = data.body.connected_accounts.filter(e => this.plugin.settings.get('shownConnections', defaultconnections)[e.type]);
               if (!connections.length) return;
               setconnections(connections);
            });

            return () => promise.cancel();
         }, [true]);

         if (!connections.length) return null;
         return [
            <div className={joinClassNames(titleClassName, 'ud-container')}>connections</div>,
            <div className="ud-connections">{connections.map(badge => <Badge {...badge} />)}</div>
         ];
      });
   }
}