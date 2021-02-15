export default class WaitQueue {
   constructor({autostart = true, functions = [], delay = 1000} = {}) {
      this.autostart = autostart;
      this.functions = functions;
      this.delay = delay;

      if (this.autostart && functions.length) this.next(); 
   }

   add(callback, onCancel) {
      return new Promise(resolve => {
         const func = async () => {
            resolve(await callback());
         }
         this.functions.push(func);
         onCancel(() => {
            const index = this.functions.indexOf(func);
            if (index == -1) return;
            this.functions.splice(index, 1);
         });

         if (this.autostart && !this.running) this.next();
      });
   }

   next = () => {
      if (!this.functions.length || this.paused) return this.running = false;
      this.running = true;
      
      this._runCallback(this.functions.shift()).then(() => setTimeout(this.next, this.delay));
   }

   continue = () => {
      this.paused = false;
      this.next();
   }

   pause = () => {
      this.paused = true;
   }

   async _runCallback(callback) {
      if (typeof callback !== 'function') return;
      try {
         await callback();
      } catch (error) {
         console.error('Could not run callback: ', callback, '\n',  error);
      }
   }
}