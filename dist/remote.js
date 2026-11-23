const neutral={mx:0,my:0,lx:0,ly:0};
let input=neutral,lastInput=0,hostPeer=null,handset=null;
function readRemote(){return performance.now()-lastInput<350&&!document.hidden&&!document.querySelector('dialog[open]')?input:neutral}
pairClose.onclick=()=>pairDialog.close();
pairButton.onclick=()=>{
 pairDialog.showModal();
 if(hostPeer&&!hostPeer.destroyed)return;
 const code=Array.from(crypto.getRandomValues(new Uint8Array(5)),n=>n.toString(16).padStart(2,'0')).join('').toUpperCase();
 pairStatus.textContent='Creating pairing code…';pairCode.textContent='';pairQR.replaceChildren();
 const peer=new Peer('ih-gallery-'+code);hostPeer=peer;
 peer.on('open',()=>{
  const url=new URL('controller.html',location.href);url.hash=code;
  const qr=qrcode(0,'M');qr.addData(url.href);qr.make();pairQR.innerHTML=qr.createImgTag(4,12,'Controller pairing QR code');
  pairCode.textContent=code;pairStatus.textContent='Scan the QR code with your phone or enter the code on the controller page.'
 });
 peer.on('connection',conn=>{
  if(handset){conn.on('open',()=>conn.close());return}
  handset=conn;
  conn.on('open',()=>{pairStatus.textContent='Phone connected';pairDialog.close()});
  conn.on('data',d=>{
   if(conn!==handset||!d)return;
   if(d.action==='door'){if(!document.querySelector('dialog[open]'))openEntrance();return}
   if(!Object.keys(neutral).every(k=>Number.isFinite(d[k])&&Math.abs(d[k])<=1))return;
   input=d;lastInput=performance.now()
  });
  const release=()=>{if(handset===conn){handset=null;input=neutral;pairStatus.textContent='Scan the code again to reconnect.'}};
  conn.on('close',release);conn.on('error',release)
 });
 peer.on('error',()=>{peer.destroy();hostPeer=null;handset=null;input=neutral;pairQR.replaceChildren();pairCode.textContent='';pairStatus.textContent='Connection failed. Close and reopen Controller to try again.'})
};
