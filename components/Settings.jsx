import { Category, RadioGroup, SwitchItem, TextInput } from '@vizality/components/settings';
import { joinClassNames } from '@vizality/util/dom';
import React, { useState } from 'react';
import defaultconnections from '../data/defaultConnections';
import { useForceUpdate } from '@vizality/hooks';
import { Divider, Tooltip, Flex } from '@vizality/components';

const options = [
   {name: 'Use Icons', value: 1},
   {name: 'Use Text', value: 2}
];

const replacements = {
   "$timelabel": 'Replaces the current time label. eg AM or PM.',
   "$day": 'Replaces the current day.',
   "$daysago": 'Replaces with how much days it\'s ago.',
   "$dayname": 'Replaces the shorted dayname.',
   "$weeksago": 'Replaces how much weeks it\'s ago.',
   "$month": 'Replaces the month.',
   "$monthname": 'Replaces the shorted monthname.',
   "$monthsago": 'Replaces with how much months it\'s ago.',
   "$year": 'Replaces the year.',
   "$yearsago": 'Replaces how much years it\'s ago.',
   "$hour": 'Replaces the hour(s)',
   "$minute": 'Replaces the minute(s)',
   "$second": 'Replaces the second(s)',
};

const formats = {
   created_format: {
      defaultValue: 'Created At: $hour:$minute:$second, $day.$month.$year $daysago days',
      name: 'Creation Format',
      note: 'This is the format how the creation date will show up.'
   },
   joined_format: {
      defaultValue: 'Joined At: $hour:$minute:$second, $day.$month.$year $daysago days',
      name: 'Joined Format',
      note: 'This is the format how the joined at date will show up.'
   },
   lastmessage_format: {
      defaultValue: 'Last Message: $hour:$minute:$second, $day.$month.$year $daysago days',
      name: 'Last Message Format',
      note: 'This is the format how the last message date will show up.'
   }
}

function ReplacementItem({children, name}) {
   return <Flex direction={Flex.Direction.HORIZONTAL}>
      <b>{name}</b>
      &nbsp;
      {children}
   </Flex>;
}

export default ({getSetting, updateSetting, toggleSetting}) => {
   const forceUpdate = useForceUpdate();
   const [isDatesOpened, setDatesOpened] = useState(false);
   const [isFormatOpened, setFormatOpened] = useState(false);
   const shownIcons = getSetting('shownConnections', Object.fromEntries(Object.keys(defaultconnections).map(k => [k, true])));
   const useIcons = getSetting('useIcons', true);

   return <>
      <Category
         name="Connections"
         opened={true}
         description={null}
         onChange={() => {}}
      >
         <div className="ud-settingsBadge-container">
            {Object.keys(defaultconnections).map(k => <Tooltip text={shownIcons[k] ? 'Enabled' : 'Disabled'} hideOnClick={false}>
               <img 
                  src={defaultconnections[k].icon} 
                  className={joinClassNames('ud-settingsBadge', shownIcons[k] ? 'enabled' : 'disabled')} 
                  onClick={() => {updateSetting('shownConnections', (shownIcons[k] = !shownIcons[k], shownIcons)); console.log(shownIcons); forceUpdate();}}
               />
            </Tooltip>)}   
         </div>
      </Category>
      <Divider />
      <SwitchItem note="This enables 12hour format on all dates." value={getSetting('12hour', false)} onChange={() => {toggleSetting('12hour');}}>12-hour</SwitchItem>
      <RadioGroup
         note={null}
         options={options}
         value={useIcons ? 1 : 2}
         onChange={({value}) => updateSetting('useIcons', value === 1)}
      >Display Type</RadioGroup>
      <Category name="Dates & Formats" opened={isDatesOpened} onChange={() => setDatesOpened(!isDatesOpened)}>
         {Object.keys(formats).map(id => <TextInput
            note={formats[id].note}
            value={getSetting(id, formats[id].defaultValue)}
            onChange={value => updateSetting(id, value)}
         >{formats[id].name}</TextInput>)}
         <Category name="Replacements" opened={isFormatOpened} onChange={() => setFormatOpened(!isFormatOpened)}>
            {Object.keys(replacements).map(key => [<ReplacementItem name={key}>{replacements[key]}</ReplacementItem>, <Divider />])}
         </Category>
      </Category>
   </>;
};