let API = 'http://localhost:3000/api';
let user = null, wallet = null, selected = null, currentRound = null;

const qs = id => document.getElementById(id);

function show(el){el.classList.remove('hidden')}
function hide(el){el.classList.add('hidden')}

async function api(path, opts={}){
  let res = await fetch(API+path, {...opts, headers:{'Content-Type':'application/json'}});
  return res.json();
}

async function login(){
  let username = qs('username').value.trim();
  let ref = qs('referralCode').value.trim();
  if(!username){alert('Enter username');return}
  let data = await api('/auth',{method:'POST',body:JSON.stringify({username, referralCode:ref})});
  user = data.user; wallet = data.wallet;
  hide(qs('authBox')); show(qs('app'));
  loadWallet(); loadReferral(); loadRound(); loadHistory(); loadBets();
}

async function loadWallet(){
  let me = await api('/me/'+user.id);
  wallet = me.wallet;
  qs('balance').innerText = (wallet.balance_paise/100).toFixed(2);
}

async function addFunds(){
  let amt = parseFloat(qs('addAmt').value);
  if(!amt) return;
  await api('/wallet/add',{method:'POST',body:JSON.stringify({userId:user.id,amount:amt})});
  loadWallet();
}

async function withdraw(){
  let amt = parseFloat(qs('wdAmt').value);
  if(!amt) return;
  let r = await api('/wallet/withdraw',{method:'POST',body:JSON.stringify({userId:user.id,amount:amt})});
  if(r.error) alert(r.error); else loadWallet();
}

async function loadReferral(){
  let r = await api('/referral/'+user.id);
  qs('myCode').innerText = r.refCode;
  qs('refCount').innerText = r.referredCount;
  qs('refEarn').innerText = (r.earningsPaise/100).toFixed(2);
}

async function loadRound(){
  let r = await api('/round/current');
  currentRound = r.round;
  qs('roundNo').innerText = currentRound.round_no;
  qs('odds').innerText = r.config.ODDS_MULTIPLIER;
  qs('seedHash').innerText = currentRound.seed_hash;
  renderNumbers();
  countdown();
}

function renderNumbers(){
  let box = qs('numbers'); box.innerHTML='';
  for(let i=1;i<=25;i++){
    let b=document.createElement('button'); b.innerText=i;
    b.onclick=()=>{selected=i;document.querySelectorAll('#numbers button').forEach(x=>x.classList.remove('active'));b.classList.add('active')};
    box.appendChild(b);
  }
}

function countdown(){
  if(!currentRound) return;
  let end=new Date(currentRound.close_at).getTime();
  let iv=setInterval(()=>{
    let left=end-Date.now();
    if(left<=0){clearInterval(iv);qs('countdown').innerText='closed';loadRound();loadHistory();loadBets();return}
    qs('countdown').innerText=(left/1000).toFixed(0)+'s';
  },1000);
}

async function placeBet(){
  if(!selected){alert('Pick a number');return}
  let stake=parseFloat(qs('stake').value);
  if(!stake){alert('Enter stake');return}
  let r=await api('/bet',{method:'POST',body:JSON.stringify({userId:user.id,number:selected,stake})});
  if(r.error) alert(r.error); else {qs('betStatus').innerText='Bet placed on '+selected; loadWallet(); loadBets();}
}

async function loadHistory(){
  let r=await api('/round/history?limit=10');
  let h=qs('history');h.innerHTML='';
  r.rounds.forEach(x=>{
    let d=document.createElement('div');
    d.innerText='Round '+x.round_no+': '+(x.winning_number||'?');
    h.appendChild(d);
  });
}

async function loadBets(){
  let r=await api('/bets/'+user.id+'?limit=10');
  let b=qs('bets');b.innerHTML='';
  r.bets.forEach(x=>{
    let d=document.createElement('div');
    d.innerText='Round '+x.round_id+' #'+x.number_chosen+' stake ₹'+(x.stake_paise/100).toFixed(2)+' → '+x.status;
    b.appendChild(d);
  });
}

async function showLedger(){
  let r=await api('/wallet/ledger/'+user.id+'?limit=20');
  let box=qs('ledgerBox');box.innerHTML='';
  r.ledger.forEach(x=>{
    let d=document.createElement('div');
    d.innerText=x.type+' '+(x.amount_paise/100).toFixed(2)+' reason '+x.reason;
    box.appendChild(d);
  });
  show(qs('modal'));
}

document.addEventListener('DOMContentLoaded',()=>{
  qs('loginBtn').onclick=login;
  qs('addBtn').onclick=addFunds;
  qs('wdBtn').onclick=withdraw;
  qs('betBtn').onclick=placeBet;
  qs('viewLedger').onclick=(e)=>{e.preventDefault();showLedger()};
  qs('closeModal').onclick=()=>hide(qs('modal'));
});
