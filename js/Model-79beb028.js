import{S as A}from"./Sakura-5350b3eb.js";import{d as B,f as o,g as F,h as H,_ as M,r as R,o as v,c as _,a as S,w as z,e as n,n as E,i as C,F as T,j as q}from"./main-abce29ed.js";const h=""+new URL("../assets/model-b188f806.png",import.meta.url).href,D=B({name:"Model",components:{Sakura:A},setup(){const e=o(!1),s=o(0),a=o(!1),d=o(null),f=o({display:"none",left:"0px",top:"0px",backgroundImage:`url(${h})`,backgroundSize:"300% 300%",backgroundPosition:"0% 0%"}),g=[{left:"20%",top:"30%"},{left:"50%",top:"45%"},{left:"75%",top:"60%"}],m=o(null),i=o(null),u=o(null),p=c=>{var r;if(!a.value)if(a.value=!0,d.value===c)e.value=!1,setTimeout(()=>{f.value.display="none",d.value=null,a.value=!1},300);else{const l=i.value,t=(r=m.value)==null?void 0:r.querySelectorAll(".hotspot")[c];if(!l||!t)return;const I=l.getBoundingClientRect(),y=t.getBoundingClientRect(),$=y.left-I.left+t.clientWidth/2,x=y.top-I.top+t.clientHeight/2;d.value!==null?(e.value=!1,setTimeout(()=>k($,x),300)):k($,x)}},k=(c,r)=>{const l=u.value,t=i.value;!l||!t||(f.value={display:"block",left:`${c-l.offsetWidth/2}px`,top:`${r-l.offsetHeight/2}px`,backgroundImage:`url(${h})`,backgroundSize:`${t.width*3}px ${t.height*3}px`,backgroundPosition:`${-c*3+150}px ${-r*3+150}px`},requestAnimationFrame(()=>{e.value=!0,setTimeout(()=>{a.value=!1},300)}))};let b;const w=()=>{p(s.value),s.value=(s.value+1)%g.length};return F(()=>{setTimeout(()=>{p(0),s.value=1},500),b=window.setInterval(w,4e3)}),H(()=>{clearInterval(b)}),{modelImage:h,isActive:e,magnifierStyle:f,hotspots:g,modelImgRef:m,imgRef:i,magnifierRef:u}}});const L={class:"model"},N={class:"container"},P={class:"header"},U={class:"model-img",ref:"modelImgRef"},V=["src"];function W(e,s,a,d,f,g){const m=R("Sakura"),i=R("router-link");return v(),_("div",L,[S(m),S(i,{to:"/",class:"back-link"},{default:z(()=>s[0]||(s[0]=[n("span",{class:"back-icon"},"←",-1),n("span",{class:"back-text"},"返回首页",-1)])),_:1}),n("div",N,[n("div",P,[n("div",U,[n("img",{src:e.modelImage,alt:"模型图",ref:"imgRef"},null,8,V),n("div",{class:E(["magnifier",{active:e.isActive}]),style:C(e.magnifierStyle),ref:"magnifierRef"},null,6),(v(!0),_(T,null,q(e.hotspots,(u,p)=>(v(),_("div",{key:p,class:"hotspot",style:C({left:u.left,top:u.top})},null,4))),128))],512)])])])}const J=M(D,[["render",W],["__scopeId","data-v-492a60b6"]]);export{J as default};
