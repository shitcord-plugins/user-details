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
               data = await queue.add(() => APIModule.get(options), doCancel => cancel = doCancel);
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

   parseTime(format, date) {
      if (typeof date !== 'object') date = new Date(date);
      return format
         .replace(/\$daysago/g, Math.round((new Date() - date) / (1000 * 60 * 60 * 24)))
         .replace(/\$day/g, date.toLocaleDateString(document.documentElement.lang, {day: '2-digit'}))
         .replace(/\$month/g, date.toLocaleDateString(document.documentElement.lang, {month: '2-digit'}))
         .replace(/\$year/g, date.getFullYear())
         .replace(/\$hour/g, this.parseZeroPadding(date.getHours()))
         .replace(/\$minute/g, this.parseZeroPadding(date.getMinutes()))
         .replace(/\$second/g, this.parseZeroPadding(date.getSeconds()));
   }
}