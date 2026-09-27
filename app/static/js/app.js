
async function api(url, options={}){const r=await fetch(url,{headers:{"Content-Type":"application/json",...(options.headers||{})},...options});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||"Something went wrong");return d}
function openModal(id){document.getElementById(id)?.classList.add("open")}
function closeModal(id){document.getElementById(id)?.classList.remove("open")}
function toast(msg){const x=document.createElement("div");x.className="toast";x.textContent=msg;document.body.appendChild(x);setTimeout(()=>x.remove(),2800)}
function toggleSidebar(){document.getElementById("sidebar")?.classList.toggle("open")}
function showNotifications(){toast("You are all caught up.")}
function setupDates(ciId,coId){ciId=ciId||"checkIn";coId=coId||"checkOut";const today=new Date();const fmt=d=>d.toISOString().slice(0,10);const ci=document.getElementById(ciId),co=document.getElementById(coId);if(ci&&!ci.value){ci.min=fmt(today);ci.value=fmt(today)}if(co&&!co.value){let d=new Date(today);d.setDate(d.getDate()+2);co.min=fmt(d);co.value=fmt(d)}}
function filterRooms(){const q=(document.getElementById("roomSearch")?.value||"").toLowerCase();const type=document.getElementById("typeFilter")?.value||"";document.querySelectorAll("#roomGrid .room-card").forEach(c=>{c.style.display=(!q||c.dataset.search.toLowerCase().includes(q))&&(!type||c.dataset.type===type)?"":"none"})}
let bookingPrice=0;
function openBooking(id,type,price){document.getElementById("bookingRoomId").value=id;document.getElementById("bookingTitle").textContent="Book "+type;document.getElementById("bookingPrice").textContent="₹"+Number(price).toLocaleString("en-IN")+" per night";const searchCi=document.getElementById("checkIn"),searchCo=document.getElementById("checkOut"),modalCi=document.getElementById("modalCheckIn"),modalCo=document.getElementById("modalCheckOut");if(modalCi&&searchCi&&searchCi.value)modalCi.value=searchCi.value;if(modalCo&&searchCo&&searchCo.value)modalCo.value=searchCo.value;setupDates("modalCheckIn","modalCheckOut");openModal("bookingModal")}
async function submitBooking(e){e.preventDefault();try{const d=await api("/api/bookings",{method:"POST",body:JSON.stringify({room_id:document.getElementById("bookingRoomId").value,check_in:document.getElementById("modalCheckIn").value,check_out:document.getElementById("modalCheckOut").value,guests:document.getElementById("bookingGuests").value})});closeModal("bookingModal");toast("Booking confirmed • #RS-"+String(d.booking.id).padStart(4,"0"));setTimeout(()=>location.href="/bookings",600)}catch(e){toast(e.message)}}
async function initDashboard(){
 try{
  const d=await api("/api/dashboard");
  const labels={customer:"GUEST OVERVIEW",owner:"OWNER CONTROL CENTER",manager:"OPERATIONS",reception:"FRONT DESK",housekeeping:"HOUSEKEEPING",maintenance:"MAINTENANCE",admin:"ADMINISTRATION"};
  document.getElementById("dashEyebrow").textContent=labels[d.role]||"OVERVIEW";
  document.getElementById("dashTitle").textContent=d.role==="customer"?"Welcome back, "+(d.name||"Guest").split(" ")[0]:"Dashboard";
  if(d.role==="customer"){
   document.getElementById("dashStats").style.display="none";
   document.getElementById("dashContent").style.display="none";
   const root=document.getElementById("customerDashboard"); root.style.display="block";
   const booking=d.bookings&&d.bookings.length?d.bookings[0]:null;
   root.innerHTML=`
    <section class="customer-welcome scroll-pop"><div><span class="welcome-kicker">YOUR OCEANVIEW ESCAPE</span><h2>Hello, ${(d.name||"Guest").split(" ")[0]}!</h2><p>Have a great stay at OceanView Resort.</p></div><div class="welcome-avatar">${(d.name||"G").slice(0,1)}</div></section>
    <section class="customer-resort-banner scroll-pop"><img src="/static/images/hero.jpg" alt="OceanView Resort"><div class="banner-overlay"><div><span class="banner-kicker">OceanView Resort</span><h2>Luxury · Comfort · Nature</h2></div><a class="btn primary" href="/rooms">View Details</a></div></section>
    <section class="customer-section scroll-pop"><div class="customer-section-head"><div><span class="section-kicker">QUICK ACCESS</span><h3>Everything you need, one tap away</h3></div></div><div class="customer-quick-grid">
      <a class="customer-quick" href="/bookings"><span class="quick-icon blue">▣</span><b>My Bookings</b><small>View your stays</small></a>
      <a class="customer-quick" href="/rooms"><span class="quick-icon cyan">▰</span><b>Book a Room</b><small>Find your room</small></a>
      <a class="customer-quick" href="#dining"><span class="quick-icon pink">♨</span><b>Dining</b><small>Explore cuisine</small></a>
      <a class="customer-quick" href="#activities"><span class="quick-icon purple">✦</span><b>Activities</b><small>Things to do</small></a>
      <a class="customer-quick" href="/issues"><span class="quick-icon teal">◉</span><b>Support</b><small>Need assistance?</small></a>
    </div></section>
    <section class="customer-section scroll-pop"><div class="customer-section-head"><div><span class="section-kicker">UPCOMING BOOKING</span><h3>Your next stay</h3></div><a class="text-link" href="/bookings">View all →</a></div>
      ${booking?`<article class="upcoming-card"><img src="/static/images/room-101.jpg" alt="Deluxe Room"><div class="upcoming-info"><span class="booking-label">CONFIRMED STAY</span><h3>${booking.type}</h3><p>${booking.check_in} → ${booking.check_out} · ${booking.guests} guests</p><small>Room ${booking.room} · Booking #RS-${String(booking.id).padStart(4,"0")}</small></div><a href="/bookings" class="btn primary">View Details</a></article>`:`<article class="upcoming-card empty-booking"><div><span class="booking-label">READY WHEN YOU ARE</span><h3>Plan your next escape</h3><p>Discover our rooms and book your stay in a few clicks.</p></div><a href="/rooms" class="btn primary">Explore Rooms</a></article>`}
    </section>
    <section class="customer-feature-row">
      <article class="experience-card scroll-pop" id="dining"><div class="experience-image" style="background-image:url('/static/images/gallery-3.jpg')"></div><div><span class="section-kicker">DINE & UNWIND</span><h3>Curated dining experiences</h3><p>From relaxed breakfasts to memorable dinners, discover the flavours waiting for you.</p><a href="#" class="text-link" onclick="toast('Dining module coming soon');return false">Explore dining →</a></div></article>
      <article class="experience-card scroll-pop" id="activities"><div class="experience-image" style="background-image:url('/static/images/gallery-1.jpg')"></div><div><span class="section-kicker">MAKE MEMORIES</span><h3>Resort activities</h3><p>Poolside moments, wellness, events and experiences designed around your stay.</p><a href="#" class="text-link" onclick="toast('Activities module coming soon');return false">Discover activities →</a></div></article>
    </section>
    <section class="customer-trust scroll-pop"><div><span>✦</span><b>Personalized service</b><small>Support whenever you need it</small></div><div><span>◇</span><b>Seamless stays</b><small>Your bookings in one place</small></div><div><span>♨</span><b>Resort experiences</b><small>More than just a room</small></div></section>`;
   setupCustomerScrollReveal();
   return;
  }
  document.getElementById("dashStats").innerHTML=d.stats.map(s=>`<div class="stat-card"><div><span>${s.label}</span><b>${s.value}</b><small>Live system data</small></div><div class="stat-icon">✦</div></div>`).join("");
  const content=`<div class="panel"><div class="panel-head"><h3>Recent Bookings</h3><a class="text-link" href="/reports">Analytics →</a></div><div class="activity-list">${(d.bookings||[]).map(b=>`<div class="activity"><div><b>${b.guest} · ${b.type}</b><small>Room ${b.room} · ${b.check_in} → ${b.check_out}</small></div><strong>₹${Number(b.total).toLocaleString("en-IN")}</strong></div>`).join("")}</div></div><div class="panel"><div class="panel-head"><h3>Room Status</h3><a class="text-link" href="/rooms">Manage →</a></div><div class="activity-list">${(d.rooms||[]).slice(0,6).map(r=>`<div class="activity"><div><b>Room ${r.number}</b><small>${r.type}</small></div><span class="status-badge ${r.status.toLowerCase()}">${r.status}</span></div>`).join("")}</div></div>`;
  document.getElementById("dashContent").innerHTML=content;
 }catch(e){toast(e.message)}
}

function setupCustomerScrollReveal(){
 const nodes=document.querySelectorAll('#customerDashboard .scroll-pop');
 const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(reduce){nodes.forEach(n=>n.classList.add('show'));return}
 const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('show');io.unobserve(e.target)}}),{threshold:.18,rootMargin:'0px 0px -60px 0px'});
 nodes.forEach(n=>io.observe(n));
}

async function loadStaff(){try{const data=await api("/api/staff");document.querySelector("#staffTable tbody").innerHTML=data.map(s=>`<tr><td><div class="user-mini"><div class="avatar">${s.name[0]}</div><span>${s.name}</span></div></td><td>${s.role}</td><td>${s.department}</td><td><span class="pill success">${s.status}</span></td><td>${s.email}</td></tr>`).join("")}catch(e){toast(e.message)}}
async function addStaff(e){e.preventDefault();try{await api("/api/staff",{method:"POST",body:JSON.stringify({name:staffName.value,email:staffEmail.value,role:staffRole.value,department:staffDept.value})});closeModal("staffModal");toast("Staff member created");loadStaff()}catch(e){toast(e.message)}}
async function loadTasks(){try{const [tasks,staff]=await Promise.all([api("/api/tasks"),api("/api/staff")]);taskAssignee.innerHTML='<option value="">Unassigned</option>'+staff.map(s=>`<option value="${s.id}">${s.name} · ${s.role}</option>`).join("");document.getElementById("taskStats").innerHTML=["Pending","In Progress","Completed","High Priority"].map((x,i)=>`<div class="stat-card"><div><span>${x}</span><b>${i===0?tasks.filter(t=>t.status==="Pending").length:i===1?tasks.filter(t=>t.status==="In Progress").length:i===2?tasks.filter(t=>t.status==="Completed").length:tasks.filter(t=>t.priority==="High").length}</b></div><div class="stat-icon">✓</div></div>`).join("");document.getElementById("taskBody").innerHTML=tasks.map(t=>`<tr><td><b>${t.title}</b><small>${t.type}</small></td><td>${t.room||"—"}</td><td>${t.assignee}</td><td><span class="pill ${t.priority==="High"?"danger":t.priority==="Low"?"success":"warning"}">${t.priority}</span></td><td><span class="pill ${t.status==="Completed"?"success":t.status==="In Progress"?"warning":""}">${t.status}</span></td><td><button class="btn small ghost" onclick="advanceTask(${t.id},'${t.status}')">Update</button></td></tr>`).join("")}catch(e){toast(e.message)}}
function openTaskModal(){openModal("taskModal")}
async function createTask(e){e.preventDefault();try{await api("/api/tasks",{method:"POST",body:JSON.stringify({title:taskTitle.value,type:taskType.value,room:taskRoom.value,priority:taskPriority.value,assigned_to:taskAssignee.value})});closeModal("taskModal");toast("Task assigned");loadTasks()}catch(e){toast(e.message)}}
async function advanceTask(id,status){const next=status==="Pending"?"In Progress":status==="In Progress"?"Completed":"Pending";try{await api("/api/tasks/"+id,{method:"PATCH",body:JSON.stringify({status:next})});loadTasks()}catch(e){toast(e.message)}}
async function loadIssues(){try{const data=await api("/api/issues");document.getElementById("issueBody").innerHTML=data.map(i=>`<tr><td><b>${i.title}</b><small>${i.description||""}</small></td><td>${i.room||"—"}</td><td>${i.category}</td><td><span class="pill ${i.priority==="High"?"danger":i.priority==="Low"?"success":"warning"}">${i.priority}</span></td><td><span class="pill ${i.status==="Resolved"?"success":""}">${i.status}</span></td><td><button class="btn small ghost" onclick="resolveIssue(${i.id})">Resolve</button></td></tr>`).join("")}catch(e){toast(e.message)}}
async function createIssue(e){e.preventDefault();try{await api("/api/issues",{method:"POST",body:JSON.stringify({title:issueTitle.value,room:issueRoom.value,category:issueCategory.value,priority:issuePriority.value,description:issueDescription.value})});closeModal("issueModal");toast("Issue reported and routed");loadIssues()}catch(e){toast(e.message)}}
async function resolveIssue(id){try{await api("/api/issues/"+id,{method:"PATCH",body:JSON.stringify({status:"Resolved"})});loadIssues()}catch(e){toast(e.message)}}
document.addEventListener("keydown",e=>{if(e.key==="Escape")document.querySelectorAll(".modal.open").forEach(m=>m.classList.remove("open"))})
document.addEventListener("DOMContentLoaded",()=>{document.querySelectorAll("[data-image]").forEach(el=>{const f=el.dataset.image;el.style.setProperty("--img",`url("/static/images/${f}")`);el.addEventListener("error",()=>{})})})

async function loadAllocation(){
 try{
  const d=await api("/api/dashboard");
  const rows=(d.bookings||[]);
  const rooms=(d.rooms||[]).filter(r=>["Available","Cleaning"].includes(r.status));
  document.getElementById("allocationBody").innerHTML=rows.map(b=>`
   <tr>
    <td><b>${b.guest}</b><small>${b.guest_email||""}</small></td>
    <td><b>G-${String(b.guest_id).padStart(4,"0")}</b></td>
    <td>${b.check_in} → ${b.check_out}<small>${b.guests} guest(s)</small></td>
    <td>₹${Number(b.total||0).toLocaleString("en-IN")}</td>
    <td><span class="pill ${Number(b.paid||0)>=Number(b.total||0)?"success":"warning"}">₹${Number(b.paid||0).toLocaleString("en-IN")}</span></td>
    <td>Room ${b.room}</td>
    <td><select id="alloc-${b.id}" class="compact-select">${rooms.map(r=>`<option value="${r.number}">Room ${r.number} · ${r.status}</option>`).join("")}</select>
    <button class="btn small primary" onclick="allocateBooking(${b.id})">Allocate</button></td>
   </tr>`).join("")||'<tr><td colspan="7" class="empty">No arrivals.</td></tr>';
 }catch(e){toast(e.message)}
}
async function allocateBooking(id){
 try{
  const sel=document.getElementById("alloc-"+id); const d=await api("/api/dashboard");
  const room=d.rooms.find(r=>r.number===sel.value); if(!room)throw Error("Room unavailable");
  await api("/api/allocation/"+id,{method:"POST",body:JSON.stringify({room_id:room.id})});
  toast("Room allocated successfully"); loadAllocation();
 }catch(e){toast(e.message)}
}

/* =========================================================
   RESORTOS MOTION ENGINE
   ========================================================= */
(function(){
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setupReveal(){
    const nodes=document.querySelectorAll('.section,.room-grid,.feature-grid,.gallery-grid,.panel,.table-panel,.analytics-grid,.settings-grid,.filter-bar');
    if(reduce){return}
    // Do not animate anything that is already visible on initial page load.
    // Only elements encountered after the user scrolls are eligible for reveal motion.
    const io=new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(!e.isIntersecting) return;
        e.target.classList.add('reveal');
        requestAnimationFrame(()=>e.target.classList.add('in-view'));
        io.unobserve(e.target);
      })
    },{threshold:.10,rootMargin:'0px 0px -20px 0px'});
    nodes.forEach(el=>{
      const rect=el.getBoundingClientRect();
      if(rect.top > window.innerHeight * 0.92){
        el.classList.add('reveal');
        io.observe(el);
      }
    });
  }

  function setupStagger(){
    document.querySelectorAll('.room-grid,.feature-grid,.gallery-grid,.quick-grid').forEach(el=>{
      el.classList.add('reveal-stagger');
      if(reduce){el.classList.add('in-view');return}
      const io=new IntersectionObserver((entries)=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in-view');io.unobserve(e.target)}}),{threshold:.08});
      io.observe(el);
    });
  }

  function setupNav(){
    const nav=document.querySelector('.public-nav');
    if(!nav)return;
    const update=()=>nav.classList.toggle('scrolled',window.scrollY>35);
    update();window.addEventListener('scroll',update,{passive:true});
  }

  function setupRipple(){
    document.addEventListener('click',(e)=>{
      const b=e.target.closest('.btn,.icon-btn,.quick');
      if(!b)return;
      const r=document.createElement('span');r.className='ripple';
      const rect=b.getBoundingClientRect();const size=Math.max(rect.width,rect.height);
      r.style.width=r.style.height=size+'px';r.style.left=(e.clientX-rect.left-size/2)+'px';r.style.top=(e.clientY-rect.top-size/2)+'px';
      b.appendChild(r);setTimeout(()=>r.remove(),700);
    });
  }

  function setupTilt(){
    if(reduce || window.innerWidth<900)return;
    document.querySelectorAll('.room-card,.feature,.stat-card').forEach(card=>{
      card.addEventListener('pointermove',(e)=>{
        const r=card.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;
        card.style.transform=`perspective(850px) rotateX(${(-y*3).toFixed(2)}deg) rotateY(${(x*4).toFixed(2)}deg) translateY(-7px)`;
      });
      card.addEventListener('pointerleave',()=>card.style.transform='');
    });
  }

  function setupParallax(){
    if(reduce)return;
    const hero=document.querySelector('.hero-content');
    if(!hero)return;
    window.addEventListener('scroll',()=>{
      if(window.scrollY<800) hero.style.transform=`translate3d(0,${window.scrollY*.10}px,0)`;
    },{passive:true});
  }

  function animateNumbers(){
    const els=document.querySelectorAll('.stat-card b[data-count], .count-up');
    els.forEach(el=>{
      const target=parseFloat(el.dataset.count||el.textContent.replace(/[^0-9.]/g,''));if(!Number.isFinite(target))return;
      const prefix=el.dataset.prefix||'';const suffix=el.dataset.suffix||'';let start=0;const duration=900;const t0=performance.now();
      const tick=(t)=>{const p=Math.min(1,(t-t0)/duration);const eased=1-Math.pow(1-p,3);el.textContent=prefix+Math.round(start+(target-start)*eased).toLocaleString('en-IN')+suffix;if(p<1)requestAnimationFrame(tick)};
      requestAnimationFrame(tick);
    });
  }

  function setupImageFallback(){
    document.querySelectorAll('[data-image]').forEach(el=>{
      const f=el.dataset.image;if(!f)return;
      const img=new Image();img.src='/static/images/'+f;
      img.onerror=()=>{el.classList.add('missing-image');el.querySelector('span')?.setAttribute('title','Add '+f+' to app/static/images')};
    });
  }

  document.addEventListener('DOMContentLoaded',()=>{
    setupNav();setupReveal();setupStagger();setupRipple();setupTilt();setupParallax();setupImageFallback();
    setTimeout(animateNumbers,350);
  });
})();

/* =========================================================
   RESORTOS ROLE-BASED OPERATIONS CENTER
   ========================================================= */
async function initOperations(){
  try{
    const d=await api('/api/dashboard');
    window.opsRole=d.role;
    const labels={owner:['Executive Operations','Revenue, occupancy, people and risk in one place.'],manager:['Manager Control Center','Coordinate rooms, staff, work orders, requests and inventory.'],reception:['Front Desk','Check-ins, check-outs, room allocation and guest requests.'],housekeeping:['Housekeeping Workboard','Your assigned cleaning tasks and guest service requests.'],maintenance:['Maintenance Workboard','Work orders, issues, repair status and estimated costs.'],admin:['Admin Console','User access, audit history and system controls.'],customer:['Guest Services','Request resort services and track your requests.']};
    const l=labels[d.role]||labels.manager; document.getElementById('opsTitle').textContent=l[0]; document.getElementById('opsSubtitle').textContent=l[1];
    renderOpsTabs(d.role); await loadOpsTab('overview');
  }catch(e){toast(e.message)}
}
function renderOpsTabs(role){
 const tabs={owner:['overview','work','requests','inventory','access','audit'],manager:['overview','work','requests','inventory','access','audit'],reception:['overview','frontdesk','requests'],housekeeping:['overview','work','requests'],maintenance:['overview','work','requests','inventory'],admin:['overview','access','inventory','audit','work','requests'],customer:['overview','requests']};
 const names={overview:'Overview',frontdesk:'Front Desk',work:'Work Orders',requests:'Service Requests',inventory:'Inventory',access:'User Access',audit:'Audit Log'};
 document.getElementById('opsTabs').innerHTML=(tabs[role]||tabs.manager).map((x,i)=>`<button class="ops-tab ${i===0?'active':''}" onclick="loadOpsTab('${x}',this)">${names[x]}</button>`).join('');
}
async function loadOpsTab(tab,btn){
 document.querySelectorAll('.ops-tab').forEach(x=>x.classList.remove('active')); if(btn)btn.classList.add('active');
 const main=document.getElementById('opsMain'); const kpi=document.getElementById('opsKpis');
 try{
  if(tab==='overview') return renderOpsOverview();
  if(tab==='work') return renderWorkOrders();
  if(tab==='requests') return renderServiceRequests();
  if(tab==='inventory') return renderInventory();
  if(tab==='access') return renderAccess();
  if(tab==='audit') return renderAudit();
  if(tab==='frontdesk') return renderFrontDesk();
 }catch(e){toast(e.message)}
}
async function renderOpsOverview(){
 const a=await api('/api/analytics').catch(()=>null); const k=document.getElementById('opsKpis');
 if(a){k.innerHTML=[['Occupancy',`${a.occupied}/${a.rooms}`,'rooms occupied'],['Revenue',`₹${Number(a.revenue).toLocaleString('en-IN')}`,'recorded revenue'],['Open Issues',a.open_issues,'need attention'],['Low Stock',a.low_stock,'items at/below minimum']].map(x=>`<div class="ops-kpi"><span>${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small></div>`).join('')}
 const role=window.opsRole; let extra='';
 if(role==='customer'){const r=await api('/api/service-requests');extra=`<div class="ops-panel"><div class="ops-panel-head"><div><h3>My Service Requests</h3><p class="muted">Live guest assistance requests.</p></div><button class="btn primary" onclick="openServiceModal()">＋ Request Service</button></div>${requestRows(r)}</div>`}
 else {const [w,i]=await Promise.all([api('/api/work-orders').catch(()=>[]),api('/api/issues').catch(()=>[])]);extra=`<div class="ops-panel"><div class="ops-panel-head"><div><h3>Priority Operations</h3><p class="muted">Work orders and issues that need attention.</p></div></div>${w.length?workRows(w.slice(0,6)):'<div class="ops-empty">No work orders.</div>'}</div><div class="ops-panel"><div class="ops-panel-head"><div><h3>Open Issues</h3><p class="muted">Current resort incidents.</p></div></div>${i.length?issueRows(i.slice(0,6)):'<div class="ops-empty">No open issues.</div>'}</div>`}
 document.getElementById('opsMain').innerHTML=extra;
}
function workRows(rows){return `<div class="ops-table-wrap"><table class="ops-table"><thead><tr><th>Work</th><th>Room</th><th>Assignee</th><th>Priority</th><th>Status</th><th></th></tr></thead><tbody>${rows.map(w=>`<tr><td><b>${esc(w.title)}</b><small>${esc(w.category)}</small></td><td>${esc(w.room)}</td><td>${esc(w.assignee)}</td><td>${chip(w.priority)}</td><td>${chip(w.status)}</td><td><button class="btn small ghost" onclick="advanceWork(${w.id},'${w.status}')">Update</button></td></tr>`).join('')}</tbody></table></div>`}
function issueRows(rows){return `<div class="ops-table-wrap"><table class="ops-table"><thead><tr><th>Issue</th><th>Room</th><th>Category</th><th>Priority</th><th>Status</th></tr></thead><tbody>${rows.map(i=>`<tr><td><b>${esc(i.title)}</b><small>${esc(i.description||'')}</small></td><td>${esc(i.room||'—')}</td><td>${esc(i.category)}</td><td>${chip(i.priority)}</td><td>${chip(i.status)}</td></tr>`).join('')}</tbody></table></div>`}
function requestRows(rows){return `<div class="ops-table-wrap"><table class="ops-table"><thead><tr><th>Service</th><th>Room</th><th>Requester</th><th>Priority</th><th>Status</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${esc(r.service_type)}</b><small>${esc(r.details)}</small></td><td>${esc(r.room)}</td><td>${esc(r.requester)}</td><td>${chip(r.priority)}</td><td>${chip(r.status)}</td></tr>`).join('')}</tbody></table></div>`}
function chip(v){const s=String(v||'').toLowerCase();let c=s.includes('high')||s.includes('open')?'danger-chip':s.includes('completed')||s.includes('resolved')||s.includes('paid')?'success-chip':s.includes('progress')||s.includes('normal')?'warn-chip':'role-chip';return `<span class="${c}">${esc(v)}</span>`}
function esc(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
async function renderWorkOrders(){const rows=await api('/api/work-orders');document.getElementById('opsKpis').innerHTML=[['Total Work',rows.length,'visible work orders'],['Open',rows.filter(x=>x.status==='Open').length,'not started'],['In Progress',rows.filter(x=>x.status==='In Progress').length,'active repairs'],['High Priority',rows.filter(x=>x.priority==='High').length,'priority queue']].map(x=>`<div class="ops-kpi"><span>${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small></div>`).join('');document.getElementById('opsMain').innerHTML=`<div class="ops-panel"><div class="ops-panel-head"><div><h3>Maintenance Work Orders</h3><p class="muted">Track repairs from assignment to completion.</p></div><button class="btn primary" onclick="openWorkModal()">＋ New Work Order</button></div>${rows.length?workRows(rows):'<div class="ops-empty">No work orders yet.</div>'}</div>`}
async function advanceWork(id,status){const next=status==='Open'?'In Progress':status==='In Progress'?'Completed':'Open';await api('/api/work-orders/'+id,{method:'PATCH',body:JSON.stringify({status:next})});toast('Work order updated');renderWorkOrders()}
async function renderServiceRequests(){const rows=await api('/api/service-requests');document.getElementById('opsKpis').innerHTML=[['Requests',rows.length,'visible requests'],['Requested',rows.filter(x=>x.status==='Requested').length,'awaiting action'],['Assigned',rows.filter(x=>x.status==='Assigned').length,'staff assigned'],['Completed',rows.filter(x=>x.status==='Completed').length,'closed requests']].map(x=>`<div class="ops-kpi"><span>${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small></div>`).join('');document.getElementById('opsMain').innerHTML=`<div class="ops-panel"><div class="ops-panel-head"><div><h3>Service Requests</h3><p class="muted">Guest requests routed to the correct operational team.</p></div>${window.opsRole==='customer'?'<button class="btn primary" onclick="openServiceModal()">＋ New Request</button>':''}</div>${rows.length?requestRows(rows):'<div class="ops-empty">No service requests.</div>'}</div>`}
async function renderInventory(){const rows=await api('/api/inventory');document.getElementById('opsKpis').innerHTML=[['Items',rows.length,'stock records'],['Low Stock',rows.filter(x=>x.low).length,'reorder attention'],['Units',rows.reduce((a,x)=>a+x.quantity,0),'total units'],['Locations',new Set(rows.map(x=>x.location)).size,'storage locations']].map(x=>`<div class="ops-kpi"><span>${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small></div>`).join('');document.getElementById('opsMain').innerHTML=`<div class="ops-panel"><div class="ops-panel-head"><div><h3>Inventory & Supplies</h3><p class="muted">Keep housekeeping and maintenance stocked.</p></div>${['owner','manager','admin'].includes(window.opsRole)?'<button class="btn primary" onclick="openInventoryModal()">＋ Add Item</button>':''}</div><div class="ops-table-wrap"><table class="ops-table"><thead><tr><th>Item</th><th>Category</th><th>Quantity</th><th>Minimum</th><th>Location</th><th>Status</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${esc(x.name)}</b><small>${esc(x.unit)}</small></td><td>${esc(x.category)}</td><td><b>${x.quantity}</b></td><td>${x.min_quantity}</td><td>${esc(x.location)}</td><td>${x.low?'<span class="danger-chip">Reorder</span>':'<span class="success-chip">Healthy</span>'}</td></tr>`).join('')}</tbody></table></div></div>`}
async function renderAccess(){const rows=await api('/api/admin/users');document.getElementById('opsKpis').innerHTML=[['Users',rows.length,'all accounts'],['Active',rows.filter(x=>x.status==='Active').length,'enabled'],['Staff',rows.filter(x=>x.role!=='customer').length,'operational accounts'],['Admins',rows.filter(x=>x.role==='admin').length,'system admins']].map(x=>`<div class="ops-kpi"><span>${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small></div>`).join('');document.getElementById('opsMain').innerHTML=`<div class="ops-panel"><div class="ops-panel-head"><div><h3>User Access Control</h3><p class="muted">Admin can change roles and account status.</p></div></div><div class="ops-table-wrap"><table class="ops-table"><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Department</th><th>Action</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${esc(x.name)}</b></td><td>${esc(x.email)}</td><td><select id="role-${x.id}">${['customer','owner','manager','reception','housekeeping','maintenance','admin'].map(r=>`<option ${x.role===r?'selected':''}>${r}</option>`).join('')}</select></td><td><select id="status-${x.id}"><option ${x.status==='Active'?'selected':''}>Active</option><option ${x.status==='Inactive'?'selected':''}>Inactive</option></select></td><td>${esc(x.department)}</td><td><button class="btn small primary" onclick="saveUserAccess(${x.id})">Save</button></td></tr>`).join('')}</tbody></table></div></div>`}
async function saveUserAccess(id){await api('/api/admin/users/'+id,{method:'PATCH',body:JSON.stringify({role:document.getElementById('role-'+id).value,status:document.getElementById('status-'+id).value})});toast('User access updated')}
async function renderAudit(){const rows=await api('/api/audit');document.getElementById('opsKpis').innerHTML=[['Events',rows.length,'latest records'],['Today',rows.filter(x=>x.created_at.includes(new Date().getFullYear())).length,'recent activity'],['Users',new Set(rows.map(x=>x.user)).size,'actors'],['Tracked','Live','audit trail']].map(x=>`<div class="ops-kpi"><span>${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small></div>`).join('');document.getElementById('opsMain').innerHTML=`<div class="ops-panel"><div class="ops-panel-head"><div><h3>Audit Trail</h3><p class="muted">Who changed what across ResortOS.</p></div></div><div class="ops-table-wrap"><table class="ops-table"><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${x.created_at}</td><td>${esc(x.user)}</td><td><b>${esc(x.action)}</b></td><td>${esc(x.entity||'—')}</td><td>${esc(x.details)}</td></tr>`).join('')}</tbody></table></div></div>`}
async function renderFrontDesk(){const d=await api('/api/dashboard');const rows=d.bookings||[];document.getElementById('opsKpis').innerHTML=[['Arrivals',rows.filter(x=>x.status==='Confirmed').length,'ready to check in'],['Checked In',rows.filter(x=>x.status==='Checked In').length,'in house'],['Checked Out',rows.filter(x=>x.status==='Checked Out').length,'departed'],['Rooms',d.rooms?.length||0,'inventory']].map(x=>`<div class="ops-kpi"><span>${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small></div>`).join('');document.getElementById('opsMain').innerHTML=`<div class="ops-panel"><div class="ops-panel-head"><div><h3>Front Desk Arrivals</h3><p class="muted">Check guests in/out and continue to room allocation.</p></div></div><div class="ops-table-wrap"><table class="ops-table"><thead><tr><th>Guest</th><th>Room</th><th>Dates</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${esc(x.guest)}</b></td><td>Room ${x.room}</td><td>${x.check_in} → ${x.check_out}</td><td>${chip(x.status)}</td><td>${x.status==='Confirmed'?`<button class="btn small primary" onclick="frontDeskAction('in',${x.id})">Check In</button>`:x.status==='Checked In'?`<button class="btn small ghost" onclick="frontDeskAction('out',${x.id})">Check Out</button>`:'—'}</td></tr>`).join('')}</tbody></table></div></div>`}
async function frontDeskAction(type,id){await api('/api/'+(type==='in'?'check-in':'check-out')+'/'+id,{method:'POST'});toast(type==='in'?'Guest checked in':'Guest checked out');renderFrontDesk()}
function openRoleModal(){if(['maintenance','manager','owner','admin'].includes(window.opsRole))openWorkModal();else openServiceModal()}
function openWorkModal(){document.getElementById('roleModalContent').innerHTML=`<div class="modal-head"><p class="eyebrow">OPERATIONS</p><h2>Create Work Order</h2></div><form class="ops-form" onsubmit="submitWork(event)"><label>Title<input id="wTitle" required placeholder="AC inspection / repair"></label><label>Category<select id="wCategory"><option>HVAC</option><option>Plumbing</option><option>Electrical</option><option>General</option></select></label><label>Room<input id="wRoom" placeholder="302"></label><label>Priority<select id="wPriority"><option>Medium</option><option>High</option><option>Low</option></select></label><label>Estimated Cost<input id="wCost" type="number" min="0" value="0"></label><label>Due Date<input id="wDue" type="date"></label><label class="full">Notes<textarea id="wNotes" rows="4"></textarea></label><div class="full"><button class="btn primary">Create Work Order</button></div></form>`;openModal('roleModal')}
async function submitWork(e){e.preventDefault();await api('/api/work-orders',{method:'POST',body:JSON.stringify({title:wTitle.value,category:wCategory.value,room:wRoom.value,priority:wPriority.value,estimated_cost:wCost.value,due_at:wDue.value,notes:wNotes.value})});closeModal('roleModal');toast('Work order created');renderWorkOrders()}
function openServiceModal(){document.getElementById('roleModalContent').innerHTML=`<div class="modal-head"><p class="eyebrow">GUEST SERVICES</p><h2>Request a Service</h2></div><form class="ops-form" onsubmit="submitService(event)"><label>Service Type<select id="sType"><option>Extra Towels</option><option>Room Cleaning</option><option>Maintenance</option><option>Room Service</option><option>Airport Transfer</option><option>Other</option></select></label><label>Room Number<input id="sRoom" placeholder="101"></label><label>Priority<select id="sPriority"><option>Normal</option><option>High</option></select></label><label class="full">Details<textarea id="sDetails" rows="4" required placeholder="Tell the team what you need..."></textarea></label><div class="full"><button class="btn primary">Send Request</button></div></form>`;openModal('roleModal')}
async function submitService(e){e.preventDefault();await api('/api/service-requests',{method:'POST',body:JSON.stringify({service_type:sType.value,room:sRoom.value,priority:sPriority.value,details:sDetails.value})});closeModal('roleModal');toast('Service request sent');renderServiceRequests()}
function openInventoryModal(){document.getElementById('roleModalContent').innerHTML=`<div class="modal-head"><p class="eyebrow">STOCK</p><h2>Add Inventory Item</h2></div><form class="ops-form" onsubmit="submitInventory(event)"><label>Item Name<input id="iName" required></label><label>Category<input id="iCategory" value="General"></label><label>Quantity<input id="iQty" type="number" value="0"></label><label>Minimum Quantity<input id="iMin" type="number" value="5"></label><label>Unit<input id="iUnit" value="pcs"></label><label>Location<input id="iLocation" value="Store"></label><div class="full"><button class="btn primary">Add Item</button></div></form>`;openModal('roleModal')}
async function submitInventory(e){e.preventDefault();await api('/api/inventory',{method:'POST',body:JSON.stringify({name:iName.value,category:iCategory.value,quantity:iQty.value,min_quantity:iMin.value,unit:iUnit.value,location:iLocation.value})});closeModal('roleModal');toast('Inventory item added');renderInventory()}

/* ---------------- GenAI UI ---------------- */
async function aiAsk(message){
  const input=document.getElementById('aiInput');
  if(input){input.value=message;}
  await sendAIChat(null,message);
}
async function sendAIChat(e, preset){
  if(e) e.preventDefault();
  const input=document.getElementById('aiInput');
  const message=(preset || (input?input.value:'' ) || '').trim();
  if(!message) return;
  addAIMessage('user',message);
  if(input) input.value='';
  addAIMessage('bot','Thinking…','ai-thinking');
  try{
    const r=await api('/api/ai/chat',{method:'POST',body:JSON.stringify({message})});
    document.querySelector('.ai-thinking')?.remove();
    addAIMessage('bot',r.answer || 'I could not generate a response right now.');
  }catch(err){
    document.querySelector('.ai-thinking')?.remove();
    addAIMessage('bot','AI service is temporarily unavailable. The local ResortOS features are still working.');
  }
}
function addAIMessage(type,text,cls=''){
  const box=document.getElementById('aiMessages'); if(!box) return;
  const el=document.createElement('div'); el.className=`ai-msg ${type} ${cls}`;
  el.innerHTML=`<b>${type==='user'?'You':'ResortOS AI'}</b><span>${esc(text).replace(/\n/g,'<br>')}</span>`;
  box.appendChild(el); box.scrollTop=box.scrollHeight;
}
async function loadAIInsight(){
  const out=document.getElementById('aiInsight'); if(!out) return;
  out.textContent='Analyzing live operations…';
  try{
    const r=await api('/api/ai/insight',{method:'POST',body:JSON.stringify({})});
    out.innerHTML=esc(r.insight||'No insight available.').replace(/\n/g,'<br>');
    if(r.metrics){
      const m=r.metrics;
      document.getElementById('aiIssues').textContent=m.open_issues;
      document.getElementById('aiTasks').textContent=m.pending_tasks;
      document.getElementById('aiStock').textContent=m.low_stock;
    }
  }catch(e){out.textContent='Unable to load live AI insight.';}
}
async function triageIssue(e){
  e.preventDefault();
  const out=document.getElementById('triageResult'); out.classList.remove('muted'); out.textContent='AI is analyzing and routing this issue…';
  try{
    const r=await api('/api/ai/triage',{method:'POST',body:JSON.stringify({title:triageTitle.value,description:triageDescription.value,room:triageRoom.value,category:triageCategory.value})});
    const t=r.triage;
    out.innerHTML=`<div class="triage-result"><div class="triage-pill">${esc(t.department)}</div><div class="triage-pill priority-${String(t.priority).toLowerCase()}">${esc(t.priority)} Priority</div><h4>${esc(t.summary)}</h4><p>${esc(t.recommended_action)}</p></div>`;
  }catch(err){out.textContent='Could not analyze this issue right now.';}
}
function initAIPage(){
  if(document.getElementById('aiInsight')) loadAIInsight();
  const io=new IntersectionObserver(entries=>entries.forEach(x=>{if(x.isIntersecting)x.target.classList.add('show')}),{threshold:.14});
  document.querySelectorAll('.ai-page .scroll-pop').forEach(x=>io.observe(x));
}

/* ===== Settings page: tabs + real save actions ===== */
function showSettingsTab(id, btn){
  document.querySelectorAll('.settings-panel').forEach(p=>p.style.display='none');
  const panel=document.getElementById('panel-'+id);
  if(panel) panel.style.display='';
  document.querySelectorAll('.settings-nav button').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
}
async function saveProfile(){
  try{
    const name=document.getElementById('profileName').value.trim();
    const phone=document.getElementById('profilePhone').value.trim();
    if(!name){toast('Please enter your name');return}
    await api('/api/profile',{method:'PATCH',body:JSON.stringify({name,phone})});
    toast('Profile updated successfully');
  }catch(e){toast(e.message)}
}
async function saveResortSettings(){
  try{
    const payload={
      resort_name:document.getElementById('resortName').value.trim(),
      email:document.getElementById('resortEmail').value.trim(),
      phone:document.getElementById('resortPhone').value.trim(),
      address:document.getElementById('resortAddress').value.trim(),
      timezone:document.getElementById('resortTimezone').value,
      currency:document.getElementById('resortCurrency').value
    };
    await api('/api/resort-settings',{method:'PATCH',body:JSON.stringify(payload)});
    toast('Resort settings saved successfully');
  }catch(e){toast(e.message)}
}
async function changeUserPassword(){
  try{
    const current_password=document.getElementById('currentPassword').value;
    const new_password=document.getElementById('newPassword').value;
    const confirm=document.getElementById('confirmPassword').value;
    if(!current_password||!new_password){toast('Please fill in all password fields');return}
    if(new_password!==confirm){toast('New passwords do not match');return}
    await api('/api/change-password',{method:'POST',body:JSON.stringify({current_password,new_password})});
    document.getElementById('currentPassword').value='';
    document.getElementById('newPassword').value='';
    document.getElementById('confirmPassword').value='';
    toast('Password updated successfully');
  }catch(e){toast(e.message)}
}

/* Customer AI Agent */
async function sendAIChat(e){
 e.preventDefault();
 const input=document.getElementById("aiInput"); const msg=(input.value||"").trim(); if(!msg)return;
 const box=document.getElementById("aiMessages");
 box.insertAdjacentHTML("beforeend",`<div class="ai-msg user"><span>${escapeHtml(msg)}</span></div>`);
 input.value=""; box.insertAdjacentHTML("beforeend",`<div class="ai-msg bot thinking" id="aiThinking"><b>ResortOS AI</b><span>Thinking about your request…</span></div>`);
 box.scrollTop=box.scrollHeight;
 try{
  const d=await api("/api/ai/chat",{method:"POST",body:JSON.stringify({message:msg})});
  document.getElementById("aiThinking")?.remove();
  let meta="";
  if(d.action && d.action!=="none") meta=`<small class="ai-action">✓ ${escapeHtml(d.action.replaceAll("_"," "))} · routed to ${escapeHtml(d.authority||"Management")}</small>`;
  box.insertAdjacentHTML("beforeend",`<div class="ai-msg bot"><b>ResortOS AI</b><span>${escapeHtml(d.answer||"Done.")}</span>${meta}</div>`);
 }catch(err){
  document.getElementById("aiThinking")?.remove();
  box.insertAdjacentHTML("beforeend",`<div class="ai-msg bot"><b>ResortOS AI</b><span>${escapeHtml(err.message)}</span></div>`);
 }
 box.scrollTop=box.scrollHeight;
}
function aiAsk(text){const i=document.getElementById("aiInput");if(i){i.value=text;i.focus()}}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function initAIPage(){document.getElementById("aiInput")?.focus()}
async function loadAIInsight(){try{const d=await api("/api/ai/analytics",{method:"POST"});document.getElementById("aiInsight").textContent=d.analytics}catch(e){toast(e.message)}}

/* ===== Autonomous Issue Intelligence ===== */
async function runIssueIntelligence(e){
  e.preventDefault();
  const input=document.getElementById('issueIntelMessage'), btn=document.getElementById('issueIntelBtn'), thinking=document.getElementById('issueIntelThinking'), out=document.getElementById('issueIntelResult');
  const message=(input?.value||'').trim(); if(!message)return;
  btn.disabled=true; thinking.style.display='block'; out.style.display='none'; out.innerHTML='';
  try{
    const r=await api('/api/ai/issue-intelligence',{method:'POST',body:JSON.stringify({message})});
    const d=r.decision||{}, result=r.result||{};
    const pc=String(d.priority||'Medium').toLowerCase();
    out.innerHTML=`<div class="triage-result intelligence-result"><div><span class="triage-pill">${esc(d.authority||'Manager')}</span><span class="triage-pill">${esc(d.category||'General')}</span><span class="triage-pill priority-${pc}">${esc(d.priority||'Medium')} Priority</span></div><h4>${esc(d.title||'AI-detected issue')}</h4><p><strong>AI decision:</strong> ${esc(d.recommended_action||'Route to the responsible team.')}</p><p><strong>Why this route:</strong> ${esc(d.reason||'Operational routing based on the message.')}</p><div class="ai-action-success">✓ ${esc(d.customer_response||'The request has been analyzed and routed.')}${result.id?` <small>Action ID #${esc(result.id)}</small>`:''}</div></div>`;
    out.style.display='block';
    input.value='';
  }catch(err){ out.innerHTML=`<div class="triage-result"><h4>AI could not complete the routing</h4><p>${esc(err.message||'Check your AI API configuration and try again.')}</p></div>`; out.style.display='block'; }
  finally{btn.disabled=false; thinking.style.display='none';}
}
function initIssueIntelligence(){ const input=document.getElementById('issueIntelMessage'); if(input) input.focus(); }

/* ===== Weather Digital Twin ===== */
let twinMap=null;
function initDigitalTwin(){
 const range=document.getElementById('simIntensity');
 if(range) range.oninput=()=>document.getElementById('simIntensityOut').value=range.value+'%';
 loadTwinState();
}
async function loadTwinState(){try{const d=await api('/api/digital-twin/state');renderTwin(d);}catch(e){toast(e.message||'Digital Twin unavailable');}}
function setTwinText(id,value){const el=document.getElementById(id);if(el)el.textContent=value;}
function renderTwin(d){
 const c=d.weather?.current||{}, t=d.twin||{}, p=t.prediction||{};
 setTwinText('weatherLabel',d.weather_label||'Live weather'); setTwinText('weatherLocation','Location: '+(d.weather?.location_name||'Resort location'));
 setTwinText('weatherTemp',c.temperature_2m!=null?Math.round(c.temperature_2m)+'°C':'--');
 setTwinText('weatherRain',c.precipitation!=null?'Rain '+c.precipitation+' mm':'Rain --');
 setTwinText('weatherWind',c.wind_speed_10m!=null?'Wind '+Math.round(c.wind_speed_10m)+' km/h':'Wind --');
 setTwinText('weatherUpdated',(d.weather?.stale?'Last available data · ':'Live observation · ')+(d.weather?.location_name||d.weather?.timezone||'local time'));
 [['demandIndex',p.demand_index??'--'],['maintRisk',(p.maintenance_risk_pct??'--')+'%'],['movementRisk',(p.movement_disruption_pct??'--')+'%'],['hkLoad',p.housekeeping_load??'--'],['availabilityTwin',(p.room_availability_pct??'--')+'%'],['uncertainty',(p.uncertainty_pct??'--')+'%'],['trafficCongestion',(p.traffic_congestion_pct??'--')+'%'],['arrivalDelay',(p.arrival_delay_min??'--')+' min'],['guestMobility',(p.guest_mobility_pct??'--')+'%'],['restaurantDemand',(p.restaurant_demand_pct??'--')+'%'],['roomServiceDemand',(p.room_service_demand_pct??'--')+'%'],['staffPressure',(p.staffing_pressure_pct??'--')+'%'],['hvacLoad',(p.hvac_load_pct??'--')+'%'],['powerLoad',(p.power_load_pct??'--')+'%'],['cancelRisk',(p.cancellation_risk_pct??'--')+'%'],['supplyDelay',(p.supply_chain_delay_pct??'--')+'%']].forEach(x=>setTwinText(x[0],x[1]));
 const cascade=t.cascades||[]; const cl=document.getElementById('cascadeList'); if(cl)cl.innerHTML=cascade.map(x=>`<span>↗ ${esc(x)}</span>`).join('');
 const acts=t.recommended_actions||[]; const al=document.getElementById('recommendedActions'); if(al)al.innerHTML=acts.map(x=>`<div class="action-item"><span>✓</span><p>${esc(x)}</p></div>`).join('');
 renderTrajectory(t.trajectory||[]);
 const social=d.social||{}; setTwinText('socialCount',(social.count||0)+' signals'); const sl=document.getElementById('socialSignals'); if(sl)sl.innerHTML=(social.items||[]).length?social.items.map(x=>`<div class="social-item"><b>${esc(x.title)}</b><small>r/${esc(x.subreddit||'public')} · score ${esc(x.score||0)}</small></div>`).join(''):'<p class="muted">No public signals returned right now.</p>';
 if(!twinMap&&window.L){twinMap=L.map('twinMap').setView([d.weather.latitude||19.076,d.weather.longitude||72.878],11);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}).addTo(twinMap);L.marker([d.weather.latitude||19.076,d.weather.longitude||72.878]).addTo(twinMap).bindPopup(`<b>ResortOS</b><br>${esc(d.weather_label||'Weather')}`).openPopup();}
}
function renderTrajectory(rows){const el=document.getElementById('trajectory');if(!el)return;if(!rows.length){el.innerHTML='<p class="muted">Run a scenario to generate the virtual time horizon.</p>';return}el.innerHTML=rows.map(r=>`<div class="trajectory-card"><b>+${r.hour}h</b><span>Traffic <strong>${r.traffic}%</strong></span><span>Movement <strong>${r.movement_risk}%</strong></span><span>Demand <strong>${r.demand}%</strong></span><span>Maintenance <strong>${r.maintenance}%</strong></span></div>`).join('');}
function setTwinPreset(type){const presets={monsoon:[28,24,48,90,4],heat:[43,2,16,15,6],storm:[29,18,75,95,3],clear:[26,0,8,0,2]};const v=presets[type]||presets.monsoon;['simTemp','simRain','simWind','simIntensity','simDuration'].forEach((id,i)=>{const el=document.getElementById(id);if(el)el.value=v[i];});document.getElementById('simIntensityOut').value=v[3]+'%';}
async function runTwinSimulation(){
 const out=document.getElementById('simulationResult'); const aiText=document.getElementById('twinAIText'); const aiConf=document.getElementById('twinAIConfidence');
 out.innerHTML='<div class="ai-thinking"><span class="thinking-dot"></span><b>Digital Twin is thinking…</b><small>Propagating weather → traffic → guests → rooms → staff → resources</small></div>'; if(aiText)aiText.textContent='Generating AI decision brief…';
 const parameters={temperature:+document.getElementById('simTemp').value,rainfall:+document.getElementById('simRain').value,wind:+document.getElementById('simWind').value,intensity:+document.getElementById('simIntensity').value,duration:+document.getElementById('simDuration').value};
 try{
  const d=await api('/api/digital-twin/simulate',{method:'POST',body:JSON.stringify({scenario_name:'Weather counterfactual',parameters})});
  const p=d.twin.prediction||{};
  out.innerHTML=`<div class="simulation-summary"><div class="summary-top"><div><span class="eyebrow">VIRTUAL FUTURE STATE</span><h4>Scenario propagated successfully</h4></div><span class="simulation-badge">NO LIVE DATA CHANGED</span></div><div class="sim-cards"><div><b>${p.demand_index}</b><small>Demand index</small></div><div><b>${p.traffic_congestion_pct}%</b><small>Traffic congestion</small></div><div><b>${p.arrival_delay_min} min</b><small>Arrival delay</small></div><div><b>${p.maintenance_risk_pct}%</b><small>Maintenance risk</small></div><div><b>${p.staffing_pressure_pct}%</b><small>Staff pressure</small></div><div><b>${p.room_availability_pct}%</b><small>Room availability</small></div></div><p class="simulation-explanation">${esc(d.ai_summary||'The Digital Twin propagated the scenario through connected resort entities using live operational state and weather inputs.')}</p></div>`;
  renderTwin({weather:d.twin?.weather?{current:{temperature_2m:d.twin.weather.temperature,precipitation:d.twin.weather.rainfall,wind_speed_10m:d.twin.weather.wind}}:{},twin:d.twin,social:{count:d.twin?.social_signals||0,items:[]},weather_label:d.twin?.weather?.label||'Scenario'});
  const a=await api('/api/digital-twin/ai-analysis',{method:'POST',body:JSON.stringify({parameters})});
  if(aiText)aiText.textContent=a.analysis||d.ai_summary||'AI analysis unavailable'; if(aiConf)aiConf.textContent=(a.confidence??'—')+'% confidence';
 }catch(e){out.innerHTML=`<div class="error-box">${esc(e.message||'Simulation failed. Check your AI/API configuration.')}</div>`;if(aiText)aiText.textContent='AI analysis could not be generated.';}
}

/* ===== ResortOS Copilot ===== */
let copilotHistory=[];
function initCopilot(){const i=document.getElementById('copilotInput');if(i){i.focus();i.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendCopilot(e)}})}}
function copilotAsk(text){const i=document.getElementById('copilotInput');if(i){i.value=text;i.focus()}}
async function sendCopilot(e){
  if(e)e.preventDefault();
  const input=document.getElementById('copilotInput'), box=document.getElementById('copilotMessages'), btn=document.getElementById('copilotSend');
  const msg=(input?.value||'').trim(); if(!msg)return;
  box.insertAdjacentHTML('beforeend',`<div class="copilot-msg user"><div><b>You</b><p>${escapeHtml(msg).replace(/\n/g,'<br>')}</p></div></div>`);
  input.value=''; if(btn)btn.disabled=true;
  const thinkingId='copilotThinking-'+Date.now();
  box.insertAdjacentHTML('beforeend',`<div class="copilot-msg bot" id="${thinkingId}"><div class="copilot-avatar">✦</div><div><b>ResortOS Copilot</b><p class="copilot-thinking">Thinking…</p></div></div>`);
  box.scrollTop=box.scrollHeight;
  try{
    const d=await api('/api/copilot/chat',{method:'POST',body:JSON.stringify({message:msg,history:copilotHistory.slice(-10)})});
    document.getElementById(thinkingId)?.remove();
    if(!d.ok)throw Error(d.message||'Copilot unavailable');
    const answer=d.content||'I could not generate a response.';
    box.insertAdjacentHTML('beforeend',`<div class="copilot-msg bot"><div class="copilot-avatar">✦</div><div><b>ResortOS Copilot</b><p>${escapeHtml(answer).replace(/\n/g,'<br>')}</p></div></div>`);
    copilotHistory.push({role:'user',content:msg},{role:'assistant',content:answer});
  }catch(err){
    document.getElementById(thinkingId)?.remove();
    box.insertAdjacentHTML('beforeend',`<div class="copilot-msg bot error"><div class="copilot-avatar">!</div><div><b>ResortOS Copilot</b><p>${escapeHtml(err.message||'Copilot is unavailable.')}</p></div></div>`);
  }finally{if(btn)btn.disabled=false;input?.focus();box.scrollTop=box.scrollHeight;}
}

/* ===== Nugen Intelligence ===== */
async function initNugen(){await refreshNugenStatus();}
async function refreshNugenStatus(){try{const d=await api('/api/nugen/status');setNugen('nugenBadge',d.configured?'NUGEN CONNECTED':'NUGEN KEY REQUIRED');setNugen('modelId',d.model_id||'Aligned model not configured');setNugen('alignmentStatus',d.alignment_status?.status||(d.alignment_id?'Alignment ID saved':'Not configured'));setNugen('alignmentIdView',d.alignment_id||'—');setNugen('modelIdView',d.model_id||'—');setNugen('alignmentStatusView',d.alignment_status?.status||'Not configured');setNugen('nugenHealth',d.configured?(d.mode==='aligned'?'Aligned inference ready':'Base-model inference ready'):'API key required');setNugen('nugenMode',d.mode==='aligned'?'Aligned domain model':(d.mode==='base-model'?'Direct Nugen base model':'Setup required'));}catch(e){setNugen('nugenBadge','NUGEN STATUS ERROR');setNugen('nugenHealth','Unable to reach Nugen');}}
function setNugen(id,v){const e=document.getElementById(id);if(e)e.textContent=v;}
async function bootstrapNugen(){const out=document.getElementById('nugenMessage');out.innerHTML='<div class="ai-thinking"><span class="thinking-dot"></span><b>Nugen alignment is starting…</b><small>Uploading ResortOS domain corpus and creating the aligned model pipeline</small></div>';try{const d=await api('/api/nugen/bootstrap',{method:'POST',body:JSON.stringify({})});out.textContent=d.message||JSON.stringify(d,null,2);await refreshNugenStatus();}catch(e){out.textContent=e.message||'Nugen bootstrap failed';}}
function useNugenPrompt(text){const p=document.getElementById('nugenPrompt');if(p){p.value=text;p.focus();}}
async function testNugen(){const out=document.getElementById('nugenOutput');const prompt=document.getElementById('nugenPrompt').value.trim();if(!prompt)return;out.innerHTML='<div class="ai-thinking"><span class="thinking-dot"></span><b>Nugen is analyzing…</b><small>Using the aligned model when available, otherwise Nugen base AI</small></div>';try{const d=await api('/api/nugen/infer',{method:'POST',body:JSON.stringify({message:prompt})});out.innerHTML=`<div class="nugen-answer"><div class="answer-meta"><span>DOMAIN-ALIGNED</span><span>${esc(d.model||'ResortOS Nugen')}</span>${d.confidence!=null?`<span>Confidence ${esc(d.confidence)}</span>`:''}</div><div class="answer-body">${esc(d.content||'No response')}</div></div>`;setNugen('lastInference','Just now');}catch(e){out.innerHTML=`<div class="error-box">${esc(e.message||'Nugen inference failed')}</div>`;}}
async function runNugenScenario(type){const prompts={storm:'Analyze a 4-hour heavy storm scenario for ResortOS. Predict traffic, guest movement, room demand, housekeeping, maintenance and staffing pressure, then provide prioritized actions with uncertainty.',heat:'Analyze an extreme heat scenario for a resort. Predict HVAC, power, guest comfort, indoor activity demand, F&B and staffing effects. Give measurable estimates and actions.',arrival:'Simulate a major travel delay wave reaching the resort. Explain likely arrival congestion, cancellations, room turnover pressure, F&B demand and the operational response.'};document.getElementById('nugenPrompt').value=prompts[type]||prompts.storm;testNugen();}

