import { Category, RadioGroup } from '@vizality/components/settings';
import { joinClassNames } from '@vizality/util/dom';
import React from 'react';
import defaultBadges from '../data/defaultbadges';
import { useForceUpdate } from '@vizality/hooks';
import { Divider, Tooltip } from '@vizality/components';

const options = [
   {name: 'Use Icons', value: 1},
   {name: 'Use Text', value: 2}
];

export default ({getSetting, updateSetting}) => {
   const forceUpdate = useForceUpdate();
   const shownIcons = getSetting('shownBadges', Object.fromEntries(Object.keys(defaultBadges).map(k => [k, true])));
   const useIcons = getSetting('useIcons', true);
   return <>
      <Category
         name="Badges"
         opened={true}
         description={null}
         onChange={() => {}}
      >
         <div className="ud-settingsBadge-container">
            {Object.keys(defaultBadges).map(k => <Tooltip text={shownIcons[k] ? 'Enabled' : 'Disabled'} hideOnClick={false}>
               <img 
                  src={defaultBadges[k].icon} 
                  className={joinClassNames('ud-settingsBadge', shownIcons[k] ? 'enabled' : 'disabled')} 
                  onClick={() => {updateSetting('shownBadges', (shownIcons[k] = !shownIcons[k], shownIcons)); console.log(shownIcons); forceUpdate();}}
               />
            </Tooltip>)}   
         </div>
      </Category>
      <Divider />
      <RadioGroup
         note={null}
         options={options}
         value={useIcons ? 1 : 2}
         onChange={({value}) => updateSetting('useIcons', value === 1)}
      >Display Type</RadioGroup>
   </>;
};