import { joinClassNames } from '@vizality/util/dom';
import { getModule } from '@vizality/webpack';
import React from 'react';
import ReactDOM from 'react-dom';

const Animations = getModule('Value');

export default class TextScroller extends React.Component {
   _ref = instance => {
      let ele = ReactDOM.findDOMNode(instance);
      if (ele && ele.parentElement) {
         let maxWidth = ele.parentElement.innerWidth;
         if (maxWidth > 50) ele.style.setProperty('max-width', `${maxWidth}px`);
         setTimeout(() => {
            if (document.contains(ele.parentElement)) {
               let newMaxWidth = ele.parentElement.innerWidth;
               if (newMaxWidth > maxWidth) ele.style.setProperty('max-width', `${newMaxWidth}px`);
            }
         }, 3000);
         let Animation = new Animations.Value(0);
         Animation
            .interpolate({ inputRange: [0, 1], outputRange: [0, (ele.firstElementChild.offsetWidth - ele.offsetWidth) * -1] })
            .addListener(v => { ele.firstElementChild.style.setProperty('left', `${v.value}px`); });
         this.scroll = p => {
            let w = p + parseFloat(ele.firstElementChild.style.getPropertyValue('left')) / (ele.firstElementChild.offsetWidth - ele.offsetWidth);
            w = isNaN(w) || !isFinite(w) ? p : w;
            w *= ele.firstElementChild.offsetWidth / (ele.offsetWidth * 2);
            Animations.parallel([Animations.timing(Animation, { toValue: p, duration: Math.sqrt(w ** 2) * 4000 / (parseInt(this.props.speed) || 1) })]).start();
         };
      }
   }

   _onClick = e => {
      if (typeof this.props.onClick == 'function') this.props.onClick(e, this);
   }

   _onMouseEnter = e => {
      if (e.currentTarget.offsetWidth < e.currentTarget.firstElementChild.offsetWidth) {
         this.scrolling = true;
         e.currentTarget.firstElementChild.style.setProperty('display', 'block');
         this.scroll(1);
      }
   }

   _onMouseLeave = e => {
      if (this.scrolling) {
         delete this.scrolling;
         e.currentTarget.firstElementChild.style.setProperty('display', 'inline');
         this.scroll(0);
      }
   }
   
   render() {
      const style = Object.assign({}, this.props.style, {
         position: 'relative',
         display: 'block',
         overflow: 'hidden'
      });

      const childStyle = {
         left: '0',
         position: 'relative',
         display: 'inline',
         whiteSpace: 'nowrap'
      };

      return <div 
            className={joinClassNames(this.props.className, 'ud-scrollableText')} 
            style={style}
            ref={this._ref}
            onClick={this._onClick}
            onMouseEnter={this._onMouseEnter}
            onMouseLeave={this._onMouseLeave}
         >
            <div style={childStyle}>{this.props.children}</div>
      </div>;
   }
}