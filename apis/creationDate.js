import { Tooltip } from '@vizality/components';
import Cake from '../components/icons/cake';
import TextScroller from '../components/textscroller';
import ApiModule from './api';
import React from 'react';

export default class CreatedAt extends ApiModule {
   task(userId) {
      const text = this.parseTime(this.plugin.settings.get('created_format', 'Created At: $hour:$minute:$second, $day.$month.$year $daysago days'), this.extractDate(userId));
      
      return React.memo(() => {
         return this.plugin.settings.get('useIcons', true) 
         ? <Tooltip text={text}><Cake/></Tooltip> 
         : <TextScroller>{text}</TextScroller>;
      });
   }
}