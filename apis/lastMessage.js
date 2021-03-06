import ApiModule from './api';
import React, { useState, useEffect } from 'react';
import { constants, getModule, getModuleByDisplayName } from '@vizality/webpack';
import TextScroller from '../components/textscroller';
import { Tooltip } from '@vizality/components';
import TextBubble from '../components/icons/textbubble';
import Cube from '../components/blankslates/cube';
import Error from '../components/icons/error';
import Eventhandler from '../modules/eventhandler';

const SelectedGuildStore = getModule('getGuildId');
const SelectedChannelStore = getModule('getChannelId', '_dispatchToken');
const ChannelTransitioner = getModule('transitionTo');
const {stringify} = getModule('stringify', 'parse', 'encode');

export default class LastMessage extends ApiModule {
   get api() {return this.constructor.name;}

   task(user) {
      return React.memo(() => {
         const [lastMessageDate, setLastMessageDate] = useState(null);
         const [lastMessageURL, setLastMessageURL] = useState(null);
         const [errorMessage, setErrorMessage] = useState('');

         useEffect(() => {
            if (user.bot && user.discriminator === "0000") return setLastMessageDate('Last Message: --- --- ---');
            const roomId = SelectedGuildStore.getGuildId() || SelectedChannelStore.getChannelId();
            const isGuild = Boolean(SelectedGuildStore.getGuildId());
            if (!roomId) return setLastMessageDate('Last Message: --- --- ---');

            const event = new Eventhandler();

            event
               .on('done', data => {
                  let date = 'Last Message: --- --- ---';
                  let url = '/channels/@me';
                  if (data && data.body?.messages?.length) {
                     const message = data.body.messages[0].find(e => e.hit && e.author.id === user.id);
                     if (message) {
                        date = this.parseTime(
                           this.plugin.settings.get(
                              'lastmessage_format', 
                              'Last Message: $hour:$minute:$second, $day.$month.$year $daysago days'
                           ), new Date(message.timestamp));
                        url = `/channels/${SelectedGuildStore.getGuildId()}/${message.channel_id}/${message.id}`;
                     }
                  }
                  setLastMessageDate(date);
                  setLastMessageURL(url);
               })
               .on('error', error => {
                  setErrorMessage('Failed to fetch data.');
                  this.error(text, error);
               })

            this.get({
               url: isGuild ? constants.Endpoints.SEARCH_GUILD(roomId) : constants.Endpoints.SEARCH_CHANNEL(roomId),
               query: stringify({author_id: user.id})
            }, roomId, user.id, event);


            return () => event.cancel();
         }, [true]);

         return lastMessageDate
            ? this.plugin.settings.get('useIcons', true)
               ? <Tooltip text={lastMessageDate}>
                    <TextBubble onClick={() => {
                       ChannelTransitioner.transitionTo(lastMessageURL);
                    }} />
                 </Tooltip>
               : <TextScroller onClick={() => {
                   ChannelTransitioner.transitionTo(lastMessageURL);
                 }}>{lastMessageDate}</TextScroller>
            : errorMessage
               ? <Tooltip text={errorMessage}><Error className="ud-errorIcon" /></Tooltip>
               : <Tooltip text="Loading LastMessage..."><Cube className="loading" /></Tooltip>;
      });
   }
}
