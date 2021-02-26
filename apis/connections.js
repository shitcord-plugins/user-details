import { Divider, Tooltip } from '@vizality/components';
import { joinClassNames } from '@vizality/util/dom';
import { constants } from '@vizality/webpack';
import React, { useState, useEffect } from 'react';
import Badge from '../components/badge';
import defaultconnections from '../data/defaultConnections';
import ApiModule from './api';
import Circle from '../components/blankslates/circle';

export default class Userconnections extends ApiModule {
   get api() {return this.constructor.name;}

   get shownConnections() {
      const connections = this.settings.get('shownConnections', defaultconnections);

      return Object.keys(connections).reduce((items, curr) => (items[curr] = Boolean(connections[curr]), items), {});
   }

   get shownConnectionsAsArray() {
      const connections = this.shownConnections;
      return Object.keys(connections).reduce((items, item, _) => {
         if (connections[item]) items.push(item);
         return items;
      }, []);
   }

   task(userId) {
      return React.memo(({titleClassName}) => {
         if (!this.shownConnectionsAsArray.length) return null;
         const [connections, setconnections] = useState(null);
         
         useEffect(() => {
            const promise = this.get({
               url: constants.Endpoints.USER_PROFILE(userId)
            }, userId, userId);
            promise.then(data => {
               if (!data || !Array.isArray(data.body?.connected_accounts)) return setconnections([]);
               const shown = this.shownConnections;
               const connections = data.body.connected_accounts.filter(e => shown[e.type]);
               setconnections(connections);
            });

            return () => promise.cancel();
         }, [true]);

         return <div className="ud-connectionsBody">
            <div className={joinClassNames(titleClassName, 'ud-container')}>{connections?.length ? 'connections' : 'no connections'}</div>
            {
               Array.isArray(connections)
               ? connections.length ? <div className="ud-connections">{connections.map(badge => <Badge {...badge} />)}</div> : null
               : <Tooltip text="Loading Connections...">{this.shownConnectionsAsArray.map(() => <Circle className="loading" />)}</Tooltip>
            }
         </div>;
      });
   }
}