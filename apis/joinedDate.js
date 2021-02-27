import ApiModule from './api';
import React, { useState, useEffect } from 'react';
import { constants, getModule, getModuleByDisplayName } from '@vizality/webpack';
import TextScroller from '../components/textscroller';
import { Tooltip } from '@vizality/components';
import Calendar from '../components/icons/calendar';
import Cube from '../components/blankslates/cube';
import Error from '../components/icons/error';
import Eventhandler from '../modules/eventhandler';

const SelectedGuildStore = getModule('getGuildId');

export default class JoinedAt extends ApiModule {
   get api() {return this.constructor.name;}

   task(userId) {
      return React.memo(() => {
         const [joined, setJoined] = useState(null);
         const [message, setMessage] = useState('');

         useEffect(() => {
            const guildId = SelectedGuildStore.getGuildId();
            const settingsFormat = this.plugin.settings.get('joined_format', 'Joined At: $hour:$minute:$second, $day.$month.$year $daysago days');
            if(!guildId) return setJoined('Joined At: --- --- ---');

            const event = new Eventhandler();
            event
               .on('done', data => {
                  if (!data) return setJoined('Joined At: --- --- ---');
                  setJoined(this.parseTime(settingsFormat, new Date(data.body.joined_at)))
               })
               .on('error', error => {
                  let text = 'Failed to fetch data.';
                  if (error?.body?.code === 10007) text = 'Member was not found!';
                  setMessage(text);
                  this.error(text, error);
               });
            
            this.get({
               url: constants.Endpoints.GUILD_MEMBER(guildId, userId)
            }, guildId, userId, event);
            
            
            return () => event.cancel();
         }, [true]);
         
         const useIcons = this.plugin.settings.get('useIcons', true);

         return joined 
            ? useIcons
               ? <Tooltip text={joined}><Calendar/></Tooltip>
               : <TextScroller>{joined}</TextScroller> 
            : message
               ? useIcons
                  ? <Tooltip text={message}><Error className="ud-errorIcon" /></Tooltip>
                  : <TextScroller style={{color: 'red'}}>{message}</TextScroller>
               : <Tooltip text="Loading JoinedAt..."><Cube className="loading" /></Tooltip>;
      });
   }
}