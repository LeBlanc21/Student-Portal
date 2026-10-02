var KEY = "scrapDonations",
  RKEY = "scrapRedemptions";

// Edit this list to change the items and their point costs
var REWARDS=[
  {name:"Set of pencils",cost:20},
  {name:"Hand sanitizer",cost:25},
  {name:"Bottle of alcohol",cost:30},
  {name:"Ream of bond paper",cost:80},
  {name:"Pad of paper",cost:20},
  {name:"Set of ballpens",cost:25},
  {name:"Notebook",cost:30}
];

function load(k) {
  try {
    return JSON.parse(localStorage.getItem(k)) || [];
  } catch (e) {
    return [];
  }
}
function save(k, d) {
  try {
    localStorage.setItem(k, JSON.stringify(d));
    return true;
  } catch (e) {
    return false;
  }
}
function $(id) {
  return document.getElementById(id);
}
function esc(s) {
  var d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}
function round(n) {
  return Math.round(n * 100) / 100;
}

try {
  var base = location.href.split("#")[0];
  new QRCode($("qr"), {
    text: base + "#points",
    width: 168,
    height: 168,
    colorDark: "#1f2a24",
    colorLight: "#ffffff",
  });
} catch (e) {
  $("qr").textContent = "QR code unavailable";
}

// Totals for one student: donations, redemptions, and current balance
function totals(sid) {
  var s = sid.toLowerCase();
  var don = load(KEY).filter(function (r) {
    return r.sid.toLowerCase() === s;
  });
  var red = load(RKEY).filter(function (r) {
    return r.sid.toLowerCase() === s;
  });
  var earned = 0,
    kg = 0,
    spent = 0;
  don.forEach(function (r) {
    earned += r.points;
    kg += r.weight;
  });
  red.forEach(function (r) {
    spent += r.cost;
  });
  return {
    don: don,
    red: red,
    earned: round(earned),
    kg: round(kg),
    spent: round(spent),
    bal: round(earned - spent),
  };
}

// ---------- Donation form ----------
$("weight").addEventListener("input", function () {
  var w = parseFloat(this.value);
  $("preview").textContent =
    w > 0 ? "This donation earns " + round(w * 10) + " points." : "";
});

$("form").addEventListener("submit", function (e) {
  e.preventDefault();
  var f = ["name", "contact", "sid", "grade", "section", "scrap", "weight"],
    v = {},
    msg = $("fmsg");
  for (var i = 0; i < f.length; i++) {
    v[f[i]] = $(f[i]).value.trim();
    if (!v[f[i]]) {
      msg.className = "msg err";
      msg.textContent = "Please fill in all fields.";
      $(f[i]).focus();
      return;
    }
  }
  var w = parseFloat(v.weight);
  if (!(w > 0)) {
    msg.className = "msg err";
    msg.textContent = "Weight must be more than 0 kg.";
    $("weight").focus();
    return;
  }
  var rec = {
    name: v.name,
    contact: v.contact,
    sid: v.sid,
    grade: v.grade,
    section: v.section,
    scrap: v.scrap,
    weight: w,
    points: round(w * 10),
    date: new Date().toLocaleDateString(),
  };
  var d = load(KEY);
  d.push(rec);
  if (!save(KEY, d)) {
    msg.className = "msg err";
    msg.textContent = "Could not save. Check your browser's storage settings.";
    return;
  }
  msg.className = "msg ok";
  msg.textContent = "Donation submitted. You earned " + rec.points + " points.";
  $("form").reset();
  $("preview").textContent = "";
  $("lookup").value = v.sid;
  show(v.sid);
  $("rid").value = v.sid;
  showRewards(v.sid);
});

// ---------- Check your points ----------
function show(id) {
  id = id.trim();
  var out = $("result");
  if (!id) {
    out.innerHTML = '<p class="msg err">Enter your student ID no.</p>';
    return;
  }
  var t = totals(id);
  if (!t.don.length) {
    out.innerHTML =
      '<p class="msg err">No donations found for ID ' +
      esc(id) +
      ". Submit a donation above to start earning points.</p>";
    return;
  }
  var h =
    '<div class="big" style="margin-top:16px">' +
    t.bal +
    " pts</div>" +
    '<p class="sub">' +
    t.earned +
    " pts earned · " +
    t.spent +
    " pts redeemed · " +
    t.kg +
    " kg donated</p>" +
    '<div class="scroll"><table><thead><tr><th>Student Name</th><th>Student ID</th><th>Date</th><th>Scrap</th><th>Kg</th><th>Points</th></tr></thead><tbody>';
  t.don
    .slice()
    .reverse()
    .forEach(function (r) {
      h +=
        "<tr><td>" +
        esc(r.name) +
        "</td><td>" +
        esc(r.sid) +
        "</td><td>" +
        esc(r.date) +
        "</td><td>" +
        esc(r.scrap) +
        "</td><td>" +
        r.weight +
        "</td><td>" +
        r.points +
        "</td></tr>";
    });
  out.innerHTML = h + "</tbody></table></div>";
}
$("check").addEventListener("click", function () {
  show($("lookup").value);
});
$("lookup").addEventListener("keydown", function (e) {
  if (e.key === "Enter") show(this.value);
});

// ---------- Redeem rewards ----------
function showRewards(id, note) {
  id = id.trim();
  var out = $("rresult");
  if (!id) {
    out.innerHTML = '<p class="msg err">Enter your student ID no.</p>';
    return;
  }
  var t = totals(id);
  if (!t.don.length) {
    out.innerHTML =
      '<p class="msg err">No donations found for ID ' +
      esc(id) +
      ". Donate scrap first to earn points.</p>";
    return;
  }
  var h =
    (note ? '<p class="msg ok">' + esc(note) + "</p>" : "") +
    '<p class="sub" style="margin-top:16px">' +
    esc(t.don[t.don.length - 1].name) +
    "</p>" +
    '<div class="big">' +
    t.bal +
    ' pts</div><p class="sub">available to redeem</p><ul class="rewards">';
  REWARDS.forEach(function (r, i) {
    h +=
      '<li class="reward"><div><strong>' +
      esc(r.name) +
      "</strong><span>" +
      r.cost +
      " pts</span></div>" +
      '<button type="button" class="redeem-btn" data-i="' +
      i +
      '"' +
      (r.cost > t.bal ? " disabled" : "") +
      ">Redeem</button></li>";
  });
  h += "</ul>";
  if (t.red.length) {
    h +=
      '<div class="scroll"><table><thead><tr><th>Date</th><th>Item</th><th>Points used</th></tr></thead><tbody>';
    t.red
      .slice()
      .reverse()
      .forEach(function (r) {
        h +=
          "<tr><td>" +
          esc(r.date) +
          "</td><td>" +
          esc(r.item) +
          "</td><td>" +
          r.cost +
          "</td></tr>";
      });
    h += "</tbody></table></div>";
  }
  out.innerHTML = h;
}

$("rcheck").addEventListener("click", function () {
  showRewards($("rid").value);
});
$("rid").addEventListener("keydown", function (e) {
  if (e.key === "Enter") showRewards(this.value);
});

$("rresult").addEventListener("click", function (e) {
  var btn = e.target.closest(".redeem-btn");
  if (!btn) return;
  var item = REWARDS[parseInt(btn.getAttribute("data-i"), 10)];
  var id = $("rid").value.trim();
  var t = totals(id);
  if (!t.don.length || item.cost > t.bal) {
    showRewards(id);
    return;
  }
  if (!window.confirm("Redeem 1 " + item.name + " for " + item.cost + " pts?"))
    return;
  var list = load(RKEY);
  list.push({
    sid: t.don[0].sid,
    item: item.name,
    cost: item.cost,
    date: new Date().toLocaleDateString(),
  });
  if (!save(RKEY, list)) {
    showRewards(id, "Could not save. Check your browser's storage settings.");
    return;
  }
  showRewards(id, "Redeemed 1 " + item.name + " for " + item.cost + " pts.");
  if ($("lookup").value.trim().toLowerCase() === id.toLowerCase()) show(id);
});
