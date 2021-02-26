import { getModule } from '@vizality/webpack';
import WaitQueue from '../modules/queue';

const APIModule = getModule('get', 'getAPIBaseURL');
let cache = {}, queue = new WaitQueue({delay: 2500});

export default class ApiModule {
   constructor(plugin) {
      this.plugin = plugin;
   }

   extractDate(id) {
      return new Date((id / 4194304) + 1420070400000);
   }

   get api() {return '';}
   get settings() {return this.plugin?.settings;}
   get cache() {return cache[this.api];}

   get(options, guildId, userId) {
      let cancel = () => {};

      const promise = new Promise(async resolve => {
         if (!cache[this.api]) cache[this.api] = {[guildId]: {}};
         if (!cache[this.api][guildId]) cache[this.api][guildId] = {};
         let data;
         const userFromCache = cache[this.api][guildId][userId];
         if (userFromCache && userFromCache.fetch > Date.now() - 600000) data = userFromCache.data;  
         
         if (!data) {
            try {
               data = await queue.add(() => APIModule.get(options), doCancel => cancel = doCancel, this.api);
            } catch (error) {
               if (error.status === 429) {
                  queue.pause();
                  setTimeout(queue.continue, (error.body?.retry_after ?? 5) * 1000);
               }
               resolve(data = null);
            }
            if(!data?.body) return resolve(data = null);

            cache[this.api][guildId][userId] = {
               data: data,
               fetch: Date.now()
            };
         }

         return resolve(data);
      });
      
      Object.defineProperty(promise, 'cancel', {
         get() {return cancel;}
      });
      
      return promise;
   }

   parseZeroPadding(zeroable) {
      return zeroable < 9 ? '0' + zeroable : zeroable;
   }

   monthsAgo(date1, date2) {
      let months;
      months = (date2.getFullYear() - date1.getFullYear()) * 12;
      months -= date1.getMonth();
      months += date2.getMonth();
      return months <= 0 ? 0 : months;
  }

  daysAgo(date1, date2) {
      return Math.floor((date1 - date2) / (1000 * 60 * 60 * 24));
  }

  yearsAgo(date1, date2) {
      return this.monthsAgo(date2, date1) / 12;
  }

   parseTime(format, date) {
      if (typeof date !== 'object') date = new Date(date);
      const today = new Date(), daysago = this.daysAgo(today, date), hour12 = this.plugin.settings.get('12hour', false);
      return format
         .replace(/\$timelabel/g, date.getHours() >= 12 ? 'PM' : 'AM')
         .replace(/\$daysago/g, daysago)
         .replace(/\$dayname/g, date.toLocaleDateString('default', {weekday: 'short', hour12}))
         .replace(/\$day/g, date.toLocaleDateString('default', {day: '2-digit', hour12}))
         .replace(/\$monthname/g, date.toLocaleDateString('default', {month: 'short', hour12}))
         .replace(/\$monthsago/g, this.monthsAgo(today, date))
         .replace(/\$month/g, date.toLocaleDateString('default', {month: '2-digit', hour12}))
         .replace(/\$weeksago/g, Math.floor(daysago / 7))
         .replace(/\$yearsago/g, Math.floor(this.yearsAgo(today, date)))
         .replace(/\$year/g, date.getFullYear())
         .replace(/\$hour/g, this.parseZeroPadding(date.getHours() % 12))
         .replace(/\$minute/g, this.parseZeroPadding(date.getMinutes()))
         .replace(/\$second/g, this.parseZeroPadding(date.getSeconds()));
   }
}