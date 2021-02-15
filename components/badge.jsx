import { Tooltip } from '@vizality/components';
import React from 'react';
import defaultbadges from '../data/defaultbadges';

const formatString = (string, options) => {
   for (const option in options) string = string.replace(new RegExp(`{{${option}}}`, 'g'), options[option]);
   return string;
}

export default function Badge({name, id, type}) {
   const onClick = () => {
      const link = defaultbadges[type].link;
      if (!link) return;
      open(formatString(link, {
         userId: id,
         user: name
      }));
   };

   return <Tooltip text={name}>
      <img src={defaultbadges[type].icon} onClick={onClick} />
   </Tooltip>;
}