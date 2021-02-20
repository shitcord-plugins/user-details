import ApiModule from './api';
import React, { useState, useEffect } from 'react';
import { constants, getModule, getModuleByDisplayName } from '@vizality/webpack';
import TextScroller from '../components/textscroller';
import { Tooltip } from '@vizality/components';
import TextBubble from '../components/icons/textbubble';
import Cube from '../components/blankslates/cube';

const SelectedGuildStore = getModule('getGuildId');
const SelectedChannelStore = getModule('getChannelId', '_dispatchToken');
const {stringify} = getModule('stringify', 'parse', 'encode');

export default class LastMessage extends ApiModule {
   get api() {return this.constructor.name;}

   task(user) {
      return React.memo(() => {
         const [lastMessage, setLastMessage] = useState(null);
         
         useEffect(() => {
            if (user.bot && user.discriminator === "0000") return setLastMessage('Last Message: --- --- ---');
            const roomId = SelectedGuildStore.getGuildId() || SelectedChannelStore.getChannelId();
            const isGuild = Boolean(SelectedGuildStore.getGuildId());
            if (!roomId) return setLastMessage('Last Message: --- --- ---');
            const promise = this.get({
               url: isGuild ? constants.Endpoints.SEARCH_GUILD(roomId) : constants.Endpoints.SEARCH_CHANNEL(roomId),
               query: stringify({author_id: user.id})
            }, roomId, user.id);
            
            promise.then(data => {
               let date = 'Last Message: --- --- ---';
               if (data && data.body?.messages?.length) {
                  const message = data.body.messages[0].find(e => e.hit && e.author.id === user.id);
                  if (message) date = this.parseTime(this.plugin.settings.get('lastmessage_format', 'Last Message: $hour:$minute:$second, $day.$month.$year $daysago days'), new Date(message.timestamp));
               }
               setLastMessage(date);
            });

            return () => promise.cancel();
         }, [true]);

         return lastMessage 
            ? this.plugin.settings.get('useIcons', true)
               ? <Tooltip text={lastMessage}><TextBubble /></Tooltip>
               : <TextScroller>{lastMessage}</TextScroller> 
            : <Tooltip text="Loading LastMessage..."><Cube className="loading" /></Tooltip>;
      });
   }
}