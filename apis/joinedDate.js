import ApiModule from './api';
import React, { useState, useEffect } from 'react';
import { constants, getModule, getModuleByDisplayName } from '@vizality/webpack';
import TextScroller from '../components/textscroller';
import { Tooltip } from '@vizality/components';
import Calendar from '../components/icons/calendar';
import Cube from '../components/blankslates/cube';

const SelectedGuildStore = getModule('getGuildId');

export default class JoinedAt extends ApiModule {
   get api() {return this.constructor.name;}

   task(userId) {
      return React.memo(() => {
         const [joined, setJoined] = useState(null);
      
         useEffect(() => {
            const guildId = SelectedGuildStore.getGuildId();
            const settingsFormat = this.plugin.settings.get('joined_format', 'Joined At: $hour:$minute:$second, $day.$month.$year $daysago days');
            if(!guildId) return setJoined('Joined At: --- --- ---');

            const promise = this.get({
               url: constants.Endpoints.GUILD_MEMBER(guildId, userId)
            }, guildId, userId);
            promise.then(data => {
               if (!data) return setJoined('Joined At: --- --- ---');
               setJoined(this.parseTime(settingsFormat, new Date(data.body.joined_at)))
            });
            
            return () => promise.cancel();
         }, [true]);
         
         return joined 
            ? this.plugin.settings.get('useIcons', true) 
               ? <Tooltip text={joined}><Calendar/></Tooltip>
               : <TextScroller>{joined}</TextScroller> 
            : <Tooltip text="Loading JoinedAt..."><Cube className="loading" /></Tooltip>;
      });
   }
}