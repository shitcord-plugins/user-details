import { Divider, Tooltip } from '@vizality/components';
import { joinClassNames } from '@vizality/util/dom';
import { constants } from '@vizality/webpack';
import React, { useState, useEffect } from 'react';
import Badge from '../components/badge';
import defaultconnections from '../data/defaultConnections';
import ApiModule from './api';
import Circle from '../components/blankslates/circle';
import Error from '../components/icons/error';
import Eventhandler from '../modules/eventhandler';

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
         const [connections, setConnections] = useState(null);
         const [message, setMessage] = useState('');

         useEffect(() => {
            const event = new Eventhandler(); 
            event
               .on('done', data => {
                  if (!data || !Array.isArray(data.body?.connected_accounts)) return setConnections([]);
                  const shown = this.shownConnections;
                  const connections = data.body.connected_accounts.filter(e => shown[e.type]);
                  setConnections(connections);
               })
               .on('error', error => {
                  let text = 'Failed to fetch data.';
                  if (error.body?.code === 50001) text = 'Cannot access Profile';
                  setMessage(text + '.');
                  this.error(text + ' from "' + userId + '"');
               });
            
            this.get({
               url: constants.Endpoints.USER_PROFILE(userId)
            }, userId, userId, event);

            return () => event.cancel();
         }, [true]);

         return <div className="ud-connectionsBody">
            <div className={joinClassNames(titleClassName, 'ud-container')}>{connections?.length ? 'connections' : 'no connections'}</div>
            {
               Array.isArray(connections)
               ? connections.length ? <div className="ud-connections">{connections.map(badge => <Badge {...badge} />)}</div> : null
               : message
                  ? <Tooltip text={message}><Error className="ud-errorIcon" /></Tooltip>
                  : <Tooltip text="Loading Connections...">{this.shownConnectionsAsArray.map(() => <Circle className="loading" />)}</Tooltip>
            }
         </div>;
      });
   }
}