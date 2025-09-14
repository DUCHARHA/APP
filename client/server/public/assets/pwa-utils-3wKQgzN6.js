import{k as n}from"./index-Bl7s4VzA.js";/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l=n("Download",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o=n("Info",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]]);function t(){const e=navigator.userAgent;let s="unknown",i=!1,r=!1;return e.includes("Firefox")?(s="firefox",i=!0,r=!1):e.includes("Safari")&&!e.includes("Chrome")&&!e.includes("Edg")?(s="safari",i=/iPad|iPhone|iPod/.test(e),r=!1):e.includes("MiuiBrowser")||e.includes("MIUI Browser")||e.includes("XiaoMi")?(s="miui",i=!0,r=!1):e.includes("YaBrowser")||e.includes("Yandex")?(s="yandex",i=!0,r=!0):e.includes("Edg")?(s="edge",i=!0,r=!0):e.includes("OPR")||e.includes("Opera")?(s="opera",i=!0,r=!0):e.includes("Chrome")&&(s="chrome",i=!0,r=!0),{canInstall:i,hasInstallPrompt:r,supportsManifest:!!document.querySelector('link[rel="manifest"]'),supportsServiceWorker:"serviceWorker"in navigator,browserName:s}}function u(){const{hasInstallPrompt:e}=t();return e}export{l as D,o as I,u as s};
